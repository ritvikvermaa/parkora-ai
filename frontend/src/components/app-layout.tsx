import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Shield, ShieldCheck, Car, Sparkles, Settings,
  Search, Bell, Sun, Moon, Menu, X, LogOut, ChevronDown, ParkingSquare,
  CheckCheck, Building2, CircleDot, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  NotificationEmptyState,
  NotificationItem,
} from "@/components/notifications";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { society } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import {
  type AppNotification,
  getNotifications,
  markAllNotificationsRead,
} from "@/services/notificationService";

export function AppLayout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const nav =
    user?.role === "admin"
      ? [
          { to: "/admin", label: "Admin", icon: Shield },
          { to: "/slots", label: "Parking Slots", icon: Car },
          { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
          { to: "/settings", label: "Settings", icon: Settings },
        ]
      : user?.role === "guard"
      ? [
          { to: "/guard", label: "Guard", icon: ShieldCheck },
          { to: "/settings", label: "Settings", icon: Settings },
        ]
      : [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/settings", label: "Settings", icon: Settings },
        ];

  const sectionNav: Record<string, { to: string; label: string }[]> = {
    "/admin": [
      { to: "/admin/operations", label: "Operations" },
      { to: "/admin/approvals", label: "Approvals" },
      { to: "/admin/analytics", label: "Analytics" },
      { to: "/admin/residents", label: "Residents" },
      { to: "/admin/activity", label: "Activity" },
    ],
    "/slots": [
      { to: "/slots/summary", label: "Summary" },
      { to: "/slots/search", label: "Search & Filters" },
      { to: "/slots/jade", label: "Jade" },
      { to: "/slots/topaz", label: "Topaz" },
      { to: "/slots/nest", label: "Nest" },
      { to: "/slots/opal", label: "Opal" },
    ],
    "/guard": [
      { to: "/guard/entry", label: "Entry Request" },
      { to: "/guard/exit", label: "Visitor Exit" },
      { to: "/guard/search", label: "Quick Search" },
      { to: "/guard/visitors", label: "Visitors" },
      { to: "/guard/residents", label: "Residents" },
    ],
    "/dashboard": [
      { to: "/dashboard/vehicles", label: "My Vehicles" },
      { to: "/dashboard/visitors", label: "Visitor Vehicles" },
      { to: "/dashboard/requests", label: "Entry Requests" },
      { to: "/dashboard/history", label: "Visitor History" },
      { to: "/dashboard/slots", label: "Assigned Slots" },
    ],
    "/ai-insights": [
      { to: "/ai-insights/pressure", label: "Pressure Model" },
      { to: "/ai-insights/actions", label: "Actions" },
      { to: "/ai-insights/violations", label: "Violations" },
      { to: "/ai-insights/counts", label: "Counts" },
    ],
    "/settings": [
      { to: "/settings/profile", label: "Profile" },
      { to: "/settings/appearance", label: "Appearance" },
      { to: "/settings/notifications", label: "Notifications" },
      { to: "/settings/society", label: "Society" },
    ],
  };

  const activeNav = nav.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const activeBase = activeNav?.to;
  const activeSections = activeBase ? sectionNav[activeBase] || [] : [];
  const activeSection = activeSections.find((item) => pathname === item.to);
  const workspaceLabel = activeSection?.label || activeNav?.label || "Workspace";
  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : "User";

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotificationsLoading(true);

    try {
      const data = await getNotifications(20);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (!user) return undefined;

    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [user?.id, pathname]);

  const markAllRead = async () => {
    await markAllNotificationsRead();
    loadNotifications();
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar/95 transition-[width] duration-300",
          collapsed ? "w-[76px]" : "w-[264px]"
        )}
      >
        <div className="min-h-20 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft">
            <ParkingSquare className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="text-[11px] font-medium uppercase text-muted-foreground">
                Parkora AI
              </div>
              <div className="truncate font-semibold text-sidebar-foreground">
                {society.name}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CircleDot className="h-3 w-3 text-success" />
                Live operations
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;

            return (
              <div key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
                {active && !collapsed && activeSections.length > 0 && (
                  <div className="ml-7 mt-1 mb-2 space-y-0.5 border-l border-sidebar-border pl-2">
                    {activeSections.map((section) => (
                      <Link
                        key={section.to}
                        to={section.to}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          pathname === section.to
                            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {section.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="space-y-3 p-3 border-t border-sidebar-border">
          {!collapsed && (
            <div className="rounded-lg border border-sidebar-border bg-background/55 p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Building2 className="h-4 w-4 text-primary" />
                Smartworld Gems
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Jade, Topaz, Nest and Opal parking control
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-sidebar-accent"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />

          <aside className="relative w-72 bg-sidebar border-r border-sidebar-border p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                  <ParkingSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Parkora AI</div>
                  <div className="font-semibold leading-tight">{society.name}</div>
                </div>
              </div>

              <Button size="icon" variant="ghost" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);

                return (
                  <div key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                    {active && activeSections.length > 0 && (
                      <div className="ml-7 mb-2 space-y-0.5">
                        {activeSections.map((section) => (
                          <Link
                            key={section.to}
                            to={section.to}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "block rounded-md px-2 py-1 text-xs hover:bg-sidebar-accent",
                              pathname === section.to
                                ? "bg-sidebar-accent text-sidebar-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {section.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/90 backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden xl:flex min-w-0 items-center gap-3">
            <div className="h-9 w-9 rounded-lg border bg-card grid place-items-center text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{workspaceLabel}</div>
              <div className="text-xs text-muted-foreground">
                {roleLabel} workspace
              </div>
            </div>
          </div>

          <div className="relative max-w-xl w-full hidden sm:block xl:ml-3">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search slots, residents, vehicles..."
              className="pl-9 bg-muted/45 border-transparent focus-visible:bg-background"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden md:inline-flex capitalize bg-card">
              {roleLabel}
            </Badge>
            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-[360px] p-0">
                <div className="flex items-center justify-between gap-3 border-b p-3">
                  <div>
                    <div className="text-sm font-medium">Notifications</div>
                    <div className="text-xs text-muted-foreground">
                      Visitor, parking and approval updates
                    </div>
                  </div>

                  <Badge variant={unreadCount ? "default" : "secondary"}>
                    {unreadCount} unread
                  </Badge>
                </div>

                <div className="max-h-96 overflow-auto divide-y">
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <NotificationEmptyState />
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        compact
                        onRead={loadNotifications}
                      />
                    ))
                  )}
                </div>

                <div className="border-t p-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={markAllRead}
                    disabled={!unreadCount}
                  >
                    <CheckCheck className="mr-1 h-4 w-4" />
                    Mark all as read
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border bg-card pl-1 pr-2 py-1 shadow-soft transition-colors hover:bg-muted">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user?.name || "User"}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {user?.email || ""}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal capitalize">
                    {user?.role || ""}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/settings">Profile & Settings</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 bg-muted/20 p-4 md:p-6 lg:p-8 animate-fade-in">
          <div className="mx-auto w-full max-w-[1480px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
