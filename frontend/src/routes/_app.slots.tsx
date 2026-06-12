import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Filter, Plus, Trash2, Building2, ParkingCircle } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "../context/AuthContext";
import {
  EmptyState,
  FieldHint,
  InlineNotice,
  StatusPill,
} from "@/components/dashboard-ui";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getSlots, addSlot, deleteSlot } from "@/services/slotService";
import { cn } from "@/lib/utils";
import { parseFlatId, SOCIETY_BLOCKS } from "@/lib/society";
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
      <SlotsPage view="overview" />
    </ProtectedRoute>
  ),
});

export type SlotsView =
  | "overview"
  | "summary"
  | "search"
  | "jade"
  | "topaz"
  | "nest"
  | "opal";

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

const slotsViewMeta: Record<SlotsView, { title: string; description: string }> = {
  overview: {
    title: "Parking Slots",
    description: "Slot inventory summary and parking management actions.",
  },
  summary: {
    title: "Slot Summary",
    description: "Capacity metrics across resident, visitor and reserved slots.",
  },
  search: {
    title: "Search Parking Slots",
    description: "Search and filter parking slots across all blocks.",
  },
  jade: {
    title: "Jade Block Parking",
    description: "Parking inventory for Jade block.",
  },
  topaz: {
    title: "Topaz Block Parking",
    description: "Parking inventory for Topaz block.",
  },
  nest: {
    title: "Nest Block Parking",
    description: "Parking inventory for Nest block.",
  },
  opal: {
    title: "Opal Block Parking",
    description: "Parking inventory for Opal block.",
  },
};

const blockViewMap: Partial<Record<SlotsView, ParkingSlot["block"]>> = {
  jade: "Jade",
  topaz: "Topaz",
  nest: "Nest",
  opal: "Opal",
};

