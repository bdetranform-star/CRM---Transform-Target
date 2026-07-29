import { getCompanies } from "@/app/actions/companies";
import { CompaniesView } from "@/components/companies/companies-view";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Companies</h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} compan{companies.length === 1 ? "y" : "ies"}, derived from your contacts&apos; Company Name field.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <CompaniesView companies={companies} />
      </div>
    </div>
  );
}
