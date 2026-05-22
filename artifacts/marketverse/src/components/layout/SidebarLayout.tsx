import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Globe, 
  Activity, 
  BrainCircuit, 
  MessageSquare, 
  History, 
  Swords, 
  PieChart,
  TerminalSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Universe", href: "/universe", icon: Globe },
  { name: "Simulator", href: "/simulator", icon: Activity },
  { name: "Psychology", href: "/psychology", icon: BrainCircuit },
  { name: "AI Mentor", href: "/mentor", icon: MessageSquare },
  { name: "Scenarios", href: "/scenarios", icon: History },
  { name: "Challenges", href: "/challenges", icon: Swords },
  { name: "Portfolio", href: "/portfolio", icon: PieChart },
];

export function SidebarLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-card/50 backdrop-blur-md relative z-10">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 group">
            <TerminalSquare className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
            <span className="font-orbitron font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              MARKETVERSE
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "text-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(0,212,255,0.1)] border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-card-border"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
                )}
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-[10px] text-destructive-foreground uppercase tracking-widest font-orbitron text-center opacity-80">
              Simulation Only
              <br/>
              Not Financial Advice
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto relative z-10 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
