import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

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
      take: 10, // Increased to 10 for charts
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
    <div className="flex h-full flex-col bg-background/50 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      
      <div className="flex items-center justify-between p-6 md:p-8 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe as métricas principais do workspace <span className="font-semibold text-foreground">{workspace.name}</span>.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8 space-y-8 relative z-0">
        
        {/* Cards de Métricas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-xl shadow-black/5 ring-1 ring-white/5 border-border/40 bg-card/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-primary/5 hover:border-primary/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Valor Total no Funil</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground">
                {formatter.format(totalValue)}
              </div>
              <p className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
                +12% <span className="text-muted-foreground font-normal">em relação ao último mês</span>
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl shadow-black/5 ring-1 ring-white/5 border-border/40 bg-card/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-primary/5 hover:border-primary/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground">{dealsCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Oportunidades mapeadas
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl shadow-black/5 ring-1 ring-white/5 border-border/40 bg-card/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-primary/5 hover:border-primary/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <Users className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground">{contactsCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Clientes em potencial
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl shadow-black/5 ring-1 ring-white/5 border-border/40 bg-card/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-primary/5 hover:border-primary/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Atividade Geral</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-primary">Saudável</div>
              <p className="text-xs text-muted-foreground mt-2">
                Status do pipeline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Interativos (Nova feature) */}
        <DashboardCharts recentDeals={recentDeals} />

        {/* Negócios Recentes */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-xl shadow-black/5 ring-1 ring-border/50 border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Negócios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentDeals.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                  <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  Nenhum negócio criado ainda.
                  <div className="mt-4">
                    <Button variant="outline" className="shadow-sm" asChild>
                      <Link href={`/workspaces/${params.slug}/deals`}>
                        Ir para o Pipeline
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDeals.slice(0, 5).map(deal => (
                    <div key={deal.id} className="flex items-center group p-2 hover:bg-muted/30 rounded-lg transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shadow-inner">
                        {deal.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.stage.name}
                        </p>
                      </div>
                      <div className="ml-auto font-bold text-sm text-foreground">
                        {formatter.format(deal.value?.toNumber() || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-xl shadow-black/5 ring-1 ring-border/50 border-border/40 bg-card/60 backdrop-blur-xl bg-gradient-to-br from-card/60 to-primary/5">
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full justify-start h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all" asChild>
                  <Link href={`/workspaces/${params.slug}/contacts`}>
                    <Users className="mr-3 h-5 w-5 text-primary/70" />
                    Adicionar novos Contatos
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all" asChild>
                  <Link href={`/workspaces/${params.slug}/deals`}>
                    <Briefcase className="mr-3 h-5 w-5 text-primary/70" />
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
