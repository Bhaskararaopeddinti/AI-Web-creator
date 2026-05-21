import Layout from "@/components/layout";
import { useState } from "react";
import { useListHostels, useCreateHostel, useDeleteHostel, getListHostelsQueryKey } from "@workspace/api-client-react";
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
import { Building2, Plus, Trash2, X } from "lucide-react";

const hostelSchema = z.object({
  name: z.string().min(2, "Name required"),
  totalRooms: z.coerce.number().min(1, "Must have at least 1 room"),
});

export default function AdminHostels() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hostels, isLoading } = useListHostels();
  const createHostel = useCreateHostel();
  const deleteHostel = useDeleteHostel();

  const form = useForm<z.infer<typeof hostelSchema>>({
    resolver: zodResolver(hostelSchema),
    defaultValues: { name: "", totalRooms: 60 },
  });

  const onSubmit = (values: z.infer<typeof hostelSchema>) => {
    createHostel.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHostelsQueryKey() });
        toast({ title: "Hostel Added", description: `${values.name} has been added successfully.` });
        form.reset();
        setShowForm(false);
      },
      onError: () => toast({ title: "Error", description: "Failed to add hostel", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    deleteHostel.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHostelsQueryKey() });
        toast({ title: "Deleted", description: `${name} removed.` });
      },
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hostels</h1>
            <p className="text-muted-foreground text-sm mt-1">Manually add and manage hostel buildings</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-hostel">
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "Add Hostel"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle className="text-base">Manually Add New Hostel</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3 items-end">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Hostel Name</FormLabel>
                      <FormControl><Input placeholder="e.g., D-Block Hostel" data-testid="input-hostel-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalRooms" render={({ field }) => (
                    <FormItem className="w-40">
                      <FormLabel>Total Rooms</FormLabel>
                      <FormControl><Input type="number" min={1} data-testid="input-hostel-rooms" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={createHostel.isPending} data-testid="button-submit-hostel">
                    {createHostel.isPending ? "Adding..." : "Add Hostel"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" />All Hostels ({hostels?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !hostels || hostels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hostels added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {hostels.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50" data-testid={`hostel-row-${h.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold">{h.name}</div>
                        <div className="text-xs text-muted-foreground">{h.totalRooms} rooms total</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(h.id, h.name)}
                      data-testid={`button-delete-hostel-${h.id}`}
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
