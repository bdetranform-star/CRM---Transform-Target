"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Table2,
  Building2,
  Handshake,
  ListChecks,
  Activity,
  BarChart3,
  ChevronDown,
  Phone,
  Users2,
  MessageSquare,
  FileUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/contacts", label: "Contacts", icon: Table2 },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/activity-feed", label: "Activity Feed", icon: Activity },
  { href: "/dashboard", label: "Dashboards", icon: BarChart3 },
];

// Legacy channel-specific tools, tucked under "More" rather than the
// top-level nav — still fully functional, just not part of the primary IA.
const MORE_ITEMS = [
  { href: "/calls", label: "Call Queue", icon: Phone },
  { href: "/linkedin", label: "LinkedIn Tasks", icon: Users2 },
  { href: "/sms-templates", label: "SMS Templates", icon: MessageSquare },
  { href: "/import-export", label: "Import / Export", icon: FileUp },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[var(--accent-warm)] text-white"
          : "text-white/70 hover:bg-navy-muted hover:text-white"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({ logo }: { logo?: ReactNode }) {
  const pathname = usePathname();
  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href));
  const [moreOpen, setMoreOpen] = useState(isMoreActive);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-navy text-navy-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        {logo}
        <div>
          <p className="text-sm font-semibold tracking-wide">Transform Targets</p>
          <p className="text-xs text-white/50">CRM</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
          />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isMoreActive && !moreOpen
              ? "bg-[var(--accent-warm)] text-white"
              : "text-white/70 hover:bg-navy-muted hover:text-white"
          )}
        >
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", moreOpen && "rotate-180")} />
          More
        </button>
        {moreOpen && (
          <div className="ml-2 space-y-0.5 border-l border-navy-border pl-2">
            {MORE_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </div>
        )}
      </nav>
      <div className="border-t border-navy-border px-3 py-3 text-[11px] text-white/40">
        IFM / Facility Maintenance outreach
      </div>
    </aside>
  );
}
