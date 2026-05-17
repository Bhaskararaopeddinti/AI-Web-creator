import Layout from "@/components/layout";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetGatePass, useUpdateGatePassStatus, getListGatePassesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, MapPin, Clock, User, Phone } from "lucide-react";
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

export default function WardenRequestDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id ?? "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: pass, isLoading, refetch } = useGetGatePass(id, { query: { enabled: !!id, queryKey: ["getGatePass", id] } });
  const updateStatus = useUpdateGatePassStatus();

  const handleAction = (action: "approved" | "rejected") => {
    setProcessing(true);
    updateStatus.mutate(
      { id, data: { status: action, wardenRemarks: remarks || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGatePassesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["getGatePass", id] });
          toast({ title: action === "approved" ? "Pass Approved" : "Pass Rejected", description: "Student has been notified via the app." });
          refetch();
          setProcessing(false);
        },
        onError: () => setProcessing(false),
      }
    );
  };

  if (isLoading) return (
    <Layout>
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Layout>
  );

  if (!pass) return (
    <Layout><div className="p-6 text-muted-foreground">Pass not found</div></Layout>
  );

  return (
    <Layout>
      <div className="p-6 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/warden/requests")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Requests
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Request #{pass.id}</h1>
            <p className="text-muted-foreground text-sm mt-1">{outingLabels[pass.outingType]}</p>
          </div>
          <Badge variant="outline" className={cn("text-sm px-3 py-1", statusColors[pass.status])}>
            {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Student Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="Name" value={pass.studentName ?? "—"} />
              <InfoRow icon={User} label="Roll Number" value={pass.studentRollNumber ?? "—"} />
              <InfoRow icon={MapPin} label="Hostel / Room" value={`${pass.hostelName ?? "—"} / ${pass.roomNumber ?? "—"}`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Outing Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={MapPin} label="Destination" value={pass.destination} />
              <InfoRow icon={Clock} label="Outgoing" value={new Date(pass.outgoingTime).toLocaleString()} />
              <InfoRow icon={Clock} label="Expected Return" value={new Date(pass.expectedReturnTime).toLocaleString()} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Reason</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{pass.reason}</p></CardContent>
        </Card>

        {pass.status === "pending" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Take Action</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Remarks (optional)</label>
                <Textarea
                  placeholder="Add remarks or reason for rejection..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  data-testid="textarea-remarks"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={processing}
                  onClick={() => handleAction("approved")}
                  data-testid="button-approve"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />Approve Gate Pass
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={processing}
                  onClick={() => handleAction("rejected")}
                  data-testid="button-reject"
                >
                  <XCircle className="w-4 h-4 mr-2" />Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pass.wardenRemarks && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Warden Remarks</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm italic">"{pass.wardenRemarks}"</p>
              {pass.approvedByName && <p className="text-xs text-muted-foreground mt-1">— {pass.approvedByName}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
