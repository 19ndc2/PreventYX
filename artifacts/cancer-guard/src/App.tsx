import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AIChat from "@/pages/AIChat";
import HealthTracker from "@/pages/HealthTracker";
import CarePlan from "@/pages/CarePlan";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AuthGatedHome() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return <Login />;
}

function ProtectedDashboard() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}

function ProtectedAIChat() {
  return <ProtectedRoute><AIChat /></ProtectedRoute>;
}

function ProtectedHealthTracker() {
  return <ProtectedRoute><HealthTracker /></ProtectedRoute>;
}

function ProtectedCarePlan() {
  return <ProtectedRoute><CarePlan /></ProtectedRoute>;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={AuthGatedHome} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={ProtectedDashboard} />
        <Route path="/chat" component={ProtectedAIChat} />
        <Route path="/health-tracker" component={ProtectedHealthTracker} />
        <Route path="/care-plan/:id" component={ProtectedCarePlan} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
