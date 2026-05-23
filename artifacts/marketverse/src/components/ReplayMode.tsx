import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetScenarioReplay, useAnalyzeInvestmentDecision } from "@workspace/api-client-react";
import { X, Play, Pause, ChevronRight, Loader2, Brain, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReplayModeProps {
  scenarioId: number;
  scenarioTitle: string;
  onClose: () => void;
}

const EMOTION_COLORS: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  fear:        { bg: 'rgba(255,51,102,0.08)',  text: '#ff3366', glow: 'rgba(255,51,102,0.3)',  label: 'FEAR' },
  panic:       { bg: 'rgba(255,51,102,0.12)',  text: '#ff3366', glow: 'rgba(255,51,102,0.5)',  label: 'PANIC' },
  greed:       { bg: 'rgba(255,170,0,0.08)',   text: '#ffaa00', glow: 'rgba(255,170,0,0.3)',   label: 'GREED' },
  euphoria:    { bg: 'rgba(255,170,0,0.12)',   text: '#ffaa00', glow: 'rgba(255,170,0,0.5)',   label: 'EUPHORIA' },
  uncertainty: { bg: 'rgba(0,212,255,0.06)',   text: '#00d4ff', glow: 'rgba(0,212,255,0.2)',   label: 'UNCERTAINTY' },
  recovery:    { bg: 'rgba(0,255,136,0.08)',   text: '#00ff88', glow: 'rgba(0,255,136,0.3)',   label: 'RECOVERY' },
};

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setIsDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!isDone && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
    </span>
  );
}

