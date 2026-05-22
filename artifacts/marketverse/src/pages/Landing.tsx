import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Activity, BrainCircuit, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Deep Space Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[90vh] text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 border border-primary/20 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
          <span className="text-xs font-orbitron tracking-widest text-primary-foreground uppercase opacity-80">System Online</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-orbitron font-black tracking-tight mb-6"
        >
          ENTER THE
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
            MARKETVERSE
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed"
        >
          A cinematic financial learning simulation. Master the markets not through theory, but through visceral experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link href="/universe">
            <Button size="lg" className="h-14 px-8 text-lg font-orbitron font-bold tracking-wider rounded-none bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all duration-300">
              INITIALIZE SEQUENCE
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          {[
            { icon: Activity, title: "Future Simulator", desc: "Project outcomes based on risk profiles and time horizons." },
            { icon: BrainCircuit, title: "Psychology Engine", desc: "Test your emotional resilience during market chaos." },
            { icon: Globe, title: "Historical Scenarios", desc: "Navigate the 2008 crash and Dot-Com bubble in real-time." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 * i, duration: 0.5 }}
              className="p-6 rounded-xl bg-card/30 border border-border backdrop-blur-sm hover:border-primary/50 transition-colors group"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-orbitron font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
