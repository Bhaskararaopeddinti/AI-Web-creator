import Layout from "@/components/layout";
import { useState } from "react";
import { useListUsers, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Trash2, GraduationCap, Shield, UserCog, User } from "lucide-react";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  student: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warden: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  security: "bg-green-500/10 text-green-400 border-green-500/20",
  admin: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const roleIcons: Record<string, React.ElementType> = {
  student: GraduationCap,
  warden: UserCog,
  security: Shield,
  admin: User,
};

export default function AdminUsers() {
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteUser = useDeleteUser();

  const { data: users, isLoading } = useListUsers(
    { role: role as any || undefined, search: search || undefined },
    { query: { queryKey: getListUsersQueryKey({ role: role as any || undefined, search: search || undefined }) } }
  );

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User Deleted", description: `${name} has been removed from the system.` });
      },
      onError: () => toast({ title: "Error", description: "Failed to delete user", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all campus users and their roles</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-users" />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="warden">Wardens</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />Users ({users?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : !users || users.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role] ?? User;
                  return (
                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50" data-testid={`user-row-${user.id}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <RoleIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{user.name}</span>
                          <Badge variant="outline" className={cn("text-xs", roleColors[user.role])}>{user.role}</Badge>
                          {!user.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                        {user.rollNumber && <div className="text-xs text-muted-foreground">Roll: {user.rollNumber} &bull; Room: {user.roomNumber}</div>}
                        {user.hostelName && <div className="text-xs text-muted-foreground">{user.hostelName} &bull; {user.departmentName}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDelete(user.id, user.name)}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
