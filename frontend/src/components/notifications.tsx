import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/dashboard-ui";
import { SectionCard } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type AppNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";

const toneDot: Record<AppNotification["type"], string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const toneBadge: Record<AppNotification["type"], string> = {
  info: "border-info/25 bg-info/10 text-info",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/15 text-warning-foreground",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(Math.round(diff / 60000), 0);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function NotificationToneDot({ type }: { type: AppNotification["type"] }) {
  return <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", toneDot[type])} />;
}

export function NotificationItem({
  notification,
  compact = false,
  onRead,
}: {
  notification: AppNotification;
  compact?: boolean;
  onRead?: (id: string) => void;
}) {
  const handleClick = async () => {
    if (!notification.isRead) {
      await markNotificationRead(notification._id);
      onRead?.(notification._id);
    }

    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left transition-colors hover:bg-muted/50",
        compact ? "px-3 py-3" : "rounded-lg border px-4 py-3",
        notification.isRead ? "opacity-80" : "bg-muted/20"
      )}
    >
      <div className="flex gap-3">
        <NotificationToneDot type={notification.type} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 font-medium text-sm">
              {notification.title}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {notification.message}
          </p>

          {!compact && (
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("capitalize", toneBadge[notification.type])}
              >
                {notification.category}
              </Badge>

              {!notification.isRead && (
                <span className="text-[11px] font-medium text-primary">Unread</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function DashboardNotifications({
  notifications,
  unreadCount,
  onRefresh,
}: {
  notifications: AppNotification[];
  unreadCount: number;
  onRefresh: () => void;
}) {
  const latest = notifications.slice(0, 5);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    onRefresh();
  };

  return (
    <SectionCard
      title="Notifications"
      description="Recent approvals, parking changes and system alerts"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant={unreadCount ? "default" : "secondary"}>
            {unreadCount} unread
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAll}
            disabled={!unreadCount}
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark read
          </Button>
        </div>
      }
    >
      {latest.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          description="Approvals, visitor movement and parking changes will appear here."
        />
      ) : (
        <div className="space-y-2">
          {latest.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onRead={onRefresh}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function DashboardNotificationsFeed() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(10);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 45000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <DashboardNotifications
      notifications={notifications}
      unreadCount={unreadCount}
      onRefresh={loadNotifications}
    />
  );
}

export function NotificationEmptyState() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Bell}
        title="All quiet"
        description="New parking, visitor and approval updates will show here."
      />
    </div>
  );
}
