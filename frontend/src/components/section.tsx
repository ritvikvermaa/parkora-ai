import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
      <div>
        <div className="mb-2 h-1 w-9 rounded-full bg-primary" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, description, children, actions, className, contentClassName }: {
  title: string; description?: string; children: ReactNode; actions?: ReactNode; className?: string; contentClassName?: string;
}) {
  return (
    <Card className={cn("shadow-card border-border/70 overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-4">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent className={cn("p-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
