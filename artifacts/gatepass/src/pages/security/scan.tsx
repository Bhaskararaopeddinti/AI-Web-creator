import Layout from "@/components/layout";
import { useState, useRef } from "react";
import { useVerifyGatePass, useMarkGatePassOut, useMarkGatePassIn, getListGatePassesQueryKey, getGetLiveCountQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Scan, User, MapPin, Clock, CheckCircle, XCircle, LogIn, LogOut, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  out: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  returned: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function SecurityScan() {
  const [token, setToken] = useState("");
  const [verifiedPass, setVerifiedPass] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyMutation = useVerifyGatePass("", { query: { enabled: false, queryKey: ["verify", ""] } });
  const markOut = useMarkGatePassOut();
  const markIn = useMarkGatePassIn();

  const handleVerify = async () => {
    if (!token.trim()) return;
    setScanning(true);
    try {
      const response = await fetch(`/api/gate-passes/verify/${encodeURIComponent(token.trim())}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("gatepass_token")}` },
      });
      if (!response.ok) {
        const err = await response.json();
        toast({ title: "Invalid Pass", description: err.error || "Could not verify token", variant: "destructive" });
        setVerifiedPass(null);
      } else {
        const data = await response.json();
        setVerifiedPass(data);
      }
    } catch {
      toast({ title: "Error", description: "Verification failed", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleMarkOut = () => {
    if (!verifiedPass) return;
    markOut.mutate({ id: verifiedPass.id }, {
      onSuccess: (updated) => {
        setVerifiedPass(updated);
        queryClient.invalidateQueries({ queryKey: getGetLiveCountQueryKey() });
        toast({ title: "Exit Recorded", description: `${updated.studentName} has left the campus.` });
      },
      onError: (err: any) => toast({ title: "Error", description: err?.data?.error || "Failed to mark exit", variant: "destructive" }),
    });
  };

  const handleMarkIn = () => {
    if (!verifiedPass) return;
    markIn.mutate({ id: verifiedPass.id }, {
      onSuccess: (updated) => {
        setVerifiedPass(updated);
        queryClient.invalidateQueries({ queryKey: getGetLiveCountQueryKey() });
        toast({ title: "Entry Recorded", description: `${updated.studentName} has returned to campus${updated.isLate ? " (LATE)" : ""}.` });
      },
      onError: (err: any) => toast({ title: "Error", description: err?.data?.error || "Failed to mark entry", variant: "destructive" }),
    });
  };

  const reset = () => { setToken(""); setVerifiedPass(null); inputRef.current?.focus(); };

  return (
    <Layout>
      <div className="p-6 max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">QR Gate Pass Scanner</h1>
          <p className="text-muted-foreground text-sm mt-1">Scan or enter QR token to verify and log student movement</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" />Enter Gate Pass Token</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Paste or type QR token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                autoFocus
                data-testid="input-qr-token"
              />
              <Button onClick={handleVerify} disabled={!token.trim() || scanning} data-testid="button-verify">
                <Scan className="w-4 h-4 mr-2" />{scanning ? "Checking..." : "Verify"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Tip: Use a barcode scanner or manually paste the UUID token from the student's QR code</p>
          </CardContent>
        </Card>

        {verifiedPass && (
          <Card className={cn("border-2", verifiedPass.status === "approved" ? "border-green-500/30" : verifiedPass.status === "out" ? "border-blue-500/30" : "border-muted")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />Pass Verified
                </CardTitle>
                <Badge variant="outline" className={cn("text-sm", statusColors[verifiedPass.status])}>
                  {verifiedPass.status.charAt(0).toUpperCase() + verifiedPass.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <InfoRow icon={User} label="Student" value={`${verifiedPass.studentName} (${verifiedPass.studentRollNumber})`} />
                <InfoRow icon={MapPin} label="Hostel / Room" value={`${verifiedPass.hostelName} / ${verifiedPass.roomNumber}`} />
                <InfoRow icon={MapPin} label="Destination" value={verifiedPass.destination} />
                <InfoRow icon={Clock} label="Expected Return" value={new Date(verifiedPass.expectedReturnTime).toLocaleString()} />
                {verifiedPass.actualOutTime && <InfoRow icon={Clock} label="Departed at" value={new Date(verifiedPass.actualOutTime).toLocaleString()} />}
              </div>

              {verifiedPass.isLate && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-400 text-sm font-medium">
                  LATE RETURN — Expected by {new Date(verifiedPass.expectedReturnTime).toLocaleString()}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {verifiedPass.status === "approved" && (
                  <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleMarkOut} disabled={markOut.isPending} data-testid="button-mark-out">
                    <LogOut className="w-4 h-4 mr-2" />Mark as Exited
                  </Button>
                )}
                {verifiedPass.status === "out" && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleMarkIn} disabled={markIn.isPending} data-testid="button-mark-in">
                    <LogIn className="w-4 h-4 mr-2" />Mark as Returned
                  </Button>
                )}
                {(verifiedPass.status === "returned" || verifiedPass.status === "rejected" || verifiedPass.status === "pending") && (
                  <div className="text-muted-foreground text-sm">
                    {verifiedPass.status === "returned" && "Student has already returned."}
                    {verifiedPass.status === "pending" && "This pass has not been approved yet."}
                    {verifiedPass.status === "rejected" && "This pass was rejected."}
                  </div>
                )}
                <Button variant="outline" onClick={reset} data-testid="button-reset-scanner">Scan Another</Button>
              </div>
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
