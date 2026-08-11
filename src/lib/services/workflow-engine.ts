import { db } from "@/lib/db";
import { TriggerType, ActionType } from "@prisma/client";
import { evaluateCondition, type WorkflowCondition } from "./workflow-conditions";
import { pickRoundRobin, pickByTerritory, pickByCompanySize, type CompanySizeTier } from "./lead-routing";
import { resolveTaskAssignee, shouldNotifyManager } from "./deal-stall";
import { interpolateTemplate } from "./workflow-template";

export type WorkflowEntityType = "Contact" | "Company" | "Deal";

/**
 * Event Context: Payload enviado na ocorrência do gatilho
 */
export interface WorkflowEventContext {
  workspaceId: string;
  triggerType: TriggerType;
  entityType: WorkflowEntityType;
  entityId: string;
  data: Record<string, any>; // Informações como fromStage, toStage, ownerId, region, employeeCount, etc.
}

/**
 * Engine Desacoplada de Automação
 */
export class WorkflowEngine {
  /**
   * Ponto de entrada: Recebe o evento e procura Workflows ativos.
   */
  static async evaluateEvent(context: WorkflowEventContext) {
    console.log(`[WorkflowEngine] Evaluating event: ${context.triggerType} for entity: ${context.entityId}`);

    try {
      const workflows = await db.workflow.findMany({
        where: {
          workspaceId: context.workspaceId,
          triggerType: context.triggerType,
          isActive: true,
        },
        include: {
          actions: {
            orderBy: { order: "asc" },
          },
        },
      });

      for (const wf of workflows) {
        if (evaluateCondition(wf.condition as WorkflowCondition | null, context.data)) {
          await this.executeWorkflow(wf, context);
        }
      }
    } catch (error) {
      console.error(`[WorkflowEngine] Erro crítico ao avaliar evento:`, error);
    }
  }

  /**
   * Executa a cadeia de ações do Workflow e registra o LOG
   */
  private static async executeWorkflow(workflow: any, context: WorkflowEventContext) {
    try {
      console.log(`[WorkflowEngine] Executing workflow: ${workflow.name}`);

      for (const action of workflow.actions) {
        // Guarda por ação: além da condition do Workflow (nível trigger), cada Action pode
        // carregar sua própria `condition` no payload (ex: NOTIFY_MANAGER só entra depois de
        // persistir mais alguns dias, FLAG_DUPLICATE só quando achou duplicado de verdade).
        const actionCondition = (action.payload as Record<string, any> | null)?.condition as WorkflowCondition | undefined;
        if (actionCondition && !evaluateCondition(actionCondition, context.data)) {
          continue;
        }
        await this.runAction(action, context, workflow);
      }

      await this.logExecution(workflow.id, "SUCCESS", null, context);
    } catch (error: any) {
      await this.logExecution(workflow.id, "FAILED", error.message, context);
    }
  }

  /**
   * Resolutor das Actions
   */
  private static async runAction(action: any, context: WorkflowEventContext, workflow: any) {
    const payload = action.payload as Record<string, any>;

    switch (action.actionType as ActionType) {
      case "CREATE_TASK": {
        // Idempotência: se essa mesma Action já gerou uma tarefa em aberto pra essa entidade
        // (ex: cron rodando de novo antes do responsável resolver), não duplica.
        const existing = await db.task.findFirst({
          where: {
            createdByActionId: action.id,
            status: { not: "DONE" },
            dealId: context.entityType === "Deal" ? context.entityId : undefined,
            contactId: context.entityType === "Contact" ? context.entityId : undefined,
            companyId: context.entityType === "Company" ? context.entityId : undefined,
          },
        });
        if (existing) break;

        await db.task.create({
          data: {
            title: payload.title ? interpolateTemplate(payload.title, context.data) : "Auto Task",
            workspaceId: context.workspaceId,
            assigneeId: resolveTaskAssignee(payload, context.data) ?? undefined,
            createdByActionId: action.id,
            status: "TODO",
            dueDate: payload.dueDays ? new Date(Date.now() + payload.dueDays * 86400000) : undefined,
            dealId: context.entityType === "Deal" ? context.entityId : undefined,
            contactId: context.entityType === "Contact" ? context.entityId : undefined,
            companyId: context.entityType === "Company" ? context.entityId : undefined,
          },
        });
        break;
      }

      case "NOTIFY_OWNER":
        // Criaríamos um log/atividade de notificação
        await db.activity.create({
          data: {
            workspaceId: context.workspaceId,
            type: "SYSTEM_LOG",
            dealId: context.entityType === "Deal" ? context.entityId : undefined,
            contactId: context.entityType === "Contact" ? context.entityId : undefined,
            companyId: context.entityType === "Company" ? context.entityId : undefined,
            description: `[Automação] Notificação enviada: ${payload.message}`,
          },
        });
        break;

      case "ASSIGN_OWNER":
        await this.runAssignOwner(payload, context, workflow);
        break;

      case "NOTIFY_MANAGER":
        await this.runNotifyManager(action.id, payload, context);
        break;

      case "FLAG_DUPLICATE":
        await this.runFlagDuplicate(context);
        break;

      case "ENROLL_IN_SEQUENCE":
        await this.runEnrollInSequence(context, workflow);
        break;

      case "REQUIRE_APPROVAL":
        await this.runRequireApproval(action.id, payload, context);
        break;

      default:
        throw new Error(`ActionType não suportado: ${action.actionType}`);
    }
  }

