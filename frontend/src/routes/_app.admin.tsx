import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Car,
  ParkingCircle,
  Users,
  TrendingUp,
  MoreHorizontal,
  UserCheck,
  UserX,
  ShieldCheck,
  Activity,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { EmptyState, StatusPill } from "@/components/dashboard-ui";
import { DashboardNotificationsFeed } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import ProtectedRoute from "../components/ProtectedRoute";

import {
  getAdminStats,
  getRecentActivity,
  getResidents,
  getPendingUsers,
  updateUserApproval,
} from "@/services/adminService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Parkora AI" }],
  }),

  component: () => (
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboard view="overview" />
    </ProtectedRoute>
  ),
});

export type AdminView =
  | "overview"
  | "operations"
  | "analytics"
  | "approvals"
  | "residents"
  | "activity";

const adminViewMeta: Record<AdminView, { title: string; description: string }> = {
  overview: {
    title: "Society Overview",
    description: "Live parking and visitor operations for Smartworld Gems.",
  },
  operations: {
    title: "Operations Health",
    description: "Capacity, approvals and gate-load signals.",
  },
  analytics: {
    title: "Parking Analytics",
    description: "Live traffic and slot distribution breakdowns.",
  },
  approvals: {
    title: "Registration Approvals",
    description: "Review pending resident access requests.",
  },
  residents: {
    title: "Residents",
    description: "Approved residents and flat assignments.",
  },
  activity: {
    title: "Recent Activity",
    description: "Latest vehicle movements across the society.",
  },
};

