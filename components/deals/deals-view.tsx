"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Handshake } from "lucide-react";
import type { Deal } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DealFormDialog } from "./deal-form-dialog";
import { DEAL_STAGE_LABELS } from "@/lib/status-config";

type DealWithContact = Deal & {
  contact: { id: string; firstName: string; lastName: string | null; company: string | null };
};
type ContactOption = { id: string; firstName: string; lastName: string | null; company: string | null };

const STAGE_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  NEW: "outline",
  QUALIFIED: "secondary",
  PROPOSAL_SENT: "secondary",
  NEGOTIATION: "default",
  WON: "default",
  LOST: "destructive",
};

export function DealsView({
  initialDeals,
  contacts,
}: {
  initialDeals: DealWithContact[];
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  function setStageFilter(stage: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (stage === "ALL") next.delete("stage");
    else next.set("stage", stage);
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleNew() {
    setEditingDeal(null);
    setDialogOpen(true);
  }

  function handleEdit(deal: Deal) {
    setEditingDeal(deal);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Select value={searchParams.get("stage") ?? "ALL"} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stages</SelectItem>
            {Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={handleNew}>
          <Plus className="size-4" />
          New Deal
        </Button>
      </div>

      {initialDeals.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Handshake className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No deals yet</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialDeals.map((deal) => (
                <TableRow key={deal.id} className="cursor-pointer" onClick={() => handleEdit(deal)}>
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  <TableCell>
                    {deal.contact.firstName} {deal.contact.lastName ?? ""}
                    {deal.contact.company ? ` — ${deal.contact.company}` : ""}
                  </TableCell>
                  <TableCell>{deal.value ? `$${Number(deal.value).toLocaleString()}` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STAGE_BADGE_VARIANT[deal.stage]}>{DEAL_STAGE_LABELS[deal.stage]}</Badge>
                  </TableCell>
                  <TableCell>{new Date(deal.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DealFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editingDeal}
        contacts={contacts}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
