import Layout from "@/components/layout";
import { useGetLiveCount } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, AlertTriangle, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WardenOutside() {
  const { data, isLoading, refetch, isFetching } = useGetLiveCount();
  const students = data?.students ?? [];
  const late = students.filter((s) => s.isLate);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Students Outside Campus</h1>
            <p className="text-muted-foreground text-sm mt-1">Live tracking of students currently outside</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-10" /> : (data?.count ?? 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Outside</div>
                </div>
                <Users className="w-8 h-8 text-blue-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-400">{isLoading ? <Skeleton className="h-8 w-10" /> : late.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Late Returns</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-400">{isLoading ? <Skeleton className="h-8 w-10" /> : (data?.count ?? 0) - late.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">On Time</div>
                </div>
                <Clock className="w-8 h-8 text-green-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {late.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-400 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              {late.length} student{late.length > 1 ? "s are" : " is"} past their expected return time
            </div>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Currently Outside ({students.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : students.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No students currently outside campus</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((s) => (
                  <div key={s.id} className={`p-4 rounded-lg border ${s.isLate ? "bg-orange-500/5 border-orange-500/30" : "bg-muted/40 border-border/50"}`} data-testid={`card-outside-${s.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{s.studentName}</div>
                        <div className="text-xs text-muted-foreground">{s.studentRollNumber} &bull; {s.hostelName} &bull; Room {s.roomNumber}</div>
                      </div>
                      <div className="flex gap-2">
                        {s.isLate && <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />LATE</Badge>}
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/20">{s.outingType.replace("_", " ")}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.destination}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Return by: {new Date(s.expectedReturnTime).toLocaleString()}</span>
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
