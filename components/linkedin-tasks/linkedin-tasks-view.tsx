"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Users2 } from "lucide-react";
import type { Contact } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { logLinkedinTouch } from "@/app/actions/touches";

const LINKEDIN_OUTCOMES = [
  { value: "CONNECTION_SENT", label: "Connection Sent" },
  { value: "CONNECTED", label: "Connected" },
  { value: "MESSAGE_SENT", label: "Message Sent" },
  { value: "REPLIED", label: "Replied" },
] as const;

export function LinkedinTasksView({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [outcomeByContact, setOutcomeByContact] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function getOutcome(id: string) {
    return outcomeByContact[id] ?? "CONNECTION_SENT";
  }

  async function handleLogTouch(contactId: string) {
    const outcome = getOutcome(contactId);
    setSavingId(contactId);
    try {
      await logLinkedinTouch({ contactId, outcome });
      toast.success("LinkedIn touch logged");
      if (outcome === "CONNECTED" || outcome === "REPLIED") {
        setContacts((cs) => cs.filter((c) => c.id !== contactId));
      }
    } catch {
      toast.error("Failed to log touch");
    } finally {
      setSavingId(null);
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Users2 className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No LinkedIn tasks pending</p>
          <p className="text-sm text-muted-foreground">
            All contacts are past this step in the sequence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>LinkedIn</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">
                {contact.firstName} {contact.lastName}
              </TableCell>
              <TableCell>{contact.company ?? "—"}</TableCell>
              <TableCell>
                {contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--channel-linkedin)] hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    Profile
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Select
                  value={getOutcome(contact.id)}
                  onValueChange={(v) =>
                    setOutcomeByContact((prev) => ({ ...prev, [contact.id]: v }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINKEDIN_OUTCOMES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleLogTouch(contact.id)}
                  disabled={savingId === contact.id}
                >
                  Log touch
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
