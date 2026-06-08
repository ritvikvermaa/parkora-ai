import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Filter, Plus, Trash2, Building2 } from "lucide-react";

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
  block: "Jade" | "Topaz" | "Nest" | "Opal";
  blockCode: "J" | "T" | "N" | "O";
  tower: string;
  flat?: string | null;
  floor: string;
  type: "resident" | "visitor";
  status: "available" | "occupied" | "reserved";
  isReservedForFlat?: boolean;
  reservedForFlat?: string | null;
  assignedTo?: string | null;
  allowVisitorFallback?: boolean;
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
  const [blockFilter, setBlockFilter] = useState<ParkingSlot["block"] | "all">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ParkingSlot | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    slotNumber: "",
    block: "",
    tower: "",
    flat: "",
    floor: "",
    type: "resident",
    status: "available",
    isReservedForFlat: false,
    reservedForFlat: "",
    assignedTo: "",
    allowVisitorFallback: true,
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
      flat: form.flat || null,
      reservedForFlat: form.isReservedForFlat
        ? form.reservedForFlat || form.flat
        : null,
      assignedTo: form.assignedTo || null,
    });

    if (data.success) {
      setMessage("Slot added successfully");
      setOpenAdd(false);
      setForm({
        slotNumber: "",
        block: "",
        tower: "",
        flat: "",
        floor: "",
        type: "resident",
        status: "available",
        isReservedForFlat: false,
        reservedForFlat: "",
        assignedTo: "",
        allowVisitorFallback: true,
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

    const confirmDelete = confirm("Remove this slot?");
    if (!confirmDelete) return;

    const data = await deleteSlot(id);

    if (data.success) {
      setMessage("Slot removed successfully");
      setActive(null);
      await loadSlots();
    } else {
      setMessage(data.message || "Failed to remove slot");
    }
  };

  const slots = parkingSlots.filter((s) => {
    const displayStatus = getDisplayStatus(s);

    if (filter !== "all" && displayStatus !== filter) return false;
    if (blockFilter !== "all" && s.block !== blockFilter) return false;

    if (
      query &&
      !`${s.slotNumber} ${s.block} ${s.tower} ${s.flat || ""} ${s.reservedForFlat || ""}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const blocks: ParkingSlot["block"][] = ["Jade", "Topaz", "Nest", "Opal"];
  const groups = blocks.filter((block) => slots.some((s) => s.block === block));
  const slotSummary = {
    total: parkingSlots.length,
    available: parkingSlots.filter((slot) => slot.status === "available").length,
    occupied: parkingSlots.filter((slot) => slot.status === "occupied").length,
    reserved: parkingSlots.filter((slot) => slot.status === "reserved").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parking Slots"
        description="Manage society slots by block, tower and flat"
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

      <div id="slot-summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-24">
        <SummaryCard label="Total Slots" value={slotSummary.total} />
        <SummaryCard label="Available" value={slotSummary.available} tone="success" />
        <SummaryCard label="Occupied" value={slotSummary.occupied} tone="destructive" />
        <SummaryCard label="Reserved" value={slotSummary.reserved} tone="warning" />
      </div>

      <div id="slot-filters" className="scroll-mt-24">
      <SectionCard
        title="Search & Filters"
        description={`${slots.length} of ${parkingSlots.length} slots`}
      >
        <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by slot, block, tower, plate, or flat format such as N22A"
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

        <div className="flex flex-wrap gap-2">
          <Button
            variant={blockFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setBlockFilter("all")}
          >
            <Building2 className="h-3 w-3 mr-1" />
            All Blocks
          </Button>

          {blocks.map((block) => (
            <Button
              key={block}
              variant={blockFilter === block ? "default" : "outline"}
              size="sm"
              onClick={() => setBlockFilter(block)}
            >
              {block}
            </Button>
          ))}
        </div>
        </div>
      </SectionCard>
      </div>

      <div className="space-y-6">
        {groups.length === 0 ? (
          <SectionCard title="No Slots Found">
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Add your first parking slot using the Add Slot button."
                : "No parking slots are available yet."}
            </p>
          </SectionCard>
        ) : (
          groups.map((group) => (
            <div key={group} id={`block-${group.toLowerCase()}`} className="scroll-mt-24">
            <SectionCard
              title={`${group} Block`}
              description={`${slots.filter((s) => s.block === group).length} slots across all towers`}
            >
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <BlockMetric label="Available" value={slots.filter((s) => s.block === group && s.status === "available").length} />
                <BlockMetric label="Occupied" value={slots.filter((s) => s.block === group && s.status === "occupied").length} />
                <BlockMetric label="Reserved" value={slots.filter((s) => s.block === group && s.status === "reserved").length} />
                <BlockMetric label="Visitor" value={slots.filter((s) => s.block === group && s.type === "visitor").length} />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {slots
                  .filter((s) => s.block === group)
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
                        <span className="text-[9px] opacity-70">
                          {s.flat || `T${s.tower}`}
                        </span>
                        <span className="text-[8px] opacity-60">
                          {s.type}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </SectionCard>
            </div>
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
            <DialogDescription>
              Create resident or visitor parking using block, tower and flat mapping.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3" onSubmit={handleAddSlot}>
            <Input
              placeholder="Slot number format: flat code + parking index, such as N22A-P1"
              value={form.slotNumber}
              onChange={(e) => setForm({ ...form, slotNumber: e.target.value })}
              required
            />

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.block}
              onChange={(e) => setForm({ ...form, block: e.target.value })}
              required
            >
              <option value="">Select Block</option>
              <option value="Jade">Jade</option>
              <option value="Topaz">Topaz</option>
              <option value="Nest">Nest</option>
              <option value="Opal">Opal</option>
            </select>

            <Input
              placeholder="Tower number only, for example 22 or 113"
              value={form.tower}
              onChange={(e) => setForm({ ...form, tower: e.target.value })}
              required
            />

            <Input
              placeholder="Flat format: tower + flat letter, or full code such as N22A"
              value={form.flat}
              onChange={(e) => setForm({ ...form, flat: e.target.value })}
            />

            <Input
              placeholder="Auto floor: A=1st, B=2nd, C=3rd, D=4th; enter manually for visitor slots"
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
            {form.flat && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {getDerivedFloorText(form.flat)}
              </div>
            )}

            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="resident">Resident Parking</option>
              <option value="visitor">Visitor Parking</option>
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isReservedForFlat}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isReservedForFlat: e.target.checked,
                    reservedForFlat: e.target.checked ? form.flat : "",
                  })
                }
              />
              Reserve this parking for a flat
            </label>

            {form.isReservedForFlat && (
              <Input
                placeholder="Reserved flat format, such as N22A"
                value={form.reservedForFlat}
                onChange={(e) =>
                  setForm({ ...form, reservedForFlat: e.target.value })
                }
              />
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allowVisitorFallback}
                onChange={(e) =>
                  setForm({
                    ...form,
                    allowVisitorFallback: e.target.checked,
                  })
                }
              />
              Allow visitor fallback if visitor parking is full
            </label>

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
                  {active.block} · Tower {active.tower} · Floor {active.floor}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <Row label="Status" value={getDisplayStatus(active)} />
                <Row label="Type" value={active.type} />
                <Row label="Block" value={active.block} />
                <Row label="Tower" value={active.tower} />
                <Row label="Flat" value={active.flat ?? "—"} />
                <Row label="Reserved For" value={active.reservedForFlat ?? "—"} />
                <Row label="Assigned To" value={active.assignedTo ?? "—"} mono />
                <Row
                  label="Visitor Fallback"
                  value={active.allowVisitorFallback ? "Allowed" : "Not allowed"}
                />
              </div>

              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSlot(active._id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove Slot
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

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneMap = {
    default: "bg-card",
    success: "bg-success/10 border-success/20",
    warning: "bg-warning/15 border-warning/30",
    destructive: "bg-destructive/10 border-destructive/20",
  };

  return (
    <div className={cn("rounded-lg border p-4", toneMap[tone])}>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function BlockMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function getDerivedFloorText(flat: string) {
  const letter = flat.trim().toUpperCase().match(/[A-Z]$/)?.[0];
  const map: Record<string, string> = {
    A: "1st floor",
    B: "2nd floor",
    C: "3rd floor",
    D: "4th floor",
  };

  return map[letter]
    ? `Detected ${letter} flat: this slot will be saved as ${map[letter]}.`
    : "Floor is derived from final flat letter when possible: A=1st, B=2nd, C=3rd, D=4th.";
}
