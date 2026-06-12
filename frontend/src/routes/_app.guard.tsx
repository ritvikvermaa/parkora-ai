import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  LogIn,
  LogOut,
  Search,
  Car,
  Clock,
  Send,
  ParkingCircle,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EmptyState,
  FieldHint,
  InlineNotice,
  StatusPill,
} from "@/components/dashboard-ui";
import { DashboardNotificationsFeed } from "@/components/notifications";
import { parseFlatId, SOCIETY_BLOCKS } from "@/lib/society";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getActiveVehicles,
  vehicleEntry,
  vehicleExit,
} from "@/services/vehicleService";

import { getAvailableSlots } from "@/services/slotService";

import ProtectedRoute from "../components/ProtectedRoute";

export const Route = createFileRoute("/_app/guard")({
  head: () => ({
    meta: [{ title: "Guard Dashboard — Parkora AI" }],
  }),

  component: () => (
    <ProtectedRoute roles={["guard", "admin"]}>
      <GuardDashboard view="overview" />
    </ProtectedRoute>
  ),
});

export type GuardView =
  | "overview"
  | "entry"
  | "exit"
  | "search"
  | "visitors"
  | "residents";

const guardViewMeta: Record<GuardView, { title: string; description: string }> = {
  overview: {
    title: "Guard Dashboard",
    description: "Gate operations summary and quick access to guard workflows.",
  },
  entry: {
    title: "Visitor Entry Request",
    description: "Create flat-specific visitor requests for resident approval.",
  },
  exit: {
    title: "Visitor Exit",
    description: "Release visitor parking without exposing resident vehicle controls.",
  },
  search: {
    title: "Quick Vehicle Search",
    description: "Find active vehicles by plate or owner.",
  },
  visitors: {
    title: "Visitor Vehicles",
    description: "Active visitor vehicles with exit controls.",
  },
  residents: {
    title: "Resident Vehicles",
    description: "Resident-owned vehicles shown read-only for guards.",
  },
};

