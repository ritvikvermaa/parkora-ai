import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  LogIn,
  LogOut,
  Search,
  Car,
  Clock,
  Send,
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
  const [message, setMessage] = useState("");

  const [entry, setEntry] = useState({
    ownerName: "",
    phone: "",
    vehicleNumber: "",
    vehicleType: "car",
    block: "Jade",
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

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await vehicleEntry(entry);

    if (data.success) {
      setMessage("Entry request sent to the resident for approval");

      setEntry({
        ownerName: "",
        phone: "",
        vehicleNumber: "",
        vehicleType: "car",
        block: "Jade",
        flat: "",
        purpose: "Guest Visit",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guard Dashboard"
        description="Create flat-specific visitor entry requests and manage active exits."
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="entry-request" className="scroll-mt-24">
        <SectionCard
          title="Visitor Entry Request"
          description="Specify the flat so the resident can approve entry"
        >
          <form className="space-y-3" onSubmit={handleEntry}>
            <Input
              placeholder="Visitor Name"
              value={entry.ownerName}
              onChange={(e) =>
                setEntry({ ...entry, ownerName: e.target.value })
              }
              required
            />

            <Input
              placeholder="Phone"
              value={entry.phone}
              onChange={(e) =>
                setEntry({ ...entry, phone: e.target.value })
              }
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
              placeholder="Flat format: tower + flat letter, such as 22A"
              value={entry.flat}
              onChange={(e) =>
                setEntry({ ...entry, flat: e.target.value.toUpperCase() })
              }
              required
            />

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={entry.block}
              onChange={(e) => setEntry({ ...entry, block: e.target.value })}
            >
              <option value="Jade">Jade (J)</option>
              <option value="Topaz">Topaz (T)</option>
              <option value="Nest">Nest (N)</option>
              <option value="Opal">Opal (O)</option>
            </select>

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            <Input
              placeholder="Purpose"
              value={entry.purpose}
              onChange={(e) =>
                setEntry({ ...entry, purpose: e.target.value })
              }
            />

            <Button type="submit" className="w-full">
              <Send className="h-4 w-4 mr-1" />
              Send for Approval
            </Button>
          </form>
        </SectionCard>
        </div>

        <div id="visitor-exit" className="scroll-mt-24">
        <SectionCard title="Visitor Exit" description="Guards can release visitor parking only">
          <form className="space-y-3" onSubmit={handleExit}>
            <Input
              placeholder="Visitor Vehicle Number"
              value={exitPlate}
              onChange={(e) => setExitPlate(e.target.value)}
              required
            />

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

        <div id="quick-search" className="scroll-mt-24">
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
                      {v.vehicleNumber || v.number}
                    </div>

                    <Badge variant="secondary">{v.vehicleType || v.type}</Badge>
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
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="visitors">Visitor Vehicles</TabsTrigger>
          <TabsTrigger value="residents">Resident Vehicles</TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" id="visitor-vehicles" className="mt-4 scroll-mt-24">
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No visitor vehicles are currently parked
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
                        <Badge variant="outline">{v.vehicleType || v.type}</Badge>
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
        </TabsContent>

        <TabsContent value="residents" id="resident-vehicles" className="mt-4 scroll-mt-24">
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No resident vehicles are currently parked
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
                          <Badge variant="secondary">Resident managed</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
