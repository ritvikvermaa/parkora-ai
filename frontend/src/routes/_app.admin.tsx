import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Car,
  ParkingCircle,
  Users,
  AlertTriangle,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await getAdminStats();
    const activityData = await getRecentActivity();
    const residents = await getResidents();

    setStats(statsData);
    setRecentActivity(activityData);
    setResidentsData(residents);
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
          label="Visitors"
          value={stats?.totalVisitors || 0}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <div className="lg:col-span-2">
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
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {residentsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No residents found
                    </TableCell>
                  </TableRow>
                ) : (
                  residentsData.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="capitalize">{r.role}</TableCell>
                      <TableCell>
                        <Badge>Active</Badge>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminTile
          title="Manage Slots"
          desc={`${stats?.availableSlots || 0} available`}
          icon={ParkingCircle}
          to="/slots"
        />

        <AdminTile
          title="Visitors"
          desc={`${stats?.totalVisitors || 0} visitors`}
          icon={Users}
          to="/visitors"
        />

        <AdminTile
          title="Guards"
          desc={`${stats?.guards || 0} active guards`}
          icon={AlertTriangle}
          to="/guard"
          tone="warning"
        />
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