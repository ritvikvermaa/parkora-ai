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
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EmptyState,
  FieldHint,
  StatusPill,
} from "@/components/dashboard-ui";
import { DashboardNotificationsFeed } from "@/components/notifications";

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

import { addResidentVehicle, removeResidentVehicle } from "@/services/vehicleService";
import {
  getPendingVisitors,
  approveVisitor,
} from "@/services/visitorService";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [{ title: "Resident Dashboard — Parkora AI" }],
  }),

  component: () => (
    <ProtectedRoute roles={["admin", "resident"]}>
      <ResidentDashboard view="overview" />
    </ProtectedRoute>
  ),
});

export type ResidentView =
  | "overview"
  | "vehicles"
  | "visitors"
  | "requests"
  | "history"
  | "slots";

const residentViewMeta: Record<ResidentView, { title: string; description: string }> = {
  overview: {
    title: "Resident Dashboard",
    description: "Your parking, visitors and resident actions at a glance.",
  },
  vehicles: {
    title: "My Vehicles",
    description: "Resident-owned vehicles and assigned parking.",
  },
  visitors: {
    title: "Visitor Vehicles",
    description: "Approved visitor vehicles currently linked to your flat.",
  },
  requests: {
    title: "Entry Requests",
    description: "Guard-created visitor requests waiting for approval.",
  },
  history: {
    title: "Visitor History",
    description: "Recent visitor activity for your flat.",
  },
  slots: {
    title: "Assigned Slots",
    description: "Reserved and occupied slots linked to your flat.",
  },
};

