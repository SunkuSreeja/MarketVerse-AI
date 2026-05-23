import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListChallenges, useSubmitChallengeAttempt, type Challenge } from "@workspace/api-client-react";
import { Swords, CheckCircle2, XCircle, ShieldAlert, AlertTriangle, ArrowRight, Sparkles, Clock, Trophy, Brain, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const DIFFICULTY_CONFIG: Record<string, { color: string; glow: string; label: string; icon: React.ElementType }> = {
  beginner:     { color: '#00ff88', glow: 'rgba(0,255,136,0.3)',   label: 'Beginner',     icon: Target },
  intermediate: { color: '#00d4ff', glow: 'rgba(0,212,255,0.3)',   label: 'Intermediate', icon: Brain },
  advanced:     { color: '#ffaa00', glow: 'rgba(255,170,0,0.3)',   label: 'Advanced',     icon: Zap },
  expert:       { color: '#ff3366', glow: 'rgba(255,51,102,0.3)', label: 'Expert',       icon: ShieldAlert },
};

interface Feedback {
  score: number;
  rationale: string;
  biasDetected?: string | null;
  correctAnswer?: string | null;
  lesson?: string | null;
}

function ChallengeCard({ challenge, onSelect, isSelected }: { challenge: Challenge; onSelect: () => void; isSelected: boolean }) {
  const diff = DIFFICULTY_CONFIG[challenge.difficulty?.toLowerCase() ?? 'beginner'];
  const DiffIcon = diff.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4, rotateY: 1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <button
        onClick={onSelect}
        className="w-full text-left rounded-xl border overflow-hidden transition-all duration-300"
        style={{
          background: isSelected
            ? `linear-gradient(135deg, ${diff.color}0a 0%, hsl(225,43%,7%) 100%)`
            : hovered ? 'hsl(225,43%,8%)' : 'hsl(225,43%,7%)',
          borderColor: isSelected ? `${diff.color}50` : hovered ? 'hsl(225,43%,20%)' : 'hsl(225,43%,15%)',
          boxShadow: isSelected ? `0 0 25px ${diff.glow}, 0 8px 30px rgba(0,0,0,0.4)` : hovered ? '0 8px 20px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full" style={{ background: isSelected ? diff.color : 'transparent', transition: 'background 0.3s', boxShadow: isSelected ? `0 0 8px ${diff.color}` : 'none' }} />
        
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${diff.color}15`, border: `1px solid ${diff.color}30` }}>
                <DiffIcon className="w-3.5 h-3.5" style={{ color: diff.color }} />
              </div>
              <span className="text-[9px] font-orbitron uppercase tracking-widest" style={{ color: diff.color }}>{diff.label}</span>
            </div>
            {challenge.timeLimit && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                <Clock className="w-3 h-3" />
                {challenge.timeLimit}s
              </div>
            )}
          </div>
          <h3 className="font-orbitron font-bold text-sm text-foreground mb-2 leading-snug">{challenge.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{challenge.description}</p>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1 text-[10px] font-orbitron text-muted-foreground">
              <Trophy className="w-3 h-3" />
              <span>{challenge.maxScore} pts</span>
            </div>
            {isSelected && (
              <div className="flex items-center gap-1 text-[10px] font-orbitron" style={{ color: diff.color }}>
                ACTIVE <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: diff.color }} />
              </div>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function ScoreDisplay({ score, maxScore }: { score: number; maxScore?: number }) {
  const pct = maxScore ? Math.round((score / maxScore) * 100) : score;
  const color = pct >= 75 ? '#00ff88' : pct >= 50 ? '#ffaa00' : '#ff3366';
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 32}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - pct / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-orbitron font-black text-lg" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <p className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Your Score</p>
        <p className="font-orbitron font-bold text-xl" style={{ color }}>{pct}%</p>
        <p className="text-xs text-muted-foreground">{maxScore ? `out of ${maxScore}` : 'points'}</p>
      </div>
    </div>
  );
}

export default function Challenges() {
  const { data: challenges, isLoading } = useListChallenges();
  const submit = useSubmitChallengeAttempt();
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = () => {
    if (!selectedChallenge || !answer.trim()) return;
    submit.mutate(
      { id: selectedChallenge.id, data: { response: answer } },
      {
        onSuccess: (res) => {
          setFeedback(res as unknown as Feedback);
          toast({ title: `Challenge scored: ${(res as any).score} points`, description: (res as any).rationale?.slice(0, 80) });
        },
        onError: () => {
          toast({ title: 'Submission failed', variant: 'destructive' });
        }
      }
    );
  };

  const handleNewChallenge = () => {
    setSelectedChallenge(null);
    setAnswer('');
    setFeedback(null);
  };

  const selectedDiff = selectedChallenge ? (DIFFICULTY_CONFIG[selectedChallenge.difficulty?.toLowerCase() ?? 'beginner']) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <Swords className="text-primary w-8 h-8" />
          Challenge Arena
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Test your investor psychology under pressure. AI-scored decisions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Challenge Grid */}
        <div className="lg:col-span-5">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {challenges?.map(ch => (
                <ChallengeCard
                  key={ch.id}
                  challenge={ch}
                  isSelected={selectedChallenge?.id === ch.id}
                  onSelect={() => { setSelectedChallenge(ch); setAnswer(''); setFeedback(null); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail / Response Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!selectedChallenge ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center text-center py-20">
                <div>
                  <Swords className="w-16 h-16 text-muted-foreground/20 mx-auto mb-5" />
                  <p className="font-orbitron text-lg text-muted-foreground/50 uppercase tracking-widest">Select a Challenge</p>
                  <p className="text-sm text-muted-foreground/40 mt-2">5 gamified investing tests. Are you rational under pressure?</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key={selectedChallenge.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                {/* Challenge Header */}
                <div
                  className="p-6 rounded-xl border relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${selectedDiff?.color}08, hsl(225,43%,7%))`,
                    borderColor: `${selectedDiff?.color}30`,
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${selectedDiff?.color}60, transparent)` }} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-orbitron uppercase tracking-widest px-2 py-0.5 rounded border" style={{ color: selectedDiff?.color, borderColor: `${selectedDiff?.color}40`, background: `${selectedDiff?.color}12` }}>
                          {selectedDiff?.label}
                        </span>
                        {selectedChallenge.maxScore && (
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-chart-3" />{selectedChallenge.maxScore} pts
                          </span>
                        )}
                      </div>
                      <h2 className="font-orbitron font-bold text-xl text-foreground mb-2">{selectedChallenge.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedChallenge.description}</p>
                    </div>
                  </div>
                </div>

                {/* Scenario */}
                {selectedChallenge.scenario && (
                  <div className="p-5 rounded-xl border border-border/40 bg-background/30">
                    <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-chart-3" /> Scenario
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{selectedChallenge.scenario}</p>
                  </div>
                )}

                {/* Question */}
                {selectedChallenge.question && (
                  <div className="p-4 rounded-xl border-l-4 bg-primary/5" style={{ borderColor: selectedDiff?.color }}>
                    <p className="text-base text-foreground font-medium leading-relaxed">{selectedChallenge.question}</p>
                  </div>
                )}

                {/* Feedback or Response */}
                <AnimatePresence mode="wait">
                  {feedback ? (
                    <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {/* Score */}
                      <div className="p-5 rounded-xl border border-border/50 bg-card/40 flex items-center gap-6">
                        <ScoreDisplay score={feedback.score} maxScore={selectedChallenge.maxScore} />
                        <div className="flex-1">
                          {feedback.biasDetected && (
                            <div className="mb-3">
                              <p className="text-[10px] font-orbitron text-destructive/80 uppercase tracking-widest mb-1">Bias Detected</p>
                              <p className="font-orbitron font-bold text-destructive capitalize">{feedback.biasDetected.replace(/_/g, ' ')}</p>
                            </div>
                          )}
                          <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-1">AI Rationale</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">{feedback.rationale}</p>
                        </div>
                      </div>

                      {feedback.correctAnswer && (
                        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
                          <p className="text-[10px] font-orbitron text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Optimal Approach
                          </p>
                          <p className="text-sm text-foreground/90 leading-relaxed">{feedback.correctAnswer}</p>
                        </div>
                      )}

                      {feedback.lesson && (
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                          <p className="text-[10px] font-orbitron text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Key Lesson
                          </p>
                          <p className="text-sm text-foreground/80 italic">"{feedback.lesson}"</p>
                        </div>
                      )}

                      <Button onClick={handleNewChallenge} variant="outline" className="w-full font-orbitron text-xs tracking-widest h-11 border-border/50">
                        Try Another Challenge <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <Textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Write your decision and reasoning here. Be specific — the AI scores based on quality of thought, not just the answer..."
                        className="min-h-[140px] resize-none bg-background/60 border-border/50 focus-visible:border-primary/50 text-sm font-light"
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || submit.isPending}
                        className="scanning-button w-full h-12 font-orbitron font-bold tracking-widest border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all"
                        style={{ background: answer.trim() ? 'rgba(0,212,255,0.08)' : undefined }}
                      >
                        {submit.isPending ? (
                          <><div className="w-4 h-4 border-2 border-primary/50 border-t-primary rounded-full animate-spin mr-2" /> ANALYZING...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> SUBMIT FOR AI SCORING</>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center font-orbitron tracking-wider">AI will score your response, detect biases, and provide the optimal approach</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