  /**
   * Higiene de dados: sinaliza o registro como possível duplicado (nome ou domínio de e-mail
   * batendo com outro já existente). A detecção em si roda no call site (createContact),
   * que já popula `context.data.duplicateIds` — aqui só materializa como Activity.
   */
  private static async runFlagDuplicate(context: WorkflowEventContext) {
    const duplicateIds: string[] = Array.isArray(context.data.duplicateIds) ? context.data.duplicateIds : [];
    if (duplicateIds.length === 0) return;

    await db.activity.create({
      data: {
        workspaceId: context.workspaceId,
        type: "SYSTEM_LOG",
        contactId: context.entityType === "Contact" ? context.entityId : undefined,
        companyId: context.entityType === "Company" ? context.entityId : undefined,
        description: `[Automação] Possível duplicado — bate com ${duplicateIds.length} registro(s) existente(s) (mesmo nome ou domínio de e-mail).`,
        metadata: { duplicateIds },
      },
    });
  }

  /**
   * Sequência de nutrição: matricula o contato (idempotente — não duplica se já tiver um
   * enrollment ativo pra esse Workflow). O envio em si é feito pelo cron (email-nurture).
   */
  private static async runEnrollInSequence(context: WorkflowEventContext, workflow: any) {
    if (context.entityType !== "Deal") {
      throw new Error(`ENROLL_IN_SEQUENCE só se aplica a Deal (via DEAL_STAGE_CHANGED), recebido: ${context.entityType}`);
    }

    const contactId = context.data.contactId;
    if (typeof contactId !== "string") {
      console.warn(`[WorkflowEngine] ENROLL_IN_SEQUENCE sem contato vinculado ao deal ${context.entityId} — não dá pra nutrir por e-mail.`);
      return;
    }

    const existing = await db.workflowEnrollment.findFirst({
      where: { workflowId: workflow.id, contactId, status: "ACTIVE" },
    });
    if (existing) return; // Já matriculado, idempotente

    await db.workflowEnrollment.create({
      data: {
        workflowId: workflow.id,
        contactId,
        dealId: context.entityId,
        enrolledAtStageId: context.data.toStage ?? "",
        step: 0,
        status: "ACTIVE",
        nextSendAt: new Date(), // Primeiro envio no próximo tick do cron
      },
    });
  }

  /**
   * Aprovação condicional: marca o deal como pendente e cria a tarefa de aprovação pro
   * manager. A guarda que efetivamente bloqueia "marcar como ganho" vive em markDealWon
   * (síncrona) — isso aqui só materializa o efeito colateral (task) de forma idempotente.
   */
  private static async runRequireApproval(actionId: string, payload: Record<string, any>, context: WorkflowEventContext) {
    if (context.entityType !== "Deal") {
      throw new Error(`REQUIRE_APPROVAL só se aplica a Deal, recebido: ${context.entityType}`);
    }

    await db.deal.updateMany({
      where: { id: context.entityId, workspaceId: context.workspaceId },
      data: { approvalStatus: "PENDING" },
    });

    const existing = await db.task.findFirst({
      where: { createdByActionId: actionId, status: { not: "DONE" }, dealId: context.entityId },
    });
    if (existing) return;

    const managers = await db.membership.findMany({
      where: { workspaceId: context.workspaceId, role: { in: ["MANAGER", "ADMIN", "OWNER"] } },
      select: { userId: true },
    });
    if (managers.length === 0) return;

    await db.task.create({
      data: {
        title: payload.title
          ? interpolateTemplate(payload.title, context.data)
          : `Aprovar desconto de ${context.data.discountPercent}% no negócio`,
        workspaceId: context.workspaceId,
        assigneeId: managers[0].userId,
        createdByActionId: actionId,
        status: "TODO",
        dealId: context.entityId,
      },
    });
  }

