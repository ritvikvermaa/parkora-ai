import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Filter, Plus, Trash2 } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { getSlots, addSlot, deleteSlot } from "@/services/slotService";
import { cn } from "@/lib/utils";
import ProtectedRoute from "../components/ProtectedRoute";

type SlotStatus = "available" | "occupied" | "reserved" | "visitor";

type ParkingSlot = {
  _id: string;
  slotNumber: string;
  type: "resident" | "visitor" | "reserved";
  status: "available" | "occupied" | "reserved";
  tower: string;
  floor: string;
  assignedTo?: string | null;
};

export const Route = createFileRoute("/_app/slots")({
  head: () => ({ meta: [{ title: "Parking Slots — Parkora AI" }] }),
  component: () => (
    <ProtectedRoute roles={["admin", "guard"]}>
      <SlotsPage />
    </ProtectedRoute>
  ),
});

const statusColor: Record<SlotStatus, string> = {
  available: "bg-success/15 text-success border-success/30 hover:bg-success/25",
  occupied: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25",
  reserved: "bg-warning/25 text-warning-foreground border-warning/40 hover:bg-warning/40",
  visitor: "bg-info/15 text-info border-info/30 hover:bg-info/25",
};

const legend: { label: string; status: SlotStatus }[] = [
  { label: "Available", status: "available" },
  { label: "Occupied", status: "occupied" },
  { label: "Reserved", status: "reserved" },
  { label: "Visitor", status: "visitor" },
];

const getDisplayStatus = (slot: ParkingSlot): SlotStatus => {
  if (slot.type === "visitor" && slot.status === "available") return "visitor";
  return slot.status;
};

function SlotsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [filter, setFilter] = useState<SlotStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ParkingSlot | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    slotNumber: "",
    type: "resident",
    status: "available",
    tower: "",
    floor: "",
    assignedTo: "",
  });

  const loadSlots = async () => {
    const data = await getSlots();
    setParkingSlots(data || []);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setMessage("Only admins can add parking slots");
      return;
    }

    const data = await addSlot({
      ...form,
      assignedTo: form.assignedTo || null,
    });

    if (data.success) {
      setMessage("Slot added successfully");
      setOpenAdd(false);
      setForm({
        slotNumber: "",
        type: "resident",
        status: "available",
        tower: "",
        floor: "",
        assignedTo: "",
      });
      await loadSlots();
    } else {
      setMessage(data.message || "Failed to add slot");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!isAdmin) {
      setMessage("Only admins can delete parking slots");
      return;
    }

    const confirmDelete = confirm("Delete this slot?");
    if (!confirmDelete) return;

    const data = await deleteSlot(id);

    if (data.success) {
      setMessage("Slot deleted successfully");
      setActive(null);
      await loadSlots();
    } else {
      setMessage(data.message || "Failed to delete slot");
    }
  };

  const slots = parkingSlots.filter((s) => {
    const displayStatus = getDisplayStatus(s);

    if (filter !== "all" && displayStatus !== filter) return false;

    if (query && !s.slotNumber.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    return true;
  });

  const blocks = Array.from(new Set(slots.map((s) => s.tower)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parking Slots"
        description="Live status across all blocks"
        actions={
          isAdmin ? (
            <Button onClick={() => setOpenAdd(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Slot
            </Button>
          ) : null
        }
      />

      {message && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <SectionCard title="Filters" description={`${slots.length} of ${parkingSlots.length} slots`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by slot ID e.g. A-101"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              <Filter className="h-3 w-3 mr-1" />
              All
            </Button>

            {legend.map((l) => (
              <Button
                key={l.status}
                variant={filter === l.status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(l.status)}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="space-y-6">
        {blocks.length === 0 ? (
          <SectionCard title="No Slots Found">
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Add your first parking slot using the Add Slot button."
                : "No parking slots are available yet."}
            </p>
          </SectionCard>
        ) : (
          blocks.map((b) => (
            <SectionCard
              key={b}
              title={`Block ${b}`}
              description={`${slots.filter((s) => s.tower === b).length} slots shown`}
            >
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2">
                {slots
                  .filter((s) => s.tower === b)
                  .map((s) => {
                    const displayStatus = getDisplayStatus(s);

                    return (
                      <button
                        key={s._id}
                        onClick={() => setActive(s)}
                        className={cn(
                          "aspect-square rounded-lg border text-[10px] font-mono font-medium transition-all hover:scale-105 hover:shadow-soft flex flex-col items-center justify-center",
                          statusColor[displayStatus]
                        )}
                        title={`${s.slotNumber} · ${displayStatus}`}
                      >
                        <span>{s.slotNumber}</span>
                        <span className="text-[9px] opacity-70">{s.type}</span>
                      </button>
                    );
                  })}
              </div>
            </SectionCard>
          ))
        )}
      </div>

      <Dialog
        open={isAdmin ? openAdd : false}
        onOpenChange={(open) => {
          if (isAdmin) setOpenAdd(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parking Slot</DialogTitle>
            <DialogDescription>Create a new parking slot in MongoDB.</DialogDescription>
          </DialogHeader>

          <form className="space-y-3" onSubmit={handleAddSlot}>
            <Input
              placeholder="Slot Number e.g. A-101"
              value={form.slotNumber}
              onChange={(e) => setForm({ ...form, slotNumber: e.target.value })}
              required
            />

            <Input
              placeholder="Tower e.g. A"
              value={form.tower}
              onChange={(e) => setForm({ ...form, tower: e.target.value })}
              required
            />

            <Input
              placeholder="Floor e.g. 1"
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              required
            />

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="resident">Resident</option>
              <option value="visitor">Visitor</option>
              <option value="reserved">Reserved</option>
            </select>

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>

            <Input
              placeholder="Assigned To optional"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            />

            <Button type="submit" className="w-full">
              Add Slot
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Slot {active.slotNumber}
                  <Badge className={cn("border-0", statusColor[getDisplayStatus(active)])}>
                    {getDisplayStatus(active)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Block {active.tower} · Floor {active.floor}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <Row label="Status" value={getDisplayStatus(active)} />
                <Row label="Assigned To" value={active.assignedTo ?? "—"} mono />
                <Row label="Type" value={active.type} />
                <Row label="Block" value={active.tower} />
                <Row label="Floor" value={active.floor} />
              </div>

              {isAdmin && (
                <Button variant="destructive" onClick={() => handleDeleteSlot(active._id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Slot
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium capitalize", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}