"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, Users2, MessageSquare, ExternalLink, Undo2 } from "lucide-react";
import type { Contact, Touch } from "@prisma/client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getContactDetail } from "@/app/actions/contacts";
import { markSmsReplied } from "@/app/actions/touches";
import { SequenceProgress } from "./sequence-progress";
import { TouchTimeline } from "./touch-timeline";
import { ContactEditForm } from "./contact-edit-form";
import { ContactCreateForm } from "./contact-create-form";
import { LogCallDialog } from "./log-call-dialog";
import { LogLinkedinDialog } from "./log-linkedin-dialog";
import { SendSmsDialog } from "./send-sms-dialog";

type ContactWithTouches = Contact & { touches: Touch[] };

// Sentinel contactId that opens the panel in "create a new contact" mode
// instead of loading an existing one.
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
  const isCreating = contactId === NEW_CONTACT_ID;
  const [contact, setContact] = useState<ContactWithTouches | null>(null);
  const [loading, setLoading] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [linkedinDialogOpen, setLinkedinDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!contactId || isCreating) return;
    setLoading(true);
    const data = await getContactDetail(contactId);
    setContact(data);
    setLoading(false);
  }, [contactId, isCreating]);

  useEffect(() => {
    if (contactId && !isCreating) {
      refresh();
    } else {
      setContact(null);
    }
  }, [contactId, isCreating, refresh]);

  async function handleReplyLogged() {
    if (!contact) return;
    const optOut = confirm(
      "Was this reply a STOP / opt-out request? Click OK to mark this contact as opted out of SMS, or Cancel to just log the reply."
    );
    try {
      await markSmsReplied({ contactId: contact.id, optOut });
      toast.success("Reply logged");
      refresh();
    } catch {
      toast.error("Failed to log reply");
    }
  }

  return (
    <Sheet open={!!contactId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {isCreating && (
          <>
            <SheetHeader>
              <SheetTitle>New contact</SheetTitle>
              <SheetDescription>Fill in the fields below to create a lead.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ContactCreateForm
                onCreated={(id) => onCreated?.(id)}
                onCancel={onClose}
              />
            </div>
          </>
        )}
        {!isCreating && loading && !contact && (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        )}
        {!isCreating && contact && (
          <>
            <SheetHeader>
              <SheetTitle>
                {contact.firstName} {contact.lastName}
              </SheetTitle>
              <SheetDescription>
                {contact.company || "No company"} · {contact.email}
              </SheetDescription>
              {contact.smsOptOut && (
                <Badge variant="destructive" className="w-fit">
                  SMS opted out
                </Badge>
              )}
            </SheetHeader>

            <div className="flex flex-wrap gap-2 border-b border-border px-6 py-3">
              <Button size="sm" variant="outline" onClick={() => setCallDialogOpen(true)}>
                <Phone className="size-4" />
                Log a call
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLinkedinDialogOpen(true)}>
                <Users2 className="size-4" />
                Log LinkedIn touch
              </Button>
              {!contact.smsOptOut && (
                <Button size="sm" variant="outline" onClick={() => setSmsDialogOpen(true)}>
                  <MessageSquare className="size-4" />
                  Send SMS
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleReplyLogged}>
                <Undo2 className="size-4" />
                Reply logged
              </Button>
              {contact.linkedinUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Open LinkedIn profile
                  </a>
                </Button>
              )}
            </div>

            <div className="border-b border-border px-6 py-4">
              <SequenceProgress sequenceStep={contact.sequenceStep} />
            </div>

            <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
              <div className="px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">Touch history</TabsTrigger>
                </TabsList>
              </div>
              <Separator className="mt-3" />
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="details">
                  <ContactEditForm contact={contact} onSaved={refresh} onDeleted={onClose} />
                </TabsContent>
                <TabsContent value="history">
                  <TouchTimeline touches={contact.touches} />
                </TabsContent>
              </div>
            </Tabs>

            <LogCallDialog
              contactId={contact.id}
              open={callDialogOpen}
              onOpenChange={setCallDialogOpen}
              onLogged={refresh}
            />
            <LogLinkedinDialog
              contactId={contact.id}
              open={linkedinDialogOpen}
              onOpenChange={setLinkedinDialogOpen}
              onLogged={refresh}
            />
            <SendSmsDialog
              contactId={contact.id}
              contact={contact}
              open={smsDialogOpen}
              onOpenChange={setSmsDialogOpen}
              onSent={refresh}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
