import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  useGetPsychologyProfile,
  useGetInvestorScores,
  useGetSimulationSummary,
} from "@workspace/api-client-react";
import { Activity, BrainCircuit, Trophy, TrendingUp, AlertTriangle, ArrowRight, Zap, MessageSquare, History, Swords, PieChart, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function useMarketStatus() {
  const [status, setStatus] = useState({ open: false, label: 'CHECKING...' });
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = ist.getDay();
      const h = ist.getHours();
      const m = ist.getMinutes();
      const t = h * 60 + m;
      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && t >= 555 && t <= 930;
      setStatus({ open: isOpen, label: isOpen ? 'NSE/BSE OPEN' : 'MARKET CLOSED' });
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);
  return status;
}

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let curr = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      curr = Math.min(curr + step, target);
      setVal(Math.round(curr));
      if (curr >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

function ScoreCard({ title, score = 0, icon: Icon, glowColor }: { title: string; score?: number; icon: React.ElementType; glowColor: string }) {
  const animated = useCountUp(score);
  return (
    <Card className="bg-card/40 border-border/50 overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}50, transparent)` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(ellipse at top right, ${glowColor}08 0%, transparent 60%)` }} />
      <CardContent className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${glowColor}15`, border: `1px solid ${glowColor}30` }}>
            <Icon className="w-4 h-4" style={{ color: glowColor }} />
          </div>
          <span className="font-orbitron font-black text-3xl" style={{ color: glowColor }}>{animated}</span>
        </div>
        <p className="text-[11px] font-orbitron text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="mt-3 w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${glowColor}40, ${glowColor})`, boxShadow: `0 0 6px ${glowColor}60` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, title, desc, icon: Icon, accent = '#00d4ff' }: { href: string; title: string; desc: string; icon: React.ElementType; accent?: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/30 hover:border-border/60 bg-background/20 hover:bg-background/40 transition-all cursor-pointer group">
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-orbitron text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default function Universe() {
  const { data: profile, isLoading: loadingProfile } = useGetPsychologyProfile();
  const { data: scores, isLoading: loadingScores } = useGetInvestorScores();
  const { data: summary, isLoading: loadingSummary } = useGetSimulationSummary();
  const marketStatus = useMarketStatus();

  const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
            <Globe className="text-primary w-8 h-8" />
            Command Center
          </h1>
          <p className="text-muted-foreground mt-2 font-light">Your real-time dashboard for market intelligence.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/50 bg-card/40">
            <div className={`relative w-2 h-2 rounded-full ${marketStatus.open ? 'bg-accent' : 'bg-muted-foreground'}`}>
              {marketStatus.open && <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping" />}
            </div>
            <span className="text-[10px] font-orbitron tracking-widest" style={{ color: marketStatus.open ? '#00ff88' : undefined }}>{marketStatus.label}</span>
          </div>
          {scores?.overallRank && (
            <div className="px-3 py-2 rounded-full border border-primary/30 bg-primary/5 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-orbitron font-bold text-primary">{scores.overallRank}</span>
            </div>
          )}
        </div>
      </div>

      {/* Score Cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingScores ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <motion.div variants={item}><ScoreCard title="Investor IQ" score={scores?.investorIQ} icon={BrainCircuit} glowColor="#00d4ff" /></motion.div>
            <motion.div variants={item}><ScoreCard title="Discipline" score={scores?.disciplineScore} icon={Trophy} glowColor="#00ff88" /></motion.div>
            <motion.div variants={item}><ScoreCard title="Risk Balance" score={scores?.riskBalance} icon={Activity} glowColor="#ffaa00" /></motion.div>
            <motion.div variants={item}><ScoreCard title="Emotional Stability" score={scores?.emotionalStability} icon={Zap} glowColor="#b400ff" /></motion.div>
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Psychology Card */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-orbitron flex items-center gap-2 text-base">
                <BrainCircuit className="text-primary w-4 h-4" /> Psychology Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {loadingProfile ? (
                <div className="space-y-3"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-16 w-full" /></div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,212,255,0.12)]">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Dominant Bias</p>
                      <p className="text-2xl font-orbitron font-bold text-foreground capitalize">{profile.dominantBias.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border-l-2 border-primary text-sm leading-relaxed text-foreground/80">
                    <span className="font-orbitron text-primary text-[10px] uppercase tracking-widest mr-2">AI:</span>
                    {profile.aiAdaptation}
                  </div>
                  <Link href="/psychology">
                    <Button variant="outline" size="sm" className="font-orbitron text-xs border-primary/30 text-primary hover:bg-primary/10">
                      Open Psychology Engine <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BrainCircuit className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mb-3">No psychology profile yet. Trigger events to build yours.</p>
                  <Link href="/psychology"><Button size="sm" className="font-orbitron text-xs">Open Psychology Engine</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simulation Summary */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="font-orbitron flex items-center gap-2 text-base">
                <Activity className="text-accent w-4 h-4" /> Simulation Summary
              </CardTitle>
              <Link href="/simulator">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary font-orbitron">
                  Run New <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-5">
              {loadingSummary ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : summary && summary.totalSimulations > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Simulations', value: String(summary.totalSimulations), color: '#00d4ff' },
                    { label: 'Avg Gain', value: `+${summary.avgProjectedGain}%`, color: '#00ff88' },
                    { label: 'Top Style', value: summary.mostPopularStyle, color: '#ffaa00' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-4 rounded-lg border border-border/30 bg-background/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-orbitron mb-2">{label}</p>
                      <p className="font-orbitron font-bold text-lg capitalize" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mb-3">No simulations run yet.</p>
                  <Link href="/simulator"><Button size="sm" className="font-orbitron text-xs">Start Simulation</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div>
          <Card className="bg-card/50 border-border h-full">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-orbitron flex items-center gap-2 text-base">
                <TrendingUp className="text-primary w-4 h-4" /> Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <QuickLink href="/market" title="Market Watch" desc="Live candlestick charts" icon={Globe} accent="#00d4ff" />
              <QuickLink href="/mentor" title="AI Mentor" desc="Gemini-powered guidance" icon={MessageSquare} accent="#00d4ff" />
              <QuickLink href="/scenarios" title="Historical Crashes" desc="Relive market events" icon={History} accent="#ffaa00" />
              <QuickLink href="/challenges" title="Challenge Arena" desc="Gamified investing tests" icon={Swords} accent="#ff3366" />
              <QuickLink href="/portfolio" title="Portfolio" desc="Holdings & performance" icon={PieChart} accent="#b400ff" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
