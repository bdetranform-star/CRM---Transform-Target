"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { contactColumns, type ContactRow } from "./columns";
import { BulkActionBar } from "./bulk-action-bar";
import { ContactDetailPanel } from "@/components/contact-detail/contact-detail-panel";
import { INDUSTRY_LABELS, LEAD_STATUS_CONFIG } from "@/lib/status-config";
import type { getContactsTable } from "@/app/actions/contacts";

type TableData = Awaited<ReturnType<typeof getContactsTable>>;

export function ContactsTableView({
  initialData,
  owners,
}: {
  initialData: TableData;
  owners: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const sortField = searchParams.get("sort") ?? "updatedAt";
  const sortDir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const sorting: SortingState = [{ id: sortField, desc: sortDir === "desc" }];

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  // Debounce the free-text search box before pushing to the URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchValue !== (searchParams.get("search") ?? "")) {
        updateParams({ search: searchValue || null });
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const table = useReactTable({
    data: initialData.rows as ContactRow[],
    columns: contactColumns,
    state: { rowSelection, sorting },
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  function handleSort(columnId: string) {
    const isSameField = sortField === columnId;
    const nextDir = isSameField && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sort: columnId, dir: nextDir });
  }

  function handleExportSelected() {
    const query = selectedIds.length > 0 ? `?ids=${selectedIds.join(",")}` : "";
    window.location.href = `/api/contacts/export${query}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, company, email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={searchParams.get("industry") ?? "ALL"}
          onValueChange={(v) => updateParams({ industry: v === "ALL" ? null : v })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All industries</SelectItem>
            {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("status") ?? "ALL"}
          onValueChange={(v) => updateParams({ status: v === "ALL" ? null : v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("owner") ?? "ALL"}
          onValueChange={(v) => updateParams({ owner: v === "ALL" ? null : v })}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All owners" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="ALL">All owners</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="ml-auto" onClick={handleExportSelected}>
          <Download className="size-4" />
          Export {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : "All"}
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onDone={() => {
            setRowSelection({});
            router.refresh();
          }}
        />
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort(header.column.id)}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortField === header.column.id ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-30" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer"
                onClick={() => setSelectedContactId(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={contactColumns.length} className="py-10 text-center text-muted-foreground">
                  No contacts match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {initialData.page} of {initialData.pageCount} &middot; {initialData.total} total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={initialData.page <= 1}
            onClick={() => updateParams({ page: String(initialData.page - 1) })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={initialData.page >= initialData.pageCount}
            onClick={() => updateParams({ page: String(initialData.page + 1) })}
          >
            Next
          </Button>
        </div>
      </div>

      <ContactDetailPanel
        contactId={selectedContactId}
        onClose={() => {
          setSelectedContactId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
