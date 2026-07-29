import { getDeals, getDealContactOptions } from "@/app/actions/deals";
import { DealsView } from "@/components/deals/deals-view";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [deals, contacts] = await Promise.all([
    getDeals(params.stage),
    getDealContactOptions(),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Deals</h1>
        <p className="text-sm text-muted-foreground">{deals.length} deal{deals.length === 1 ? "" : "s"}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <DealsView initialDeals={deals} contacts={contacts} />
      </div>
    </div>
  );
}
