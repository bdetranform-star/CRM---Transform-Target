"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Table2,
  Phone,
  Users2,
  MessageSquare,
  BarChart3,
  FileUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Board", icon: LayoutGrid },
  { href: "/contacts", label: "Contacts", icon: Table2 },
  { href: "/calls", label: "Call Queue", icon: Phone },
  { href: "/linkedin", label: "LinkedIn Tasks", icon: Users2 },
  { href: "/sms-templates", label: "SMS Templates", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/import-export", label: "Import / Export", icon: FileUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-navy text-navy-foreground">
      <div className="px-5 py-5">
        <p className="text-sm font-semibold tracking-wide">Transform Targets</p>
        <p className="text-xs text-white/50">CRM</p>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent-warm)] text-white"
                  : "text-white/70 hover:bg-navy-muted hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-navy-border px-3 py-3 text-[11px] text-white/40">
        IFM / Facility Maintenance outreach
      </div>
    </aside>
  );
}
