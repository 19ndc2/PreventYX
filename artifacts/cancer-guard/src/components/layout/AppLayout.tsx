import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Activity, 
  FileText, 
  MessageSquare, 
  HeartPulse,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/risk-assessment", label: "Risk Assessment", icon: Activity },
  { href: "/cancer-types", label: "Cancer Library", icon: FileText },
  { href: "/pathways", label: "Care Pathways", icon: HeartPulse },
  { href: "/chat", label: "AI Advisor", icon: MessageSquare },
  { href: "/health-tracker", label: "Health Tracker", icon: ShieldAlert },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't show layout on landing page
  if (location === "/") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 z-50 bg-card border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            Cancer<span className="text-primary">Guard</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 mt-auto">
          <div className="bg-secondary/50 rounded-2xl p-4 border border-secondary text-sm">
            <p className="font-semibold text-foreground mb-1">Confidential & Secure</p>
            <p className="text-muted-foreground text-xs leading-relaxed">Your data is stored anonymously for your privacy.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur-lg border-b border-border shadow-sm" : "bg-transparent"
      )}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-xl text-foreground">CancerGuard</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-card z-[70] shadow-2xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-display font-bold text-xl">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-4 rounded-xl transition-all",
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground font-medium"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:pl-72 flex flex-col min-h-screen">
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 pt-20 md:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
