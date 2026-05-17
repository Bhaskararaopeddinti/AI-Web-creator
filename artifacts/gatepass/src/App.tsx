import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";

import StudentDashboard from "@/pages/student/dashboard";
import ApplyGatePass from "@/pages/student/apply";
import StudentPasses from "@/pages/student/passes";
import PassDetail from "@/pages/student/pass-detail";
import StudentNotifications from "@/pages/student/notifications";

import WardenDashboard from "@/pages/warden/dashboard";
import WardenRequests from "@/pages/warden/requests";
import WardenRequestDetail from "@/pages/warden/request-detail";
import WardenOutside from "@/pages/warden/outside";
import WardenHistory from "@/pages/warden/history";

import SecurityDashboard from "@/pages/security/dashboard";
import SecurityScan from "@/pages/security/scan";
import SecurityLogs from "@/pages/security/logs";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminHostels from "@/pages/admin/hostels";
import AdminDepartments from "@/pages/admin/departments";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminAiInsights from "@/pages/admin/ai-insights";
import AdminLogs from "@/pages/admin/logs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({
  component: Component,
  role,
  ...rest
}: {
  component: React.ComponentType<any>;
  role?: string | string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        warden: "/warden",
        security: "/security",
        student: "/student",
      };
      return <Redirect to={redirectMap[user.role] ?? "/login"} />;
    }
  }

  return <Component {...rest} />;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  const redirectMap: Record<string, string> = {
    admin: "/admin",
    warden: "/warden",
    security: "/security",
    student: "/student",
  };
  return <Redirect to={redirectMap[user.role] ?? "/login"} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/student">
        <ProtectedRoute role="student" component={StudentDashboard} />
      </Route>
      <Route path="/student/apply">
        <ProtectedRoute role="student" component={ApplyGatePass} />
      </Route>
      <Route path="/student/passes/:id">
        {(params) => <ProtectedRoute role="student" component={PassDetail} {...params} />}
      </Route>
      <Route path="/student/passes">
        <ProtectedRoute role="student" component={StudentPasses} />
      </Route>
      <Route path="/student/notifications">
        <ProtectedRoute role="student" component={StudentNotifications} />
      </Route>

      <Route path="/warden">
        <ProtectedRoute role="warden" component={WardenDashboard} />
      </Route>
      <Route path="/warden/requests/:id">
        {(params) => <ProtectedRoute role="warden" component={WardenRequestDetail} {...params} />}
      </Route>
      <Route path="/warden/requests">
        <ProtectedRoute role="warden" component={WardenRequests} />
      </Route>
      <Route path="/warden/outside">
        <ProtectedRoute role="warden" component={WardenOutside} />
      </Route>
      <Route path="/warden/history">
        <ProtectedRoute role="warden" component={WardenHistory} />
      </Route>

      <Route path="/security">
        <ProtectedRoute role="security" component={SecurityDashboard} />
      </Route>
      <Route path="/security/scan">
        <ProtectedRoute role="security" component={SecurityScan} />
      </Route>
      <Route path="/security/logs">
        <ProtectedRoute role="security" component={SecurityLogs} />
      </Route>

      <Route path="/admin">
        <ProtectedRoute role="admin" component={AdminDashboard} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute role="admin" component={AdminUsers} />
      </Route>
      <Route path="/admin/hostels">
        <ProtectedRoute role="admin" component={AdminHostels} />
      </Route>
      <Route path="/admin/departments">
        <ProtectedRoute role="admin" component={AdminDepartments} />
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute role="admin" component={AdminAnalytics} />
      </Route>
      <Route path="/admin/ai-insights">
        <ProtectedRoute role={["admin", "warden"]} component={AdminAiInsights} />
      </Route>
      <Route path="/admin/logs">
        <ProtectedRoute role="admin" component={AdminLogs} />
      </Route>

      <Route path="/" component={RootRedirect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
