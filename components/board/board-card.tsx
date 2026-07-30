"use client";

import { useDraggable } from "@dnd-kit/core";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { INDUSTRY_LABELS, SEQUENCE_STEPS } from "@/lib/status-config";
import { ContactAvatar } from "@/components/contact-avatar";
import type { BoardContact } from "./board-view";
import type { Industry } from "@prisma/client";

export function BoardCard({
  contact,
  onClick,
  overlay,
}: {
  contact: BoardContact;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-md border border-border bg-white p-3 shadow-sm transition-shadow active:cursor-grabbing",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-lg"
      )}
    >
      <div className="flex items-center gap-2">
        <ContactAvatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          avatarUrl={contact.avatarUrl}
          size={24}
        />
        <p className="truncate text-sm font-medium">
          {contact.firstName} {contact.lastName}
        </p>
      </div>
      {contact.company && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="size-3" />
          {contact.company}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {INDUSTRY_LABELS[contact.industry as Industry] ?? contact.industry}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Step: {SEQUENCE_STEPS[Math.min(contact.sequenceStep, 3)]?.label ?? "Done"}
        </span>
      </div>
    </div>
  );
}
