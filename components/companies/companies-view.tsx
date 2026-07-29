"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { CompanySummary } from "@/app/actions/companies";

export function CompaniesView({ companies }: { companies: CompanySummary[] }) {
  const router = useRouter();

  function openCompanyContacts(name: string) {
    const filters = [{ field: "company", operator: "equals", value: name }];
    router.push(`/contacts?filters=${encodeURIComponent(JSON.stringify(filters))}`);
  }

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
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
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
              className="cursor-pointer"
              onClick={() => openCompanyContacts(company.name)}
            >
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
  );
}
