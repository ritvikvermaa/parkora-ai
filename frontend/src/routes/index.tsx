import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ParkingSquare,
  Mail,
  Lock,
  ArrowRight,
  User,
  Home,
  ShieldCheck,
  Car,
  Activity,
  UserCheck,
  Building2,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { FieldHint, InlineNotice } from "@/components/dashboard-ui";
import { useAuth } from "@/context/AuthContext";
import API from "@/services/api";
import { parseFlatId, SOCIETY_BLOCKS } from "@/lib/society";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Parkora AI" },
      { name: "description", content: "Sign in to the Smartworld Gems parking console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [flat, setFlat] = useState("");
  const [phone, setPhone] = useState("");
  const [block, setBlock] = useState("");
  const parsedFlat = parseFlatId(flat);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      if (mode === "register" && !parsedFlat.isValid) {
        setMessage("Enter a compact flat ID such as N22A. The final letter must be A, B, C, or D.");
        return;
      }

      const endpoint = mode === "login" ? "login" : "register";
      const res = await fetch(`${API}/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : {
                name,
                email,
                password,
                phone,
                flat,
                block: block || parsedFlat.block,
                role: "resident",
              }
        ),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Login failed");
        return;
      }

      if (mode === "register") {
        setMessage(data.message || "Registration sent to admin for approval");
        setMode("login");
        setPassword("");
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
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)] bg-background">
      <div className="hidden lg:flex relative overflow-hidden border-r bg-sidebar p-10 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-soft">
            <ParkingSquare className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-xs uppercase text-muted-foreground">Parkora AI</div>
            <div className="font-semibold text-lg">Smartworld Gems</div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <CircleDot className="h-3 w-3 text-success" />
              Live society parking console
            </div>
            <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
              Gate entries, resident approvals and parking allocation for Smartworld Gems.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Built around the Jade, Topaz, Nest and Opal blocks with compact flat IDs like J112A and N22C.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PreviewTile icon={ShieldCheck} label="Resident onboarding" value="Admin approved" />
            <PreviewTile icon={Car} label="Parking logic" value="Visitor first" />
            <PreviewTile icon={Activity} label="Pressure model" value="Live signals" />
            <PreviewTile icon={UserCheck} label="Gate requests" value="Flat approved" />
          </div>

          <div className="rounded-lg border bg-background p-4 shadow-card">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Smartworld Gems setup</span>
              <span className="text-success">Operational</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md bg-muted/50 p-3">
                <div className="text-muted-foreground text-xs">Blocks</div>
                <div className="mt-1 font-semibold">J T N O</div>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <div className="text-muted-foreground text-xs">Fallback</div>
                <div className="mt-1 font-semibold">Controlled</div>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <div className="text-muted-foreground text-xs">Access</div>
                <div className="mt-1 font-semibold">Role based</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          © 2026 Parkora AI for Smartworld Gems
        </div>
      </div>

      <div className="flex items-center justify-center bg-muted/20 p-6 md:p-10">
        <Card className="w-full max-w-md p-8 shadow-card border-border/70">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <ParkingSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Parkora AI</div>
              <div className="font-semibold">Smartworld Gems</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create resident account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Sign in to the Smartworld Gems parking console."
              : "Your request will be reviewed by the admin before sign-in."}
          </p>

          {message && (
            <div className="mt-4">
              <InlineNotice
                tone={message.toLowerCase().includes("pending") || message.toLowerCase().includes("approval") ? "warning" : "info"}
              >
              {message}
              </InlineNotice>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="block">Block</Label>
                    <select
                      id="block"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Infer</option>
                      {SOCIETY_BLOCKS.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name} ({item.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="flat">Flat</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="flat"
                        placeholder="Enter flat ID, e.g. N22A"
                        required
                        value={flat}
                        onChange={(e) => {
                          const nextFlat = e.target.value.toUpperCase();
                          const parsed = parseFlatId(nextFlat);

                          setFlat(nextFlat);
                          if (parsed.block) setBlock(parsed.block);
                        }}
                        className="pl-9 h-11"
                      />
                    </div>
                  </div>
                </div>

                <FieldHint>
                  {flat && parsedFlat.isValid
                    ? `${parsedFlat.normalized}: ${parsedFlat.block}, tower ${parsedFlat.tower}, ${parsedFlat.floorLabel}.`
                    : "Use the compact society format. Example: N22A means Nest block, tower 22, flat A."}
                </FieldHint>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                  />
                </div>
              </>
            )}

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

            {mode === "login" && <div className="flex items-center gap-2">
              <Checkbox id="remember" defaultChecked />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>}

            <Button type="submit" disabled={loading} className="w-full h-11 font-medium">
              {loading
                ? mode === "login"
                  ? "Signing in…"
                  : "Sending request…"
                : mode === "login"
                  ? <>Sign in <ArrowRight className="h-4 w-4 ml-1" /></>
                  : <>Request approval <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
            className="mt-5 w-full text-sm text-primary hover:underline"
          >
            {mode === "login"
              ? "New resident? Register for approval"
              : "Already approved? Sign in"}
          </button>

          {mode === "login" && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Use the account credentials approved by your society admin.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function PreviewTile({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}
