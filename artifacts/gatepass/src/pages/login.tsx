import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user);
          if (res.user.role === "admin") setLocation("/admin");
          else if (res.user.role === "warden") setLocation("/warden");
          else if (res.user.role === "security") setLocation("/security");
          else setLocation("/student");
        },
        onError: (err) => {
          toast({ title: "Login Failed", description: err.message || "Invalid credentials", variant: "destructive" });
        },
      }
    );
  };

  const fillDemo = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", email.split("@")[0] + "123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">GatePass System</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@campus.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t pt-6">
            <div className="text-sm text-center text-muted-foreground w-full">Demo Accounts:</div>
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <Button variant="outline" size="sm" onClick={() => fillDemo("student@campus.edu")}>Student</Button>
              <Button variant="outline" size="sm" onClick={() => fillDemo("warden@campus.edu")}>Warden</Button>
              <Button variant="outline" size="sm" onClick={() => fillDemo("security@campus.edu")}>Security</Button>
              <Button variant="outline" size="sm" onClick={() => fillDemo("admin@campus.edu")}>Admin</Button>
            </div>
            <div className="text-sm text-center mt-2">
              <span className="text-muted-foreground">Are you a student? </span>
              <Button variant="link" className="p-0 h-auto" onClick={() => setLocation("/register")}>Register here</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
