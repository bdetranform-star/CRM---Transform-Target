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
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Plus } from "lucide-react";

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
import { SavedViewTabs } from "./saved-view-tabs";
import { AdvancedFiltersPanel } from "./advanced-filters-panel";
import {
  ContactDetailPanel,
  NEW_CONTACT_ID,
} from "@/components/contact-detail/contact-detail-panel";
import { INDUSTRY_LABELS, LEAD_STATUS_CONFIG, TEAM_MEMBER_LABELS } from "@/lib/status-config";
import type { ContactFilter } from "@/lib/contact-filters";
import { getAllFilteredContactIds, type getContactsTable } from "@/app/actions/contacts";
import { SAVED_VIEWS, SAVED_VIEW_LOCKED_FILTER, type SavedView } from "@/lib/saved-views";
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "@/lib/contacts-table-preferences";
import { getSavedPageSize, savePageSize } from "@/lib/contacts-table-storage";

type TableData = Awaited<ReturnType<typeof getContactsTable>>;

export function ContactsTableView({
  initialData,
  owners,
  viewCounts,
}: {
  initialData: TableData;
  owners: string[];
  viewCounts: Record<SavedView, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [creating, setCreating] = useState(false);

  // Cross-page "select all N contacts that match the current filter" — once
  // active, `allFilteredIds` (not `rowSelection`, which only ever knows about
  // rows on the currently-loaded page) is the authoritative selected set.
  const [allFilteredIds, setAllFilteredIds] = useState<string[] | null>(null);
  const [loadingAllFilteredIds, setLoadingAllFilteredIds] = useState(false);
  const selectAllFilteredActive = allFilteredIds !== null;

  const sortField = searchParams.get("sort") ?? "updatedAt";
  const sortDir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const sorting: SortingState = [{ id: sortField, desc: sortDir === "desc" }];

  const filters: ContactFilter[] = useMemo(() => {
    const raw = searchParams.get("filters");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [searchParams]);

  const activeView = (searchParams.get("view") as SavedView | null) ?? SAVED_VIEWS.ALL;
  const activeCustomId = searchParams.get("customView");
  const lockedFilter = activeCustomId ? undefined : SAVED_VIEW_LOCKED_FILTER[activeView];

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

  // Search/quick-filter/saved-view/advanced-filter state only (not page or
  // sort) — changing any of these means "matches the current filter" itself
  // is different, so the full cross-page "select all filtered" set is no
  // longer valid and must be cleared, not just the current page's checkboxes.
  const filterCriteriaSignature = [
    searchParams.get("search"),
    searchParams.get("industry"),
    searchParams.get("status"),
    searchParams.get("owner"),
    searchParams.get("view"),
    searchParams.get("customView"),
    searchParams.get("filters"),
  ].join("|");

  function clearSelection() {
    setRowSelection({});
    setAllFilteredIds(null);
  }

  useEffect(() => {
    clearSelection();
  }, [filterCriteriaSignature]);

  // Paging/changing page size swaps out which rows are actually on screen,
  // so the page-scoped `rowSelection` no longer corresponds to anything
  // visible — but an active "select all filtered" selection is independent
  // of what page you're looking at, so it's deliberately left alone here.
  useEffect(() => {
    setRowSelection({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("page"), searchParams.get("pageSize")]);

  // Bootstrap the user's last-saved page size from localStorage on first
  // load, only if the URL doesn't already specify one (an explicit URL param
  // — e.g. from a shared link — always wins).
  useEffect(() => {
    if (searchParams.get("pageSize")) return;
    const saved = getSavedPageSize();
    if (saved && saved !== initialData.pageSize) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("pageSize", String(saved));
      router.replace(`${pathname}?${next.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectAllFiltered() {
    setLoadingAllFilteredIds(true);
    try {
      const ids = await getAllFilteredContactIds({
        search: searchParams.get("search") || undefined,
        industry: searchParams.get("industry") || undefined,
        contactOwner: searchParams.get("owner") || undefined,
        leadStatus: searchParams.get("status") || undefined,
        savedView: searchParams.get("view") || undefined,
        filters,
      });
      setAllFilteredIds(ids);
    } finally {
      setLoadingAllFilteredIds(false);
    }
  }

  function handlePageSizeChange(value: string) {
    const size = Number(value) as PageSizeOption;
    savePageSize(size);
    updateParams({ pageSize: String(size) });
  }

  const table = useReactTable({
    data: initialData.rows as ContactRow[],
    columns: contactColumns,
    state: { rowSelection, sorting },
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      selectAllFilteredActive,
      onClearAllFiltered: clearSelection,
    },
  });

  const pageSelectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  const selectedIds = selectAllFilteredActive ? (allFilteredIds as string[]) : pageSelectedIds;

  // Only offer to expand to the full filtered set once every row on this
  // page is selected and there's actually more beyond this page to expand to.
  const showSelectAllBanner =
    !selectAllFilteredActive &&
    initialData.rows.length > 0 &&
    pageSelectedIds.length === initialData.rows.length &&
    initialData.total > initialData.rows.length;

  function handleSort(columnId: string) {
    const isSameField = sortField === columnId;
    const nextDir = isSameField && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sort: columnId, dir: nextDir });
  }

  function handleExportSelected() {
    const query = selectedIds.length > 0 ? `?ids=${selectedIds.join(",")}` : "";
    window.location.href = `/api/contacts/export${query}`;
  }

  function handleFiltersChange(next: ContactFilter[]) {
    updateParams({ filters: next.length > 0 ? JSON.stringify(next) : null });
  }

  return (
    <div className="flex flex-col gap-4">
      <SavedViewTabs viewCounts={viewCounts} />

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
                {TEAM_MEMBER_LABELS[owner as keyof typeof TEAM_MEMBER_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="ml-auto" onClick={handleExportSelected}>
          <Download className="size-4" />
          Export {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : "All"}
        </Button>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New Contact
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AdvancedFiltersPanel filters={filters} onChange={handleFiltersChange} lockedFilter={lockedFilter} />
      </div>

      {showSelectAllBanner && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-[var(--accent-teal)]/30 bg-[color-mix(in_srgb,var(--accent-teal)_6%,white)] px-4 py-2.5 text-sm">
          <span>
            All {initialData.rows.length} contact{initialData.rows.length === 1 ? "" : "s"} on this
            page are selected.
          </span>
          <button
            type="button"
            className="font-medium text-[var(--accent-teal)] underline hover:no-underline disabled:opacity-50"
            onClick={handleSelectAllFiltered}
            disabled={loadingAllFilteredIds}
          >
            {loadingAllFilteredIds
              ? "Loading..."
              : `Select all ${initialData.total} contacts that match the current filter`}
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClear={clearSelection}
          onDone={() => {
            clearSelection();
            router.refresh();
          }}
        />
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Table containerClassName="max-h-[65vh]">
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-secondary/50">
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
                onClick={() => router.push(`/contacts/${row.original.id}`)}
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

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Page {initialData.page} of {initialData.pageCount} &middot; {initialData.total} total
          </span>
          <div className="flex items-center gap-1.5">
            <span>Rows per page</span>
            <Select value={String(initialData.pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[68px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
        contactId={creating ? NEW_CONTACT_ID : null}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false);
          router.push(`/contacts/${id}`);
        }}
      />
    </div>
  );
}
