import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListNotifications } from "@workspace/api-client-react";
import {
  LayoutDashboard, LogOut, Bell, Shield, GraduationCap,
  Users, Building2, BookOpen, FileText, BarChart3, Scan,
  CheckSquare, History, MapPin, Brain, UserCog, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavLink({ href, icon: Icon, label, badge }: { href: string; icon: React.ElementType; label: string; badge?: number }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer group",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{label}</span>
        {badge != null && badge > 0 && (
          <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0 h-5">{badge > 99 ? "99+" : badge}</Badge>
        )}
      </div>
    </Link>
  );
}

const studentNav = [
  { href: "/student", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/apply", icon: FileText, label: "Apply for Pass" },
  { href: "/student/passes", icon: CheckSquare, label: "My Passes" },
  { href: "/student/notifications", icon: Bell, label: "Notifications" },
];

const wardenNav = [
  { href: "/warden", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/warden/requests", icon: FileText, label: "Requests" },
  { href: "/warden/outside", icon: MapPin, label: "Outside Now" },
  { href: "/warden/history", icon: History, label: "History" },
];

const securityNav = [
  { href: "/security", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/security/scan", icon: Scan, label: "QR Scanner" },
  { href: "/security/logs", icon: History, label: "Gate Logs" },
];

const adminNav = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/hostels", icon: Building2, label: "Hostels" },
  { href: "/admin/departments", icon: BookOpen, label: "Departments" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/ai-insights", icon: Brain, label: "AI Insights" },
  { href: "/admin/logs", icon: History, label: "Gate Logs" },
];

const roleConfig = {
  student: { nav: studentNav, icon: GraduationCap, label: "Student Portal", color: "text-blue-400" },
  warden: { nav: wardenNav, icon: UserCog, label: "Warden Dashboard", color: "text-purple-400" },
  security: { nav: securityNav, icon: Shield, label: "Security Guard", color: "text-green-400" },
  admin: { nav: adminNav, icon: Users, label: "Admin Panel", color: "text-orange-400" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: notifications } = useListNotifications();
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (!user) return null;

  const config = roleConfig[user.role as keyof typeof roleConfig];
  const RoleIcon = config.icon;

  const navWithBadge = config.nav.map((item) => ({
    ...item,
    badge: item.href.includes("notifications") ? unreadCount : undefined,
  }));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">GatePass</div>
              <div className={cn("text-xs leading-tight", config.color)}>{config.label}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navWithBadge.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} badge={item.badge} />
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <RoleIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => { logout(); setLocation("/login"); }}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
