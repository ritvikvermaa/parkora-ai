// Dummy data for the entire Parkora AI app
export const society = {
  name: "Smartworld Gems",
  tagline: "Smartworld Gems Parking Operations",
};

export const currentUser = {
  name: "Aarav Sharma",
  unit: "B-1204",
  email: "aarav.sharma@smartworldgems.in",
  avatar: "AS",
  role: "Resident",
};

export const stats = {
  totalSlots: 320,
  occupied: 247,
  available: 58,
  reserved: 15,
  visitors: 12,
  residents: 412,
  monthlyRevenue: 184250,
  violationsToday: 7,
};

export const myVehicles = [
  { id: "v1", plate: "MH 14 KQ 8821", model: "Hyundai Creta", color: "Pearl White", slot: "B2-047", status: "Parked" },
  { id: "v2", plate: "MH 14 PR 1129", model: "Honda Activa 6G", color: "Matte Grey", slot: "B2-M12", status: "Parked" },
];

export const visitorRequests = [
  { id: "r1", name: "Rohan Mehta", plate: "MH 12 AB 4521", visiting: "B-1204", time: "Today, 6:30 PM", status: "pending" },
  { id: "r2", name: "Priya Iyer", plate: "MH 04 CZ 7712", visiting: "B-1204", time: "Today, 8:00 PM", status: "approved" },
];

export const notifications = [
  { id: "n1", title: "Visitor approved", body: "Priya Iyer's request for B-1204 is approved.", time: "12m ago", type: "success" as const },
  { id: "n2", title: "Slot reminder", body: "Your slot B2-047 expires in 2 hours.", time: "1h ago", type: "info" as const },
  { id: "n3", title: "Violation detected", body: "Unauthorized vehicle at A1-018.", time: "3h ago", type: "warning" as const },
  { id: "n4", title: "Maintenance scheduled", body: "Basement 1 cleaning at 11 PM.", time: "Yesterday", type: "info" as const },
];

export const recentEntries = [
  { id: "e1", plate: "MH 14 KQ 8821", type: "Resident", unit: "B-1204", time: "09:12", slot: "B2-047", status: "In" },
  { id: "e2", plate: "DL 8C AC 4421", type: "Visitor", unit: "A-302", time: "09:24", slot: "V-08", status: "In" },
  { id: "e3", plate: "MH 02 BB 1290", type: "Resident", unit: "C-705", time: "09:31", slot: "C1-112", status: "Out" },
  { id: "e4", plate: "KA 03 MN 2218", type: "Visitor", unit: "D-1101", time: "09:42", slot: "V-12", status: "In" },
  { id: "e5", plate: "MH 14 PR 1129", type: "Resident", unit: "B-1204", time: "10:01", slot: "B2-M12", status: "In" },
];

export const activeParked = [
  { id: "p1", plate: "MH 14 KQ 8821", owner: "Aarav Sharma", slot: "B2-047", since: "2h 14m", type: "Resident" },
  { id: "p2", plate: "DL 8C AC 4421", owner: "Rohan Mehta", slot: "V-08", since: "1h 02m", type: "Visitor" },
  { id: "p3", plate: "MH 02 BB 1290", owner: "Neha Kapoor", slot: "C1-112", since: "47m", type: "Resident" },
  { id: "p4", plate: "KA 03 MN 2218", owner: "Vikram Rao", slot: "V-12", since: "20m", type: "Visitor" },
];

export const occupancySeries = [
  { hour: "00", occ: 280 }, { hour: "03", occ: 270 }, { hour: "06", occ: 240 },
  { hour: "09", occ: 190 }, { hour: "12", occ: 215 }, { hour: "15", occ: 232 },
  { hour: "18", occ: 268 }, { hour: "21", occ: 290 },
];

export const weeklyTraffic = [
  { day: "Mon", entries: 412, exits: 398 },
  { day: "Tue", entries: 386, exits: 402 },
  { day: "Wed", entries: 451, exits: 430 },
  { day: "Thu", entries: 478, exits: 462 },
  { day: "Fri", entries: 520, exits: 488 },
  { day: "Sat", entries: 612, exits: 590 },
  { day: "Sun", entries: 489, exits: 502 },
];

