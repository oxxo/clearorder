"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Package,
  DollarSign,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/utils";

const navItems = [
  { label: "Orders", href: ROUTES.dashboard, icon: ClipboardList },
  { label: "Products", href: ROUTES.products, icon: Package },
  { label: "Fee Schedules", href: ROUTES.feeSchedules, icon: DollarSign },
  { label: "Documents", href: "#", icon: FileText, disabled: true, sprint: "Sprint 2" },
  { label: "Approvals", href: "#", icon: ShieldCheck, disabled: true, sprint: "Sprint 3" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-sidebar flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <ClipboardList className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg tracking-tight">ClearOrder</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/orders")
              : pathname.startsWith(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
                title={item.sprint}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wider opacity-60">
                  {item.sprint}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          ClearOrder v0.1 — Sprint 1
        </p>
      </div>
    </aside>
  );
}
