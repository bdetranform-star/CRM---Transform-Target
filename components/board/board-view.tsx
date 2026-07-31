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
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { updateContactStatus } from "@/app/actions/contacts";
import { LEAD_STATUS_ORDER, LEAD_STATUS_CONFIG } from "@/lib/status-config";
import type { LeadStatus, ChannelTag } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";
import {
  ContactDetailPanel,
  NEW_CONTACT_ID,
} from "@/components/contact-detail/contact-detail-panel";

export type BoardContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  company: string | null;
  email: string | null;
  leadStatus: LeadStatus;
  industry: string;
  contactOwner: string;
  sequenceStep: number;
  avatarUrl: string | null;
  channelTags: ChannelTag[];
};

export function BoardView({
  initialContacts,
}: {
  initialContacts: Record<string, BoardContact[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeContact, setActiveContact] = useState<BoardContact | null>(null);
  const [creating, setCreating] = useState(false);

  const [contactsByStatus, setOptimisticContactsByStatus] = useOptimistic(
    initialContacts,
    (
      state: Record<string, BoardContact[]>,
      action: { contactId: string; from: string; to: string }
    ) => {
      const next: Record<string, BoardContact[]> = {};
      for (const key of Object.keys(state)) next[key] = [...state[key]];

      const fromList = next[action.from];
      const idx = fromList.findIndex((c) => c.id === action.contactId);
      if (idx === -1) return next;
      const [moved] = fromList.splice(idx, 1);
      next[action.to] = [{ ...moved, leadStatus: action.to as LeadStatus }, ...next[action.to]];
      return next;
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const allContacts = useMemo(
    () => Object.values(contactsByStatus).flat(),
    [contactsByStatus]
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
    const targetStatus = String(over.id);
    const sourceStatus = allContacts.find((c) => c.id === contactId)?.leadStatus;
    if (!sourceStatus || sourceStatus === targetStatus) return;

    startTransition(() => {
      setOptimisticContactsByStatus({ contactId, from: sourceStatus, to: targetStatus });
    });

    updateContactStatus(contactId, targetStatus).catch(() => {
      toast.error("Failed to update lead status");
    });
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-x-auto p-6">
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New Contact
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-4">
            {LEAD_STATUS_ORDER.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                label={LEAD_STATUS_CONFIG[status].label}
                contacts={contactsByStatus[status] ?? []}
                onCardClick={(id) => router.push(`/contacts/${id}`)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeContact ? <BoardCard contact={activeContact} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
      <ContactDetailPanel
        contactId={creating ? NEW_CONTACT_ID : null}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false);
          router.push(`/contacts/${id}`);
        }}
      />
    </>
  );
}
