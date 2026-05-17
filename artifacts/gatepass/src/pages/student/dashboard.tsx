import Layout from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useListGatePasses, useListNotifications } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Clock, CheckCircle, XCircle, FileText, Bell, ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  out: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  returned: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const outingLabels: Record<string, string> = {
  home_visit: "Home Visit",
  weekend_leave: "Weekend Leave",
  emergency_leave: "Emergency Leave",
  medical_leave: "Medical Leave",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: passesData, isLoading } = useListGatePasses({}, { query: { queryKey: ["listGatePasses", {}] } });
  const { data: notifications } = useListNotifications();

  const passes = passesData?.data ?? [];
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;
  const pending = passes.filter((p) => p.status === "pending").length;
  const approved = passes.filter((p) => p.status === "approved").length;
  const currentlyOut = passes.find((p) => p.status === "out");

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.rollNumber && <span className="mr-3">Roll: {user.rollNumber}</span>}
            {user?.hostelName && <span className="mr-3">Hostel: {user.hostelName}</span>}
            {user?.roomNumber && <span>Room: {user.roomNumber}</span>}
          </p>
        </div>

        {currentlyOut && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-400">Currently Outside Campus</div>
              <div className="text-sm text-muted-foreground">
                Destination: {currentlyOut.destination} &mdash; Expected return: {new Date(currentlyOut.expectedReturnTime).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Passes", value: passes.length, icon: FileText, color: "text-primary" },
            { label: "Pending", value: pending, icon: Clock, color: "text-yellow-400" },
            { label: "Approved", value: approved, icon: CheckCircle, color: "text-green-400" },
            { label: "Notifications", value: unread, icon: Bell, color: "text-orange-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                  <Icon className={cn("w-8 h-8 opacity-60", color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href="/student/apply">
            <Button data-testid="button-apply-pass">
              <FileText className="w-4 h-4 mr-2" />
              Apply for Gate Pass
            </Button>
          </Link>
          <Link href="/student/passes">
            <Button variant="outline">
              View All Passes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : passes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No gate passes yet. Apply for your first one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {passes.slice(0, 5).map((pass) => (
                  <Link key={pass.id} href={`/student/passes/${pass.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors" data-testid={`card-pass-${pass.id}`}>
                      <div>
                        <div className="font-medium text-sm">{outingLabels[pass.outingType] ?? pass.outingType}</div>
                        <div className="text-xs text-muted-foreground">{pass.destination} &mdash; {new Date(pass.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", statusColors[pass.status])}>
                        {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
