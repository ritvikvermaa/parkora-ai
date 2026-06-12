import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, delta, tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: { value: string; positive?: boolean };
  tone?: "default" | "success" | "warning" | "info" | "destructive";
}) {
  const toneMap: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="group shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg border-border/70">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
            {delta && (
              <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium",
                delta.positive ? "text-success" : "text-destructive")}>
                {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta.value}
              </div>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-lg grid place-items-center ring-1 ring-inset ring-current/10 transition-transform group-hover:scale-105", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
