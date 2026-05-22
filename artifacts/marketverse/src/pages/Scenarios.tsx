import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListScenarios, useGetScenario, MarketScenario } from "@workspace/api-client-react";
import { History, TrendingDown, Clock, AlertCircle, ArrowRight, BookOpen, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

export default function Scenarios() {
  const { data: scenarios, isLoading: loadingList } = useListScenarios();
  const [activeId, setActiveId] = useState<number | null>(null);

  const { data: activeScenario, isLoading: loadingDetail } = useGetScenario(
    activeId!,
    { query: { enabled: !!activeId } }
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <History className="text-primary w-8 h-8" />
          Historical Scenarios
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Relive past market crashes. Understand the panic, the recovery, and the lessons.</p>
      </div>

      {!activeId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingList ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl bg-card border border-border" />)
          ) : scenarios?.map((scenario, i) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card/40 border-border hover:border-primary/50 transition-all duration-300 h-full flex flex-col group cursor-pointer" onClick={() => setActiveId(scenario.id)}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-orbitron text-primary border border-primary/20 bg-primary/10 px-2 py-1 rounded">
                      {scenario.year}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{scenario.category}</span>
                  </div>
                  <CardTitle className="font-orbitron text-xl group-hover:text-primary transition-colors">{scenario.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6">{scenario.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-background/50 p-2 rounded border border-border">
                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Peak Drop</p>
                      <p className="text-lg font-bold text-destructive font-orbitron">{scenario.peakDropPercent}%</p>
                    </div>
                    <div className="bg-background/50 p-2 rounded border border-border">
                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Recovery</p>
                      <p className="text-lg font-bold text-accent font-orbitron">{scenario.recoveryMonths} mo</p>
                    </div>
                  </div>

                  <Button variant="ghost" className="w-full justify-between text-muted-foreground group-hover:text-primary border border-border/50 group-hover:border-primary/30">
                    Enter Timeline <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Button variant="ghost" onClick={() => setActiveId(null)} className="mb-6 text-muted-foreground hover:text-foreground">
            ← Return to Scenarios
          </Button>

          {loadingDetail || !activeScenario ? (
            <Skeleton className="h-[600px] w-full rounded-xl bg-card" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card/40 border-border overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <History className="w-64 h-64" />
                  </div>
                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-orbitron text-primary">{activeScenario.year}</span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-0.5 border border-border rounded">{activeScenario.category}</span>
                    </div>
                    <CardTitle className="text-3xl font-orbitron font-bold">{activeScenario.title}</CardTitle>
                    <CardDescription className="text-base text-foreground/80 mt-2">{activeScenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex gap-6 mb-8">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-destructive" />
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Drawdown</p>
                          <p className="text-xl font-bold font-orbitron text-destructive">{activeScenario.peakDropPercent}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent" />
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Recovery Time</p>
                          <p className="text-xl font-bold font-orbitron text-accent">{activeScenario.recoveryMonths} months</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-chart-3" />
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Primary Emotion</p>
                          <p className="text-xl font-bold font-orbitron capitalize text-chart-3">{activeScenario.emotionalTheme}</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full mt-6 bg-background/50 rounded-lg p-4 border border-border">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-orbitron">Market Value Trajectory</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeScenario.timeline.map((t, i) => ({ ...t, index: i }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                          />
                          <Line type="monotone" dataKey="marketMove" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 6, fill: "hsl(var(--destructive))" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/20 text-primary shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-orbitron font-bold text-lg mb-2 text-primary">Smart Investor Lesson</h3>
                      <p className="text-primary-foreground/90 leading-relaxed text-sm">{activeScenario.smartInvestorLesson}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="bg-card/40 border-border h-full max-h-[800px] flex flex-col">
                  <CardHeader className="border-b border-border/50 sticky top-0 bg-card/90 backdrop-blur z-10">
                    <CardTitle className="font-orbitron text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Event Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-y-auto flex-1">
                    <div className="relative p-6">
                      <div className="absolute left-6 top-6 bottom-6 w-px bg-border" />
                      <div className="space-y-8">
                        {activeScenario.timeline.map((event, index) => (
                          <div key={index} className="relative pl-6">
                            <div className={`absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${event.marketMove < 0 ? 'bg-destructive' : event.marketMove > 0 ? 'bg-accent' : 'bg-primary'}`} />
                            <div className="bg-background/50 border border-border p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-muted-foreground">{event.month}</span>
                                <span className={`text-xs font-bold ${event.marketMove < 0 ? 'text-destructive' : event.marketMove > 0 ? 'text-accent' : 'text-primary'}`}>
                                  {event.marketMove > 0 ? '+' : ''}{event.marketMove}%
                                </span>
                              </div>
                              <p className="text-sm font-medium mb-2">{event.event}</p>
                              <div className="inline-block px-2 py-1 bg-secondary/50 rounded text-[10px] uppercase tracking-wider text-muted-foreground border border-border/50">
                                Emotion: {event.emotion}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
