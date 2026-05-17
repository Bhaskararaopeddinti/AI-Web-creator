import Layout from "@/components/layout";
import { useGetLiveCount, useListGateLogs } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Scan, Users, AlertTriangle, History, ArrowRight, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SecurityDashboard() {
  const { data: live, isLoading: liveLoading } = useGetLiveCount();
  const { data: logs, isLoading: logsLoading } = useListGateLogs({ limit: 10 });

  const late = live?.students.filter((s) => s.isLate) ?? [];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor campus entry and exit</p>
          </div>
          <Link href="/security/scan">
            <Button data-testid="button-open-scanner">
              <Scan className="w-4 h-4 mr-2" />Open QR Scanner
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{liveLoading ? <Skeleton className="h-8 w-10" /> : live?.count ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Currently Outside</div>
                </div>
                <Users className="w-8 h-8 text-blue-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-400">{liveLoading ? <Skeleton className="h-8 w-10" /> : late.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Late Returns</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-400">{logsLoading ? <Skeleton className="h-8 w-10" /> : logs?.length ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Recent Logs</div>
                </div>
                <History className="w-8 h-8 text-green-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Students Outside</CardTitle>
              <Link href="/security/logs"><Button variant="ghost" size="sm">Logs <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent>
              {liveLoading ? <Skeleton className="h-32 w-full" /> : live?.students.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-sm">No students outside</div>
              ) : (
                <div className="space-y-2">
                  {live!.students.slice(0, 5).map((s) => (
                    <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-lg", s.isLate ? "bg-red-500/10 border border-red-500/20" : "bg-muted/40")} data-testid={`card-outside-${s.id}`}>
                      <div>
                        <div className="font-medium text-sm">{s.studentName}</div>
                        <div className="text-xs text-muted-foreground">{s.hostelName} &bull; {s.destination}</div>
                      </div>
                      {s.isLate && <Badge variant="destructive" className="text-xs">LATE</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Gate Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? <Skeleton className="h-32 w-full" /> : !logs || logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-sm">No logs yet</div>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40" data-testid={`log-${log.id}`}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        log.type === "out" ? "bg-orange-500/20" : "bg-green-500/20")}>
                        {log.type === "out" ? <LogOut className="w-4 h-4 text-orange-400" /> : <LogIn className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{log.studentName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <Badge variant="outline" className={cn("ml-auto text-xs flex-shrink-0", log.type === "out" ? "text-orange-400 border-orange-500/20" : "text-green-400 border-green-500/20")}>
                        {log.type === "out" ? "EXIT" : "ENTRY"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
