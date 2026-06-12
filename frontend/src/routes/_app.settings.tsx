import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon, Bell, User, Building2, Shield } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/section";
import { InlineNotice } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  getSettings,
  updateProfile,
  updateSocietySettings,
} from "@/services/settingsService";
import { getAuthToken } from "@/services/authHeaders";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings - Parkora AI" }] }),
  component: () => (
    <ProtectedRoute roles={["admin", "guard", "resident"]}>
      <SettingsPage view="overview" />
    </ProtectedRoute>
  ),
});

export type SettingsView = "overview" | "profile" | "appearance" | "notifications" | "society";

const settingsViewMeta: Record<SettingsView, { title: string; description: string }> = {
  overview: {
    title: "Settings",
    description: "Open a focused settings page from the sidebar.",
  },
  profile: {
    title: "Profile Settings",
    description: "Manage your account information.",
  },
  appearance: {
    title: "Appearance Settings",
    description: "Choose your dashboard theme.",
  },
  notifications: {
    title: "Notification Settings",
    description: "Choose what you want to hear about.",
  },
  society: {
    title: "Society Settings",
    description: "Admin-controlled society and parking rules.",
  },
};

export function SettingsPage({ view = "overview" }: { view?: SettingsView }) {
  const { theme, setTheme } = useTheme();
  const { user: authUser, login, logout } = useAuth();

  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    flat: "",
    block: "",
    role: "",
  });
  const [society, setSociety] = useState({
    societyName: "",
    totalBlocks: 4,
    totalSlots: 0,
    visitorSlotLimit: 20,
    visitorFallbackEnabled: true,
    notifications: {
      visitorApprovals: true,
      securityAlerts: true,
      slotReminders: true,
      societyAnnouncements: false,
    },
  });

  const isAdmin = authUser?.role === "admin";

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();

    if (data.success) {
      setProfile({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        flat: data.user?.flat || "",
        block: data.user?.block || "",
        role: data.user?.role || "",
      });
      setSociety(data.settings);
    }
  };

  const saveProfile = async () => {
    const data = await updateProfile(profile);

    if (data.success) {
      setMessage("Profile saved");
      login({ token: getAuthToken(), user: data.user });
    } else {
      setMessage(data.message || "Profile update failed");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const saveSociety = async () => {
    const data = await updateSocietySettings(society);

    if (data.success) {
      setMessage("Society settings saved");
      setSociety({ ...society, ...data.settings });
    } else {
      setMessage(data.message || "Settings update failed");
    }
  };

  const updateNotification = (key: string, value: boolean) => {
    setSociety({
      ...society,
      notifications: {
        ...society.notifications,
        [key]: value,
      },
    });
  };
  const currentView = settingsViewMeta[view] ? view : "overview";

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={settingsViewMeta[currentView].title}
        description={settingsViewMeta[currentView].description}
      />

      {message && (
        <InlineNotice
          tone={message.toLowerCase().includes("failed") ? "destructive" : "success"}
          onDismiss={() => setMessage("")}
        >
          {message}
        </InlineNotice>
      )}

      {currentView === "overview" && (
        <SectionCard title="Settings Pages" description="Use these pages to manage one category at a time.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <QuickPage to="/settings/profile" title="Profile" desc="Name, phone and flat ID." />
            <QuickPage to="/settings/appearance" title="Appearance" desc="Theme and display preferences." />
            <QuickPage to="/settings/notifications" title="Notifications" desc="Visitor and security alerts." />
            <QuickPage to="/settings/society" title="Society" desc="Parking rules and fallback behavior." />
          </div>
        </SectionCard>
      )}

      {currentView === "profile" && <div id="profile" className="scroll-mt-24">
      <SectionCard title="Profile" description="Your account information">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground grid place-items-center text-xl font-semibold">
            {profile.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <div className="font-medium">{profile.name || "User"}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {profile.role} · Flat {profile.flat || "Not assigned"}
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Field
            label="Full Name"
            value={profile.name}
            onChange={(value) => setProfile({ ...profile, name: value })}
          />
          <Field label="Email" value={profile.email} disabled />
          <Field
            label="Phone"
            placeholder="Enter phone number"
            value={profile.phone}
            onChange={(value) => setProfile({ ...profile, phone: value })}
          />
          <Field
            label="Flat ID"
            placeholder="Enter flat ID, e.g. N22A"
            value={profile.flat}
            onChange={(value) =>
              setProfile({ ...profile, flat: value.toUpperCase() })
            }
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={saveProfile}>Save changes</Button>
        </div>
      </SectionCard>
      </div>}

      {currentView === "appearance" && <div id="appearance" className="scroll-mt-24">
      <SectionCard title="Appearance" description="Theme and display preferences">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <ThemeCard
            active={theme === "light"}
            onClick={() => setTheme("light")}
            icon={Sun}
            label="Light"
          />
          <ThemeCard
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            icon={Moon}
            label="Dark"
          />
        </div>
      </SectionCard>
      </div>}

      {currentView === "notifications" && <div id="notifications" className="scroll-mt-24">
      <SectionCard title="Notifications" description="Choose what you want to hear about">
        <div className="space-y-1">
          <Toggle
            icon={Bell}
            title="Visitor approvals"
            desc="Notify me when a visitor requests entry"
            checked={society.notifications.visitorApprovals}
            onCheckedChange={(checked: boolean) =>
              updateNotification("visitorApprovals", checked)
            }
          />
          <Toggle
            icon={Shield}
            title="Security alerts"
            desc="Violations and unauthorized vehicles"
            checked={society.notifications.securityAlerts}
            onCheckedChange={(checked: boolean) =>
              updateNotification("securityAlerts", checked)
            }
          />
          <Toggle
            icon={User}
            title="Slot reminders"
            desc="Parking session and allocation updates"
            checked={society.notifications.slotReminders}
            onCheckedChange={(checked: boolean) =>
              updateNotification("slotReminders", checked)
            }
          />
          <Toggle
            icon={Building2}
            title="Society announcements"
            desc="Maintenance, events, and billing"
            checked={society.notifications.societyAnnouncements}
            onCheckedChange={(checked: boolean) =>
              updateNotification("societyAnnouncements", checked)
            }
          />
        </div>
        {isAdmin && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={saveSociety}>
              Save notification settings
            </Button>
          </div>
        )}
      </SectionCard>
      </div>}

      {currentView === "society" && <div id="society" className="scroll-mt-24">
      <SectionCard title="Society" description="Admin-controlled society settings">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Field
            label="Society Name"
            value={society.societyName}
            disabled={!isAdmin}
            onChange={(value) => setSociety({ ...society, societyName: value })}
          />
          <Field label="Total Blocks" value={String(society.totalBlocks)} disabled />
          <Field label="Total Slots" value={String(society.totalSlots)} disabled />
          <Field
            label="Visitor Slot Limit"
            value={String(society.visitorSlotLimit)}
            disabled={!isAdmin}
            onChange={(value) =>
              setSociety({ ...society, visitorSlotLimit: Number(value) })
            }
          />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Resident fallback parking</div>
            <div className="text-xs text-muted-foreground">
              Use unhandover resident parking when visitor slots are full.
            </div>
          </div>
          <Switch
            checked={society.visitorFallbackEnabled}
            disabled={!isAdmin}
            onCheckedChange={(checked) =>
              setSociety({ ...society, visitorFallbackEnabled: checked })
            }
          />
        </div>
        {isAdmin && (
          <div className="flex justify-end mt-4">
            <Button onClick={saveSociety}>Save society settings</Button>
          </div>
        )}
      </SectionCard>
      </div>}

      <div className="flex justify-between items-center p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <div>
          <div className="font-medium text-sm">Sign out</div>
          <div className="text-xs text-muted-foreground">
            End this active session.
          </div>
        </div>
        <Button variant="destructive" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

function QuickPage({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-4 hover:border-primary hover:shadow-card transition-all">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

function Toggle({ icon: Icon, title, desc, checked, onCheckedChange }: any) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ThemeCard({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 text-left transition-all hover:shadow-soft",
        active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{label}</span>
        {active && (
          <span className="ml-auto text-xs text-primary font-medium">Active</span>
        )}
      </div>
      <div
        className={cn(
          "mt-3 h-16 rounded-lg border flex items-center justify-center text-xs",
          label === "Light"
            ? "bg-white text-zinc-700 border-zinc-200"
            : "bg-zinc-900 text-zinc-200 border-zinc-700"
        )}
      >
        Aa
      </div>
    </button>
  );
}
