"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, PencilLine } from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AvatarCluster } from "@/components/contact-avatar";
import type { CompanySummary } from "@/app/actions/companies";
import { CompanyBulkEditDialog } from "./company-bulk-edit-dialog";

export function CompaniesView({ companies }: { companies: CompanySummary[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  function openCompanyContacts(name: string) {
    const filters = [{ field: "company", operator: "equals", value: name }];
    router.push(`/contacts?filters=${encodeURIComponent(JSON.stringify(filters))}`);
  }

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === companies.length ? new Set() : new Set(companies.map((c) => c.name))));
  }

  const selectedCompanies = useMemo(
    () => companies.filter((c) => selected.has(c.name)),
    [companies, selected]
  );

  if (companies.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No companies yet</p>
          <p className="text-sm text-muted-foreground">
            Companies appear here once contacts have a Company Name set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--accent-teal)]/30 bg-[color-mix(in_srgb,var(--accent-teal)_6%,white)] px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkEditOpen(true)}>
              <PencilLine className="size-4" />
              Bulk edit
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size > 0 && selected.size === companies.length}
                  onCheckedChange={toggleAll}
                  aria-label="Select all companies"
                />
              </TableHead>
              <TableHead className="w-16"></TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Country</TableHead>
              <TableHead># Employees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow
                key={company.name}
                data-state={selected.has(company.name) && "selected"}
                className="cursor-pointer"
                onClick={() => openCompanyContacts(company.name)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(company.name)}
                    onCheckedChange={() => toggle(company.name)}
                    aria-label={`Select ${company.name}`}
                  />
                </TableCell>
                <TableCell>
                  <AvatarCluster people={company.avatars} totalCount={company.contactCount} size={28} />
                </TableCell>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.contactCount}</TableCell>
                <TableCell>{company.city ?? "—"}</TableCell>
                <TableCell>{company.state ?? "—"}</TableCell>
                <TableCell>{company.country ?? "—"}</TableCell>
                <TableCell>{company.numberOfEmployees?.toLocaleString() ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CompanyBulkEditDialog
        companies={selectedCompanies}
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onApplied={() => {
          setSelected(new Set());
          router.refresh();
        }}
      />
    </div>
  );
}
