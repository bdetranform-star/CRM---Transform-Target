"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Users2,
  MessageSquare,
  ExternalLink,
  Undo2,
  Trash2,
  Camera,
} from "lucide-react";
import type { Contact, ContactChatMessage, Touch, Deal, Task } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContactAvatar } from "@/components/contact-avatar";
import { deleteContact } from "@/app/actions/contacts";
import { markSmsReplied } from "@/app/actions/touches";
import { SequenceProgress } from "./sequence-progress";
import { TouchTimeline } from "./touch-timeline";
import { ActivityTimelineTab } from "./activity-timeline-tab";
import { ContactInsightsPanel } from "./contact-insights-panel";
import {
  ContactInfoSection,
  CompanyInfoSection,
  LeadInfoSection,
  LinkedinOutreachSection,
  DatesSection,
} from "./property-sections";
import { LogCallDialog } from "./log-call-dialog";
import { LogLinkedinDialog } from "./log-linkedin-dialog";
import { SendSmsDialog } from "./send-sms-dialog";
import { AvatarUploadDialog } from "./avatar-upload-dialog";

type ContactDetail = Contact & { touches: Touch[]; deals: Deal[]; tasks: Task[] };

/** Strips the protocol/trailing slash for display; the href keeps the real URL. */
function formatUrlLabel(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function toHref(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export function ContactDetailPageView({
  contact,
  initialChatMessages,
}: {
  contact: ContactDetail;
  initialChatMessages: ContactChatMessage[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [linkedinDialogOpen, setLinkedinDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function handleReplyLogged() {
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

  async function handleDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    try {
      await deleteContact(contact.id);
      toast.success("Contact deleted");
      router.push("/contacts");
    } catch {
      toast.error("Failed to delete contact");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <Link
          href="/contacts"
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Contacts
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              <span>{contact.company || "No company"}</span>
              {contact.email && (
                <>
                  <span>·</span>
                  <span>{contact.email}</span>
                </>
              )}
              {contact.websiteUrl && (
                <>
                  <span>·</span>
                  <a
                    href={toHref(contact.websiteUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-teal)] hover:underline"
                  >
                    {formatUrlLabel(contact.websiteUrl)}
                  </a>
                </>
              )}
              {contact.linkedinUrl && (
                <>
                  <span>·</span>
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-teal)] hover:underline"
                  >
                    LinkedIn
                  </a>
                </>
              )}
            </div>
            {contact.smsOptOut && (
              <Badge variant="destructive" className="mt-1 w-fit">
                SMS opted out
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>
        <div className="mt-4 max-w-xl">
          <SequenceProgress sequenceStep={contact.sequenceStep} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-[320px] shrink-0 overflow-y-auto border-r border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAvatarDialogOpen(true)}
              className="group relative rounded-full"
              aria-label="Change photo"
            >
              <ContactAvatar
                id={contact.id}
                firstName={contact.firstName}
                lastName={contact.lastName}
                avatarUrl={contact.avatarUrl}
                size={48}
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-4" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {contact.firstName} {contact.lastName}
              </p>
              {contact.jobTitle && <p className="truncate text-xs text-muted-foreground">{contact.jobTitle}</p>}
              {contact.company && <p className="truncate text-xs text-muted-foreground">{contact.company}</p>}
            </div>
          </div>

          <ContactInfoSection contact={contact} onSaved={refresh} />
          <CompanyInfoSection contact={contact} onSaved={refresh} />
          <LeadInfoSection contact={contact} onSaved={refresh} />
          <LinkedinOutreachSection contact={contact} onSaved={refresh} />
          <DatesSection contact={contact} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border bg-white px-6 pt-3">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="flex flex-col gap-6">
                <ContactInsightsPanel contact={contact} initialChatMessages={initialChatMessages} />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Recent activity</h3>
                    <button
                      type="button"
                      onClick={() => setTab("activities")}
                      className="text-xs font-medium text-[var(--accent-teal)] hover:underline"
                    >
                      See all activity
                    </button>
                  </div>
                  <TouchTimeline touches={contact.touches.slice(0, 5)} />
                </div>
              </TabsContent>
              <TabsContent value="activities">
                <ActivityTimelineTab contactId={contact.id} touches={contact.touches} onLogged={refresh} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

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
      <AvatarUploadDialog
        contactId={contact.id}
        firstName={contact.firstName}
        lastName={contact.lastName}
        currentAvatarUrl={contact.avatarUrl}
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        onChanged={refresh}
      />
    </div>
  );
}
