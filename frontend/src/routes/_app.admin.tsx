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
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
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

import { weeklyTraffic, slotMix } from "@/lib/dummy-data";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Parkora AI" }],
  }),

  component: () => (
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

function AdminDashboard() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Society Overview"
        description="Parkora Live Dashboard"
        actions={<Button variant="outline">Export Report</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      <div id="operations" className="scroll-mt-24">
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
      </div>

      <div id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-24">
        <SectionCard
          title="Weekly Traffic"
          description="Entries vs exits"
          actions={
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              Demo Data
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="approvals" className="lg:col-span-3 scroll-mt-24">
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No pending registration requests
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{user.flat || "-"}</TableCell>
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

        <div id="residents" className="lg:col-span-2 scroll-mt-24">
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No residents found
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
                        <Badge>{r.approvalStatus || "approved"}</Badge>
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

        <div id="activity" className="scroll-mt-24">
        <SectionCard title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground">No activity found</div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminTile
          title="Manage Slots"
          desc={`${stats?.availableSlots || 0} available`}
          icon={ParkingCircle}
          to="/slots"
        />

        <AdminTile
          title="AI Insights"
          desc="Demand and usage patterns"
          icon={TrendingUp}
          to="/ai-insights"
        />

        <AdminTile
          title="Settings"
          desc="Society and profile"
          icon={MoreHorizontal}
          to="/settings"
        />
      </div>
    </div>
  );
}

function formatFlat(resident: any) {
  if (!resident.flat) return "-";
  if (resident.flat.includes("-")) return resident.flat.replace("-", "");
  return [resident.block, resident.flat].filter(Boolean).join(" ") || resident.flat;
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
    <Link to={to} className="rounded-xl border p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}
