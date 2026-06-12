import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Car,
  Gauge,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import ProtectedRoute from "../components/ProtectedRoute";
import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { EmptyState, StatusPill } from "@/components/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAiDashboard, getViolations } from "@/services/aiService";

export const Route = createFileRoute("/_app/ai-insights")({
  head: () => ({ meta: [{ title: "AI Insights - Parkora AI" }] }),
  component: () => (
    <ProtectedRoute roles={["admin"]}>
      <AIInsights view="overview" />
    </ProtectedRoute>
  ),
});

export type AiView = "overview" | "pressure" | "actions" | "violations" | "counts";

const aiViewMeta: Record<AiView, { title: string; description: string }> = {
  overview: {
    title: "AI Insights",
    description: "ML-assisted pressure forecast and operational alerts.",
  },
  pressure: {
    title: "Parking Pressure Model",
    description: "Occupancy, visitor velocity, overstay risk and time-of-day weighting.",
  },
  actions: {
    title: "Recommended Actions",
    description: "Operational suggestions generated from live parking data.",
  },
  violations: {
    title: "Violation Detection",
    description: "Vehicles and visitors needing attention.",
  },
  counts: {
    title: "AI Counts",
    description: "Data volume feeding the AI insights dashboard.",
  },
};

export function AIInsights({ view = "overview" }: { view?: AiView }) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [modelData, violationData] = await Promise.all([
      getAiDashboard(),
      getViolations(),
    ]);

    if (modelData.success) setDashboard(modelData);
    setViolations(violationData.violations || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = dashboard?.counts || {};
  const model = dashboard?.model || {};
  const tone =
    model.level === "high"
      ? "destructive"
      : model.level === "moderate"
        ? "warning"
        : "success";
  const currentView = aiViewMeta[view] ? view : "overview";

  return (
    <div className="space-y-6">
      <PageHeader
        title={aiViewMeta[currentView].title}
        description={aiViewMeta[currentView].description}
        actions={
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        }
      />

      {currentView === "overview" && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pressure Score"
          value={model.pressureScore ?? 0}
          icon={Gauge}
          tone={tone as any}
        />
        <StatCard
          label="Active Vehicles"
          value={counts.activeVehicles || 0}
          icon={Activity}
        />
        <StatCard
          label="Visitor Vehicles"
          value={counts.visitorVehicles || 0}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Parking Issues"
          value={counts.parkingUnavailable || 0}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>}

      {currentView === "overview" && (
        <SectionCard title="Insight Pages" description="Open a focused AI page from the sidebar.">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <QuickPage to="/ai-insights/pressure" title="Pressure" desc="Forecast parking load." />
            <QuickPage to="/ai-insights/actions" title="Actions" desc="Operational suggestions." />
            <QuickPage to="/ai-insights/violations" title="Violations" desc="Review attention items." />
            <QuickPage to="/ai-insights/counts" title="Counts" desc="Inspect model inputs." />
          </div>
        </SectionCard>
      )}

      {(currentView === "pressure" || currentView === "actions") && (
      <div className="grid grid-cols-1 gap-6 max-w-7xl">
        {currentView === "pressure" && (
        <div id="pressure-model" className="scroll-mt-24">
          <SectionCard
            title="Parking Pressure Model"
            description="Uses occupancy, visitor velocity, overstay risk, and time-of-day weighting"
          actions={
              <StatusPill status={model.level || "healthy"} />
          }
          >
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Overall pressure</span>
                  <span>{model.pressureScore ?? 0}/100</span>
                </div>
                <Progress value={model.pressureScore || 0} />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric
                  label="Slot occupancy"
                  value={`${Math.round((model.occupancyRatio || 0) * 100)}%`}
                />
                <Metric
                  label="Visitor occupancy"
                  value={`${Math.round((model.visitorOccupancyRatio || 0) * 100)}%`}
                />
                <Metric
                  label="Requests/hour"
                  value={(model.requestVelocity || 0).toFixed(1)}
                />
                <Metric label="Overstay risk" value={model.overstayRisk || 0} />
              </div>
            </div>
          </SectionCard>
        </div>
        )}

        {currentView === "actions" && (
        <div id="actions" className="scroll-mt-24">
        <SectionCard
          title="Recommended Actions"
          description="Operational suggestions generated by the model"
          actions={<Sparkles className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {(model.actions || []).length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No urgent recommendations"
                description="Recommendations appear when the pressure model detects capacity or visitor-flow risk."
              />
            ) : (
              (model.actions || []).map((action: string, index: number) => (
                <div key={index} className="rounded-lg border p-3 text-sm">
                  {action}
                </div>
              ))
            )}
          </div>
        </SectionCard>
        </div>
        )}
      </div>
      )}

      {currentView === "violations" && (
      <div id="violations" className="scroll-mt-24">
      <SectionCard title="Violation Detection" description="Vehicles and visitors needing attention">
        <div className="space-y-3">
          {violations.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No violations detected"
              description="Overstays, mismatched parking usage, and unavailable-parking issues will be listed here."
            />
          ) : (
            violations.map((violation, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{violation.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {violation.message}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {violation.vehicle}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
      </div>
      )}

      {currentView === "counts" && (
      <div id="ai-counts" className="grid grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-24">
        <StatCard label="Total Slots" value={counts.slots || 0} icon={Zap} />
        <StatCard
          label="Resident Vehicles"
          value={counts.residentVehicles || 0}
          icon={Car}
        />
        <StatCard
          label="Pending Visitors"
          value={counts.pendingVisitors || 0}
          icon={Users}
          tone="warning"
        />
        <StatCard
          label="Total Visitors"
          value={counts.visitors || 0}
          icon={Users}
          tone="info"
        />
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