export function ResidentDashboard({ view = "overview" }: { view?: ResidentView }) {
  const [data, setData] = useState<any>(null);
  const [pendingVisitors, setPendingVisitors] = useState<any[]>([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicleToRemove, setVehicleToRemove] = useState<any>(null);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
    tone: "success" | "warning";
  } | null>(null);

  const [visitorForm, setVisitorForm] = useState({
    visitorName: "",
    phone: "",
    vehicleNumber: "",
    purpose: "Guest Visit",
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "",
    vehicleType: "car",
    manufacturer: "",
    model: "",
    flat: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const dashboard = await getResidentDashboard();
    const pending = await getPendingVisitors();
    setData(dashboard);
    setPendingVisitors(pending.visitors || []);
  };

  const user = data?.user;
  const vehicles = data?.vehicles || [];
  const residentVehicles = vehicles.filter(
    (vehicle: any) =>
      (vehicle.parkingCategory ||
        (vehicle.manufacturer === "Visitor" ? "visitor" : "resident")) ===
      "resident"
  );
  const visitorVehicles = vehicles.filter(
    (vehicle: any) =>
      (vehicle.parkingCategory ||
        (vehicle.manufacturer === "Visitor" ? "visitor" : "resident")) ===
      "visitor"
  );
  const visitors = data?.visitors || [];
  const slots = data?.assignedSlots || [];
  const currentView = residentViewMeta[view] ? view : "overview";

  const submitVisitor = async () => {
    const data = await inviteVisitor(visitorForm);

    if (data.success) {
      setNotice(
        data.parkingUnavailable
          ? {
              title: "Parking could not be allotted",
              description:
                "The visitor invite was recorded. It will remain visible with parking unavailable status.",
              tone: "warning",
            }
          : {
              title: "Visitor parking allocated",
              description: `${visitorForm.visitorName} has been allotted slot ${data.allottedSlot?.slotNumber || "N/A"}.`,
              tone: "success",
            }
      );

      setInviteOpen(false);

      setVisitorForm({
        visitorName: "",
        phone: "",
        vehicleNumber: "",
        purpose: "Guest Visit",
      });

      loadDashboard();
    } else {
      const accessMessage =
        data.statusCode === 403 || data.message === "Access denied"
          ? "This tab is using a non-resident account token. Sign in as the resident in this tab, then try again."
          : data.message || "Failed to invite visitor";

      setNotice({
        title: "Invite could not be completed",
        description: accessMessage,
        tone: "warning",
      });
    }
  };

  const handleVisitorApproval = async (id: string) => {
    const res = await approveVisitor(id);

    if (res.success) {
      setNotice(
        res.parkingUnavailable
          ? {
              title: "Parking could not be allotted",
              description:
                "The request was updated. No visitor or fallback parking is available right now.",
              tone: "warning",
            }
          : {
              title: "Visitor approved",
              description: `Parking allocated at slot ${res.slot?.slotNumber || "N/A"}.`,
              tone: "success",
            }
      );
      loadDashboard();
    } else {
      setNotice({
        title: "Request could not be updated",
        description: res.message || "Unable to update visitor request",
        tone: "warning",
      });
    }
  };

  const submitVehicle = async () => {
    const payload = {
      ...vehicleForm,
      ownerName: user?.name || "",
      flat: user?.flat || vehicleForm.flat,
    };

    const res = await addResidentVehicle(payload);

    if (res.success) {
      setNotice({
        title: "Vehicle added",
        description: `Parking allocated at slot ${res.slot?.slotNumber || "N/A"}.`,
        tone: "success",
      });

      setVehicleOpen(false);

      setVehicleForm({
        vehicleNumber: "",
        vehicleType: "car",
        manufacturer: "",
        model: "",
        flat: "",
      });

      loadDashboard();
    } else {
      setNotice({
        title: "Vehicle could not be added",
        description: res.message || "Failed to add vehicle",
        tone: "warning",
      });
    }
  };

  const handleRemoveVehicle = async () => {
    if (!vehicleToRemove) return;

    const res = await removeResidentVehicle(vehicleToRemove._id);

    if (res.success) {
      setNotice({
        title: "Vehicle removed",
        description: "The vehicle was removed and its parking slot was released.",
        tone: "success",
      });
      setVehicleToRemove(null);
      loadDashboard();
    } else {
      setNotice({
        title: "Vehicle could not be removed",
        description: res.message || "Failed to remove vehicle",
        tone: "warning",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          currentView === "overview"
            ? `Welcome back, ${user?.name?.split(" ")[0] || ""}`
            : residentViewMeta[currentView].title
        }
        description={residentViewMeta[currentView].description}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVehicleOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Vehicle
            </Button>

            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Invite Visitor
            </Button>
          </div>
        }
      />

      {currentView === "overview" && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Slots"
          value={slots.length}
          icon={ParkingCircle}
          tone="success"
        />

        <StatCard
          label="My Vehicles"
          value={residentVehicles.length}
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
          value={visitorVehicles.length || visitors.length}
          icon={Users}
          tone="warning"
        />
      </div>}

      {currentView === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              icon={Car}
              title="My Vehicles"
              desc="View and manage your own vehicles"
              to="/dashboard/vehicles"
            />
            <QuickAction
              icon={Users}
              title="Entry Requests"
              desc="Approve pending visitor requests"
              to="/dashboard/requests"
            />
            <QuickAction
              icon={ParkingCircle}
              title="Assigned Slots"
              desc="Review parking linked to your flat"
              to="/dashboard/slots"
            />
          </div>

          <DashboardNotificationsFeed />
        </div>
      )}

      {currentView !== "overview" && (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 max-w-7xl">
        <div className="space-y-6">
          {currentView === "vehicles" && (
          <div id="resident-vehicles" className="scroll-mt-24">
          <SectionCard title="Resident Vehicles" description="Your registered vehicles and assigned parking">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {residentVehicles.length === 0 ? (
                <div className="md:col-span-2 2xl:col-span-3">
                  <EmptyState
                    icon={Car}
                    title="No resident vehicles registered"
                    description="Add your own vehicle to allocate the flat-linked resident slot first."
                    action={
                      <Button size="sm" onClick={() => setVehicleOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Vehicle
                      </Button>
                    }
                  />
                </div>
              ) : (
                residentVehicles.map((v: any) => (
                  <div key={v._id} className="rounded-lg border p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold capitalize">
                          {v.manufacturer} {v.model}
                        </div>

                        <div className="text-xs text-muted-foreground capitalize">
                          {v.vehicleType}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill status={v.exitTime ? "exited" : "parked"} />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setVehicleToRemove(v)}
                          aria-label="Remove vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="font-mono">{v.vehicleNumber}</div>

                      <div className="text-xs flex gap-1 mt-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Slot {v.slot?.slotNumber || "N/A"}
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Flat {v.flat || "N/A"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
          </div>
          )}

          {currentView === "visitors" && (
          <div id="visitor-vehicles" className="scroll-mt-24">
          <SectionCard title="Visitor Vehicles" description="Approved visitor vehicles currently linked to your flat">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {visitorVehicles.length === 0 ? (
                <div className="md:col-span-2 2xl:col-span-3">
                  <EmptyState
                    icon={Users}
                    title="No visitor vehicles parked"
                    description="Approved visitor vehicles linked to your flat will appear here."
                    action={
                      <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Invite Visitor
                      </Button>
                    }
                  />
                </div>
              ) : (
                visitorVehicles.map((v: any) => (
                  <div key={v._id} className="rounded-lg border p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{v.ownerName || "Visitor"}</div>
                        <div className="text-xs text-muted-foreground">
                          Visitor vehicle
                        </div>
                      </div>
                      <StatusPill status="parked" />
                    </div>

                    <div className="mt-4">
                      <div className="font-mono">{v.vehicleNumber || v.number}</div>
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
          </div>
          )}

          {currentView === "history" && (
          <div id="visitor-history" className="scroll-mt-24">
          <SectionCard title="Recent Visitors" description="Visitor History">
            <div className="space-y-2">
              {visitors.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No visitor history yet"
                  description="Invited visitors and guard-approved entries will be listed here."
                />
              ) : (
                visitors.map((v: any) => (
                  <div key={v._id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">
                        {v.visitorName || "Visitor"}
                      </div>
                      <StatusPill status={v.status || "pending"} />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Vehicle: {v.vehicleNumber}
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
          )}

          {currentView === "requests" && (
          <div id="entry-requests" className="scroll-mt-24">
          <SectionCard
            title="Entry Requests"
            description={`${pendingVisitors.length} waiting for your approval`}
          >
            <div className="space-y-3">
              {pendingVisitors.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No pending entry requests"
                  description="Guard-created requests for your flat will appear here for approval."
                />
              ) : (
                pendingVisitors.map((visitor: any) => (
                  <div key={visitor._id} className="rounded-lg border p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="font-medium">{visitor.visitorName}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {visitor.vehicleNumber} · {visitor.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {visitor.purpose || "Guest Visit"}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVisitorApproval(visitor._id)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
          </div>
          )}

          {currentView === "slots" && (
          <div id="assigned-slots" className="scroll-mt-24">
          <SectionCard
            title="Assigned Slots"
            actions={<Bell className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {slots.length === 0 ? (
                <div className="md:col-span-2 2xl:col-span-3">
                <EmptyState
                  icon={ParkingCircle}
                  title="No assigned slots"
                  description="Reserved and occupied slots linked to your flat will appear here."
                />
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
          </div>
          )}
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

              <div className="mt-2 text-sm text-muted-foreground">
                Flat: {user?.flat || "Not assigned"}
              </div>

              <div className="mt-6">
                <Badge className="capitalize">{user?.role}</Badge>
              </div>
            </CardContent>
          </Card>

          <QuickAction
            icon={Users}
            title="Invite Visitor"
            desc="Create visitor pass"
            onClick={() => setInviteOpen(true)}
          />

          <QuickAction
            icon={Car}
            title="Add Vehicle"
            desc="Register vehicle"
            onClick={() => setVehicleOpen(true)}
          />

          <QuickAction
            icon={Sparkles}
            title="AI Insights"
            desc="View analytics"
            to="/ai-insights"
          />
        </div>
      </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Visitor</DialogTitle>
            <DialogDescription>
              A parking slot is allocated automatically as soon as the invite is created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Visitor name</Label>
              <Input
                placeholder="Enter visitor name"
                value={visitorForm.visitorName}
                onChange={(e) =>
                  setVisitorForm({
                    ...visitorForm,
                    visitorName: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  placeholder="Enter phone number"
                  value={visitorForm.phone}
                  onChange={(e) =>
                    setVisitorForm({
                      ...visitorForm,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Vehicle number</Label>
                <Input
                  placeholder="Enter plate number"
                  value={visitorForm.vehicleNumber}
                  onChange={(e) =>
                    setVisitorForm({
                      ...visitorForm,
                      vehicleNumber: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input
                placeholder="Enter visit purpose"
                value={visitorForm.purpose}
                onChange={(e) =>
                  setVisitorForm({
                    ...visitorForm,
                    purpose: e.target.value,
                  })
                }
              />
            </div>

            <FieldHint>
              Resident invites are approved immediately. Parking is allocated automatically when capacity exists.
            </FieldHint>

            <Button className="w-full" onClick={submitVisitor}>
              Invite and Allocate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>
              Owner name and flat number will be picked automatically from your
              resident profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Input value={user?.name || ""} disabled />
            </div>

            <div className="space-y-1.5">
              <Label>Vehicle number</Label>
              <Input
                placeholder="Enter plate number"
                value={vehicleForm.vehicleNumber}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    vehicleNumber: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Manufacturer</Label>
                <Input
                  placeholder="Enter manufacturer"
                  value={vehicleForm.manufacturer}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      manufacturer: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input
                  placeholder="Enter model"
                  value={vehicleForm.model}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      model: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={vehicleForm.vehicleType}
              onChange={(e) =>
                setVehicleForm({
                  ...vehicleForm,
                  vehicleType: e.target.value,
                })
              }
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="ev">EV</option>
              <option value="other">Other</option>
            </select>

            <div className="space-y-1.5">
              <Label>Flat ID</Label>
              <Input
                placeholder="Enter flat ID, e.g. N22A"
                value={user?.flat || vehicleForm.flat}
                disabled={!!user?.flat}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    flat: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <FieldHint>
              First vehicle uses the flat-linked slot. Additional vehicles use visitor or eligible fallback parking.
            </FieldHint>

            <Button className="w-full" onClick={submitVehicle}>
              Add Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!vehicleToRemove} onOpenChange={(open) => !open && setVehicleToRemove(null)}>
        <DialogContent>
          {vehicleToRemove && (
            <>
              <DialogHeader>
                <DialogTitle>Remove vehicle?</DialogTitle>
                <DialogDescription>
                  {vehicleToRemove.vehicleNumber || vehicleToRemove.number} will be removed from your resident vehicles and its parking slot will be released.
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setVehicleToRemove(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleRemoveVehicle}>
                  Remove Vehicle
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!notice} onOpenChange={(open) => !open && setNotice(null)}>
        <DialogContent>
          {notice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {notice.tone === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  )}
                  {notice.title}
                </DialogTitle>
                <DialogDescription>{notice.description}</DialogDescription>
              </DialogHeader>

              <Button onClick={() => setNotice(null)} className="w-full">
                Got it
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, to, onClick }: any) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="rounded-lg border p-4 block text-left w-full hover:border-primary hover:shadow-card transition-all bg-card"
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
      className="rounded-lg border p-4 block hover:border-primary hover:shadow-card transition-all bg-card"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>

      <div className="mt-3 font-medium">{title}</div>

      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
