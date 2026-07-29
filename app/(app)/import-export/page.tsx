import { getContactOwnerPool } from "@/app/actions/contacts";
import { ImportExportView } from "@/components/import-export/import-export-view";

export default async function ImportExportPage() {
  const owners = await getContactOwnerPool();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Import / Export</h1>
        <p className="text-sm text-muted-foreground">
          Bulk import contacts from a CSV file, or export your contact list.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <ImportExportView owners={owners} />
      </div>
    </div>
  );
}
