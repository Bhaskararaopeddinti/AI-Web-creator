import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, useListHostels, useListDepartments } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rollNumber: z.string().min(1, "Roll number is required"),
  phone: z.string().min(10, "Valid phone number required"),
  hostelId: z.string().min(1, "Please select a hostel"),
  departmentId: z.string().min(1, "Please select a department"),
  roomNumber: z.string().min(1, "Room number is required"),
  parentPhone: z.string().min(10, "Parent phone number required"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const { data: hostels } = useListHostels();
  const { data: departments } = useListDepartments();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", rollNumber: "", phone: "", hostelId: "", departmentId: "", roomNumber: "", parentPhone: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: { ...data, role: "student", hostelId: parseInt(data.hostelId, 10), departmentId: parseInt(data.departmentId, 10) } },
      {
        onSuccess: (res) => { login(res.token, res.user); setLocation("/student"); },
        onError: (err: any) => { toast({ title: "Registration Failed", description: err?.data?.error || "Something went wrong", variant: "destructive" }); },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Student Registration</h1>
          <p className="text-muted-foreground mt-2">Create your campus GatePass account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>All fields are required for registration</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="you@campus.edu" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="rollNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl><Input placeholder="CS2021001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="hostelId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hostel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {hostels?.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {departments?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="roomNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number</FormLabel>
                      <FormControl><Input placeholder="A-204" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="parentPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Phone</FormLabel>
                      <FormControl><Input placeholder="9876543200" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registering..." : "Create Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setLocation("/login")}>Sign in</Button>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
