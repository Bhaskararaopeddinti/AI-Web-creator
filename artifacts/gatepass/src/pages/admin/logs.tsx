import Layout from "@/components/layout";
import { useListGateLogs } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, LogIn, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLogs() {
  const { data: logs, isLoading, refetch, isFetching } = useListGateLogs({ limit: 200 });

  const exitCount = logs?.filter((l) => l.type === "out").length ?? 0;
  const entryCount = logs?.filter((l) => l.type === "in").length ?? 0;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gate Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">Complete audit trail of all campus entry and exit events</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{logs?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-400">{exitCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Exit Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-400">{entryCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Entry Events</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />All Gate Events ({logs?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !logs || logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No gate logs yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border/50" data-testid={`log-row-${log.id}`}>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      log.type === "out" ? "bg-orange-500/20" : "bg-green-500/20")}>
                      {log.type === "out" ? <LogOut className="w-4 h-4 text-orange-400" /> : <LogIn className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{log.studentName}</div>
                      <div className="text-xs text-muted-foreground">{log.studentRollNumber}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="outline" className={cn("text-xs mb-1 block w-fit ml-auto",
                        log.type === "out" ? "text-orange-400 border-orange-500/20" : "text-green-400 border-green-500/20")}>
                        {log.type === "out" ? "EXIT" : "ENTRY"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                    {log.guardName && (
                      <div className="text-xs text-muted-foreground flex-shrink-0 hidden md:block">
                        Guard: {log.guardName}
                      </div>
                    )}
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
