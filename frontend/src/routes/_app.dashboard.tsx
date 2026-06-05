import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Car,
  Users,
  Bell,
  Sparkles,
  ParkingCircle,
  Clock,
  Plus,
  MapPin,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import ProtectedRoute from "../components/ProtectedRoute";

import {
  getResidentDashboard,
  inviteVisitor,
} from "@/services/residentService";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [{ title: "Resident Dashboard — Parkora AI" }],
  }),

  component: () => (
    <ProtectedRoute roles={["admin", "resident"]}>
      <ResidentDashboard />
    </ProtectedRoute>
  ),
});

function ResidentDashboard() {
  const [data, setData] = useState<any>(null);

  const [inviteOpen, setInviteOpen] = useState(false);

  const [visitorForm, setVisitorForm] = useState({
    visitorName: "",
    phone: "",
    vehicleNumber: "",
    purpose: "Guest Visit",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const dashboard = await getResidentDashboard();
    setData(dashboard);
  };

  const submitVisitor = async () => {
    const data = await inviteVisitor(visitorForm);

    if (data.success) {
      alert(`Visitor invited.\nSlot: ${data.allottedSlot.slotNumber}`);

      setInviteOpen(false);

      setVisitorForm({
        visitorName: "",
        phone: "",
        vehicleNumber: "",
        purpose: "Guest Visit",
      });

      loadDashboard();
    } else {
      alert(data.message || "Failed to invite visitor");
    }
  };

  const user = data?.user;
  const vehicles = data?.vehicles || [];
  const visitors = data?.visitors || [];
  const slots = data?.assignedSlots || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || ""} 👋`}
        description="Resident Dashboard"
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Invite Visitor
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Slots"
          value={slots.length}
          icon={ParkingCircle}
          tone="success"
        />

        <StatCard
          label="My Vehicles"
          value={vehicles.length}
          icon={Car}
          tone="info"
        />

        <StatCard
          label="Active Vehicles"
          value={data?.activeVehicles || 0}
          icon={Clock}
        />

        <StatCard
          label="Visitors"
          value={visitors.length}
          icon={Users}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="My Vehicles" description="Registered Vehicles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No vehicles found
                </div>
              ) : (
                vehicles.map((v: any) => (
                  <div key={v._id} className="rounded-xl border p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold capitalize">
                          {v.vehicleType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.vehicleNumber}
                        </div>
                      </div>

                      <Badge>{v.exitTime ? "Exited" : "Parked"}</Badge>
                    </div>

                    <div className="mt-4">
                      <div className="font-mono">{v.vehicleNumber}</div>

                      <div className="text-xs flex gap-1 mt-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Slot {v.slot?.slotNumber || "N/A"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Recent Visitors" description="Visitor History">
            <div className="space-y-2">
              {visitors.length === 0 ? (
                <div className="text-sm text-muted-foreground">No visitors</div>
              ) : (
                visitors.map((v: any) => (
                  <div key={v._id} className="rounded-lg border p-3">
                    <div className="font-medium">{v.visitorName || "Visitor"}</div>

                    <div className="text-xs text-muted-foreground">
                      Vehicle: {v.vehicleNumber}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Status: {v.status}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-xs uppercase text-muted-foreground">
                Resident Info
              </div>

              <div className="mt-3 text-2xl font-semibold">{user?.name}</div>

              <div className="mt-2 text-sm text-muted-foreground">
                {user?.email}
              </div>

              <div className="mt-6">
                <Badge className="capitalize">{user?.role}</Badge>
              </div>
            </CardContent>
          </Card>

          <SectionCard
            title="Assigned Slots"
            actions={<Bell className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {slots.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No assigned slots
                </div>
              ) : (
                slots.map((s: any) => (
                  <div key={s._id} className="rounded-lg border p-3">
                    <div className="font-medium">{s.slotNumber}</div>

                    <div className="text-xs text-muted-foreground">
                      Tower {s.tower} · Floor {s.floor}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <QuickAction
            icon={Users}
            title="Invite Visitor"
            desc="Create visitor pass"
            onClick={() => setInviteOpen(true)}
          />

          <QuickAction
            icon={Sparkles}
            title="AI Insights"
            desc="View analytics"
            to="/ai-insights"
          />
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Visitor</DialogTitle>
            <DialogDescription>
              Send a visitor request to the guard and auto-allot a visitor slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Visitor Name"
              value={visitorForm.visitorName}
              onChange={(e) =>
                setVisitorForm({
                  ...visitorForm,
                  visitorName: e.target.value,
                })
              }
            />

            <Input
              placeholder="Phone"
              value={visitorForm.phone}
              onChange={(e) =>
                setVisitorForm({
                  ...visitorForm,
                  phone: e.target.value,
                })
              }
            />

            <Input
              placeholder="Vehicle Number"
              value={visitorForm.vehicleNumber}
              onChange={(e) =>
                setVisitorForm({
                  ...visitorForm,
                  vehicleNumber: e.target.value,
                })
              }
            />

            <Input
              placeholder="Purpose"
              value={visitorForm.purpose}
              onChange={(e) =>
                setVisitorForm({
                  ...visitorForm,
                  purpose: e.target.value,
                })
              }
            />

            <Button className="w-full" onClick={submitVisitor}>
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  to,
  onClick,
}: any) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="rounded-xl border p-4 block text-left w-full hover:border-primary hover:shadow-card transition-all bg-card"
      >
        <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>

        <div className="mt-3 font-medium">{title}</div>

        <div className="text-xs text-muted-foreground">{desc}</div>
      </button>
    );
  }

  return (
    <Link
      to={to}
      className="rounded-xl border p-4 block hover:border-primary hover:shadow-card transition-all bg-card"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>

      <div className="mt-3 font-medium">{title}</div>

      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}