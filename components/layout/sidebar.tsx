"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ArrowDownFromLine, ArrowLeftRight,
  BookOpen, Heart, CheckSquare, History, FileText,
  Upload, Settings,
} from "lucide-react";
import type { Role } from "@/lib/types";

type NavItem = { href: string; label: string; icon: React.ElementType; roles: Role[] };

const sections: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard,  roles: ["owner","admin","member"] },
      { href: "/inventory",   label: "Inventory",   icon: Package,           roles: ["owner","admin","member"] },
      { href: "/withdrawals", label: "Withdrawals", icon: ArrowDownFromLine, roles: ["owner","admin"] },
      { href: "/trades",      label: "Trades",      icon: ArrowLeftRight,    roles: ["owner","admin"] },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/catalog",   label: "Catalog",   icon: BookOpen,    roles: ["owner","admin","member"] },
      { href: "/wanted",    label: "Wanted",    icon: Heart,       roles: ["owner","admin","member"] },
      { href: "/checklist", label: "Checklist", icon: CheckSquare, roles: ["owner","admin","member"] },
    ],
  },
  {
    label: "Activity",
    items: [
      { href: "/history",        label: "History", icon: History,  roles: ["owner","admin","member"] },
      { href: "/logs/attempted", label: "Logs",    icon: FileText, roles: ["owner","admin","member"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/import",   label: "Import",   icon: Upload,   roles: ["owner","admin"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["owner","admin","member"] },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo — links to dashboard */}
      <Link href="/dashboard" className="flex h-14 items-center gap-2.5 px-4 border-b border-[hsl(var(--sidebar-border))] hover:opacity-80 transition-opacity">
        <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
          <Package className="h-3.5 w-3.5 text-white/80" />
        </div>
        <span className="text-sm font-semibold text-white/90 tracking-tight truncate">
          VEX Inventory
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section, si) => {
          const visible = section.items.filter((i) => i.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={si} className={cn("px-2", si > 0 && "mt-4")}>
              {section.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visible.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-white/10 text-white"
                          : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/[0.06] hover:text-white/90"
                      )}
                    >
                      <Icon className={cn(
                        "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                        active ? "text-white" : "text-white/35 group-hover:text-white/65"
                      )} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
