import Layout from "@/components/layout";
import { useState } from "react";
import { Link } from "wouter";
import { useListGatePasses, useUpdateGatePassStatus, getListGatePassesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Eye, FileText, AlertCircle } from "lucide-react";
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

export default function WardenRequests() {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusParam = status !== "all" ? status as any : undefined;
  const { data, isLoading } = useListGatePasses(
    { status: statusParam, search: search || undefined },
    { query: { queryKey: getListGatePassesQueryKey({ status: statusParam, search: search || undefined }) } }
  );
  const updateStatus = useUpdateGatePassStatus();
  const passes = data?.data ?? [];

  const handleAction = (id: number, action: "approved" | "rejected") => {
    setProcessingId(id);
    updateStatus.mutate({ id, data: { status: action } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGatePassesQueryKey({ status: "pending" }) });
        toast({ title: action === "approved" ? "Pass Approved" : "Pass Rejected", description: "Student has been notified." });
        setProcessingId(null);
      },
      onError: () => setProcessingId(null),
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gate Pass Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve student outing requests</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search student or destination..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="out">Outside</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Requests ({data?.total ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : passes.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passes.map((pass) => (
                  <div key={pass.id} className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-3" data-testid={`card-request-${pass.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{pass.studentName}</div>
                        <div className="text-xs text-muted-foreground">{pass.studentRollNumber} &bull; {pass.hostelName} &bull; Room {pass.roomNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", statusColors[pass.status])}>
                          {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                        </Badge>
                        {pass.isLate && <Badge variant="destructive" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Late</Badge>}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Type: </span>{outingLabels[pass.outingType]}
                      <span className="mx-3 text-muted-foreground">•</span>
                      <span className="text-muted-foreground">Destination: </span>{pass.destination}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(pass.outgoingTime).toLocaleString()} → {new Date(pass.expectedReturnTime).toLocaleString()}
                    </div>
                    <div className="flex gap-2 justify-end">
                      {pass.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                            disabled={processingId === pass.id}
                            onClick={() => handleAction(pass.id, "approved")}
                            data-testid={`button-approve-${pass.id}`}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            disabled={processingId === pass.id}
                            onClick={() => handleAction(pass.id, "rejected")}
                            data-testid={`button-reject-${pass.id}`}>
                            <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      <Link href={`/warden/requests/${pass.id}`}>
                        <Button size="sm" variant="ghost" data-testid={`button-view-${pass.id}`}><Eye className="w-3.5 h-3.5 mr-1" />Details</Button>
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
