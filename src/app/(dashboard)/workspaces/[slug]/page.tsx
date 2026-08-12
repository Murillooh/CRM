import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, Activity, Mail, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export default async function DashboardPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { workspace } = await requireWorkspaceAccess(params.slug);

  const startOfThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Consultas ao banco de dados para montar as métricas
  const [contactsCount, dealsCount, emailAccountsCount, dealsAggregation, valueThisMonthAgg, recentDeals] = await Promise.all([
    db.contact.count({ where: { workspaceId: workspace.id } }),
    db.deal.count({ where: { workspaceId: workspace.id } }),
    db.emailAccount.count({ where: { workspaceId: workspace.id, status: "CONNECTED" } }),
    db.deal.aggregate({
      where: { workspaceId: workspace.id },
      _sum: { value: true }
    }),
    // Base pro "% adicionado este mês" — real, calculado, não fixo (era hardcoded "+12%" antes).
    db.deal.aggregate({
      where: { workspaceId: workspace.id, createdAt: { gte: startOfThisMonth } },
      _sum: { value: true },
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

  // Onboarding leve (item 11 da auditoria de UX): fica visível até ter pelo menos um
  // contato E um negócio — dá pra ver o primeiro passo "concluído" enquanto ainda
  // falta o segundo, em vez de sumir inteiro assim que qualquer um dos dois acontece.
  // "Conectar e-mail" é sugestão extra, não segura o banner sozinho (time pode nem
  // usar a integração — não vira nag permanente por causa disso).
  const isNewWorkspace = contactsCount === 0 || dealsCount === 0;
  const onboardingSteps = [
    { label: "Adicione seu primeiro contato", done: contactsCount > 0, href: `/workspaces/${params.slug}/contacts`, icon: Users },
    { label: "Crie seu primeiro negócio", done: dealsCount > 0, href: `/workspaces/${params.slug}/deals`, icon: Briefcase },
    { label: "Conecte seu e-mail", done: emailAccountsCount > 0, href: `/workspaces/${params.slug}/settings`, icon: Mail },
  ];

  const totalValue = dealsAggregation._sum.value?.toNumber() || 0;
  const valueAddedThisMonth = valueThisMonthAgg._sum.value?.toNumber() || 0;
  const valueBeforeThisMonth = totalValue - valueAddedThisMonth;
  const growthPct = valueBeforeThisMonth > 0 ? (valueAddedThisMonth / valueBeforeThisMonth) * 100 : null;

  // Converter Decimal para Number (Next.js server->client serialization)
  const serializedRecentDeals = recentDeals.map(deal => ({
    ...deal,
    value: deal.value ? deal.value.toNumber() : 0,
  }));

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
          <p className="text-sm text-muted-foreground mt-1">Acompanhe as métricas principais do workspace <span className="font-semibold text-foreground">{workspace.name}</span>.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">

        {isNewWorkspace && (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Bem-vindo! Vamos começar</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Três passos rápidos pra deixar o {workspace.name} pronto pra uso.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {onboardingSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link
                      key={step.label}
                      href={step.href}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                        step.done
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          step.done ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span className={step.done ? "text-emerald-700 dark:text-emerald-400 line-through decoration-1" : "font-medium text-foreground"}>
                        {step.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total no Funil</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatter.format(totalValue)}
              </div>
              {growthPct !== null ? (
                <p className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
                  +{growthPct.toFixed(0)}% <span className="text-muted-foreground font-normal">adicionado este mês</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  {valueAddedThisMonth > 0 ? "Todo o valor foi adicionado este mês" : "Nenhum valor no funil ainda"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{dealsCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Oportunidades mapeadas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Users className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{contactsCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Clientes em potencial
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade Geral</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">Saudável</div>
              <p className="text-xs text-muted-foreground mt-2">
                Status do pipeline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Interativos */}
        <DashboardCharts recentDeals={serializedRecentDeals} />

        {/* Negócios Recentes */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Negócios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {serializedRecentDeals.length === 0 ? (
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
                  {serializedRecentDeals.slice(0, 5).map(deal => (
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
                        {formatter.format(deal.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <Link href={`/workspaces/${params.slug}/contacts`}>
                    <Users className="mr-3 h-5 w-5 text-primary/70" />
                    Adicionar novos Contatos
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" asChild>
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
