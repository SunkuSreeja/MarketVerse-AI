import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetPsychologyProfile, useRecordPsychologyEvent } from "@workspace/api-client-react";
import { BrainCircuit, Activity, Heart, AlertTriangle, Zap, ShieldAlert, Crosshair, ArrowDownCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = [
  { id: "panic_click", label: "Panic Reaction", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive" },
  { id: "fomo", label: "FOMO Buy", icon: Zap, color: "text-chart-3", bg: "bg-chart-3" },
  { id: "hesitation", label: "Hesitation", icon: Activity, color: "text-muted-foreground", bg: "bg-muted-foreground" },
  { id: "risky_decision", label: "Risky Call", icon: Crosshair, color: "text-chart-5", bg: "bg-chart-5" },
  { id: "panic_sell", label: "Panic Sell", icon: ArrowDownCircle, color: "text-destructive", bg: "bg-destructive" }
];

export default function Psychology() {
  const { data: profile, isLoading, refetch } = useGetPsychologyProfile();
  const recordEvent = useRecordPsychologyEvent();
  const { toast } = useToast();

  const [heartbeatRate, setHeartbeatRate] = useState(1); // multiplier
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // Dynamic heartbeat animation based on panic score
  useEffect(() => {
    if (profile) {
      const rate = 1 + (profile.panicScore / 100);
      setHeartbeatRate(rate);
    }
  }, [profile]);

  const handleSimulateEvent = (type: string, severity: number) => {
    setLastEvent(type);
    
    // Visual flash effect on body
    const el = document.getElementById("psych-container");
    if (el) {
      el.classList.add("bg-destructive/10");
      setTimeout(() => el.classList.remove("bg-destructive/10"), 300);
    }

    recordEvent.mutate(
      { data: { eventType: type, severity, context: "Simulator manual trigger" } },
      {
        onSuccess: () => {
          refetch();
          toast({
            title: "Biometric Event Recorded",
            description: `Detected: ${type.replace('_', ' ')} (Sev: ${severity})`,
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div id="psych-container" className="max-w-6xl mx-auto space-y-8 pb-12 transition-colors duration-300">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <BrainCircuit className="text-primary w-8 h-8" />
          Psychology Engine
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Real-time biometric & behavioral monitoring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Core Biometrics */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/50 border-border backdrop-blur-sm relative overflow-hidden min-h-[400px]">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            <CardContent className="p-8 relative z-10 h-full flex flex-col justify-center">
              {isLoading ? (
                <div className="space-y-8">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : profile ? (
                <>
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 / heartbeatRate }}
                        className="w-16 h-16 rounded-full bg-destructive/20 border border-destructive flex items-center justify-center shadow-[0_0_30px_rgba(255,51,102,0.3)]"
                      >
                        <Heart className="w-8 h-8 text-destructive" />
                      </motion.div>
                      <div>
                        <h3 className="font-orbitron text-xl text-destructive tracking-widest">BPM SIMULATION</h3>
                        <p className="font-mono text-sm text-muted-foreground">Stress Multiplier: {heartbeatRate.toFixed(2)}x</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Dominant Bias</h3>
                      <p className="text-2xl font-orbitron font-bold text-primary capitalize">
                        {profile.dominantBias.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <Meter label="Panic Response" value={profile.panicScore} color="bg-destructive" glow="shadow-[0_0_10px_rgba(255,51,102,0.5)]" />
                    <Meter label="Greed/FOMO Indicator" value={profile.greedScore} color="bg-chart-3" glow="shadow-[0_0_10px_rgba(255,170,0,0.5)]" />
                    <Meter label="Discipline Maintenance" value={profile.disciplineScore} color="bg-accent" glow="shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">No profile data available.</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border">
            <CardHeader>
              <CardTitle className="font-orbitron text-lg">AI Behavioral Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : profile ? (
                <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg text-sm text-primary-foreground leading-relaxed font-mono">
                  {profile.aiAdaptation}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Event Injector */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card/40 border-destructive/30 relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive/50" />
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-orbitron text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Stress Injector
              </CardTitle>
              <CardDescription>Manually trigger behavioral events to test engine response.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {EVENT_TYPES.map((ev) => (
                <Button 
                  key={ev.id}
                  variant="outline" 
                  className={`w-full justify-start h-12 border-border/50 hover:border-${ev.color} hover:bg-background/50 relative overflow-hidden group`}
                  onClick={() => handleSimulateEvent(ev.id, Math.floor(Math.random() * 3) + 3)}
                  disabled={recordEvent.isPending}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${ev.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <ev.icon className={`w-4 h-4 mr-3 ${ev.color} opacity-70 group-hover:opacity-100`} />
                  <span className="font-orbitron tracking-wider text-xs">{ev.label}</span>
                  {lastEvent === ev.id && recordEvent.isPending && (
                    <Activity className="w-4 h-4 ml-auto animate-pulse text-muted-foreground" />
                  )}
                </Button>
              ))}

              {profile?.topPatterns && profile.topPatterns.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Detected Patterns</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.topPatterns.map((pattern, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded bg-secondary text-secondary-foreground border border-border">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function Meter({ label, value, color, glow }: { label: string, value: number, color: string, glow: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-orbitron mb-2">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute top-0 left-0 h-full ${color} ${glow}`}
        />
      </div>
    </div>
  );
}
