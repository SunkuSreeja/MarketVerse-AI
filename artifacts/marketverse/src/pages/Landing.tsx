import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Activity, BrainCircuit, Globe, Shield, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const TICKER_ITEMS = [
  { sym: 'NIFTY 50', val: '22,419', chg: '+1.24%', up: true },
  { sym: 'SENSEX', val: '73,847', chg: '+1.18%', up: true },
  { sym: 'RELIANCE', val: '₹2,934', chg: '+0.87%', up: true },
  { sym: 'TCS', val: '₹3,812', chg: '-0.43%', up: false },
  { sym: 'INFOSYS', val: '₹1,642', chg: '+2.11%', up: true },
  { sym: 'HDFC BANK', val: '₹1,487', chg: '-0.29%', up: false },
  { sym: 'BTC/USD', val: '$67,231', chg: '+3.47%', up: true },
  { sym: 'GOLD', val: '$2,341', chg: '+0.62%', up: true },
  { sym: 'WIPRO', val: '₹487', chg: '+1.56%', up: true },
  { sym: 'BAJAJ FIN', val: '₹6,782', chg: '-0.71%', up: false },
];

const SYSTEMS = [
  { label: 'Psychology Engine', status: 'ONLINE', color: '#00ff88' },
  { label: 'AI Mentor', status: 'ACTIVE', color: '#00d4ff' },
  { label: 'Market Data', status: 'LIVE', color: '#00ff88' },
  { label: 'Scenario DB', status: 'LOADED', color: '#00d4ff' },
  { label: 'Bias Detection', status: 'SCANNING', color: '#ffaa00' },
];

const FEATURES = [
  { icon: Activity, title: 'Future Simulator', desc: 'Configure risk profiles and time horizons. Watch compound growth unfold across decades in real-time projection charts.', accent: '#00d4ff', href: '/simulator' },
  { icon: BrainCircuit, title: 'Psychology Engine', desc: 'Your biometrics react to market chaos. Panic-sell at the bottom, or hold through the storm — the engine records everything.', accent: '#00ff88', href: '/psychology' },
  { icon: Globe, title: 'Historical Crashes', desc: 'Navigate the 2008 collapse, COVID crash, Dot-Com bust, and Harshad Mehta scandal — frame by frame with AI narration.', accent: '#ffaa00', href: '/scenarios' },
  { icon: TrendingUp, title: 'Market Watch', desc: 'Interactive candlestick charts with beginner-friendly AI explanations. Click any candle to understand what the market was feeling.', accent: '#b400ff', href: '/market' },
  { icon: Shield, title: 'Challenge Arena', desc: 'Five high-pressure decision challenges scored by AI. Prove you can think rationally when everyone around you is panicking.', accent: '#ff3366', href: '/challenges' },
  { icon: Zap, title: 'AI Mentor', desc: 'Powered by Gemini 2.5 Flash. Ask anything — from "what is a stop-loss?" to "should I invest during a recession?"', accent: '#00d4ff', href: '/mentor' },
];

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: (i * 13.7) % 100,
  y: (i * 17.3) % 100,
  size: 2 + (i % 4),
  duration: 6 + (i % 8),
  delay: (i * 0.4) % 4,
}));

