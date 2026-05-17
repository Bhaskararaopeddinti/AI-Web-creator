import Layout from "@/components/layout";
import { useGetAnalyticsSummary, useGetLiveCount, useListGatePasses, getListGatePassesQueryKey, useUpdateGatePassStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, FileText, Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  out: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  returned: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const outingLabels: Record<string, string> = {
  home_visit: "Home Visit", weekend_leave: "Weekend Leave",
  emergency_leave: "Emergency Leave", medical_leave: "Medical Leave",
};

export default function WardenDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: liveCount } = useGetLiveCount();
  const { data: pendingData } = useListGatePasses({ status: "pending" }, { query: { queryKey: getListGatePassesQueryKey({ status: "pending" }) } });
  const queryClient = useQueryClient();
  const updateStatus = useUpdateGatePassStatus();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const pendingPasses = pendingData?.data ?? [];

  const handleQuickAction = (id: number, status: "approved" | "rejected") => {
    setProcessingId(id);
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGatePassesQueryKey({ status: "pending" }) });
          queryClient.invalidateQueries({ queryKey: ["getAnalyticsSummary"] });
          setProcessingId(null);
        },
        onError: () => setProcessingId(null),
      }
    );
  };

  const statCards = [
    { label: "Total Students", value: summary?.totalStudents, icon: Users, color: "text-blue-400" },
    { label: "Pending Requests", value: summary?.pendingPasses, icon: Clock, color: "text-yellow-400" },
    { label: "Currently Outside", value: liveCount?.count, icon: MapPin, color: "text-blue-400" },
    { label: "Late Returns", value: summary?.lateReturns, icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Warden Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage student gate pass requests</p>
          </div>
          <Link href="/warden/requests">
            <Button data-testid="button-view-all-requests">
              View All Requests <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {summaryLoading ? <Skeleton className="h-8 w-12" /> : (value ?? 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                  <Icon className={cn("w-8 h-8 opacity-60", color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Requests ({pendingPasses.length})</CardTitle>
            <Link href="/warden/requests"><Button variant="ghost" size="sm">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            {pendingPasses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPasses.slice(0, 5).map((pass) => (
                  <div key={pass.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50" data-testid={`card-request-${pass.id}`}>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{pass.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {outingLabels[pass.outingType]} &mdash; {pass.destination}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(pass.outgoingTime).toLocaleDateString()} to {new Date(pass.expectedReturnTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        disabled={processingId === pass.id}
                        onClick={() => handleQuickAction(pass.id, "approved")}
                        data-testid={`button-approve-${pass.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={processingId === pass.id}
                        onClick={() => handleQuickAction(pass.id, "rejected")}
                        data-testid={`button-reject-${pass.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Link href={`/warden/requests/${pass.id}`}>
                        <Button size="sm" variant="ghost">Details</Button>
                      </Link>
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
