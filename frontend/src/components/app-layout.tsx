import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Shield, ShieldCheck, Car, Users, Sparkles, Settings,
  Search, Bell, Sun, Moon, Menu, X, LogOut, ChevronDown, ParkingSquare,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notifications, society } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const nav =
    user?.role === "admin"
      ? [
          { to: "/guard", label: "Guard", icon: ShieldCheck },
          { to: "/admin", label: "Admin", icon: Shield },
          { to: "/slots", label: "Parking Slots", icon: Car },
          { to: "/visitors", label: "Visitors", icon: Users },
          { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
          { to: "/settings", label: "Settings", icon: Settings },
        ]
      : user?.role === "guard"
      ? [
          { to: "/guard", label: "Guard", icon: ShieldCheck },
          { to: "/slots", label: "Parking Slots", icon: Car },
          { to: "/visitors", label: "Visitors", icon: Users },
          { to: "/settings", label: "Settings", icon: Settings },
        ]
      : [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/settings", label: "Settings", icon: Settings },
        ];

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
          collapsed ? "w-[76px]" : "w-[248px]"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
            <ParkingSquare className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold text-sidebar-foreground">Parkora AI</div>
              <div className="text-[11px] text-muted-foreground">{society.name}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-sidebar-accent"
          >
            <Menu className="h-4 w-4" />
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
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
                  <ParkingSquare className="h-5 w-5" />
                </div>
                <div className="font-semibold">Parkora AI</div>
              </div>

              <Button size="icon" variant="ghost" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;

                return (
                  <Link
                    key={item.to}
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
                );
              })}
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search slots, residents, vehicles…"
              className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b font-medium text-sm flex justify-between items-center">
                  Notifications <Badge variant="secondary">{notifications.length} new</Badge>
                </div>

                <div className="max-h-80 overflow-auto divide-y">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            n.type === "success" && "bg-success",
                            n.type === "info" && "bg-info",
                            n.type === "warning" && "bg-warning"
                          )}
                        />
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="ml-auto text-[11px] text-muted-foreground">{n.time}</div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 ml-4">{n.body}</p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-chart-5 text-primary-foreground grid place-items-center text-xs font-semibold">
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

        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}