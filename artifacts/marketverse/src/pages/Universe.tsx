import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  useGetPsychologyProfile, 
  useGetInvestorScores, 
  useGetSimulationSummary 
} from "@workspace/api-client-react";
import { 
  Activity, 
  BrainCircuit, 
  Trophy, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Universe() {
  const { data: profile, isLoading: loadingProfile } = useGetPsychologyProfile();
  const { data: scores, isLoading: loadingScores } = useGetInvestorScores();
  const { data: summary, isLoading: loadingSummary } = useGetSimulationSummary();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-2 font-light">Your central hub for market simulation and analysis.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-orbitron font-medium">Rank: <span className="text-accent">{scores?.overallRank || "Novice"}</span></span>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loadingScores ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-card border border-border" />)
        ) : (
          <>
            <ScoreCard title="Investor IQ" score={scores?.investorIQ} icon={BrainCircuit} color="text-primary" glow="shadow-[0_0_15px_rgba(0,212,255,0.2)]" />
            <ScoreCard title="Discipline" score={scores?.disciplineScore} icon={Trophy} color="text-accent" glow="shadow-[0_0_15px_rgba(0,255,136,0.2)]" />
            <ScoreCard title="Risk Balance" score={scores?.riskBalance} icon={Activity} color="text-chart-3" glow="shadow-[0_0_15px_rgba(255,170,0,0.2)]" />
            <ScoreCard title="Emotional Stability" score={scores?.emotionalStability} icon={Zap} color="text-chart-5" glow="shadow-[0_0_15px_rgba(180,0,255,0.2)]" />
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-orbitron flex items-center gap-2 text-lg">
                <BrainCircuit className="text-primary w-5 h-5" />
                Psychology Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3 bg-muted" />
                  <Skeleton className="h-20 w-full bg-muted" />
                </div>
              ) : profile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                      <AlertTriangle className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Dominant Bias</h3>
                      <p className="text-2xl font-orbitron font-bold text-foreground capitalize">{profile.dominantBias.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-secondary/50 text-sm leading-relaxed text-secondary-foreground border-l-4 border-l-primary">
                    <span className="font-bold text-primary mr-2">AI ADAPTATION:</span>
                    {profile.aiAdaptation}
                  </div>
                </div>
              ) : (
                <EmptyState message="Run simulations or scenarios to build your psychology profile." action={{ label: "Go to Psychology", href: "/psychology" }} />
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="font-orbitron flex items-center gap-2 text-lg">
                <Activity className="text-accent w-5 h-5" />
                Simulation Summary
              </CardTitle>
              <Link href="/simulator">
                <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
               {loadingSummary ? (
                 <div className="flex justify-between">
                   <Skeleton className="h-16 w-24 bg-muted" />
                   <Skeleton className="h-16 w-24 bg-muted" />
                   <Skeleton className="h-16 w-24 bg-muted" />
                 </div>
               ) : summary && summary.totalSimulations > 0 ? (
                 <div className="grid grid-cols-3 gap-4">
                   <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                     <p className="text-xs text-muted-foreground uppercase mb-2">Simulations</p>
                     <p className="text-2xl font-orbitron font-bold">{summary.totalSimulations}</p>
                   </div>
                   <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                     <p className="text-xs text-muted-foreground uppercase mb-2">Avg Gain</p>
                     <p className="text-2xl font-orbitron font-bold text-accent">+{summary.avgProjectedGain}%</p>
                   </div>
                   <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                     <p className="text-xs text-muted-foreground uppercase mb-2">Style</p>
                     <p className="text-lg font-orbitron font-bold capitalize mt-1 text-primary">{summary.mostPopularStyle}</p>
                   </div>
                 </div>
               ) : (
                 <EmptyState message="No simulations run yet." action={{ label: "Start Simulation", href: "/simulator" }} />
               )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border h-full">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-orbitron flex items-center gap-2 text-lg">
                <TrendingUp className="text-chart-4 w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-3">
              <QuickActionLink href="/mentor" title="Consult AI Mentor" desc="Get personalized advice" icon={MessageSquare} />
              <QuickActionLink href="/scenarios" title="Historical Scenarios" desc="Navigate past crashes" icon={History} />
              <QuickActionLink href="/challenges" title="Challenge Arena" desc="Test your knowledge" icon={Swords} />
              <QuickActionLink href="/portfolio" title="View Portfolio" desc="Check your asset allocation" icon={PieChart} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score = 0, icon: Icon, color, glow }: any) {
  return (
    <Card className={`bg-card/40 backdrop-blur-md border border-border/50 overflow-hidden relative group hover:border-primary/30 transition-colors`}>
      <div className={`absolute top-0 left-0 w-full h-1 ${glow} opacity-50`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Icon className={`w-6 h-6 ${color}`} />
          <span className="text-4xl font-orbitron font-bold">{score}</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="mt-4 w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${color.replace('text-', 'bg-')}`} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

import { MessageSquare, History, Swords, PieChart } from "lucide-react";

function QuickActionLink({ href, title, desc, icon: Icon }: any) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
        <div className="p-2 rounded-md bg-card border border-border group-hover:border-primary/30 group-hover:text-primary transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-orbitron font-medium text-sm group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function EmptyState({ message, action }: any) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-4">
        <Activity className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {action && (
        <Link href={action.href}>
          <Button variant="outline" size="sm" className="font-orbitron text-xs">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}
