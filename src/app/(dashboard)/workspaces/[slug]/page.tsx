import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { workspace } = await requireWorkspaceAccess(params.slug);

  // Consultas ao banco de dados para montar as métricas
  const [contactsCount, dealsCount, dealsAggregation, recentDeals] = await Promise.all([
    db.contact.count({ where: { workspaceId: workspace.id } }),
    db.deal.count({ where: { workspaceId: workspace.id } }),
    db.deal.aggregate({
      where: { workspaceId: workspace.id },
      _sum: { value: true }
    }),
    db.deal.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        stage: true
      }
    })
  ]);

  const totalValue = dealsAggregation._sum.value?.toNumber() || 0;
  
  // Formatar moeda brasileira
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe as métricas principais do workspace {workspace.name}.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total no Funil</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {formatter.format(totalValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Soma de todos os negócios
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negócios (Deals)</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dealsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Oportunidades mapeadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes em potencial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Saudável</div>
              <p className="text-xs text-muted-foreground mt-1">
                Status geral do pipeline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Negócios Recentes */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Negócios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentDeals.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum negócio criado ainda.
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/workspaces/${params.slug}/deals`}>
                        Ir para o Pipeline
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDeals.map(deal => (
                    <div key={deal.id} className="flex items-center">
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">{deal.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Etapa: {deal.stage.name}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {formatter.format(deal.value?.toNumber() || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/workspaces/${params.slug}/contacts`}>
                    <Users className="mr-2 h-4 w-4" />
                    Adicionar novos Contatos
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/workspaces/${params.slug}/deals`}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Gerenciar Funil de Vendas
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
