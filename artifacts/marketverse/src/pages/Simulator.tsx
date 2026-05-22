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
  RefreshCw
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
  monthlyAmount: z.coerce.number().min(10, "Minimum $10").max(1000000),
  riskLevel: z.number().min(1).max(10),
  diversification: z.number().min(0).max(100),
  timeHorizonYears: z.coerce.number().min(1).max(50),
  startingAmount: z.coerce.number().min(0),
});

export default function Simulator() {
  const [activeSimId, setActiveSimId] = useState<number | null>(null);
  
  const { data: simulations, refetch: refetchSims, isLoading: loadingSims } = useListSimulations();
  const createSim = useCreateSimulation();
  const runSim = useRunSimulation();

  const [outcome, setOutcome] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const form = useForm<z.infer<typeof simSchema>>({
    resolver: zodResolver(simSchema),
    defaultValues: {
      name: "My First Plan",
      investmentStyle: "moderate",
      monthlyAmount: 500,
      riskLevel: 5,
      diversification: 70,
      timeHorizonYears: 10,
      startingAmount: 1000,
    },
  });

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
    
    // Fake cinematic delay for UX
    setTimeout(() => {
      runSim.mutate({ id }, {
        onSuccess: (res) => {
          setOutcome(res);
          setIsSimulating(false);
        },
        onError: () => {
          setIsSimulating(false);
        }
      });
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <Activity className="text-primary w-8 h-8" />
          Future Simulator
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Configure variables and project potential timelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card/60 backdrop-blur-md border-primary/20 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-orbitron text-lg">Parameters</CardTitle>
              <CardDescription>Calibrate simulation engine</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Scenario Name</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 font-mono text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startingAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Initial ($)</FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-background/50 font-mono text-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthlyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Monthly ($)</FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-background/50 font-mono text-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="timeHorizonYears"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Horizon (Years)</FormLabel>
                          <span className="font-mono text-xs text-primary">{field.value}Y</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1} max={50} step={1}
                            value={[field.value]}
                            onValueChange={(val) => field.onChange(val[0])}
                            className="py-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="investmentStyle"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Strategy Vector</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-2"
                          >
                            {["conservative", "moderate", "aggressive", "yolo"].map((style) => (
                              <Label
                                key={style}
                                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all ${
                                  field.value === style ? "border-primary bg-primary/10 text-primary" : ""
                                }`}
                              >
                                <RadioGroupItem value={style} id={style} className="sr-only" />
                                <span className="text-xs font-orbitron uppercase tracking-wider">{style}</span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Risk Tolerance</FormLabel>
                          <span className="font-mono text-xs text-destructive">Lv.{field.value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1} max={10} step={1}
                            value={[field.value]}
                            onValueChange={(val) => field.onChange(val[0])}
                            className="py-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full font-orbitron tracking-widest font-bold bg-primary hover:bg-primary/80 text-primary-foreground h-12"
                    disabled={createSim.isPending || isSimulating}
                  >
                    {isSimulating ? (
                      <><RefreshCw className="mr-2 w-4 h-4 animate-spin" /> EXECUTING...</>
                    ) : (
                      <><Play className="mr-2 w-4 h-4" /> INITIALIZE RUN</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Projection Viewport */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/40 backdrop-blur-sm border-border min-h-[500px] flex flex-col relative overflow-hidden">
            {isSimulating && (
              <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(0,212,255,0.4)]" />
                <p className="font-orbitron text-primary font-bold tracking-widest animate-pulse">COMPUTING OUTCOMES...</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">Running Monte Carlo pathways...</p>
              </div>
            )}
            
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-orbitron flex items-center gap-2">
                Viewport
                {outcome && <span className="text-xs font-mono text-accent ml-2 px-2 py-0.5 bg-accent/10 rounded border border-accent/30">RUN COMPLETE</span>}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 flex-1 flex flex-col">
              {!outcome && !isSimulating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Activity className="w-16 h-16 mb-4" />
                  <p className="font-orbitron">AWAITING PARAMETERS</p>
                </div>
              ) : outcome ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex-1 flex flex-col space-y-6"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-background/60 border border-border rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Worst Case</p>
                      <p className="text-xl font-orbitron text-destructive font-bold">${outcome.worstCase.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-center shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                      <p className="text-[10px] text-primary uppercase tracking-widest mb-1">Projected</p>
                      <p className="text-2xl font-orbitron text-primary font-bold">${outcome.projectedValue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-background/60 border border-border rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Best Case</p>
                      <p className="text-xl font-orbitron text-accent font-bold">${outcome.bestCase.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={outcome.yearlyProjections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="year" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12} 
                          tickFormatter={(val) => `Yr ${val}`}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--primary))', fontFamily: 'monospace' }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected']}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                    <div className="p-4 bg-secondary/30 rounded-lg border border-secondary/50 text-sm">
                      <div className="flex items-center gap-2 mb-2 text-primary font-orbitron">
                        <Activity className="w-4 h-4" /> AI Insight
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{outcome.aiInsight}</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg border border-secondary/50 text-sm">
                      <div className="flex items-center gap-2 mb-2 text-accent font-orbitron">
                        <TrendingUp className="w-4 h-4" /> Alternative Strategy
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{outcome.alternativeStrategy}</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </CardContent>
          </Card>

          {/* History / Previous Runs */}
          <Card className="bg-card/30 border-border">
            <CardHeader className="py-4 border-b border-border/50">
              <CardTitle className="text-sm font-orbitron font-normal text-muted-foreground">Recent Transmissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSims ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : simulations && simulations.length > 0 ? (
                <div className="divide-y divide-border/50 max-h-48 overflow-y-auto">
                  {simulations.slice(0, 5).map((sim) => (
                    <div 
                      key={sim.id} 
                      className="flex items-center justify-between p-3 hover:bg-secondary/20 cursor-pointer transition-colors"
                      onClick={() => handleRunSim(sim.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{sim.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ${sim.monthlyAmount}/mo • Lv.{sim.riskLevel} Risk • {sim.timeHorizonYears}Y
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">No historical runs found.</div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
