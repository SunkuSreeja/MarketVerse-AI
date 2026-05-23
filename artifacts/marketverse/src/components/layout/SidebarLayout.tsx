import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Activity, 
  BrainCircuit, 
  MessageSquare, 
  History, 
  Swords, 
  PieChart,
  TerminalSquare,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Universe", href: "/universe", icon: Globe },
  { name: "Market Watch", href: "/market", icon: TrendingUp },
  { name: "Simulator", href: "/simulator", icon: Activity },
  { name: "Psychology", href: "/psychology", icon: BrainCircuit },
  { name: "AI Mentor", href: "/mentor", icon: MessageSquare },
  { name: "Scenarios", href: "/scenarios", icon: History },
  { name: "Challenges", href: "/challenges", icon: Swords },
  { name: "Portfolio", href: "/portfolio", icon: PieChart },
];

function StatusDot({ label, active = true }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        active ? "bg-accent shadow-[0_0_6px_rgba(0,255,136,0.8)]" : "bg-muted-foreground"
      )}>
        {active && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping absolute" />}
      </div>
      <span className="text-[9px] font-orbitron tracking-widest text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

export function SidebarLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border relative z-10 sidebar-scanline overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsl(225 43% 6%) 0%, hsl(225 43% 5%) 100%)' }}>
        
        {/* Ambient top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border/50 relative">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <TerminalSquare className="w-6 h-6 text-primary group-hover:text-accent transition-colors duration-300" />
              <div className="absolute inset-0 bg-primary/20 rounded blur-sm group-hover:bg-accent/20 transition-colors duration-300" />
            </div>
            <span className="font-orbitron font-black text-base tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary glow-breathe">
              MARKETVERSE
            </span>
          </Link>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "text-primary bg-primary/10 border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                {isActive && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_12px_rgba(0,212,255,0.8)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                  </>
                )}
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-primary drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className={cn("font-medium tracking-wide relative z-10", isActive && "font-semibold")}>{item.name}</span>
                
                {isActive && (
                  <AnimatePresence>
                    <motion.div
                      layoutId="nav-active"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,212,255,1)]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    />
                  </AnimatePresence>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <p className="text-[9px] font-orbitron tracking-widest text-muted-foreground/50 uppercase mb-3">System Status</p>
          <div className="space-y-1.5 relative">
            <StatusDot label="AI Mentor: Active" active={true} />
            <StatusDot label="Psychology Engine: Online" active={true} />
            <StatusDot label="Market Feed: Live" active={true} />
          </div>
          <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
            <p className="text-[9px] text-destructive-foreground uppercase tracking-widest font-orbitron text-center opacity-70">
              Simulation Only · Not Advice
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex-1 overflow-y-auto relative z-10 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
