import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let connectionString = process.env.DATABASE_URL;

if (connectionString?.startsWith("prisma+postgres://")) {
  try {
    const urlObj = new URL(connectionString);
    const apiKeyBase64 = urlObj.searchParams.get("api_key");
    if (apiKeyBase64) {
      const decoded = JSON.parse(Buffer.from(apiKeyBase64, "base64").toString());
      if (decoded.databaseUrl) {
        connectionString = decoded.databaseUrl;
      }
    }
  } catch (e) {
    console.error("Erro ao decodificar a URL do Prisma Postgres", e);
  }
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('Seed: Starting mock data generation...');

  // 1. Pegar o primeiro workspace existente
  const workspace = await prisma.workspace.findFirst();
  
  if (!workspace) {
    console.log('Nenhum workspace encontrado. Abortando seed.');
    return;
  }

  const workspaceId = workspace.id;

  // 2. Criar 5 Empresas
  const companies = await Promise.all([
    prisma.company.create({ data: { name: 'Tech Soluções', workspaceId } }),
    prisma.company.create({ data: { name: 'Agência Criativa', workspaceId } }),
    prisma.company.create({ data: { name: 'Startup Inovação', workspaceId } }),
    prisma.company.create({ data: { name: 'Indústrias ABC', workspaceId } }),
    prisma.company.create({ data: { name: 'Consultoria Top', workspaceId } })
  ]);
  
  // 3. Criar 5 Contatos vinculados às empresas
  const contacts = await Promise.all([
    prisma.contact.create({
      data: { name: 'João Silva', email: 'joao.silva@exemplo.com.br', phone: '11999990001', jobTitle: 'CEO', workspaceId, companyId: companies[0].id }
    }),
    prisma.contact.create({
      data: { name: 'Maria Souza', email: 'maria.souza@exemplo.com.br', phone: '11999990002', jobTitle: 'Diretora de Marketing', workspaceId, companyId: companies[1].id }
    }),
    prisma.contact.create({
      data: { name: 'Carlos Ferreira', email: 'carlos.f@startup.com', phone: '11999990003', jobTitle: 'CTO', workspaceId, companyId: companies[2].id }
    }),
    prisma.contact.create({
      data: { name: 'Ana Oliveira', email: 'ana.oliveira@industria.com', phone: '11999990004', jobTitle: 'Gerente de Compras', workspaceId, companyId: companies[3].id }
    }),
    prisma.contact.create({
      data: { name: 'Pedro Santos', email: 'pedro.santos@consultoria.com', phone: '11999990005', jobTitle: 'Consultor Sênior', workspaceId, companyId: companies[4].id }
    })
  ]);
  console.log(`Seed: Criados 5 empresas e 5 contatos fictícios.`);

  // 3. Pegar pipeline e stages
  const pipeline = await prisma.pipeline.findFirst({
    where: { workspaceId },
    include: { stages: { orderBy: { order: 'asc' } } }
  });

  if (pipeline && pipeline.stages.length > 0) {
    // 4. Criar Negócios (Deals) atrelados a esses contatos
    const stages = pipeline.stages;
    
    await Promise.all([
      prisma.deal.create({
        data: {
          title: 'Licenciamento Software 2026',
          value: 12500.00,
          workspaceId,
          pipelineId: pipeline.id,
          stageId: stages[0].id, // Lead
          contactId: contacts[0].id
        }
      }),
      prisma.deal.create({
        data: {
          title: 'Redesign do Site Institucional',
          value: 8000.00,
          workspaceId,
          pipelineId: pipeline.id,
          stageId: stages[1].id, // Contato Realizado
          contactId: contacts[1].id
        }
      }),
      prisma.deal.create({
        data: {
          title: 'Consultoria em Infraestrutura',
          value: 35000.00,
          workspaceId,
          pipelineId: pipeline.id,
          stageId: stages[2].id, // Proposta
          contactId: contacts[2].id
        }
      }),
      prisma.deal.create({
        data: {
          title: 'Compra de Maquinário',
          value: 150000.00,
          workspaceId,
          pipelineId: pipeline.id,
          stageId: stages[3].id, // Negociação
          contactId: contacts[3].id
        }
      }),
      prisma.deal.create({
        data: {
          title: 'Projeto Estratégico Q3',
          value: 22000.00,
          workspaceId,
          pipelineId: pipeline.id,
          stageId: stages[stages.length - 1].id, // Geralmente a última é ganho ou quase
          contactId: contacts[4].id
        }
      })
    ]);
    console.log(`Seed: Criados 5 negócios fictícios no pipeline.`);
  }

  // 5. Criar 2 Automações (Workflows)
  await Promise.all([
    prisma.workflow.create({
      data: {
        name: 'Email de Boas-vindas p/ Novos Leads',
        isActive: true,
        triggerType: 'DEAL_STAGE_CHANGED',
        workspaceId,
        actions: {
          create: [
            {
              actionType: 'CREATE_TASK',
              payload: { title: 'Fazer ligação de boas-vindas' }
            }
          ]
        }
      }
    }),
    prisma.workflow.create({
      data: {
        name: 'Relatório Diário de Vendas',
        isActive: false,
        triggerType: 'SCHEDULE_DAILY',
        workspaceId,
        actions: {
          create: [
            {
              actionType: 'NOTIFY_OWNER',
              payload: { message: 'Seu resumo do dia está pronto.' }
            }
          ]
        }
      }
    })
  ]);
  console.log(`Seed: Criadas 2 automações fictícias.`);

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