const GRADIENT_STYLE: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 50%, #00d4ff 100%)',
  backgroundSize: '200% auto',
  animation: 'border-trace 3s linear infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 180);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative inline-block" style={GRADIENT_STYLE}>
      {text}
      {glitching && (
        <>
          <span className="absolute inset-0" style={{ animation: 'glitch-1 0.18s steps(1) forwards', WebkitTextFillColor: '#00ff88', clipPath: 'inset(10% 0 60% 0)', backgroundImage: 'none' }}>{text}</span>
          <span className="absolute inset-0" style={{ animation: 'glitch-2 0.18s steps(1) forwards', WebkitTextFillColor: '#ff3366', clipPath: 'inset(60% 0 10% 0)', backgroundImage: 'none' }}>{text}</span>
        </>
      )}
    </span>
  );
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link href={feature.href}>
        <div
          className="relative h-full p-6 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden"
          style={{
            background: hovered ? `linear-gradient(135deg, ${feature.accent}0a 0%, hsl(225,43%,7%) 100%)` : 'hsl(225,43%,7%)',
            borderColor: hovered ? `${feature.accent}50` : 'hsl(225,43%,15%)',
            boxShadow: hovered ? `0 0 30px ${feature.accent}18, 0 8px 30px rgba(0,0,0,0.5)` : '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div className="absolute top-0 right-0 w-16 h-16 transition-opacity duration-300" style={{ opacity: hovered ? 1 : 0, background: `linear-gradient(225deg, ${feature.accent}18, transparent)` }} />
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ background: `${feature.accent}18`, border: `1px solid ${feature.accent}35`, boxShadow: hovered ? `0 0 20px ${feature.accent}30` : 'none', transition: 'box-shadow 0.3s' }}
          >
            <feature.icon className="w-5 h-5" style={{ color: feature.accent }} />
          </div>
          <h3 className="font-orbitron font-bold text-base mb-2 transition-colors duration-200" style={{ color: hovered ? feature.accent : 'hsl(210,40%,98%)' }}>
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
          <div className="flex items-center gap-1 mt-4 text-xs font-orbitron transition-opacity duration-200" style={{ color: feature.accent, opacity: hovered ? 1 : 0 }}>
            ENTER <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, -100]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Deep space ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[70vw] h-[60vh] rounded-full blur-[180px]" style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[40vw] h-[40vh] rounded-full blur-[200px]" style={{ background: 'radial-gradient(ellipse, rgba(180,0,255,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(128,128,128,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 60%, transparent 100%)' }} />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: 'radial-gradient(circle, rgba(0,212,255,0.7) 0%, transparent 70%)' }}
            animate={{ y: [0, -25, 8, -18, 0], x: [0, 12, -8, 6, 0], opacity: [0.2, 0.7, 0.3, 0.5, 0.2], scale: [1, 1.4, 0.7, 1.2, 1] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Ticker tape */}
      <div className="fixed top-0 left-0 right-0 z-40 h-8 border-b border-border/50 overflow-hidden flex items-center" style={{ background: 'rgba(10,12,20,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="ticker-track flex items-center gap-8 px-4">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-orbitron text-muted-foreground tracking-widest">{item.sym}</span>
              <span className="text-[10px] font-mono text-foreground">{item.val}</span>
              <span className={`text-[10px] font-mono font-bold ${item.up ? 'text-accent' : 'text-destructive'}`}>{item.chg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <motion.section ref={heroRef} style={{ opacity: heroOpacity, y: heroY }} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-md" style={{ background: 'rgba(0,212,255,0.05)' }}>
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(0,255,136,0.9)]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-xs font-orbitron tracking-widest text-primary/80 uppercase">Neural Systems Online — v2.5</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="mb-6">
          <div className="text-6xl md:text-8xl font-orbitron font-black tracking-tight leading-none mb-2 text-foreground">ENTER THE</div>
          <div className="text-6xl md:text-8xl font-orbitron font-black tracking-tight leading-none">
            <GlitchText text="MARKETVERSE" />
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed">
          A cinematic AI-powered financial learning simulator. Master the markets not through theory — through visceral, real-time experience of crashes, recoveries, and the psychology that drives both.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/universe">
            <Button size="lg" className="scanning-button h-14 px-10 text-base font-orbitron font-bold tracking-wider border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,212,255,0.5)]" style={{ background: 'rgba(0,212,255,0.08)' }}>
              INITIALIZE SEQUENCE <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/scenarios">
            <Button size="lg" variant="ghost" className="h-14 px-8 text-sm font-orbitron tracking-wider text-muted-foreground hover:text-foreground border border-border/50 hover:border-border">
              VIEW CRASH SCENARIOS
            </Button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] font-orbitron text-muted-foreground/50 tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-px h-10 bg-gradient-to-b from-primary/60 to-transparent" />
        </motion.div>
      </motion.section>

      {/* System Status */}
      <section className="relative py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl p-8 relative overflow-hidden" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/40 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/40 rounded-br-2xl" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.8)]" />
              <p className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest">System Status</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SYSTEMS.map((sys, i) => (
                <motion.div key={sys.label} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col gap-2 p-3 rounded-lg border border-border/30" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sys.color, boxShadow: `0 0 6px ${sys.color}` }} />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase" style={{ color: sys.color }}>{sys.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{sys.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-orbitron text-primary/60 uppercase tracking-widest mb-4">Core Modules</p>
            <h2 className="text-4xl md:text-5xl font-orbitron font-black">
              Everything You Need<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">To Think Like a Pro</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <blockquote className="text-2xl md:text-4xl font-light text-foreground/70 leading-relaxed italic">
              "The stock market is a device for transferring money from the
              <span className="text-primary font-normal not-italic"> impatient </span>
              to the
              <span className="text-accent font-normal not-italic"> patient</span>."
            </blockquote>
            <p className="text-sm text-muted-foreground font-orbitron tracking-widest">— Warren Buffett</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-14">
            <Link href="/universe">
              <Button size="lg" className="scanning-button h-14 px-12 text-base font-orbitron font-bold tracking-wider bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_50px_rgba(0,212,255,0.4)] transition-all duration-300">
                BEGIN YOUR JOURNEY <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-8 px-6 text-center">
        <p className="text-xs font-orbitron text-muted-foreground tracking-widest uppercase">MarketVerse AI — Simulation Only · Not Financial Advice</p>
      </footer>
    </div>
  );
}
