"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { LinkedinBoardCard } from "./linkedin-board-card";
import type { LinkedinBoardContact } from "./linkedin-board-view";

export function LinkedinBoardColumn({
  stage,
  label,
  contacts,
  onCardClick,
}: {
  stage: string;
  label: string;
  contacts: LinkedinBoardContact[];
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/40 transition-colors",
        isOver && "border-[var(--accent-teal)] bg-[color-mix(in_srgb,var(--accent-teal)_8%,white)]"
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
          {contacts.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {contacts.map((contact) => (
          <LinkedinBoardCard key={contact.id} contact={contact} onClick={() => onCardClick(contact.id)} />
        ))}
        {contacts.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No contacts
          </div>
        )}
      </div>
    </div>
  );
}
