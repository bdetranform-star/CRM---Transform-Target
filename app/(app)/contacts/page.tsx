import { getContactsTable, getContactOwners } from "@/app/actions/contacts";
import { ContactsTableView } from "@/components/contacts-table/contacts-table-view";

const PAGE_SIZE = 50;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [data, owners] = await Promise.all([
    getContactsTable({
      page,
      pageSize: PAGE_SIZE,
      search: params.search,
      industry: params.industry,
      contactOwner: params.owner,
      leadStatus: params.status,
      sortField: params.sort,
      sortDirection: params.dir === "asc" ? "asc" : params.dir === "desc" ? "desc" : undefined,
    }),
    getContactOwners(),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          {data.total} total contact{data.total === 1 ? "" : "s"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <ContactsTableView initialData={data} owners={owners} />
      </div>
    </div>
  );
}
