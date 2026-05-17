import Layout from "@/components/layout";
import { useGetAnalyticsSummary, useGetLiveCount, useListGateLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users, FileText, Clock, CheckCircle, XCircle, MapPin, AlertTriangle,
  ArrowRight, BarChart3, Brain, LogIn, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: summary, isLoading: sumLoading } = useGetAnalyticsSummary();
  const { data: live } = useGetLiveCount();
  const { data: logs } = useListGateLogs({ limit: 8 });

  const statCards = [
    { label: "Total Students", value: summary?.totalStudents, icon: Users, color: "text-blue-400", href: "/admin/users" },
    { label: "Today's Passes", value: summary?.todayPasses, icon: FileText, color: "text-primary", href: "/admin/logs" },
    { label: "Pending Review", value: summary?.pendingPasses, icon: Clock, color: "text-yellow-400", href: "/admin/logs" },
    { label: "Currently Outside", value: live?.count, icon: MapPin, color: "text-blue-400", href: "/admin/logs" },
    { label: "Approved Passes", value: summary?.approvedPasses, icon: CheckCircle, color: "text-green-400", href: "/admin/logs" },
    { label: "Rejected Passes", value: summary?.rejectedPasses, icon: XCircle, color: "text-red-400", href: "/admin/logs" },
    { label: "Late Returns", value: summary?.lateReturns, icon: AlertTriangle, color: "text-orange-400", href: "/admin/logs" },
    { label: "Total Passes", value: summary?.totalPasses, icon: FileText, color: "text-muted-foreground", href: "/admin/logs" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">System overview and management</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-2" />Analytics</Button>
            </Link>
            <Link href="/admin/ai-insights">
              <Button size="sm"><Brain className="w-4 h-4 mr-2" />AI Insights</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {sumLoading ? <Skeleton className="h-8 w-10" /> : (value ?? 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{label}</div>
                    </div>
                    <Icon className={cn("w-8 h-8 opacity-50", color)} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <div className="font-semibold">User Management</div>
                    <div className="text-xs text-muted-foreground">Add, edit, deactivate accounts</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/hostels">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-purple-400" /></div>
                  <div>
                    <div className="font-semibold">Hostels</div>
                    <div className="text-xs text-muted-foreground">Manage hostel buildings</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/departments">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-green-400" /></div>
                  <div>
                    <div className="font-semibold">Departments</div>
                    <div className="text-xs text-muted-foreground">Academic departments</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Gate Activity</CardTitle>
            <Link href="/admin/logs"><Button variant="ghost" size="sm">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            {!logs || logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-6 text-sm">No activity yet</div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40" data-testid={`log-row-${log.id}`}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      log.type === "out" ? "bg-orange-500/20" : "bg-green-500/20")}>
                      {log.type === "out" ? <LogOut className="w-4 h-4 text-orange-400" /> : <LogIn className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{log.studentName}</div>
                      <div className="text-xs text-muted-foreground">{log.studentRollNumber}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="outline" className={cn("text-xs", log.type === "out" ? "text-orange-400 border-orange-500/20" : "text-green-400 border-green-500/20")}>
                        {log.type === "out" ? "EXIT" : "ENTRY"}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
