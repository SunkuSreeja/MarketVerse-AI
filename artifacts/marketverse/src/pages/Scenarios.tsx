import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListScenarios, useGetScenario, type MarketScenario } from "@workspace/api-client-react";
import { History, TrendingDown, Clock, AlertCircle, ArrowRight, BookOpen, Activity, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { ReplayMode } from "@/components/ReplayMode";

const SEVERITY_COLOR: Record<string, string> = {
  catastrophic: '#ff3366',
  severe: '#ff3366',
  extreme: '#ff3366',
  high: '#ffaa00',
  moderate: '#00d4ff',
};

function ScenarioCard({ scenario, isActive, onClick }: { scenario: MarketScenario; isActive: boolean; onClick: () => void }) {
  const sev = scenario.severity?.toLowerCase() ?? 'moderate';
  const color = SEVERITY_COLOR[sev] ?? '#00d4ff';

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <button
        onClick={onClick}
        className={`w-full text-left p-5 rounded-xl border transition-all duration-300 ${
          isActive
            ? 'shadow-[0_0_25px_rgba(0,212,255,0.15)]'
            : 'border-border/50 hover:border-border'
        }`}
        style={isActive ? { borderColor: `${color}60`, background: `${color}06` } : { background: 'hsl(225,43%,7%)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-orbitron uppercase tracking-widest px-2 py-0.5 rounded border" style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
                {sev}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{scenario.year}</span>
            </div>
            <h3 className="font-orbitron font-bold text-sm text-foreground leading-snug">{scenario.title}</h3>
          </div>
          {isActive && (
            <div className="w-2 h-2 rounded-full animate-pulse mt-1 flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{scenario.description}</p>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-destructive" /> {scenario.maxDrawdown}% draw</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {scenario.durationMonths}mo</span>
        </div>
      </button>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-primary/30 rounded-lg p-3 text-xs font-mono shadow-xl backdrop-blur-sm">
      <p className="text-primary font-orbitron mb-1 text-[10px]">{label}</p>
      <p className={`font-bold ${payload[0].value >= 0 ? 'text-accent' : 'text-destructive'}`}>
        {payload[0].value >= 0 ? '+' : ''}{payload[0].value.toFixed(1)}%
      </p>
    </div>
  );
};

export default function Scenarios() {
  const { data: scenarios, isLoading } = useListScenarios();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replayId, setReplayId] = useState<number | null>(null);
  const { data: scenario, isLoading: loadingDetail } = useGetScenario(
    selectedId!,
    { query: { enabled: selectedId !== null } }
  );

  const chartData = scenario?.timeline?.map(t => ({
    date: t.date,
    change: t.indexLevel != null ? parseFloat(((t.indexLevel / (scenario.timeline?.[0]?.indexLevel ?? 100) - 1) * 100).toFixed(2)) : 0,
  })) ?? [];

  const minChange = Math.min(...chartData.map(d => d.change), 0);

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-7 pb-12">
        <div>
          <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
            <History className="text-primary w-8 h-8" />
            Historical Scenarios
          </h1>
          <p className="text-muted-foreground mt-2 font-light">Navigate legendary market crashes — frame by frame, with AI narration.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scenario List */}
          <div className="lg:col-span-4 space-y-3">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : scenarios?.map(s => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                isActive={selectedId === s.id}
                onClick={() => { setSelectedId(s.id); setReplayId(null); }}
              />
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!selectedId ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center text-center py-20">
                  <div>
                    <History className="w-16 h-16 text-muted-foreground/20 mx-auto mb-5" />
                    <p className="font-orbitron text-lg text-muted-foreground/50 uppercase tracking-widest">Select a Scenario</p>
                    <p className="text-sm text-muted-foreground/40 mt-2">Choose a historical crash to explore its timeline</p>
                  </div>
                </motion.div>
              ) : loadingDetail ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="bg-card/50 border-border p-6 space-y-4">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </Card>
                </motion.div>
              ) : scenario ? (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Title + Actions */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-orbitron text-primary/60 uppercase tracking-widest">{scenario.year}</span>
                        <span className="text-[10px] font-mono text-muted-foreground/50">•</span>
                        <span className="text-[10px] font-orbitron text-destructive/70 uppercase tracking-widest">{scenario.severity}</span>
                      </div>
                      <h2 className="text-2xl font-orbitron font-bold text-foreground">{scenario.title}</h2>
                    </div>
                    <Button
                      onClick={() => setReplayId(scenario.id)}
                      className="scanning-button flex items-center gap-2 font-orbitron text-xs tracking-widest h-10 px-5 border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all"
                      style={{ background: 'rgba(0,212,255,0.08)', flexShrink: 0 }}
                    >
                      <Play className="w-4 h-4" />
                      REPLAY
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Max Drawdown', value: `${scenario.maxDrawdown}%`, icon: TrendingDown, color: '#ff3366' },
                      { label: 'Duration', value: `${scenario.durationMonths} months`, icon: Clock, color: '#00d4ff' },
                      { label: 'Severity', value: scenario.severity, icon: AlertCircle, color: SEVERITY_COLOR[scenario.severity?.toLowerCase() ?? 'moderate'] },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="p-4 rounded-xl border border-border/50 bg-background/30 text-center">
                        <Icon className="w-4 h-4 mx-auto mb-2" style={{ color }} />
                        <p className="font-orbitron font-bold text-base capitalize" style={{ color }}>{value}</p>
                        <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  {chartData.length > 0 && (
                    <Card className="bg-card/40 border-border">
                      <CardHeader className="pb-2 border-b border-border/30">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <CardTitle className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest">Market Timeline</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="scenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff3366" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#ff3366" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                            <ReferenceLine y={minChange} stroke="rgba(255,51,102,0.4)" strokeDasharray="4 3" label={{ value: 'Bottom', fill: '#ff3366', fontSize: 9, fontFamily: 'monospace' }} />
                            <Area type="monotone" dataKey="change" stroke="#ff3366" strokeWidth={1.5} fill="url(#scenGrad)" dot={false} activeDot={{ r: 4, fill: '#ff3366', strokeWidth: 0 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description + Key Events */}
                  <Card className="bg-card/40 border-border">
                    <CardContent className="p-5 space-y-4">
                      <p className="text-sm text-foreground/80 leading-relaxed">{scenario.description}</p>
                      {scenario.keyEvents && scenario.keyEvents.length > 0 && (
                        <div>
                          <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                            <BookOpen className="w-3 h-3" /> Key Events
                          </p>
                          <div className="space-y-2">
                            {scenario.keyEvents.map((ev, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-sm">
                                <div className="w-1 h-1 rounded-full bg-primary/60 mt-2.5 flex-shrink-0" />
                                <span className="text-foreground/70 leading-relaxed">{ev}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {scenario.lesson && (
                        <div className="border-t border-border/40 pt-4">
                          <p className="text-[10px] font-orbitron text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> Key Lesson
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed italic">"{scenario.lesson}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Replay CTA */}
                  <div className="flex items-center gap-4 p-5 rounded-xl border border-primary/20 bg-primary/3">
                    <div className="flex-1">
                      <p className="font-orbitron font-bold text-base text-foreground mb-1">Ready to relive this crash?</p>
                      <p className="text-sm text-muted-foreground">Step through every candle with real-time AI narration and decision prompts.</p>
                    </div>
                    <Button onClick={() => setReplayId(scenario.id)} className="scanning-button font-orbitron text-xs tracking-widest px-6 border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all" style={{ background: 'rgba(0,212,255,0.08)' }}>
                      <Play className="w-4 h-4 mr-2" /> START REPLAY
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Full-screen Replay Overlay */}
      {replayId !== null && scenarios && (
        <ReplayMode
          scenarioId={replayId}
          scenarioTitle={scenarios.find(s => s.id === replayId)?.title ?? 'Market Replay'}
          onClose={() => setReplayId(null)}
        />
      )}
    </>
  );
}