function MarketMove({ change }: { change: number }) {
  const isPos = change >= 0;
  return (
    <div className={`flex items-center gap-2 ${isPos ? 'text-accent' : 'text-destructive'}`}>
      {isPos ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
      <span className="font-orbitron font-bold text-2xl">
        {isPos ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}

export function ReplayMode({ scenarioId, scenarioTitle, onClose }: ReplayModeProps) {
  const { data: replay, isLoading } = useGetScenarioReplay(scenarioId, {
    query: { enabled: true }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [decisionMade, setDecisionMade] = useState<string | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const analyzeDecision = useAnalyzeInvestmentDecision();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = replay?.steps.length ?? 0;
  const step = replay?.steps[currentStep];
  const emotion = step ? (EMOTION_COLORS[step.emotion] ?? EMOTION_COLORS.uncertainty) : EMOTION_COLORS.uncertainty;

  useEffect(() => {
    if (isPlaying && step && !step.decisionMoment) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentStep, step, totalSteps]);

  const handleDecision = (choice: string) => {
    setDecisionMade(choice);
    if (!step) return;
    analyzeDecision.mutate(
      {
        data: {
          decision: choice,
          context: step.narration,
          emotion: step.emotion,
        }
      },
      {
        onSuccess: (res) => {
          setDecisionFeedback(res.explanation);
        }
      }
    );
  };

  const handleNext = () => {
    setDecisionMade(null);
    setDecisionFeedback(null);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'hsl(225,43%,3%)' }}
      >
        {/* Ambient emotional background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ background: `radial-gradient(ellipse at 50% 30%, ${emotion.glow} 0%, transparent 60%)` }}
          transition={{ duration: 1.5 }}
        />

        {/* Scan line */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px)',
          }}
        />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-border/30">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded border border-primary/30 bg-primary/5">
              <span className="text-[10px] font-orbitron text-primary tracking-widest uppercase">Market Replay</span>
            </div>
            <h2 className="font-orbitron font-bold text-lg text-foreground">{scenarioTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Step counter */}
            <span className="font-orbitron text-sm text-muted-foreground">
              <span className="text-primary font-bold">{currentStep + 1}</span>
              <span className="mx-1">/</span>
              <span>{totalSteps}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="font-orbitron text-primary tracking-widest">LOADING TIMELINE...</p>
            </div>
          </div>
        ) : replay && step ? (
          <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-8 relative z-20">
            <div className="w-full max-w-4xl space-y-6">

              {/* Emotion Badge */}
              <motion.div
                key={step.emotion}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div
                  className="px-4 py-1.5 rounded-full border text-xs font-orbitron tracking-widest font-bold uppercase"
                  style={{
                    color: emotion.text,
                    borderColor: emotion.text + '40',
                    background: emotion.bg,
                    boxShadow: `0 0 20px ${emotion.glow}`,
                  }}
                >
                  {emotion.label}
                </div>
                <span className="text-xs font-orbitron text-muted-foreground">
                  Step {step.stepIndex + 1}
                </span>
              </motion.div>

              {/* Main candle data */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Open', value: step.candle.open.toFixed(2), color: 'text-muted-foreground' },
                  { label: 'High', value: step.candle.high.toFixed(2), color: 'text-accent' },
                  { label: 'Low', value: step.candle.low.toFixed(2), color: 'text-destructive' },
                  { label: 'Close', value: step.candle.close.toFixed(2), color: step.candle.close >= step.candle.open ? 'text-accent' : 'text-destructive' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card/40 border border-border/50 rounded-xl p-4 text-center backdrop-blur-sm">
                    <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                    <p className={`font-orbitron font-bold text-xl ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Market Move */}
              <div className="flex items-center justify-center gap-6">
                <MarketMove change={((step.candle.close - step.candle.open) / step.candle.open) * 100} />
              </div>

              {/* Narrative */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-card/30 border border-border/40 rounded-xl p-6 backdrop-blur-sm"
                style={{ borderLeftColor: emotion.text, borderLeftWidth: 3 }}
              >
                <p className="text-foreground text-lg leading-relaxed font-light">
                  <TypewriterText text={step.narration} speed={18} />
                </p>
              </motion.div>

              {/* Decision Point */}
              {step.decisionMoment && !decisionFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card/50 border rounded-xl p-6 backdrop-blur-sm"
                  style={{ borderColor: emotion.text + '60' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5" style={{ color: emotion.text }} />
                    <p className="font-orbitron font-bold uppercase tracking-wider text-sm" style={{ color: emotion.text }}>
                      Decision Point
                    </p>
                  </div>
                  <p className="text-foreground mb-5">{step.decisionPrompt}</p>
                  {!decisionMade ? (
                    <div className="flex gap-3">
                      <Button onClick={() => handleDecision('BUY — Accumulate more at this level')} className="flex-1 bg-accent/20 text-accent border border-accent/40 hover:bg-accent hover:text-black font-orbitron tracking-widest h-12">
                        <TrendingUp className="w-4 h-4 mr-2" /> BUY
                      </Button>
                      <Button onClick={() => handleDecision('HOLD — Stay the course, do nothing')} className="flex-1 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-orbitron tracking-widest h-12">
                        <Minus className="w-4 h-4 mr-2" /> HOLD
                      </Button>
                      <Button onClick={() => handleDecision('SELL — Exit position to cut losses')} className="flex-1 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-white font-orbitron tracking-widest h-12">
                        <TrendingDown className="w-4 h-4 mr-2" /> SELL
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="font-orbitron text-sm text-primary tracking-widest">Analyzing your decision...</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Decision Feedback */}
              {decisionFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-5"
                >
                  <p className="text-xs font-orbitron text-primary mb-2 uppercase tracking-widest">AI Behavioral Analysis</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{decisionFeedback}</p>
                  <Button onClick={handleNext} className="mt-4 font-orbitron tracking-widest" size="sm">
                    Continue Replay <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              {/* Final lesson */}
              {currentStep === totalSteps - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center"
                >
                  <p className="text-xs font-orbitron text-accent uppercase tracking-widest mb-3">Final Lesson</p>
                  <p className="text-foreground text-base leading-relaxed">{replay.finalLesson}</p>
                  <Button onClick={onClose} className="mt-5 font-orbitron tracking-widest bg-accent text-black hover:bg-accent/80">
                    Complete Replay
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        ) : null}

        {/* Controls */}
        {replay && !isLoading && currentStep < totalSteps - 1 && (
          <div className="relative z-20 px-8 py-5 border-t border-border/30 flex items-center gap-4">
            {/* Progress bar */}
            <div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: emotion.text }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={step?.decisionMoment && !decisionFeedback}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              {(!step?.decisionMoment || decisionFeedback) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  className="font-orbitron text-xs border-border/50 hover:border-primary/30"
                >
                  Next <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
