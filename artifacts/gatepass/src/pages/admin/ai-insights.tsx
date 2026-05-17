import Layout from "@/components/layout";
import { useGetAiInsights } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, CheckCircle, RefreshCw, Lightbulb, User } from "lucide-react";
import { cn } from "@/lib/utils";

const severityColors = {
  low: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminAiInsights() {
  const { data, isLoading, refetch, isFetching } = useGetAiInsights();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />AI Security Insights
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Automated anomaly detection and intelligent recommendations</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-insights">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed" data-testid="ai-insights-text">{data?.insights || "No insights available yet."}</p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />Suspicious Patterns
                {data?.suspiciousFlags && data.suspiciousFlags.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">{data.suspiciousFlags.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : !data?.suspiciousFlags || data.suspiciousFlags.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-50" />
                  <p className="text-sm">No suspicious patterns detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.suspiciousFlags.map((flag, i) => (
                    <div key={i} className={cn("p-3 rounded-lg border", severityColors[flag.severity])} data-testid={`flag-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-sm">{flag.studentName}</span>
                        </div>
                        <Badge variant="outline" className={cn("text-xs uppercase", severityColors[flag.severity])}>
                          {flag.severity}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !data?.recommendations || data.recommendations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">No recommendations</div>
              ) : (
                <div className="space-y-3">
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border/50" data-testid={`rec-${i}`}>
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm">{rec}</p>
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
