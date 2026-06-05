import { createFileRoute } from "@tanstack/react-router";
import { Sun, Moon, Bell, User, Building2, Shield } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { currentUser, society } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import ProtectedRoute from "../components/ProtectedRoute";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Parkora AI" }] }),
  component: () => (
  <ProtectedRoute roles={["admin", "guard", "resident"]}>
    <SettingsPage />
  </ProtectedRoute>
),
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Settings" description="Manage your profile, appearance, and society preferences." />

      <SectionCard title="Profile" description="Your account information">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-chart-5 text-primary-foreground grid place-items-center text-xl font-semibold">
            {currentUser.avatar}
          </div>
          <div>
            <div className="font-medium">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground">{currentUser.role} · Unit {currentUser.unit}</div>
            <Button size="sm" variant="outline" className="mt-2">Change photo</Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" defaultValue={currentUser.name} />
          <Field label="Email" defaultValue={currentUser.email} />
          <Field label="Phone" defaultValue="+91 98765 43210" />
          <Field label="Unit" defaultValue={currentUser.unit} />
        </div>
        <div className="flex justify-end mt-4"><Button>Save changes</Button></div>
      </SectionCard>

      <SectionCard title="Appearance" description="Theme and display preferences">
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard active={theme === "light"} onClick={() => setTheme("light")} icon={Sun} label="Light" />
          <ThemeCard active={theme === "dark"} onClick={() => setTheme("dark")} icon={Moon} label="Dark" />
        </div>
      </SectionCard>

      <SectionCard title="Notifications" description="Choose what you want to hear about">
        <div className="space-y-1">
          <Toggle icon={Bell} title="Visitor approvals" desc="Notify me when a visitor requests entry" defaultChecked />
          <Toggle icon={Shield} title="Security alerts" desc="Violations, unauthorized vehicles" defaultChecked />
          <Toggle icon={User} title="Slot reminders" desc="When my parking session is ending" defaultChecked />
          <Toggle icon={Building2} title="Society announcements" desc="Maintenance, events, billing" />
        </div>
      </SectionCard>

      <SectionCard title="Society" description="Greenwood Heights admin settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Society Name" defaultValue={society.name} />
          <Field label="Total Blocks" defaultValue="4" />
          <Field label="Total Slots" defaultValue="320" />
          <Field label="Visitor Slot Limit" defaultValue="20" />
        </div>
      </SectionCard>

      <div className="flex justify-between items-center p-4 rounded-xl border border-destructive/30 bg-destructive/5">
        <div>
          <div className="font-medium text-sm">Sign out everywhere</div>
          <div className="text-xs text-muted-foreground">End all active sessions on this account.</div>
        </div>
        <Button variant="destructive">Sign out</Button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}

function Toggle({ icon: Icon, title, desc, defaultChecked }: any) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><Icon className="h-4 w-4" /></div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function ThemeCard({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all hover:shadow-soft",
        active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{label}</span>
        {active && <span className="ml-auto text-xs text-primary font-medium">Active</span>}
      </div>
      <div className={cn(
        "mt-3 h-16 rounded-lg border flex items-center justify-center text-xs",
        label === "Light" ? "bg-white text-zinc-700 border-zinc-200" : "bg-zinc-900 text-zinc-200 border-zinc-700"
      )}>
        Aa
      </div>
    </button>
  );
}
