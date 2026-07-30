"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ContactCreateForm } from "./contact-create-form";

// Sentinel contactId that opens the panel — it only ever renders the "new
// contact" form now; viewing/editing an existing contact lives at
// /contacts/[id] instead. Kept as a sentinel (rather than a plain boolean
// prop) so callers that used to pass a real contact id here fail fast/loud
// rather than silently opening a blank form.
export const NEW_CONTACT_ID = "__new__";

export function ContactDetailPanel({
  contactId,
  onClose,
  onCreated,
}: {
  contactId: string | null;
  onClose: () => void;
  onCreated?: (contactId: string) => void;
}) {
  return (
    <Sheet open={contactId === NEW_CONTACT_ID} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New contact</SheetTitle>
          <SheetDescription>Fill in the fields below to create a lead.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ContactCreateForm onCreated={(id) => onCreated?.(id)} onCancel={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