export const slotMix = [
  { name: "Occupied", value: 247, color: "var(--color-destructive)" },
  { name: "Available", value: 58, color: "var(--color-success)" },
  { name: "Reserved", value: 15, color: "var(--color-warning)" },
];

export type SlotStatus = "available" | "occupied" | "reserved" | "visitor";

export const parkingSlots: { id: string; block: string; status: SlotStatus; plate?: string; owner?: string }[] = (() => {
  const arr: { id: string; block: string; status: SlotStatus; plate?: string; owner?: string }[] = [];
  const blocks = ["A1", "B2", "C1", "D3"];
  const statuses: SlotStatus[] = ["available", "occupied", "reserved", "visitor"];
  blocks.forEach((b) => {
    for (let i = 1; i <= 18; i++) {
      const s = statuses[(i + b.length) % 4];
      arr.push({
        id: `${b}-${String(i).padStart(3, "0")}`,
        block: b,
        status: s,
        plate: s === "occupied" || s === "visitor" ? `MH 14 KQ ${1000 + i}` : undefined,
        owner: s === "occupied" ? "Resident" : s === "visitor" ? "Guest" : undefined,
      });
    }
  });
  return arr;
})();

export const visitorHistory = [
  { id: "h1", name: "Rohan Mehta", plate: "DL 8C AC 4421", host: "B-1204", date: "Jun 04", duration: "2h 14m", status: "Completed" },
  { id: "h2", name: "Priya Iyer", plate: "MH 04 CZ 7712", host: "B-1204", date: "Jun 03", duration: "45m", status: "Completed" },
  { id: "h3", name: "Vikram Rao", plate: "KA 03 MN 2218", host: "D-1101", date: "Jun 03", duration: "1h 08m", status: "Completed" },
  { id: "h4", name: "Sneha Kulkarni", plate: "MH 12 GH 4499", host: "A-302", date: "Jun 02", duration: "3h 22m", status: "Completed" },
];

export const aiDemand = [
  { time: "6AM", predicted: 180, actual: 175 },
  { time: "9AM", predicted: 215, actual: 198 },
  { time: "12PM", predicted: 240, actual: 232 },
  { time: "3PM", predicted: 255, actual: 248 },
  { time: "6PM", predicted: 285, actual: 278 },
  { time: "9PM", predicted: 295, actual: null as number | null },
];

export const violations = [
  { id: "vl1", slot: "A1-018", plate: "UNKNOWN", reason: "Unregistered vehicle", time: "10:42 AM", severity: "high" },
  { id: "vl2", slot: "C1-022", plate: "MH 14 KQ 8821", reason: "Overstay (3h+)", time: "09:30 AM", severity: "medium" },
  { id: "vl3", slot: "B2-103", plate: "DL 8C AC 4421", reason: "Wrong slot occupied", time: "08:18 AM", severity: "low" },
];

export const peakHours = [
  { hour: "6 AM", load: 22 }, { hour: "8 AM", load: 64 }, { hour: "10 AM", load: 48 },
  { hour: "12 PM", load: 55 }, { hour: "2 PM", load: 42 }, { hour: "4 PM", load: 51 },
  { hour: "6 PM", load: 88 }, { hour: "8 PM", load: 95 }, { hour: "10 PM", load: 71 },
];

export const residents = [
  { id: "u1", name: "Aarav Sharma", unit: "B-1204", vehicles: 2, status: "Active" },
  { id: "u2", name: "Neha Kapoor", unit: "C-705", vehicles: 1, status: "Active" },
  { id: "u3", name: "Vikram Rao", unit: "D-1101", vehicles: 3, status: "Active" },
  { id: "u4", name: "Sneha Kulkarni", unit: "A-302", vehicles: 1, status: "Inactive" },
  { id: "u5", name: "Karan Singh", unit: "B-808", vehicles: 2, status: "Active" },
];
