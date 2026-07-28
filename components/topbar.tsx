"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar({ userEmail, userName }: { userEmail?: string | null; userName?: string | null }) {
  const initials = (userName || userEmail || "?").slice(0, 2).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{userName || userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
