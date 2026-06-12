import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NoticeTone = "success" | "warning" | "info" | "destructive";

const toneClass: Record<NoticeTone, string> = {
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/15 text-warning-foreground",
  info: "border-info/25 bg-info/10 text-info",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

const toneIcon: Record<NoticeTone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
  destructive: AlertCircle,
};

export function InlineNotice({
  tone = "info",
  title,
  children,
  onDismiss,
}: {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const Icon = toneIcon[tone];

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", toneClass[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          {title && <div className="font-medium">{title}</div>}
          <div className={cn(title && "mt-0.5", "text-current/80")}>{children}</div>
        </div>
        {onDismiss && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="-mr-2 -mt-1 h-7 w-7 text-current hover:bg-background/40"
            onClick={onDismiss}
            aria-label="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-muted/20 px-4 py-7 text-center",
        className
      )}
    >
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-md border bg-background text-muted-foreground shadow-soft">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      {description && (
        <div className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    approved: "border-success/30 bg-success/10 text-success",
    available: "border-success/30 bg-success/10 text-success",
    parked: "border-success/30 bg-success/10 text-success",
    occupied: "border-destructive/30 bg-destructive/10 text-destructive",
    rejected: "border-destructive/30 bg-destructive/10 text-destructive",
    pending: "border-warning/35 bg-warning/15 text-warning-foreground",
    reserved: "border-warning/35 bg-warning/15 text-warning-foreground",
    parking_unavailable: "border-warning/35 bg-warning/15 text-warning-foreground",
    visitor: "border-info/30 bg-info/10 text-info",
    resident: "border-primary/25 bg-primary/10 text-primary",
    exited: "border-border bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        map[normalized] || "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </div>
  );
}
