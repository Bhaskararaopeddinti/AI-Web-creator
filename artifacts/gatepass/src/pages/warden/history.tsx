import Layout from "@/components/layout";
import { useState } from "react";
import { useListGatePasses, getListGatePassesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Search, AlertCircle } from "lucide-react";
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

export default function WardenHistory() {
  const [status, setStatus] = useState("returned");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListGatePasses(
    { status: status as any || undefined, search: search || undefined },
    { query: { queryKey: getListGatePassesQueryKey({ status: status as any || undefined, search: search || undefined }) } }
  );

  const passes = data?.data ?? [];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Outing History</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete record of all gate pass requests</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search student or destination..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="out">Outside</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" />Records ({data?.total ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : passes.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No records found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {passes.map((pass) => (
                  <div key={pass.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{pass.studentName}</span>
                        <span className="text-xs text-muted-foreground">{pass.studentRollNumber}</span>
                        {pass.isLate && <Badge variant="destructive" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Late</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {outingLabels[pass.outingType]} &mdash; {pass.destination}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Applied: {new Date(pass.createdAt).toLocaleDateString()}
                        {pass.actualInTime && ` &mdash; Returned: ${new Date(pass.actualInTime).toLocaleString()}`}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs ml-4", statusColors[pass.status])}>
                      {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                    </Badge>
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