  /**
   * Roteamento de leads: escolhe um responsável (round-robin, território ou porte da empresa)
   * e atribui ao Contact/Company que disparou o evento.
   */
  private static async runAssignOwner(payload: Record<string, any>, context: WorkflowEventContext, workflow: any) {
    if (context.entityType !== "Contact" && context.entityType !== "Company") {
      throw new Error(`ASSIGN_OWNER só se aplica a Contact/Company, recebido: ${context.entityType}`);
    }

    const members = await db.membership.findMany({
      where: { workspaceId: context.workspaceId, role: "SALES_REP" },
      orderBy: { createdAt: "asc" },
      select: { userId: true, region: true },
    });
    const routable = members.map((m) => ({ id: m.userId, region: m.region }));
    const lastAssignedId: string | null = (workflow.state as any)?.cursor ?? null;

    let assigneeId: string | null;
    const strategy = payload.strategy || "round_robin";

    if (strategy === "territory") {
      assigneeId = pickByTerritory(routable, context.data.region ?? null, lastAssignedId);
    } else if (strategy === "company_size") {
      const tiers: CompanySizeTier[] = payload.tiers || [];
      const fallback = payload.fallbackAssigneeId ?? pickRoundRobin(routable, lastAssignedId);
      assigneeId = pickByCompanySize(tiers, context.data.employeeCount ?? null, fallback);
    } else {
      assigneeId = pickRoundRobin(routable, lastAssignedId);
    }

    if (!assigneeId) {
      console.warn(`[WorkflowEngine] ASSIGN_OWNER sem responsável elegível (workspace ${context.workspaceId}, workflow ${workflow.id}).`);
      return;
    }

    if (context.entityType === "Contact") {
      await db.contact.updateMany({
        where: { id: context.entityId, workspaceId: context.workspaceId },
        data: { ownerId: assigneeId },
      });
    } else {
      await db.company.updateMany({
        where: { id: context.entityId, workspaceId: context.workspaceId },
        data: { ownerId: assigneeId },
      });
    }

    // Persiste o cursor pra próxima rodada de round-robin (inclusive dentro de territory/company_size).
    await db.workflow.update({
      where: { id: workflow.id },
      data: { state: { cursor: assigneeId } },
    });
  }

  /**
   * Escalonamento pro manager: só age quando `daysInStage` (ou métrica equivalente no
   * contexto) atinge `payload.minDaysInStage`. Idempotente por Action, igual CREATE_TASK.
   */
  private static async runNotifyManager(actionId: string, payload: Record<string, any>, context: WorkflowEventContext) {
    const daysInStage = context.data.daysInStage;
    const minDaysInStage = payload.minDaysInStage ?? 0;

    if (typeof daysInStage !== "number" || !shouldNotifyManager(daysInStage, minDaysInStage)) {
      return; // Ainda não persistiu o suficiente pra escalar
    }

    const existing = await db.task.findFirst({
      where: {
        createdByActionId: actionId,
        status: { not: "DONE" },
        dealId: context.entityType === "Deal" ? context.entityId : undefined,
      },
    });
    if (existing) return;

    const managers = await db.membership.findMany({
      where: { workspaceId: context.workspaceId, role: { in: ["MANAGER", "ADMIN", "OWNER"] } },
      orderBy: { role: "asc" }, // ADMIN < MANAGER < OWNER alfabeticamente não importa; pega o primeiro elegível
      select: { userId: true },
    });
    if (managers.length === 0) return; // Sem manager no workspace, nada a fazer

    await db.task.create({
      data: {
        title: payload.title || "Deal parado precisa de atenção do gestor",
        workspaceId: context.workspaceId,
        assigneeId: managers[0].userId,
        createdByActionId: actionId,
        status: "TODO",
        dealId: context.entityType === "Deal" ? context.entityId : undefined,
      },
    });

    await db.activity.create({
      data: {
        workspaceId: context.workspaceId,
        type: "SYSTEM_LOG",
        dealId: context.entityType === "Deal" ? context.entityId : undefined,
        description: `[Automação] Deal parado há ${daysInStage} dias — manager notificado.`,
      },
    });
  }

  /**
   * Auditoria de Execução da Automação
   */
  private static async logExecution(workflowId: string, status: string, errorMsg: string | null, context: any) {
    await db.workflowLog.create({
      data: {
        workflowId,
        status,
        errorMsg,
        context: context,
      },
    });
  }
}
