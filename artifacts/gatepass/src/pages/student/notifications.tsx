import Layout from "@/components/layout";
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  gate_pass_approved: "text-green-400",
  gate_pass_rejected: "text-red-400",
  gate_pass_applied: "text-blue-400",
  late_return: "text-orange-400",
  general: "text-muted-foreground",
};

export default function StudentNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleMarkOne = (id: number) => {
    markOneRead.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAllRead.isPending} data-testid="button-mark-all-read">
              <CheckCheck className="w-4 h-4 mr-2" />Mark all read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <BellOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...notifications].reverse().map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      n.isRead ? "border-transparent bg-transparent opacity-60" : "border-border bg-muted/40"
                    )}
                    data-testid={`notification-${n.id}`}
                  >
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", n.isRead ? "bg-transparent" : "bg-primary")} />
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", typeColors[n.type])}>{n.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{n.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkOne(n.id)} className="flex-shrink-0">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </Button>
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
