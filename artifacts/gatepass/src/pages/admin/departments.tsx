import Layout from "@/components/layout";
import { useState } from "react";
import { useListDepartments, useCreateDepartment, useDeleteDepartment, getListDepartmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, X } from "lucide-react";

const deptSchema = z.object({ name: z.string().min(2, "Department name required") });

export default function AdminDepartments() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: departments, isLoading } = useListDepartments();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();

  const form = useForm<z.infer<typeof deptSchema>>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: z.infer<typeof deptSchema>) => {
    createDept.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        toast({ title: "Department Added", description: `${values.name} has been added.` });
        form.reset();
        setShowForm(false);
      },
      onError: () => toast({ title: "Error", description: "Failed to add department", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    deleteDept.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        toast({ title: "Deleted" });
      },
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Departments</h1>
            <p className="text-muted-foreground text-sm mt-1">Manually add and manage academic departments</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-department">
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "Add Department"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle className="text-base">Manually Add New Department</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3 items-end">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Department Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Information Technology" data-testid="input-department-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={createDept.isPending} data-testid="button-submit-department">
                    {createDept.isPending ? "Adding..." : "Add"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />All Departments ({departments?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !departments || departments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No departments added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50" data-testid={`dept-row-${d.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {d.id}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(d.id, d.name)}
                      data-testid={`button-delete-dept-${d.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
