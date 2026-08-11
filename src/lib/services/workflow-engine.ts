import { db } from "@/lib/db";
import { TriggerType, ActionType } from "@prisma/client";

/**
 * Event Context: Payload enviado na ocorrência do gatilho
 */
export interface WorkflowEventContext {
  workspaceId: string;
  triggerType: TriggerType;
  entityId: string; // Ex: Deal ID
  data: any;        // Informações como fromStage, toStage, value, etc.
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
        // Validação da Condition (Filtros baseados em JSON)
        if (this.checkCondition(wf.condition as any, context.data)) {
          await this.executeWorkflow(wf, context);
        }
      }
    } catch (error) {
      console.error(`[WorkflowEngine] Erro crítico ao avaliar evento:`, error);
    }
  }

  /**
   * Avalia a condição (ex: toStage == "XYZ")
   * Para MVP, vamos construir um filtro simples de igualdade.
   */
  private static checkCondition(condition: Record<string, any> | null, data: any): boolean {
    if (!condition || Object.keys(condition).length === 0) return true;
    
    // Simplificação de regra: ex: { "field": "toStage", "operator": "equals", "value": "123" }
    // Num sistema de produção, usaríamos json-logic ou algo similar.
    if (condition.field && condition.value && condition.operator === "equals") {
      return data[condition.field] === condition.value;
    }

    return true; // Falback
  }

  /**
   * Executa a cadeia de ações do Workflow e registra o LOG
   */
  private static async executeWorkflow(workflow: any, context: WorkflowEventContext) {
    try {
      console.log(`[WorkflowEngine] Executing workflow: ${workflow.name}`);
      
      for (const action of workflow.actions) {
        await this.runAction(action, context);
      }

      await this.logExecution(workflow.id, "SUCCESS", null, context);
    } catch (error: any) {
      await this.logExecution(workflow.id, "FAILED", error.message, context);
    }
  }

  /**
   * Resolutor das Actions
   */
  private static async runAction(action: any, context: WorkflowEventContext) {
    const payload = action.payload as Record<string, any>;

    switch (action.actionType) {
      case "CREATE_TASK":
        // Exemplo: Criar tarefa no banco
        await db.task.create({
          data: {
            title: payload.title || "Auto Task",
            dealId: context.entityId,
            workspaceId: context.workspaceId,
            status: "TODO",
            dueDate: payload.dueDays ? new Date(Date.now() + payload.dueDays * 86400000) : undefined,
          },
        });
        break;

      case "NOTIFY_OWNER":
        // Criaríamos um log/atividade de notificação
        await db.activity.create({
          data: {
            workspaceId: context.workspaceId,
            type: "SYSTEM_LOG",
            dealId: context.entityId,
            description: `[Automação] Notificação enviada: ${payload.message}`,
          }
        });
        break;
      
      default:
        throw new Error(`ActionType não suportado: ${action.actionType}`);
    }
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
      }
    });
  }
}
