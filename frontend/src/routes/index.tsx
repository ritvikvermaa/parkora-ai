import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ParkingSquare, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Parkora AI" },
      { name: "description", content: "Sign in to Parkora AI smart parking dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("admin@parkora.com");
  const [password, setPassword] = useState("123456");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Login failed");
        return;
      }

      login(data);

      if (data.user.role === "admin") {
        navigate({ to: "/admin" });
      } else if (data.user.role === "guard") {
        navigate({ to: "/guard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      setMessage("Backend not connected or login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary via-chart-5 to-chart-4 text-primary-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
            <ParkingSquare className="h-5 w-5" />
          </div>
          <div className="font-semibold text-lg">Parkora AI</div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Smart parking for<br />modern societies.
          </h2>
          <p className="mt-4 text-white/80 max-w-md">
            Real-time slot tracking, AI demand prediction, and effortless visitor management — all in one place.
          </p>
        </div>

        <div className="text-xs text-white/60">© 2026 Greenwood Heights · Powered by Parkora AI</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md p-8 shadow-card border-border/60">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your Parkora account.</p>

          {message && (
            <div className="mt-4 rounded-md border bg-muted/50 px-3 py-2 text-sm">
              {message}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" defaultChecked />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 font-medium">
              {loading ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Demo: admin@parkora.com / 123456
          </p>
        </Card>
      </div>
    </div>
  );
}