export function AdminDashboard({ view = "overview" }: { view?: AdminView }) {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [residentsData, setResidentsData] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await getAdminStats();
    const activityData = await getRecentActivity();
    const residents = await getResidents();
    const pending = await getPendingUsers();

    setStats(statsData);
    setRecentActivity(activityData);
    setResidentsData(residents);
    setPendingUsers(pending);
  };

  const handleApproval = async (
    id: string,
    approvalStatus: "approved" | "rejected"
  ) => {
    const data = await updateUserApproval(id, approvalStatus);

    if (data.success) {
      await loadStats();
    }
  };

  const occRate = stats?.totalSlots
    ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100)
    : 0;
  const weeklyTraffic = buildTrafficData(recentActivity);
  const slotMix = buildSlotMix(stats);
  const currentView = adminViewMeta[view] ? view : "overview";
  const showStats = currentView === "overview" || currentView === "operations";
  const showOperations = currentView === "overview" || currentView === "operations";
  const showAnalytics = currentView === "analytics";
  const showApprovals = currentView === "approvals";
  const showResidents = currentView === "residents";
  const showActivity = currentView === "activity";

  return (
    <div className="space-y-6">
      <PageHeader
        title={adminViewMeta[currentView].title}
        description={adminViewMeta[currentView].description}
        actions={<Button variant="outline">Export Report</Button>}
      />

      {showStats && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Slots" value={stats?.totalSlots || 0} icon={ParkingCircle} />

        <StatCard
          label="Occupied"
          value={`${stats?.occupiedSlots || 0} (${occRate}%)`}
          icon={Car}
          tone="destructive"
        />

        <StatCard
          label="Pending Users"
          value={stats?.pendingUsers || 0}
          icon={Users}
          tone="info"
        />

        <StatCard
          label="Active Vehicles"
          value={stats?.activeVehicles || 0}
          icon={Car}
          tone="success"
        />
      </div>}

      {showOperations && <div
        id="operations"
        className={cn(
          "scroll-mt-24",
          currentView === "overview" && "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6"
        )}
      >
        <SectionCard
          title="Operations Health"
          description="Live control-room signals for approvals, capacity and gate load"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Slot Occupancy</span>
                <span>{occRate}%</span>
              </div>
              <Progress value={occRate} />
              <div className="text-xs text-muted-foreground">
                {stats?.occupiedSlots || 0} occupied of {stats?.totalSlots || 0} total slots
              </div>
            </div>

            <OpsSignal
              icon={UserCheck}
              label="Approvals"
              value={pendingUsers.length}
              desc={pendingUsers.length ? "Review resident requests" : "No pending user approvals"}
              tone={pendingUsers.length ? "warning" : "success"}
            />

            <OpsSignal
              icon={ShieldCheck}
              label="Gate Load"
              value={stats?.activeVehicles || 0}
              desc="Active parked vehicles across resident and visitor traffic"
              tone="info"
            />
          </div>
        </SectionCard>

        {currentView === "overview" && <DashboardNotificationsFeed />}
      </div>}

      {showAnalytics && <div id="analytics" className="grid grid-cols-1 xl:grid-cols-2 gap-6 scroll-mt-24 max-w-7xl">
        <SectionCard
          title="Weekly Traffic"
          description="Entries vs exits"
          actions={
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          }
        >
          <div className="h-72 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTraffic}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar dataKey="entries" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />

                <Bar dataKey="exits" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Slot Distribution" description="Live Breakdown">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slotMix} dataKey="value" innerRadius={60} outerRadius={95}>
                  {slotMix.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1">
            {slotMix.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>}

      {(showApprovals || showResidents || showActivity) && <div className="grid grid-cols-1 gap-6 max-w-7xl">
        {showApprovals && (
        <div id="approvals" className="scroll-mt-24">
          <SectionCard
            title="Pending Registration Requests"
            description={`${pendingUsers.length} users waiting for approval`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Flat</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pendingUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        icon={UserCheck}
                        title="No pending registrations"
                        description="New resident requests will appear here for admin approval."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{formatFlat(user)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproval(user._id, "approved")}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(user._id, "rejected")}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
        )}

        {showResidents && (
        <div id="residents" className="scroll-mt-24">
          <SectionCard
            title="Residents"
            description={`${stats?.residents || 0} residents registered`}
            actions={
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin">View All</Link>
              </Button>
            }
          >
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
              </TableHeader>

              <TableBody>
                {residentsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        icon={Users}
                        title="No approved residents yet"
                        description="Approved resident accounts will be listed here with flat details."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  residentsData.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="capitalize">{r.role}</TableCell>
                      <TableCell>{formatFlat(r)}</TableCell>
                      <TableCell>
                        <StatusPill status={r.approvalStatus || "approved"} />
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
        )}

        {showActivity && (
        <div id="activity" className="scroll-mt-24">
        <SectionCard title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No vehicle activity yet"
                description="Vehicle entries and exits will create the live activity trail."
              />
            ) : (
              recentActivity.map((v) => {
                const status = v.exitTime ? "Out" : "In";

                return (
                  <div key={v._id} className="flex items-center gap-3 text-sm">
                    <div
                      className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                        status === "In"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Car className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate">
                        <span className="font-medium font-mono">{v.vehicleNumber}</span> ·{" "}
                        {v.vehicleType}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {v.ownerName} · Slot {v.slot?.slotNumber || "N/A"}
                      </div>
                    </div>

                    <div className="text-xs">{status}</div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
        </div>
        )}
      </div>}

      {currentView === "overview" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminTile
          title="Manage Slots"
          desc={`${stats?.availableSlots || 0} available`}
          icon={ParkingCircle}
          to="/slots"
        />

        <AdminTile
          title="AI Insights"
          desc="Smartworld demand model"
          icon={TrendingUp}
          to="/ai-insights"
        />

        <AdminTile
          title="Settings"
          desc="Society and profile"
          icon={MoreHorizontal}
          to="/settings"
        />
      </div>}
    </div>
  );
}

function formatFlat(resident: any) {
  if (!resident.flat) return "-";
  if (resident.flat.includes("-")) return resident.flat.replace("-", "");
  return resident.flat;
}

function buildTrafficData(activity: any[]) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = labels.reduce((acc: any, day) => {
    acc[day] = { day, entries: 0, exits: 0 };
    return acc;
  }, {});

  activity.forEach((item) => {
    const date = new Date(item.entryTime || item.createdAt || item.updatedAt || Date.now());
    const day = labels[(date.getDay() + 6) % 7];
    map[day].entries += item.entryTime ? 1 : 0;
    map[day].exits += item.exitTime ? 1 : 0;
  });

  return labels.map((day) => map[day]);
}

function buildSlotMix(stats: any) {
  const available = stats?.availableSlots || 0;
  const occupied = stats?.occupiedSlots || 0;
  const other = Math.max((stats?.totalSlots || 0) - available - occupied, 0);

  return [
    { name: "Available", value: available, color: "var(--color-chart-2)" },
    { name: "Occupied", value: occupied, color: "var(--color-chart-1)" },
    { name: "Reserved / Other", value: other, color: "var(--color-chart-3)" },
  ].filter((item) => item.value > 0);
}

function OpsSignal({ icon: Icon, label, value, desc, tone }: any) {
  const toneMap: any = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/15 text-warning-foreground border-warning/30",
    info: "bg-info/10 text-info border-info/20",
  };

  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone] || "bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
        </div>
        <div className="h-9 w-9 rounded-lg bg-background/70 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function AdminTile({ title, desc, icon: Icon, to, tone = "default" }: any) {
  const map: any = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/20 text-warning-foreground",
  };

  return (
    <Link to={to} className="rounded-lg border p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-lg grid place-items-center ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}
