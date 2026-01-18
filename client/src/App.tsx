import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Documents from "@/pages/documents";
import Messages from "@/pages/messages";
import Students from "@/pages/students";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import ClientPayments from "@/pages/payments";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminPayments from "@/pages/admin/payments";
import AdminClients from "@/pages/admin/clients";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  const isSuperAdmin = user?.role === 'super_admin';

  if (isSuperAdmin) {
    if (!location.startsWith('/admin')) {
      return <Redirect to="/admin/analytics" />;
    }
    return (
      <Switch>
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/clients" component={AdminClients} />
        <Route component={AdminAnalytics} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/documents" component={Documents} />
      <Route path="/messages" component={Messages} />
      <Route path="/students" component={Students} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/payments" component={ClientPayments} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
