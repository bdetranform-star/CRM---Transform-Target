"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { bulkUpdateStatus, bulkDeleteContacts } from "@/app/actions/contacts";
import { LEAD_STATUS_CONFIG } from "@/lib/status-config";

export function BulkActionBar({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone: () => void;
}) {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleStatusChange() {
    if (!status) return;
    setBusy(true);
    try {
      await bulkUpdateStatus({ ids: selectedIds, leadStatus: status });
      toast.success(`Updated ${selectedIds.length} contact(s)`);
      onDone();
    } catch {
      toast.error("Failed to update contacts");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${selectedIds.length} contact(s)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await bulkDeleteContacts({ ids: selectedIds });
      toast.success(`Deleted ${selectedIds.length} contact(s)`);
      onDone();
    } catch {
      toast.error("Failed to delete contacts");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--accent-teal)]/30 bg-[color-mix(in_srgb,var(--accent-teal)_6%,white)] px-4 py-2.5">
      <span className="text-sm font-medium">{selectedIds.length} selected</span>
      <div className="ml-auto flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Change status to..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" disabled={!status || busy} onClick={handleStatusChange}>
          Apply
        </Button>
        <Button size="sm" variant="destructive" disabled={busy} onClick={handleDelete}>
          Delete selected
        </Button>
      </div>
    </div>
  );
}
