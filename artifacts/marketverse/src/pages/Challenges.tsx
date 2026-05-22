import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListChallenges, useSubmitChallengeAttempt, Challenge } from "@workspace/api-client-react";
import { Swords, CheckCircle2, XCircle, ShieldAlert, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function Challenges() {
  const { data: challenges, isLoading } = useListChallenges();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  
  const submitAttempt = useSubmitChallengeAttempt();

  const handleStart = (c: Challenge) => {
    setActiveChallenge(c);
    setSelectedOption("");
    setResult(null);
  };

  const handleSubmit = () => {
    if (!activeChallenge || !selectedOption) return;

    submitAttempt.mutate(
      { id: activeChallenge.id, data: { selectedOptionId: selectedOption, timeSpentSeconds: 15 } },
      {
        onSuccess: (res) => {
          setResult(res);
        }
      }
    );
  };

  if (activeChallenge) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Button variant="ghost" onClick={() => setActiveChallenge(null)} className="mb-6 text-muted-foreground">
          ← Abandon Challenge
        </Button>

        <Card className={`bg-card/60 backdrop-blur-md overflow-hidden relative transition-colors duration-500 ${result ? (result.correct ? 'border-accent/50' : 'border-destructive/50') : 'border-primary/20 shadow-[0_0_30px_rgba(0,212,255,0.05)]'}`}>
          {result && (
            <div className={`absolute top-0 left-0 w-full h-1 ${result.correct ? 'bg-accent shadow-[0_0_15px_rgba(0,255,136,1)]' : 'bg-destructive shadow-[0_0_15px_rgba(255,51,102,1)]'}`} />
          )}
          
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${activeChallenge.difficulty === 'advanced' ? 'border-destructive text-destructive bg-destructive/10' : activeChallenge.difficulty === 'intermediate' ? 'border-chart-3 text-chart-3 bg-chart-3/10' : 'border-accent text-accent bg-accent/10'}`}>
                {activeChallenge.difficulty}
              </span>
              <span className="text-xs font-orbitron text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {activeChallenge.pointsReward} PTS
              </span>
            </div>
            <CardTitle className="text-2xl font-orbitron">{activeChallenge.title}</CardTitle>
            <CardDescription className="text-base">{activeChallenge.description}</CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            <div className="p-6 bg-background/50 border-l-4 border-primary rounded-r-lg mb-8 relative">
              <ShieldAlert className="absolute top-4 right-4 w-12 h-12 text-primary/10" />
              <p className="text-foreground leading-relaxed italic">"{activeChallenge.scenario}"</p>
            </div>

            {!result ? (
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-4">
                {activeChallenge.options.map((opt) => (
                  <Label
                    key={opt.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${selectedOption === opt.id ? 'border-primary bg-primary/5 shadow-[0_0_10px_rgba(0,212,255,0.1)]' : 'border-border/50 bg-background hover:border-primary/30 hover:bg-primary/5'}`}
                  >
                    <RadioGroupItem value={opt.id} className="mt-1 sr-only" />
                    <div className={`w-4 h-4 rounded-full border mt-0.5 mr-4 flex items-center justify-center ${selectedOption === opt.id ? 'border-primary' : 'border-muted-foreground'}`}>
                      {selectedOption === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm leading-relaxed">{opt.text}</span>
                  </Label>
                ))}
              </RadioGroup>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className={`p-6 rounded-lg border flex items-start gap-4 ${result.correct ? 'bg-accent/5 border-accent/30' : 'bg-destructive/5 border-destructive/30'}`}>
                  {result.correct ? <CheckCircle2 className="w-8 h-8 text-accent shrink-0" /> : <XCircle className="w-8 h-8 text-destructive shrink-0" />}
                  <div>
                    <h3 className={`font-orbitron font-bold text-lg mb-2 ${result.correct ? 'text-accent' : 'text-destructive'}`}>
                      {result.correct ? 'SUCCESS: DECISION VALIDATED' : 'FAILURE: CRITICAL ERROR'}
                    </h3>
                    <p className="text-sm text-foreground mb-4">{result.explanation}</p>
                    
                    <div className="bg-background/80 p-3 rounded border border-border text-sm">
                      <span className="text-primary font-bold mr-2">AI FEEDBACK:</span>
                      <span className="text-muted-foreground">{result.aiFeedback}</span>
                    </div>

                    {result.correct && (
                      <p className="mt-4 text-xs font-orbitron text-accent flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-4 h-4" /> +{result.pointsEarned} POINTS EARNED
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="bg-background/30 border-t border-border/50 p-6">
            {!result ? (
              <Button 
                className="w-full font-orbitron tracking-widest h-12" 
                disabled={!selectedOption || submitAttempt.isPending}
                onClick={handleSubmit}
              >
                {submitAttempt.isPending ? "EVALUATING..." : "COMMIT DECISION"}
              </Button>
            ) : (
              <Button className="w-full font-orbitron tracking-widest h-12" onClick={() => setActiveChallenge(null)}>
                RETURN TO ARENA
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <Swords className="text-primary w-8 h-8" />
          Challenge Arena
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Test your instincts in simulated high-pressure scenarios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl bg-card border border-border" />)
        ) : challenges?.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card/40 border-border hover:border-primary/50 transition-all duration-300 h-full flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <AlertTriangle className="w-32 h-32" />
              </div>
              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded bg-background/50">
                    {challenge.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-orbitron text-primary border border-primary/20 bg-primary/10 px-2 py-0.5 rounded">
                    {challenge.pointsReward} PTS
                  </span>
                </div>
                <CardTitle className="font-orbitron text-lg leading-tight group-hover:text-primary transition-colors">{challenge.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 relative z-10">
                <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
              </CardContent>
              <CardFooter className="pt-0 relative z-10">
                <Button 
                  onClick={() => handleStart(challenge)} 
                  variant="ghost" 
                  className="w-full justify-between border border-border/50 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary transition-all"
                >
                  <span className="font-orbitron text-xs tracking-wider">INITIATE</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
