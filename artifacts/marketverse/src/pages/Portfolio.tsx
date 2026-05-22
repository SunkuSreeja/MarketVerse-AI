import { motion } from "framer-motion";
import { useGetPortfolio, PortfolioHolding } from "@workspace/api-client-react";
import { PieChart, TrendingUp, TrendingDown, DollarSign, Activity, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export default function PortfolioView() {
  const { data: portfolio, isLoading } = useGetPortfolio();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <PieChart className="text-primary w-8 h-8" />
          Asset Allocation
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Your simulated portfolio standing and aggregate metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 border-primary/20 relative overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.05)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <CardContent className="p-8">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-16 w-64" />
                </div>
              ) : portfolio ? (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <p className="text-sm font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Net Liquidation Value</p>
                    <h2 className="text-5xl font-orbitron font-bold text-foreground">${portfolio.totalValue.toLocaleString()}</h2>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className={`px-4 py-3 rounded-lg border ${portfolio.gainLoss >= 0 ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                      <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Total P/L</p>
                      <div className="flex items-center gap-2 font-orbitron font-bold text-lg">
                        {portfolio.gainLoss >= 0 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        ${Math.abs(portfolio.gainLoss).toLocaleString()}
                      </div>
                    </div>
                    <div className={`px-4 py-3 rounded-lg border ${portfolio.gainLossPercent >= 0 ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                      <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Return</p>
                      <div className="flex items-center gap-2 font-orbitron font-bold text-lg">
                        {portfolio.gainLossPercent >= 0 ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border">
            <CardHeader>
              <CardTitle className="font-orbitron text-lg">Holdings Map</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : portfolio?.holdings ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="text-left font-orbitron font-normal py-3 px-4 uppercase tracking-wider text-[10px]">Asset</th>
                        <th className="text-right font-orbitron font-normal py-3 px-4 uppercase tracking-wider text-[10px]">Allocation</th>
                        <th className="text-right font-orbitron font-normal py-3 px-4 uppercase tracking-wider text-[10px]">Value</th>
                        <th className="text-right font-orbitron font-normal py-3 px-4 uppercase tracking-wider text-[10px]">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {portfolio.holdings.map((h, i) => (
                        <tr key={i} className="hover:bg-secondary/10 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-orbitron font-bold text-foreground">{h.symbol}</div>
                            <div className="text-xs text-muted-foreground">{h.name}</div>
                          </td>
                          <td className="text-right py-4 px-4 font-mono">{h.allocation}%</td>
                          <td className="text-right py-4 px-4 font-mono">${h.currentValue.toLocaleString()}</td>
                          <td className={`text-right py-4 px-4 font-mono font-medium ${h.gainLoss >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {h.gainLoss >= 0 ? '+' : '-'}${Math.abs(h.gainLoss).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No holdings found.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts & Ratings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/40 border-border">
            <CardHeader className="pb-0">
              <CardTitle className="font-orbitron text-lg text-center">Diversification</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full rounded-full" />
              ) : portfolio?.holdings ? (
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={portfolio.holdings}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="allocation"
                        stroke="none"
                      >
                        {portfolio.holdings.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'monospace' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Activity className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border">
            <CardHeader>
              <CardTitle className="font-orbitron text-lg">Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : portfolio?.investorScores?.badges ? (
                <div className="flex flex-wrap gap-2">
                  {portfolio.investorScores.badges.map((badge, i) => (
                    <div key={i} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-orbitron text-primary-foreground">{badge}</span>
                    </div>
                  ))}
                  {portfolio.investorScores.badges.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Complete challenges and simulations to earn badges.</p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