export function SlotsPage({ view = "overview" }: { view?: SlotsView }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [filter, setFilter] = useState<SlotStatus | "all">("all");
  const [blockFilter, setBlockFilter] = useState<ParkingSlot["block"] | "all">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ParkingSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<ParkingSlot | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "destructive" | "info";
    title: string;
    body: string;
  } | null>(null);

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

  const parsedFlat = parseFlatId(form.flat);

  const loadSlots = async () => {
    const data = await getSlots();
    setParkingSlots(data || []);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const currentView = slotsViewMeta[view] ? view : "overview";
  const forcedBlock = blockViewMap[currentView];
  const effectiveBlockFilter = forcedBlock || blockFilter;

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setMessage({
        tone: "destructive",
        title: "Permission required",
        body: "Only admins can add parking slots.",
      });
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
      setMessage({
        tone: "success",
        title: "Slot added",
        body: `${data.slot?.slotNumber || form.slotNumber} is now available in the slot map.`,
      });
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
      setMessage({
        tone: "destructive",
        title: "Slot could not be added",
        body: data.message || data.error || "Failed to add slot.",
      });
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;

    if (!isAdmin) {
      setMessage({
        tone: "destructive",
        title: "Permission required",
        body: "Only admins can delete parking slots.",
      });
      return;
    }

    const data = await deleteSlot(slotToDelete._id);

    if (data.success) {
      setMessage({
        tone: "success",
        title: "Slot removed",
        body: `${slotToDelete.slotNumber} was removed from active parking inventory.`,
      });
      setActive(null);
      setSlotToDelete(null);
      await loadSlots();
    } else {
      setMessage({
        tone: "destructive",
        title: "Slot could not be removed",
        body: data.message || data.error || "Failed to remove slot.",
      });
    }
  };

  const handleFlatChange = (value: string) => {
    const nextFlat = value.toUpperCase();
    const parsed = parseFlatId(nextFlat);

    setForm({
      ...form,
      flat: nextFlat,
      block: parsed.block || form.block,
      tower: parsed.tower || form.tower,
      floor: parsed.floor || form.floor,
      reservedForFlat: form.isReservedForFlat ? nextFlat : form.reservedForFlat,
    });
  };

  const slots = parkingSlots.filter((s) => {
    const displayStatus = getDisplayStatus(s);

    if (filter !== "all" && displayStatus !== filter) return false;
    if (effectiveBlockFilter !== "all" && s.block !== effectiveBlockFilter) return false;

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
  const showSummary = currentView === "overview" || currentView === "summary";
  const showFilters = currentView === "search" || Boolean(forcedBlock);
  const showSlotGrid = currentView === "search" || Boolean(forcedBlock);

  return (
    <div className="space-y-6">
      <PageHeader
        title={slotsViewMeta[currentView].title}
        description={slotsViewMeta[currentView].description}
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
        <InlineNotice
          tone={message.tone}
          title={message.title}
          onDismiss={() => setMessage(null)}
        >
          {message.body}
        </InlineNotice>
      )}

      {showSummary && <div id="slot-summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-24">
        <SummaryCard label="Total Slots" value={slotSummary.total} />
        <SummaryCard label="Available" value={slotSummary.available} tone="success" />
        <SummaryCard label="Occupied" value={slotSummary.occupied} tone="destructive" />
        <SummaryCard label="Reserved" value={slotSummary.reserved} tone="warning" />
      </div>}

      {currentView === "overview" && (
        <SectionCard title="Slot Pages" description="Open a focused parking page from the sidebar.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <QuickPage to="/slots/search" title="Search & Filters" desc="Find slots by flat, block, tower or status." />
            <QuickPage to="/slots/jade" title="Jade Block" desc="View Jade parking inventory." />
            <QuickPage to="/slots/nest" title="Nest Block" desc="View Nest parking inventory." />
          </div>
        </SectionCard>
      )}

      {showFilters && (
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
            variant={effectiveBlockFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setBlockFilter("all")}
            disabled={Boolean(forcedBlock)}
          >
            <Building2 className="h-3 w-3 mr-1" />
            All Blocks
          </Button>

          {blocks.map((block) => (
            <Button
              key={block}
              variant={effectiveBlockFilter === block ? "default" : "outline"}
              size="sm"
              onClick={() => setBlockFilter(block)}
              disabled={Boolean(forcedBlock)}
            >
              {block}
            </Button>
          ))}
        </div>
        </div>
      </SectionCard>
      </div>
      )}

      {showSlotGrid && (
      <div className="space-y-6">
        {groups.length === 0 ? (
          <SectionCard title="No Slots Found">
            <EmptyState
              icon={ParkingCircle}
              title="No parking slots match this view"
              description={
                isAdmin
                  ? "Adjust the filters or add a new resident or visitor slot."
                  : "No parking slots are available for the selected filters."
              }
              action={
                isAdmin ? (
                  <Button size="sm" onClick={() => setOpenAdd(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Slot
                  </Button>
                ) : null
              }
            />
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
      )}

      <Dialog
        open={isAdmin ? openAdd : false}
        onOpenChange={(open) => {
          if (isAdmin) setOpenAdd(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Parking Slot</DialogTitle>
            <DialogDescription>
              Create resident or visitor parking. Compact flat IDs can auto-fill block, tower and floor.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3" onSubmit={handleAddSlot}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Slot number</Label>
                <Input
                  placeholder="Enter slot code, e.g. V-014 or N22A-P1"
                  value={form.slotNumber}
                  onChange={(e) => setForm({ ...form, slotNumber: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Flat ID</Label>
                <Input
                  placeholder="Enter flat ID, e.g. N22A"
                  value={form.flat}
                  onChange={(e) => handleFlatChange(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Block</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                  required
                >
                  <option value="">Select block</option>
                  {SOCIETY_BLOCKS.map((block) => (
                    <option key={block.name} value={block.name}>
                      {block.name} ({block.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Tower</Label>
                <Input
                  placeholder="Enter tower number, e.g. 22"
                  value={form.tower}
                  onChange={(e) => setForm({ ...form, tower: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Floor</Label>
                <Input
                  placeholder="Auto from A/B/C/D, or enter for visitor slots"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
              </div>
            </div>

            <FieldHint>
              {form.flat && parsedFlat.isValid
                ? `${parsedFlat.normalized} detected: ${parsedFlat.block || form.block || "selected block"}, tower ${parsedFlat.tower}, ${parsedFlat.floorLabel}.`
                : "Use compact flat IDs. Final letter sets the floor: A=1st, B=2nd, C=3rd, D=4th."}
            </FieldHint>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Parking type</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="resident">Resident parking</option>
                  <option value="visitor">Visitor parking</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Initial status</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-sm">Reserve for a flat</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reserved slots stay hidden from guard visitor allocation.
                  </p>
                </div>
                <Switch
                  checked={form.isReservedForFlat}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      isReservedForFlat: checked,
                      status: checked ? "reserved" : form.status,
                      reservedForFlat: checked ? form.flat : "",
                    })
                  }
                />
              </div>
            </div>

            {form.isReservedForFlat && (
              <div className="space-y-1.5">
                <Label>Reserved flat</Label>
                <Input
                  placeholder="Enter reserved flat ID, e.g. N22A"
                  value={form.reservedForFlat}
                  onChange={(e) =>
                    setForm({ ...form, reservedForFlat: e.target.value.toUpperCase() })
                  }
                />
              </div>
            )}

            <div className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-sm">Visitor fallback allowed</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Guards may use this slot only when visitor parking is full and the flat is not handed over.
                  </p>
                </div>
                <Switch
                  checked={form.allowVisitorFallback}
                  onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    allowVisitorFallback: checked,
                  })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned vehicle or user ID</Label>
              <Input
                placeholder="Optional; leave blank for unassigned slots"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              />
            </div>

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
                  <StatusPill status={getDisplayStatus(active)} />
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
                  onClick={() => setSlotToDelete(active)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove Slot
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!slotToDelete} onOpenChange={(open) => !open && setSlotToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove parking slot?</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDelete
                ? `${slotToDelete.slotNumber} will be removed from the active parking inventory. Existing history stays intact.`
                : "This slot will be removed from active parking inventory."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSlot}
            >
              Remove Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function QuickPage({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-4 hover:border-primary hover:shadow-card transition-all">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
