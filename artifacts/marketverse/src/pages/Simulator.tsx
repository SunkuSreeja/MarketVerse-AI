import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateSimulation, 
  useRunSimulation,
  useListSimulations
} from "@workspace/api-client-react";
import { 
  Activity, 
  Play, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const simSchema = z.object({
  name: z.string().min(1, "Name is required"),
  investmentStyle: z.enum(["conservative", "moderate", "aggressive", "yolo"]),
  monthlyAmount: z.coerce.number().min(10, "Minimum ₹10").max(1000000),
  riskLevel: z.number().min(1).max(10),
  diversification: z.number().min(0).max(100),
  timeHorizonYears: z.coerce.number().min(1).max(50),
  startingAmount: z.coerce.number().min(0),
});

const STYLES = [
  { value: 'conservative', label: 'Conservative', desc: 'Low risk, stable growth', color: '#00ff88' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced approach', color: '#00d4ff' },
  { value: 'aggressive', label: 'Aggressive', desc: 'High risk, high reward', color: '#ffaa00' },
  { value: 'yolo', label: 'YOLO', desc: 'Maximum risk mode', color: '#ff3366' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-primary/30 rounded-lg p-3 text-xs backdrop-blur-sm shadow-[0_0_20px_rgba(0,212,255,0.1)]">
      <p className="font-orbitron text-primary text-[10px] mb-1.5">Year {label}</p>
      <p className="font-bold text-accent">₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
      {payload[1] && <p className="text-destructive/80 text-[10px]">Min: ₹{payload[1]?.value?.toLocaleString('en-IN')}</p>}
    </div>
  );
};

export default function Simulator() {
  const [activeSimId, setActiveSimId] = useState<number | null>(null);
  const { data: simulations, refetch: refetchSims } = useListSimulations();
  const createSim = useCreateSimulation();
  const runSim = useRunSimulation();
  const [outcome, setOutcome] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatingStep, setSimulatingStep] = useState(0);

  const STEPS = ['Parsing parameters...', 'Running Monte Carlo...', 'Calculating risk bands...', 'Generating projections...'];

  const form = useForm<z.infer<typeof simSchema>>({
    resolver: zodResolver(simSchema),
    defaultValues: {
      name: "My Investment Plan",
      investmentStyle: "moderate",
      monthlyAmount: 5000,
      riskLevel: 5,
      diversification: 70,
      timeHorizonYears: 10,
      startingAmount: 50000,
    },
  });

  const watchedStyle = form.watch('investmentStyle');
  const activeStyle = STYLES.find(s => s.value === watchedStyle) ?? STYLES[1];

  const onSubmit = (data: z.infer<typeof simSchema>) => {
    createSim.mutate({ data }, {
      onSuccess: (newSim) => {
        refetchSims();
        handleRunSim(newSim.id);
      }
    });
  };

  const handleRunSim = (id: number) => {
    setActiveSimId(id);
    setIsSimulating(true);
    setOutcome(null);
    setSimulatingStep(0);

    // Cycling step display
    const stepInterval = setInterval(() => {
      setSimulatingStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 600);

    setTimeout(() => {
      clearInterval(stepInterval);
      runSim.mutate({ id }, {
        onSuccess: (res) => {
          setOutcome(res);
          setIsSimulating(false);
        },
        onError: () => setIsSimulating(false),
      });
    }, 2500);
  };

  const chartData = outcome?.projectionData ?? [];
  const finalValue = outcome?.projectedValue;
  const totalInvested = outcome?.totalInvested;
  const gain = finalValue && totalInvested ? finalValue - totalInvested : null;
  const gainPct = gain && totalInvested ? ((gain / totalInvested) * 100).toFixed(1) : null;
  const isPositive = (gain ?? 0) >= 0;

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <Activity className="text-primary w-8 h-8" />
          Future Simulator
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Configure variables and project your financial trajectory across time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${activeStyle.color}60, transparent)` }} />
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-orbitron text-base">Simulation Config</CardTitle>
              <CardDescription className="text-xs">Configure your investment parameters.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Simulation Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background/60 border-border/50 text-sm h-9 font-mono" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  {/* Investment Style */}
                  <FormField control={form.control} name="investmentStyle" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Investment Style</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                          {STYLES.map(s => (
                            <label key={s.value} className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all duration-200 ${field.value === s.value ? 'border-opacity-60 shadow-sm' : 'border-border/40 hover:border-border/70'}`}
                              style={field.value === s.value ? { borderColor: s.color + '60', background: s.color + '08', boxShadow: `0 0 15px ${s.color}15` } : {}}>
                              <RadioGroupItem value={s.value} className="sr-only" />
                              <span className="font-orbitron text-xs font-bold mb-0.5" style={{ color: field.value === s.value ? s.color : undefined }}>{s.label}</span>
                              <span className="text-[9px] text-muted-foreground">{s.desc}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* Starting Amount */}
                  <FormField control={form.control} name="startingAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Initial Capital (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" className="bg-background/60 border-border/50 h-9 font-mono text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  {/* Monthly SIP */}
                  <FormField control={form.control} name="monthlyAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Monthly SIP (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" className="bg-background/60 border-border/50 h-9 font-mono text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  {/* Risk Level Slider */}
                  <FormField control={form.control} name="riskLevel" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Risk Level</FormLabel>
                        <span className="font-orbitron font-bold text-sm" style={{ color: field.value > 7 ? '#ff3366' : field.value > 4 ? '#ffaa00' : '#00ff88' }}>{field.value}/10</span>
                      </div>
                      <FormControl>
                        <div className="pt-1">
                          <Slider min={1} max={10} step={1} value={[field.value]} onValueChange={([v]) => field.onChange(v)} className="w-full" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* Time Horizon */}
                  <FormField control={form.control} name="timeHorizonYears" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Time Horizon</FormLabel>
                        <span className="font-orbitron font-bold text-sm text-primary">{field.value}Y</span>
                      </div>
                      <FormControl>
                        <div className="pt-1">
                          <Slider min={1} max={50} step={1} value={[field.value]} onValueChange={([v]) => field.onChange(v)} className="w-full" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* Diversification */}
                  <FormField control={form.control} name="diversification" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">Diversification</FormLabel>
                        <span className="font-orbitron font-bold text-sm text-accent">{field.value}%</span>
                      </div>
                      <FormControl>
                        <div className="pt-1">
                          <Slider min={0} max={100} step={5} value={[field.value]} onValueChange={([v]) => field.onChange(v)} className="w-full" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    disabled={createSim.isPending || isSimulating}
                    className="scanning-button w-full h-12 font-orbitron font-bold tracking-widest border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300"
                    style={{ background: 'rgba(0,212,255,0.08)' }}
                  >
                    {isSimulating ? (
                      <><div className="w-4 h-4 border-2 border-primary/50 border-t-primary rounded-full animate-spin mr-2" /> COMPUTING...</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" /> RUN SIMULATION</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {isSimulating ? (
              <motion.div key="simulating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="bg-card/50 border-border overflow-hidden relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <CardContent className="p-10 flex flex-col items-center justify-center min-h-[400px] relative z-10">
                    {/* Animated rings */}
                    <div className="relative w-24 h-24 mb-8">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border border-primary/50"
                          animate={{ scale: [1, 2 + i * 0.3, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                        />
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-10 h-10 text-primary animate-pulse" />
                      </div>
                    </div>
                    <p className="font-orbitron font-bold text-xl text-foreground mb-2">Running Simulation</p>
                    <motion.p
                      key={simulatingStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-primary/70 font-mono mb-8"
                    >
                      {STEPS[simulatingStep]}
                    </motion.p>
                    {/* Fake loading bars */}
                    <div className="w-full max-w-xs space-y-2">
                      {STEPS.map((step, i) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i <= simulatingStep ? 'bg-primary shadow-[0_0_6px_rgba(0,212,255,0.8)]' : 'bg-border'}`} />
                          <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-border/30">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: i <= simulatingStep ? '100%' : '0%' }}
                              transition={{ duration: 0.6, delay: i * 0.1 }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-20 truncate">{step.split('...')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            ) : outcome ? (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Result Headline */}
                <div
                  className="p-6 rounded-xl border relative overflow-hidden"
                  style={{
                    background: isPositive ? 'rgba(0,255,136,0.04)' : 'rgba(255,51,102,0.04)',
                    borderColor: isPositive ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)',
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${isPositive ? '#00ff88' : '#ff3366'}50, transparent)` }} />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-1.5">Projected Value</p>
                      <p className="font-orbitron font-black text-2xl text-foreground">₹{finalValue?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-1.5">Total Invested</p>
                      <p className="font-orbitron font-bold text-xl text-foreground/70">₹{totalInvested?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-1.5">Net Gain/Loss</p>
                      <div className={`flex items-center gap-1.5 ${isPositive ? 'text-accent' : 'text-destructive'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-orbitron font-bold text-xl">{gainPct}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                  <Card className="bg-card/40 border-border">
                    <CardHeader className="pb-2 border-b border-border/30">
                      <CardTitle className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.8)]" />
                        Projection Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-4">
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#00ff88" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="simGradMin" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff3366" stopOpacity={0.1} />
                              <stop offset="100%" stopColor="#ff3366" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
                          <XAxis dataKey="year" tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} label={{ value: 'Years', fill: 'rgba(148,163,184,0.3)', fontSize: 8, position: 'insideBottom', offset: -2 }} />
                          <YAxis tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1e6 ? `₹${(v/1e6).toFixed(1)}L` : v >= 1e3 ? `₹${(v/1e3).toFixed(0)}K` : `₹${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          {totalInvested && <ReferenceLine y={totalInvested} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />}
                          {chartData[0]?.min !== undefined && <Area type="monotone" dataKey="min" stroke="#ff3366" strokeWidth={1} strokeDasharray="4 3" fill="url(#simGradMin)" dot={false} activeDot={false} opacity={0.5} />}
                          <Area type="monotone" dataKey="value" stroke="#00ff88" strokeWidth={2} fill="url(#simGrad)" dot={false} activeDot={{ r: 4, fill: '#00ff88', strokeWidth: 0, filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.8))' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Analysis */}
                {outcome.analysis && (
                  <Card className="bg-card/40 border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-orbitron text-primary uppercase tracking-widest mb-2">AI Analysis</p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{outcome.analysis}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={() => { setOutcome(null); setActiveSimId(null); }} variant="outline" className="w-full font-orbitron text-xs tracking-widest h-10 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40">
                  <RefreshCw className="w-4 h-4 mr-2" /> Run New Simulation
                </Button>
              </motion.div>

            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="bg-card/40 border-border overflow-hidden">
                  <CardContent className="p-10 flex flex-col items-center justify-center min-h-[420px] text-center">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }}>
                        <Activity className="w-10 h-10 text-primary/60" />
                      </div>
                      <motion.div
                        className="absolute -inset-2 rounded-full border border-primary/15"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    </div>
                    <h3 className="font-orbitron font-bold text-xl mb-3">Ready to simulate</h3>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
                      Configure your investment parameters on the left and hit RUN SIMULATION to project your financial future.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/50 font-orbitron">
                      <span>Configure</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>Simulate</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>Analyze</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Past simulations */}
                {simulations && simulations.length > 0 && (
                  <div>
                    <p className="text-xs font-orbitron text-muted-foreground uppercase tracking-widest mb-3">Past Simulations</p>
                    <div className="space-y-2">
                      {simulations.slice(-4).reverse().map(sim => (
                        <button
                          key={sim.id}
                          onClick={() => handleRunSim(sim.id)}
                          className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border/40 hover:border-border/70 hover:bg-white/3 transition-all text-left"
                        >
                          <div>
                            <p className="font-orbitron text-xs font-semibold text-foreground">{sim.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{sim.investmentStyle} · {sim.timeHorizonYears}yr · Risk {sim.riskLevel}/10</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
