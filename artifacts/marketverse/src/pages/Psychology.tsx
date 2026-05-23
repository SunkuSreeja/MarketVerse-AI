import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetPsychologyProfile, useRecordPsychologyEvent } from "@workspace/api-client-react";
import { BrainCircuit, Activity, AlertTriangle, Zap, ShieldAlert, Crosshair, ArrowDownCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { HeartbeatECG } from "@/components/HeartbeatECG";

const EVENT_TYPES = [
  { id: "panic_click", label: "Panic Reaction", icon: ShieldAlert, color: "#ff3366", desc: "Irrational fear response" },
  { id: "fomo", label: "FOMO Buy", icon: Zap, color: "#ffaa00", desc: "Fear of missing out" },
  { id: "hesitation", label: "Hesitation", icon: Activity, color: "#94a3b8", desc: "Analysis paralysis" },
  { id: "risky_decision", label: "Risky Call", icon: Crosshair, color: "#b400ff", desc: "High-stakes gamble" },
  { id: "panic_sell", label: "Panic Sell", icon: ArrowDownCircle, color: "#ff3366", desc: "Capitulation event" },
];

const BIAS_PROFILES: Record<string, { color: string; desc: string }> = {
  loss_aversion:   { color: '#ff3366', desc: "You feel losses 2x more intensely than equivalent gains. This causes premature exits." },
  overconfidence:  { color: '#ffaa00', desc: "You overestimate your ability to predict market direction. Risk of over-leveraging." },
  herding:         { color: '#00d4ff', desc: "You follow the crowd rather than independent analysis. Susceptible to hype cycles." },
  anchoring:       { color: '#b400ff', desc: "You fixate on specific price points (like your buy price) rather than current value." },
  fomo:            { color: '#ffaa00', desc: "Fear of missing out drives impulsive buys near market tops." },
  panic:           { color: '#ff3366', desc: "High stress response to volatility. Risk of selling at the worst possible time." },
};

function GlowOrb({ value, color, label }: { value: number; color: string; label: string }) {
  const size = 60 + (value / 100) * 40;
  const glowIntensity = (value / 100) * 40;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: size + 20, height: size + 20, background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }}
        />
        {/* Core orb */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-full flex items-center justify-center"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, ${color}30 0%, ${color}10 60%, transparent 100%)`,
            border: `2px solid ${color}60`,
            boxShadow: `0 0 ${glowIntensity}px ${color}50, inset 0 0 20px ${color}15`,
          }}
        >
          <span className="font-orbitron font-black text-xl" style={{ color }}>{value}</span>
        </motion.div>
      </div>
      <div className="text-center">
        <p className="text-xs font-orbitron text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function Meter({ label, value, color, glow }: { label: string; value: number; color: string; glow: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-orbitron uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-sm font-orbitron font-bold" style={{ color: glow }}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${glow}60, ${glow})`, boxShadow: `0 0 8px ${glow}60` }}
        />
      </div>
    </div>
  );
}

export default function Psychology() {
  const { data: profile, isLoading, refetch } = useGetPsychologyProfile();
  const recordEvent = useRecordPsychologyEvent();
  const { toast } = useToast();
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const panicScore = profile?.panicScore ?? 0;
  const greedScore = profile?.greedScore ?? 0;
  const disciplineScore = profile?.disciplineScore ?? 0;

  const biasInfo = profile?.dominantBias ? (BIAS_PROFILES[profile.dominantBias] ?? { color: '#00d4ff', desc: '' }) : null;

  const handleSimulateEvent = (type: string, color: string, severity: number) => {
    setLastEvent(type);
    setFlashColor(color);
    setNotification("NEURAL SPIKE DETECTED");
    setTimeout(() => setFlashColor(null), 400);
    setTimeout(() => setNotification(null), 2500);

    recordEvent.mutate(
      { data: { eventType: type, severity, context: "Manual trigger via Stress Injector" } },
      {
        onSuccess: () => {
          refetch();
          toast({
            title: "Biometric Event Recorded",
            description: `Detected: ${type.replace(/_/g, ' ')} — severity ${severity}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div
      id="psych-container"
      className="max-w-6xl mx-auto space-y-8 pb-12 relative transition-all duration-300"
      style={flashColor ? { background: `${flashColor}08` } : undefined}
    >
      {/* Flash vignette */}
      <AnimatePresence>
        {flashColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: `radial-gradient(ellipse at center, transparent 30%, ${flashColor}25 100%)` }}
          />
        )}
      </AnimatePresence>

      {/* Neural spike notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-lg border border-destructive/40 bg-destructive/10 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(255,51,102,0.8)]" />
              <span className="font-orbitron text-xs text-destructive uppercase tracking-widest">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <BrainCircuit className="text-primary w-8 h-8" />
          Psychology Engine
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Real-time biometric and behavioral monitoring of your investor psychology.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: ECG + Meters */}
        <div className="lg:col-span-8 space-y-5">
          {/* ECG Card */}
          <Card className="bg-card/50 border-border backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            <CardHeader className="border-b border-border/30">
              <CardTitle className="font-orbitron text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(255,51,102,0.8)]" />
                Biometric Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : profile ? (
                <>
                  <HeartbeatECG panicScore={panicScore} greedScore={greedScore} width={undefined as unknown as number} height={70} />

                  {/* Dominant bias */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/30">
                    <div>
                      <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-1">Dominant Bias</p>
                      <p className="font-orbitron font-bold text-xl capitalize" style={{ color: biasInfo?.color ?? '#00d4ff' }}>
                        {profile.dominantBias.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {biasInfo && (
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: biasInfo.color, boxShadow: `0 0 12px ${biasInfo.color}` }} />
                    )}
                  </div>

                  {/* Meters */}
                  <div className="space-y-5">
                    <Meter label="Panic Response" value={panicScore} color="bg-destructive" glow="#ff3366" />
                    <Meter label="Greed Indicator" value={greedScore} color="bg-chart-3" glow="#ffaa00" />
                    <Meter label="Discipline Score" value={disciplineScore} color="bg-accent" glow="#00ff88" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No biometric data yet. Trigger events below to build your profile.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emotional State Orbs */}
          {profile && (
            <Card className="bg-card/30 border-border">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="font-orbitron text-sm text-muted-foreground uppercase tracking-widest">Current Emotional State</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-around">
                  <GlowOrb value={panicScore} color="#ff3366" label="Panic" />
                  <GlowOrb value={greedScore} color="#ffaa00" label="Greed" />
                  <GlowOrb value={disciplineScore} color="#00ff88" label="Discipline" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {profile?.aiAdaptation && (
            <Card className="bg-card/30 border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-orbitron text-primary uppercase tracking-widest mb-2">AI Behavioral Analysis</p>
                    {biasInfo?.desc && (
                      <p className="text-sm text-foreground/80 leading-relaxed mb-3 border-l-2 pl-3" style={{ borderColor: biasInfo.color + '60' }}>{biasInfo.desc}</p>
                    )}
                    <div className="text-sm text-muted-foreground leading-relaxed font-mono text-xs bg-primary/5 border border-primary/10 rounded-lg p-3">
                      {profile.aiAdaptation}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Stress Injector */}
        <div className="lg:col-span-4">
          <Card className="bg-card/40 border-destructive/25 relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-destructive/50" />
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-orbitron text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Stress Injector
              </CardTitle>
              <CardDescription>Manually trigger behavioral events to test psychological response.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-2.5">
              {EVENT_TYPES.map((ev) => (
                <motion.div key={ev.id} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-14 border-border/40 relative overflow-hidden group"
                    style={{ borderLeftColor: ev.color + '80', borderLeftWidth: 3 }}
                    onClick={() => handleSimulateEvent(ev.id, ev.color, Math.floor(Math.random() * 3) + 4)}
                    disabled={recordEvent.isPending}
                  >
                    {/* Ripple on click */}
                    <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-100 rounded-md" style={{ background: `${ev.color}15` }} />
                    <div className="flex items-start gap-3 relative z-10 w-full">
                      <ev.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ev.color }} />
                      <div className="flex-1 text-left">
                        <div className="font-orbitron text-xs font-bold tracking-wider" style={{ color: lastEvent === ev.id ? ev.color : undefined }}>
                          {ev.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{ev.desc}</div>
                      </div>
                      {lastEvent === ev.id && recordEvent.isPending && (
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse mt-1.5 flex-shrink-0" style={{ background: ev.color }} />
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}

              {profile?.topPatterns && profile.topPatterns.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border/40">
                  <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-3">Detected Patterns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.topPatterns.map((pattern, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded border border-border/50 bg-secondary/30 text-muted-foreground font-orbitron">
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
