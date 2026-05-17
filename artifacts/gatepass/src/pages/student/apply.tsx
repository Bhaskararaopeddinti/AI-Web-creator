import Layout from "@/components/layout";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateGatePass, getListGatePassesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, ArrowLeft } from "lucide-react";

const applySchema = z.object({
  outingType: z.enum(["home_visit", "weekend_leave", "emergency_leave", "medical_leave"]),
  reason: z.string().min(10, "Please provide a detailed reason"),
  destination: z.string().min(3, "Please specify your destination"),
  outgoingTime: z.string().min(1, "Outgoing time is required"),
  expectedReturnTime: z.string().min(1, "Expected return time is required"),
});

const outingTypes = [
  { value: "home_visit", label: "Home Visit" },
  { value: "weekend_leave", label: "Weekend Leave" },
  { value: "emergency_leave", label: "Emergency Leave" },
  { value: "medical_leave", label: "Medical Leave" },
];

export default function ApplyGatePass() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateGatePass();

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: { outingType: "home_visit", reason: "", destination: "", outgoingTime: "", expectedReturnTime: "" },
  });

  const onSubmit = (values: z.infer<typeof applySchema>) => {
    createMutation.mutate(
      {
        data: {
          outingType: values.outingType,
          reason: values.reason,
          destination: values.destination,
          outgoingTime: new Date(values.outgoingTime).toISOString(),
          expectedReturnTime: new Date(values.expectedReturnTime).toISOString(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGatePassesQueryKey() });
          toast({ title: "Gate Pass Applied", description: "Your request has been submitted for warden approval." });
          setLocation("/student/passes");
        },
        onError: (err: any) => {
          toast({ title: "Failed", description: err?.data?.error || "Could not submit request", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => setLocation("/student")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Apply for Gate Pass</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit your outing request for warden approval</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary" />
              Outing Request Form
            </CardTitle>
            <CardDescription>Fill in all details accurately. False information may result in rejection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="outingType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-outing-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {outingTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="destination" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl><Input placeholder="e.g., Home, City Hospital, etc." data-testid="input-destination" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Outing</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain the purpose of your outing in detail..." rows={4} data-testid="textarea-reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="outgoingTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outgoing Date & Time</FormLabel>
                      <FormControl><Input type="datetime-local" data-testid="input-outgoing-time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="expectedReturnTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Return</FormLabel>
                      <FormControl><Input type="datetime-local" data-testid="input-return-time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-pass">
                  {createMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
