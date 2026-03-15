import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  LayoutDashboard,
  MessageSquare,
  HeartPulse,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Advisor", icon: MessageSquare },
  { href: "/health-tracker", label: "Health Tracker", icon: HeartPulse },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (location === "/") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-card border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-md shadow-primary/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Prevent<span className="text-primary">yx</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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

        <div className="p-4 mt-auto border-t border-border/50 space-y-3">
          {!isLoading && (
            isAuthenticated && user ? (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : (user.email ?? "User")}
                  </p>
                  {user.email && user.firstName && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Log in
              </button>
            )
          )}
          <div className="bg-secondary/50 rounded-xl p-3 border border-secondary text-xs">
            <p className="font-semibold text-foreground mb-0.5">Confidential & Secure</p>
            <p className="text-muted-foreground leading-relaxed">Your data is stored securely for your privacy.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur-lg border-b border-border shadow-sm" : "bg-transparent"
      )}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-xl text-foreground">Preventyx</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Menu */}
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
                <div className="pt-4 border-t border-border mt-4">
                  {!isLoading && (isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm font-semibold truncate">
                          {user.firstName ?? user.email ?? "User"}
                        </p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 font-medium transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Log out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={login}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold"
                    >
                      <LogIn className="w-5 h-5" />
                      Log in
                    </button>
                  ))}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 pt-20 md:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
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
