"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { updateContactLinkedinLifecycleStage } from "@/app/actions/contacts";
import { LINKEDIN_LIFECYCLE_STAGE_ORDER, LINKEDIN_LIFECYCLE_STAGE_LABELS } from "@/lib/status-config";
import type { LinkedinLifecycleStage } from "@prisma/client";
import { LinkedinBoardColumn } from "./linkedin-board-column";
import { LinkedinBoardCard } from "./linkedin-board-card";

export type LinkedinBoardContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  company: string | null;
  email: string;
  linkedinLifecycleStage: LinkedinLifecycleStage;
  linkedinConnectionStatus: string | null;
  contactOwner: string;
  avatarUrl: string | null;
};

export function LinkedinBoardView({
  initialContacts,
}: {
  initialContacts: Record<string, LinkedinBoardContact[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeContact, setActiveContact] = useState<LinkedinBoardContact | null>(null);

  const [contactsByStage, setOptimisticContactsByStage] = useOptimistic(
    initialContacts,
    (
      state: Record<string, LinkedinBoardContact[]>,
      action: { contactId: string; from: string; to: string }
    ) => {
      const next: Record<string, LinkedinBoardContact[]> = {};
      for (const key of Object.keys(state)) next[key] = [...state[key]];

      const fromList = next[action.from];
      const idx = fromList.findIndex((c) => c.id === action.contactId);
      if (idx === -1) return next;
      const [moved] = fromList.splice(idx, 1);
      next[action.to] = [
        { ...moved, linkedinLifecycleStage: action.to as LinkedinLifecycleStage },
        ...next[action.to],
      ];
      return next;
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const allContacts = useMemo(
    () => Object.values(contactsByStage).flat(),
    [contactsByStage]
  );

  function handleDragStart(event: DragStartEvent) {
    const contact = allContacts.find((c) => c.id === event.active.id);
    setActiveContact(contact ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveContact(null);
    const { active, over } = event;
    if (!over) return;

    const contactId = String(active.id);
    const targetStage = String(over.id);
    const sourceStage = allContacts.find((c) => c.id === contactId)?.linkedinLifecycleStage;
    if (!sourceStage || sourceStage === targetStage) return;

    startTransition(() => {
      setOptimisticContactsByStage({ contactId, from: sourceStage, to: targetStage });
    });

    updateContactLinkedinLifecycleStage(contactId, targetStage).catch(() => {
      toast.error("Failed to update LinkedIn lifecycle stage");
    });
  }

  return (
    <div className="flex h-full flex-col overflow-x-auto p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4">
          {LINKEDIN_LIFECYCLE_STAGE_ORDER.map((stage) => (
            <LinkedinBoardColumn
              key={stage}
              stage={stage}
              label={LINKEDIN_LIFECYCLE_STAGE_LABELS[stage]}
              contacts={contactsByStage[stage] ?? []}
              onCardClick={(id) => router.push(`/contacts/${id}`)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeContact ? <LinkedinBoardCard contact={activeContact} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
