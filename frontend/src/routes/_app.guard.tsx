import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  LogIn,
  LogOut,
  Search,
  Car,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  getActiveVehicles,
  vehicleEntry,
  vehicleExit,
} from "@/services/vehicleService";

import { getAvailableSlots } from "@/services/slotService";

import {
  getPendingVisitors,
  approveVisitor,
  rejectVisitor,
} from "@/services/visitorService";

import ProtectedRoute from "../components/ProtectedRoute";

export const Route = createFileRoute("/_app/guard")({
  head: () => ({
    meta: [{ title: "Guard Dashboard — Parkora AI" }],
  }),

  component: () => (
    <ProtectedRoute roles={["guard", "admin"]}>
      <GuardDashboard />
    </ProtectedRoute>
  ),
});

function GuardDashboard() {
  const [query, setQuery] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [pendingVisitors, setPendingVisitors] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const [entry, setEntry] = useState({
    ownerName: "",
    vehicleNumber: "",
    vehicleType: "car",
    slotId: "",
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

  const loadPendingVisitors = async () => {
    const data = await getPendingVisitors();
    setPendingVisitors(data.visitors || []);
  };

  const loadAll = async () => {
    await loadVehicles();
    await loadAvailableSlots();
    await loadPendingVisitors();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredActive = vehicles.filter(
    (v) =>
      v.vehicleNumber?.toLowerCase().includes(query.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(query.toLowerCase())
  );

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await vehicleEntry(entry);

    if (data.success) {
      setMessage("Vehicle entry recorded successfully");

      setEntry({
        ownerName: "",
        vehicleNumber: "",
        vehicleType: "car",
        slotId: "",
      });

      await loadAll();
    } else {
      setMessage(data.message || data.error || "Entry failed");
    }
  };

  const handleExit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await vehicleExit(exitPlate);

    if (data.success) {
      setMessage("Vehicle exit recorded successfully");
      setExitPlate("");

      await loadAll();
    } else {
      setMessage(data.message || "Exit failed");
    }
  };

  const handleQuickExit = async (vehicleNumber: string) => {
    const data = await vehicleExit(vehicleNumber);

    if (data.success) {
      setMessage("Vehicle exit recorded successfully");
      await loadAll();
    } else {
      setMessage(data.message || "Exit failed");
    }
  };

  const handleApproveVisitor = async (id: string) => {
    const data = await approveVisitor(id);

    if (data.success) {
      setMessage("Visitor approved and entry time started");
      await loadAll();
    } else {
      setMessage(data.message || "Visitor approval failed");
    }
  };

  const handleRejectVisitor = async (id: string) => {
    const data = await rejectVisitor(id);

    if (data.success) {
      setMessage("Visitor rejected and slot released");
      await loadAll();
    } else {
      setMessage(data.message || "Visitor rejection failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guard Console"
        description="Log entries, exits, approve visitors, and search vehicles on duty."
      />

      {message && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Entries Today"
          value={vehicles.length}
          icon={LogIn}
          tone="info"
        />

        <StatCard
          label="Pending Visitors"
          value={pendingVisitors.length}
          icon={UserCheck}
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
      </div>

      <SectionCard
        title="Incoming Visitor Requests"
        description={`${pendingVisitors.length} pending requests`}
      >
        <div className="space-y-3">
          {pendingVisitors.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No pending visitor requests
            </div>
          ) : (
            pendingVisitors.map((visitor) => (
              <div
                key={visitor._id}
                className="rounded-lg border p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="font-medium">{visitor.visitorName}</div>

                    <div className="text-xs text-muted-foreground mt-1">
                      Phone: {visitor.phone}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Vehicle: {visitor.vehicleNumber}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Resident: {visitor.hostResident}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Purpose: {visitor.purpose || "Guest Visit"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Slot: {visitor.slot?.slotNumber || "N/A"}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <Badge variant="outline">Pending</Badge>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveVisitor(visitor._id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectVisitor(visitor._id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard
          title="Vehicle Entry"
          description="Log a new vehicle entering the premises"
        >
          <form className="space-y-3" onSubmit={handleEntry}>
            <Input
              placeholder="Owner Name"
              value={entry.ownerName}
              onChange={(e) =>
                setEntry({ ...entry, ownerName: e.target.value })
              }
              required
            />

            <Input
              placeholder="Vehicle Number"
              value={entry.vehicleNumber}
              onChange={(e) =>
                setEntry({ ...entry, vehicleNumber: e.target.value })
              }
              required
            />

            <Input
              placeholder="Vehicle Type: car / bike / visitor"
              value={entry.vehicleType}
              onChange={(e) =>
                setEntry({ ...entry, vehicleType: e.target.value })
              }
              required
            />

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={entry.slotId}
              onChange={(e) =>
                setEntry({ ...entry, slotId: e.target.value })
              }
              required
            >
              <option value="">Select Available Slot</option>

              {availableSlots.map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {slot.slotNumber} — Tower {slot.tower}, {slot.floor}
                </option>
              ))}
            </select>

            <Button type="submit" className="w-full">
              <LogIn className="h-4 w-4 mr-1" />
              Log Entry
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Vehicle Exit" description="Mark a vehicle as exited">
          <form className="space-y-3" onSubmit={handleExit}>
            <Input
              placeholder="Vehicle Number"
              value={exitPlate}
              onChange={(e) => setExitPlate(e.target.value)}
              required
            />

            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action</span>
                <span className="font-medium">Release assigned slot</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">Ready</span>
              </div>
            </div>

            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-1" />
              Log Exit
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Quick Search" description="Find a vehicle by plate or owner">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicle…"
              className="pl-9 h-11"
            />
          </div>

          <div className="mt-4 space-y-2 max-h-64 overflow-auto">
            {filteredActive.length === 0 ? (
              <EmptyState message="No matching vehicles" />
            ) : (
              filteredActive.map((v) => (
                <div
                  key={v._id}
                  className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-semibold">
                      {v.vehicleNumber}
                    </div>

                    <Badge variant="secondary">{v.vehicleType}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    {v.ownerName} · Slot {v.slot?.slotNumber || "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Parked</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <SectionCard
            title="Active Parked Vehicles"
            description={`${vehicles.length} vehicles currently parked`}
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
                  {vehicles.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="font-mono font-medium">
                        {v.vehicleNumber}
                      </TableCell>

                      <TableCell>{v.ownerName}</TableCell>

                      <TableCell>{v.slot?.slotNumber || "-"}</TableCell>

                      <TableCell>
                        <Badge variant="outline">{v.vehicleType}</Badge>
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
                          onClick={() => handleQuickExit(v.vehicleNumber)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <div className="mx-auto h-10 w-10 rounded-full bg-muted grid place-items-center mb-2">
        <Search className="h-4 w-4" />
      </div>

      {message}
    </div>
  );
}