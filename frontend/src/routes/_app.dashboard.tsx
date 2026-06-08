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
      <ResidentDashboard />
    </ProtectedRoute>
  ),
});

function ResidentDashboard() {
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

  const submitVisitor = async () => {
    const data = await inviteVisitor(visitorForm);

    if (data.success) {
      setNotice({
        title: "Visitor parking allocated",
        description: `${visitorForm.visitorName} has been allotted slot ${data.allottedSlot.slotNumber}.`,
        tone: "success",
      });

      setInviteOpen(false);

      setVisitorForm({
        visitorName: "",
        phone: "",
        vehicleNumber: "",
        purpose: "Guest Visit",
      });

      loadDashboard();
    } else {
      setNotice({
        title: "Invite could not be completed",
        description: data.message || "Failed to invite visitor",
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
        title={`Welcome back, ${user?.name?.split(" ")[0] || ""}`}
        description="Resident Dashboard"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div id="resident-vehicles" className="scroll-mt-24">
          <SectionCard title="Resident Vehicles" description="Your registered vehicles and assigned parking">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {residentVehicles.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No resident vehicles found
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
                        <Badge>{v.exitTime ? "Exited" : "Parked"}</Badge>
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

          <div id="visitor-vehicles" className="scroll-mt-24">
          <SectionCard title="Visitor Vehicles" description="Approved visitor vehicles currently linked to your flat">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visitorVehicles.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No visitor vehicles are parked
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
                      <Badge variant="secondary">Parked</Badge>
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

          <div id="visitor-history" className="scroll-mt-24">
          <SectionCard title="Recent Visitors" description="Visitor History">
            <div className="space-y-2">
              {visitors.length === 0 ? (
                <div className="text-sm text-muted-foreground">No visitors</div>
              ) : (
                visitors.map((v: any) => (
                  <div key={v._id} className="rounded-lg border p-3">
                    <div className="font-medium">
                      {v.visitorName || "Visitor"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Vehicle: {v.vehicleNumber}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Status: {formatVisitorStatus(v.status)}
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

          <div id="entry-requests" className="scroll-mt-24">
          <SectionCard
            title="Entry Requests"
            description={`${pendingVisitors.length} waiting for your approval`}
          >
            <div className="space-y-3">
              {pendingVisitors.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No pending entry requests
                </div>
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

          <div id="assigned-slots" className="scroll-mt-24">
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
          </div>

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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Visitor</DialogTitle>
            <DialogDescription>
              A parking slot is allocated automatically as soon as the invite is created.
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
            <Input value={user?.name || ""} disabled />

            <Input
              placeholder="Vehicle Number"
              value={vehicleForm.vehicleNumber}
              onChange={(e) =>
                setVehicleForm({
                  ...vehicleForm,
                  vehicleNumber: e.target.value,
                })
              }
            />

            <Input
              placeholder="Manufacturer"
              value={vehicleForm.manufacturer}
              onChange={(e) =>
                setVehicleForm({
                  ...vehicleForm,
                  manufacturer: e.target.value,
                })
              }
            />

            <Input
              placeholder="Model"
              value={vehicleForm.model}
              onChange={(e) =>
                setVehicleForm({
                  ...vehicleForm,
                  model: e.target.value,
                })
              }
            />

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

            <Input
              placeholder="Flat Number"
              value={user?.flat || vehicleForm.flat}
              disabled={!!user?.flat}
              onChange={(e) =>
                setVehicleForm({
                  ...vehicleForm,
                  flat: e.target.value,
                })
              }
            />

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

function formatVisitorStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending approval",
    approved: "Parking allotted",
    parking_unavailable: "Parking could not be allotted",
    rejected: "Rejected",
    exited: "Exited",
  };

  return labels[status] || status;
}

function QuickAction({ icon: Icon, title, desc, to, onClick }: any) {
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