export function GuardDashboard({ view = "overview" }: { view?: GuardView }) {
  const [query, setQuery] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "destructive" | "info";
    title: string;
    body: string;
  } | null>(null);

  const [entry, setEntry] = useState({
    ownerName: "",
    phone: "",
    vehicleNumber: "",
    vehicleType: "car",
    block: "",
    flat: "",
    purpose: "Guest Visit",
  });

  const [exitPlate, setExitPlate] = useState("");

  const loadVehicles = async () => {
    const data = await getActiveVehicles();
    setVehicles(data.vehicles || []);
  };

  const loadAvailableSlots = async () => {
    const slots = await getAvailableSlots();
    setAvailableSlots(slots || []);
  };

  const loadAll = async () => {
    await loadVehicles();
    await loadAvailableSlots();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredActive = vehicles.filter(
    (v) =>
      v.vehicleNumber?.toLowerCase().includes(query.toLowerCase()) ||
      v.number?.toLowerCase().includes(query.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(query.toLowerCase())
  );
  const getVehicleCategory = (vehicle: any) =>
    vehicle.parkingCategory ||
    (vehicle.manufacturer === "Visitor" ? "visitor" : "resident");
  const visitorVehicles = vehicles.filter(
    (vehicle) => getVehicleCategory(vehicle) === "visitor"
  );
  const residentVehicles = vehicles.filter(
    (vehicle) => getVehicleCategory(vehicle) === "resident"
  );
  const parsedFlat = parseFlatId(entry.flat);

  const handleFlatChange = (value: string) => {
    const nextFlat = value.toUpperCase();
    const parsed = parseFlatId(nextFlat);

    setEntry({
      ...entry,
      flat: nextFlat,
      block: parsed.block || entry.block,
    });
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await vehicleEntry(entry);

    if (data.success) {
      setMessage({
        tone: "success",
        title: "Request sent",
        body: "The visitor entry request is waiting for resident approval.",
      });

      setEntry({
        ownerName: "",
        phone: "",
        vehicleNumber: "",
        vehicleType: "car",
        block: "",
        flat: "",
        purpose: "Guest Visit",
      });

      await loadAll();
    } else {
      setMessage({
        tone: "destructive",
        title: "Entry request failed",
        body: data.message || data.error || "Entry failed.",
      });
    }
  };

  const handleExit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await vehicleExit(exitPlate);

    if (data.success) {
      setMessage({
        tone: "success",
        title: "Visitor exit logged",
        body: "The visitor parking slot has been released.",
      });
      setExitPlate("");

      await loadAll();
    } else {
      setMessage({
        tone: "warning",
        title: "Exit could not be logged",
        body: data.message || "Exit failed.",
      });
    }
  };

  const handleQuickExit = async (vehicleNumber: string) => {
    const data = await vehicleExit(vehicleNumber);

    if (data.success) {
      setMessage({
        tone: "success",
        title: "Visitor exit logged",
        body: "The visitor parking slot has been released.",
      });
      await loadAll();
    } else {
      setMessage({
        tone: "warning",
        title: "Exit could not be logged",
        body: data.message || "Exit failed.",
      });
    }
  };
  const currentView = guardViewMeta[view] ? view : "overview";

  return (
    <div className="space-y-6">
      <PageHeader
        title={guardViewMeta[currentView].title}
        description={guardViewMeta[currentView].description}
      />

      {message && (
        <InlineNotice
          tone={message.tone}
          title={message.title}
          onDismiss={() => setMessage(null)}
        >
          {message.body}
        </InlineNotice>
      )}

      {currentView === "overview" && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Entries Today"
          value={vehicles.length}
          icon={LogIn}
          tone="info"
        />

        <StatCard
          label="Approval Flow"
          value="Resident"
          icon={Send}
          tone="warning"
        />

        <StatCard
          label="Currently Parked"
          value={vehicles.length}
          icon={Car}
          tone="default"
        />

        <StatCard
          label="Available Slots"
          value={availableSlots.length}
          icon={Clock}
          tone="success"
        />
      </div>}

      {currentView === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6">
          <SectionCard title="Guard Pages" description="Open a focused workflow from the sidebar.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <QuickPage to="/guard/entry" title="Entry Request" desc="Send resident approval requests." />
              <QuickPage to="/guard/visitors" title="Visitor Vehicles" desc="Manage visitor exits." />
              <QuickPage to="/guard/search" title="Quick Search" desc="Find active vehicles." />
            </div>
          </SectionCard>

          <DashboardNotificationsFeed />
        </div>
      )}

      {["entry", "exit", "search"].includes(currentView) && (
      <div className="grid grid-cols-1 gap-6 max-w-7xl">
        {currentView === "entry" && (
        <div id="entry-request" className="scroll-mt-24">
        <SectionCard
          title="Visitor Entry Request"
          description="Specify the flat so the resident can approve entry"
          contentClassName="pt-0"
        >
          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" onSubmit={handleEntry}>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Visitor name</Label>
              <Input
                placeholder="Enter visitor name"
                value={entry.ownerName}
                onChange={(e) =>
                  setEntry({ ...entry, ownerName: e.target.value })
                }
                required
              />
            </div>

              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  placeholder="Enter phone number"
                  value={entry.phone}
                  onChange={(e) =>
                    setEntry({ ...entry, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Vehicle number</Label>
                <Input
                  placeholder="Enter plate number"
                  value={entry.vehicleNumber}
                  onChange={(e) =>
                    setEntry({ ...entry, vehicleNumber: e.target.value.toUpperCase() })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Flat ID</Label>
                <Input
                  placeholder="Enter flat ID, e.g. N22A"
                  value={entry.flat}
                  onChange={(e) => handleFlatChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Block</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={entry.block}
                  onChange={(e) => setEntry({ ...entry, block: e.target.value })}
                >
                  <option value="">Infer from flat ID</option>
                  {SOCIETY_BLOCKS.map((block) => (
                    <option key={block.name} value={block.name}>
                      {block.name} ({block.code})
                    </option>
                  ))}
                </select>
              </div>

            <div className="md:col-span-2 xl:col-span-4">
            <FieldHint>
              {entry.flat && parsedFlat.isValid
                ? `${parsedFlat.normalized}: ${parsedFlat.block || entry.block || "block inferred by backend"}, tower ${parsedFlat.tower}, ${parsedFlat.floorLabel}.`
                : "Resident approval is required. Parking is allocated only after approval."}
            </FieldHint>
            </div>

              <div className="space-y-1.5">
                <Label>Vehicle type</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={entry.vehicleType}
                  onChange={(e) =>
                    setEntry({ ...entry, vehicleType: e.target.value })
                  }
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="ev">EV</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5 xl:col-span-2">
                <Label>Purpose</Label>
                <Input
                  placeholder="Enter visit purpose"
                  value={entry.purpose}
                  onChange={(e) =>
                    setEntry({ ...entry, purpose: e.target.value })
                  }
                />
              </div>

            <Button type="submit" className="w-full md:col-span-2 xl:col-span-4">
              <Send className="h-4 w-4 mr-1" />
              Send for Approval
            </Button>
          </form>
        </SectionCard>
        </div>
        )}

        {currentView === "exit" && (
        <div id="visitor-exit" className="scroll-mt-24">
        <SectionCard title="Visitor Exit" description="Guards can release visitor parking only">
          <form className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px_auto] gap-4 items-end" onSubmit={handleExit}>
            <div className="space-y-1.5">
              <Label>Visitor vehicle number</Label>
            <Input
              placeholder="Enter visitor vehicle number"
              value={exitPlate}
              onChange={(e) => setExitPlate(e.target.value)}
              required
            />
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action</span>
                <span className="font-medium">Release visitor slot</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">Ready</span>
              </div>
            </div>

            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-1" />
              Log Visitor Exit
            </Button>
          </form>
        </SectionCard>
        </div>
        )}

        {currentView === "search" && (
        <div id="quick-search" className="scroll-mt-24">
        <SectionCard title="Quick Search" description="Find a vehicle by plate or owner">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicle…"
              className="pl-9 h-11"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredActive.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                icon={Search}
                title="No matching vehicles"
                description="Search by plate number or owner name to find active parking sessions."
              />
              </div>
            ) : (
              filteredActive.map((v) => (
                <div
                  key={v._id}
                  className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-semibold">
                      {v.vehicleNumber || v.number}
                    </div>

                    <StatusPill status={v.vehicleType || v.type || "active"} />
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    {v.ownerName || "Visitor"} · Slot {v.slot?.slotNumber || "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
        </div>
        )}
      </div>
      )}

      {currentView === "visitors" && (
        <div id="visitor-vehicles" className="scroll-mt-24">
          <SectionCard
            title="Active Visitor Vehicles"
            description={`${visitorVehicles.length} visitor vehicles currently parked`}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>

                  <TableBody>
                  {visitorVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={ParkingCircle}
                          title="No visitor vehicles parked"
                          description="Approved visitor vehicles will appear here with guard exit controls."
                        />
                      </TableCell>
                    </TableRow>
                  ) : visitorVehicles.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="font-mono font-medium">
                        {v.vehicleNumber || v.number}
                      </TableCell>

                      <TableCell>{v.ownerName || "-"}</TableCell>

                      <TableCell>{v.slot?.slotNumber || "-"}</TableCell>

                      <TableCell>
                        <StatusPill status={v.vehicleType || v.type || "visitor"} />
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {v.entryTime
                          ? new Date(v.entryTime).toLocaleString()
                          : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuickExit(v.vehicleNumber || v.number)}
                        >
                          Mark Exit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </div>
      )}

      {currentView === "residents" && (
        <div id="resident-vehicles" className="scroll-mt-24">
          <SectionCard
            title="Resident Vehicles"
            description={`${residentVehicles.length} resident-owned vehicles currently parked`}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {residentVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={Car}
                          title="No resident vehicles parked"
                          description="Resident-owned vehicles are shown read-only for guards."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    residentVehicles.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell className="font-mono font-medium">
                          {v.vehicleNumber || v.number}
                        </TableCell>
                        <TableCell>{v.ownerName || "-"}</TableCell>
                        <TableCell>{v.flat || "-"}</TableCell>
                        <TableCell>{v.slot?.slotNumber || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {v.entryTime ? new Date(v.entryTime).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          <StatusPill status="resident managed" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </div>
      )}
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
