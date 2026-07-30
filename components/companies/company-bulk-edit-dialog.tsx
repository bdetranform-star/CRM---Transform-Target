"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { INDUSTRY_LABELS, TEAM_MEMBER_LABELS } from "@/lib/status-config";
import { bulkUpdateCompanyProperty, type CompanySummary } from "@/app/actions/companies";

type CompanyBulkEditField = "industry" | "contactOwner";

const FIELD_META: Record<CompanyBulkEditField, { label: string; options: Record<string, string> }> = {
  industry: { label: "Industry", options: INDUSTRY_LABELS },
  contactOwner: { label: "Contact Owner", options: TEAM_MEMBER_LABELS },
};

/**
 * Companies-level bulk edit: unlike the Contacts table's multi-property
 * BulkEditDialog, this is deliberately single-property-at-a-time (Industry
 * or Contact Owner, the two properties the task called out as meaningful at
 * the company level) — a company "row" is really a group of Contact rows
 * sharing a company name, so applying a change here fans out to every
 * Contact under the selected companies via `bulkUpdateCompanyProperty()`.
 */
export function CompanyBulkEditDialog({
  companies,
  open,
  onOpenChange,
  onApplied,
}: {
  /** Only the currently-selected companies, not the full list. */
  companies: CompanySummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}) {
  const [field, setField] = useState<CompanyBulkEditField>("industry");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<"edit" | "review">("edit");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setField("industry");
    setValue("");
    setStage("edit");
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const companyWord = companies.length === 1 ? "company" : "companies";
  const totalContacts = companies.reduce((sum, c) => sum + c.contactCount, 0);
  const fieldMeta = FIELD_META[field];
  const mixedCompanies = companies.filter((c) => (field === "industry" ? c.industryMixed : c.contactOwnerMixed));
  const newValueLabel = fieldMeta.options[value] ?? value;

  async function handleApply() {
    setSubmitting(true);
    try {
      const count = await bulkUpdateCompanyProperty({
        companyNames: companies.map((c) => c.name),
        field,
        value,
      });
      toast.success(`Updated ${count} contact${count === 1 ? "" : "s"} across ${companies.length} ${companyWord}`);
      onApplied();
      handleClose(false);
    } catch {
      toast.error("Failed to apply bulk edit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Bulk edit {companies.length} {companyWord}
          </DialogTitle>
        </DialogHeader>

        {stage === "edit" ? (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Property</label>
                <Select
                  value={field}
                  onValueChange={(v) => {
                    setField(v as CompanyBulkEditField);
                    setValue("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="contactOwner">Contact Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">New value</label>
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldMeta.options).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mixedCompanies.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {mixedCompanies.length} of {companies.length} selected {companyWord} currently have mixed{" "}
                    {fieldMeta.label} values across their contacts — this will set all of them to the same value.
                  </span>
                </div>
              )}

              <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 text-sm">
                {companies.map((c) => {
                  const mixed = field === "industry" ? c.industryMixed : c.contactOwnerMixed;
                  const current = field === "industry" ? c.industry : c.contactOwner;
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-2 px-1 py-1">
                      <span className="truncate">{c.name}</span>
                      <span className={mixed ? "font-medium text-amber-700" : "text-muted-foreground"}>
                        {mixed ? "Mixed" : current ? fieldMeta.options[current] : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button disabled={!value} onClick={() => setStage("review")}>
                Review changes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                This will set <span className="font-medium text-foreground">{fieldMeta.label}</span> to{" "}
                <span className="font-medium text-foreground">{newValueLabel}</span> for every contact under{" "}
                {companies.length} selected {companyWord} ({totalContacts} contact{totalContacts === 1 ? "" : "s"}{" "}
                total).
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStage("edit")} disabled={submitting}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={submitting}>
                {submitting ? "Applying..." : "Apply changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
