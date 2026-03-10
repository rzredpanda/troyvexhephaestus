"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  BookOpen,
  History,
  FileText,
  Heart,
  CheckSquare,
  Upload,
  Settings,
  Users,
  Layers,
} from "lucide-react";
import type { Role } from "@/lib/types";

const navItems = [
  { href: "/",               label: "Dashboard", icon: LayoutDashboard, roles: ["owner","admin","member"] as Role[] },
  { href: "/inventory",      label: "Inventory",  icon: Package,          roles: ["owner","admin","member"] as Role[] },
  { href: "/catalog",        label: "Catalog",    icon: BookOpen,         roles: ["owner","admin","member"] as Role[] },
  { href: "/history",        label: "History",    icon: History,          roles: ["owner","admin","member"] as Role[] },
  { href: "/logs/attempted", label: "Logs",       icon: FileText,         roles: ["owner","admin","member"] as Role[] },
  { href: "/wanted",         label: "Wanted",     icon: Heart,            roles: ["owner","admin","member"] as Role[] },
  { href: "/checklist",      label: "Checklist",  icon: CheckSquare,      roles: ["owner","admin","member"] as Role[] },
  { href: "/bom",            label: "BOM",        icon: Layers,           roles: ["owner","admin"] as Role[] },
  { href: "/import",         label: "Import",     icon: Upload,           roles: ["owner","admin"] as Role[] },
  { href: "/users",          label: "Users",      icon: Users,            roles: ["owner"] as Role[] },
  { href: "/settings",       label: "Settings",   icon: Settings,         roles: ["owner","admin","member"] as Role[] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const filtered = navItems.filter((i) => i.roles.includes(role));

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="px-5 py-4 border-b border-sidebar-border">
        <span className="font-heading text-xl font-bold text-sidebar-foreground">
          VEX Inventory
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {filtered.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
