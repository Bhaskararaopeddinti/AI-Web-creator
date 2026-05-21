import Layout from "@/components/layout";
import { useState } from "react";

import {
  useListUsers,
  useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";

import {
  Users,
  Search,
  Trash2,
  GraduationCap,
  Shield,
  UserCog,
  User,
  Phone,
  IdCard,
} from "lucide-react";

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
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");

  /* Hostel + Department States */
  const [hostelName, setHostelName] =
    useState("");

  const [departmentName, setDepartmentName] =
    useState("");

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const deleteUser = useDeleteUser();

  const roleParam =
    role !== "all"
      ? (role as any)
      : undefined;

  const { data: users, isLoading } =
    useListUsers(
      {
        role: roleParam,
        search: search || undefined,
      },
      {
        query: {
          queryKey:
            getListUsersQueryKey({
              role: roleParam,
              search:
                search || undefined,
            }),
        },
      }
    );

  const handleDelete = (
    id: number,
    name: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete ${name}?`
      )
    )
      return;

    deleteUser.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey:
              getListUsersQueryKey(),
          });

          toast({
            title: "User Deleted",
            description: `${name} has been removed from the system.`,
          });
        },

        onError: () =>
          toast({
            title: "Error",
            description:
              "Failed to delete user",
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            User Management
          </h1>

          <p className="text-muted-foreground text-sm mt-1">
            Manage all campus users and their roles
          </p>
        </div>

        {/* Search + Role Filter */}
        <div className="flex gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />

            <Input
              placeholder="Search by name..."
              className="pl-9"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              data-testid="input-search-users"
            />
          </div>

          {/* Role Filter */}
          <Select
            value={role}
            onValueChange={setRole}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Roles
              </SelectItem>

              <SelectItem value="student">
                Students
              </SelectItem>

              <SelectItem value="warden">
                Wardens
              </SelectItem>

              <SelectItem value="security">
                Security
              </SelectItem>

              <SelectItem value="admin">
                Admins
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hostel + Department Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Hostel */}
          <div className="space-y-2">

            <label className="text-sm font-medium">
              Hostel Name
            </label>

            <Select
              value={hostelName}
              onValueChange={
                setHostelName
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Hostel" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="Boys Hostel">
                  Boys Hostel
                </SelectItem>

                <SelectItem value="Girls Hostel">
                  Girls Hostel
                </SelectItem>

                <SelectItem value="Other">
                  Other
                </SelectItem>

              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="space-y-2">

            <label className="text-sm font-medium">
              Department
            </label>

            <Select
              value={departmentName}
              onValueChange={
                setDepartmentName
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="CSE">
                  CSE
                </SelectItem>

                <SelectItem value="ECE">
                  ECE
                </SelectItem>

                <SelectItem value="CSM">
                  CSM
                </SelectItem>

                <SelectItem value="CIC">
                  CIC
                </SelectItem>

                <SelectItem value="IECT">
                  IECT
                </SelectItem>

                <SelectItem value="EEE">
                  EEE
                </SelectItem>

                <SelectItem value="MECH">
                  MECH
                </SelectItem>

                <SelectItem value="CIVIL">
                  CIVIL
                </SelectItem>

                <SelectItem value="DE">
                  DE
                </SelectItem>

                <SelectItem value="Other">
                  Other
                </SelectItem>

              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Card */}
        <Card>

          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({users?.length ?? 0})
            </CardTitle>
          </CardHeader>

          <CardContent>

            {/* Loading */}
            {isLoading ? (
              <div className="space-y-3">

                {[1, 2, 3, 4].map(
                  (i) => (
                    <Skeleton
                      key={i}
                      className="h-20 w-full"
                    />
                  )
                )}

              </div>
            ) : !users ||
              users.length === 0 ? (

              /* Empty State */
              <div className="text-center text-muted-foreground py-10">

                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />

                <p className="text-sm">
                  No users found
                </p>

              </div>

            ) : (

              /* User List */
              <div className="space-y-3">

                {users.map((user) => {

                  const RoleIcon =
                    roleIcons[user.role] ??
                    User;

                  return (

                    <div
                      key={user.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition"
                    >

                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">

                        <RoleIcon className="w-5 h-5 text-primary" />

                      </div>

                      {/* User Details */}
                      <div className="flex-1 min-w-0">

                        {/* Name + Role */}
                        <div className="flex flex-wrap items-center gap-2">

                          <span className="font-semibold text-sm">
                            {user.name}
                          </span>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              roleColors[
                                user.role
                              ]
                            )}
                          >
                            {user.role}
                          </Badge>

                          {!user.isActive && (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>

                        {/* Email */}
                        <div className="text-xs text-muted-foreground mt-1">
                          Email:
                          {user.email}
                        </div>

                        {/* Registration Number */}
                        {user.registrationNumber && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">

                            <IdCard className="w-3 h-3" />

                            Registration No:
                            {
                              user.registrationNumber
                            }

                          </div>
                        )}

                        {/* College ID */}
                        {user.collegeId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">

                            <IdCard className="w-3 h-3" />

                            College ID:
                            {
                              user.collegeId
                            }

                          </div>
                        )}

                        {/* Parent Phone */}
                        {user.parentPhone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">

                            <Phone className="w-3 h-3" />

                            Parent Phone:
                            {
                              user.parentPhone
                            }

                          </div>
                        )}

                        {/* Roll & Room */}
                        {user.rollNumber && (
                          <div className="text-xs text-muted-foreground mt-1">

                            Roll:
                            {
                              user.rollNumber
                            }

                            {" • "}

                            Room:
                            {
                              user.roomNumber
                            }

                          </div>
                        )}

                        {/* Hostel & Department */}
                        <div className="text-xs text-muted-foreground mt-1">

                          Hostel:
                          {user.hostelName ||
                            hostelName ||
                            "Not Assigned"}

                          {" • "}

                          Department:
                          {user.departmentName ||
                            departmentName ||
                            "Not Assigned"}

                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="flex items-center gap-2 flex-shrink-0">

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() =>
                            handleDelete(
                              user.id,
                              user.name
                            )
                          }
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