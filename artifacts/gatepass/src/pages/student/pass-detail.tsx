import Layout from "@/components/layout";
import { useParams, useLocation } from "wouter";
import { useGetGatePass, useGetGatePassQr } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, User, QrCode } from "lucide-react";
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

export default function PassDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id ?? "0", 10);

  const { data: pass, isLoading } = useGetGatePass(id, { query: { enabled: !!id, queryKey: ["getGatePass", id] } });
  const { data: qr } = useGetGatePassQr(id, {
    query: { enabled: !!pass && (pass.status === "approved" || pass.status === "out"), queryKey: ["getGatePassQr", id] }
  });

  if (isLoading) return (
    <Layout>
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Layout>
  );

  if (!pass) return (
    <Layout>
      <div className="p-6 text-center text-muted-foreground">Pass not found</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-6 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/student/passes")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Passes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gate Pass #{pass.id}</h1>
            <p className="text-muted-foreground text-sm mt-1">{outingLabels[pass.outingType]}</p>
          </div>
          <Badge variant="outline" className={cn("text-sm px-3 py-1", statusColors[pass.status])}>
            {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Outing Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={MapPin} label="Destination" value={pass.destination} />
              <InfoRow icon={Clock} label="Outgoing Time" value={new Date(pass.outgoingTime).toLocaleString()} />
              <InfoRow icon={Clock} label="Expected Return" value={new Date(pass.expectedReturnTime).toLocaleString()} />
              {pass.actualOutTime && <InfoRow icon={Clock} label="Actual Departure" value={new Date(pass.actualOutTime).toLocaleString()} />}
              {pass.actualInTime && <InfoRow icon={Clock} label="Actual Return" value={new Date(pass.actualInTime).toLocaleString()} />}
              <div className="border-t pt-3 mt-3">
                <div className="text-xs text-muted-foreground mb-1">Reason</div>
                <p className="text-sm">{pass.reason}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Status Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="Applied On" value={new Date(pass.createdAt).toLocaleDateString()} />
              {pass.approvedByName && <InfoRow icon={User} label="Reviewed By" value={pass.approvedByName} />}
              {pass.wardenRemarks && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Warden Remarks</div>
                  <p className="text-sm italic">"{pass.wardenRemarks}"</p>
                </div>
              )}
              {pass.isLate && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2 text-red-400 text-sm">
                  Late return detected
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {(pass.status === "approved" || pass.status === "out") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <QrCode className="w-4 h-4" />Digital Gate Pass (QR Code)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qr ? (
                <>
                  <img src={qr.qrDataUrl} alt="Gate Pass QR Code" className="w-48 h-48 rounded-lg border border-border" data-testid="img-qr-code" />
                  <p className="text-xs text-muted-foreground text-center">
                    Show this QR code to the security guard when exiting or entering the campus
                  </p>
                  <div className="text-xs font-mono bg-muted px-3 py-1 rounded">{qr.token}</div>
                </>
              ) : (
                <Skeleton className="w-48 h-48 rounded-lg" />
              )}
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
