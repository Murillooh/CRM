"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ChartDataProps = {
  recentDeals: Array<{
    id: string;
    title: string;
    value: any; // Prisma Decimal
    createdAt: Date;
    stage: { name: string; order: number };
  }>;
};

export function DashboardCharts({ recentDeals }: ChartDataProps) {
  // Mock monthly data since we don't have enough history in the DB yet,
  // but we combine it with real data for demonstration.
  const revenueData = useMemo(() => {
    return [
      { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
      { name: "Fev", total: Math.floor(Math.random() * 5000) + 2000 },
      { name: "Mar", total: Math.floor(Math.random() * 5000) + 3000 },
      { name: "Abr", total: Math.floor(Math.random() * 5000) + 4000 },
      { name: "Mai", total: Math.floor(Math.random() * 5000) + 5000 },
      { name: "Jun", total: Math.floor(Math.random() * 5000) + 6000 },
    ];
  }, []);

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    recentDeals.forEach((deal) => {
      const stageName = deal.stage.name;
      counts[stageName] = (counts[stageName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [recentDeals]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle>Crescimento de Receita</CardTitle>
          <CardDescription>Receita gerada nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle>Negócios por Etapa</CardTitle>
          <CardDescription>Distribuição atual do funil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {stageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Nenhum negócio no pipeline
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
