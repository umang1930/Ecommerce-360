import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { fetchClaspoFlipkartInventory, fetchMonkeymanFlipkartInventory } from "@/lib/dashboard/flipkart";
import type { FlipkartInventoryResult } from "@/lib/dashboard/flipkart-types";

function money(value: number | undefined, currency = "INR") {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function InventoryListing({ result }: { result: FlipkartInventoryResult }) {
  if (result.unavailable) {
    return <p className="border-b border-border px-5 py-5 text-sm text-muted-foreground">Flipkart could not find SKU {result.sku} in the Claspo listings.</p>;
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div><p className="text-xs text-muted-foreground">Product</p><p className="mt-1 text-sm font-medium text-foreground">{result.productTitle || "Flipkart listing"}</p><p className="mt-1 text-xs text-muted-foreground">SKU {result.sku}</p></div>
        <div><p className="text-xs text-muted-foreground">Listing status</p><p className="mt-1 text-sm font-medium text-foreground">{result.listingStatus || "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Selling price</p><p className="mt-1 text-sm font-medium text-foreground">{result.sellingPrice == null ? "Not returned by Flipkart" : money(result.sellingPrice, result.currency)}</p></div>
        <div><p className="text-xs text-muted-foreground">MRP</p><p className="mt-1 text-sm font-medium text-foreground">{money(result.mrp, result.currency)}</p></div>
        <div><p className="text-xs text-muted-foreground">Orders to fulfill</p><p className="mt-1 text-sm font-medium text-foreground">{result.ordersToBeFulfilled ?? "Not returned by Flipkart"}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{["Location", "Status", "Available stock"].map((label) => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.locations.length ? result.locations.map((location, index) => (
              <tr key={`${location.id}-${index}`} className="text-foreground">
                <td className="px-5 py-3">{location.id}</td>
                <td className="px-5 py-3">{location.status}</td>
                <td className="px-5 py-3 font-medium">{location.inventory}</td>
              </tr>
            )) : <tr><td className="px-5 py-4 text-muted-foreground" colSpan={3}>No inventory locations returned.</td></tr>}
          </tbody>
        </table>
      </div>
      {result.productUrl ? <p className="border-t border-border px-5 py-3 text-xs"><a className="text-primary underline" href={result.productUrl} target="_blank" rel="noreferrer">View Flipkart listing</a></p> : null}
    </div>
  );
}

export function FlipkartInventory() {
  const inventoryQuery = useQuery({
    queryKey: ["flipkart-inventory", "CL-VB-05-2026", "cl-mfc-06-2026", "hk-Hang-01-2026", "MM-BELLA-RG", "MM-BELLA-BLK"],
    queryFn: async () => {
      const [claspo, monkeyman] = await Promise.all([
        fetchClaspoFlipkartInventory(),
        fetchMonkeymanFlipkartInventory(),
      ]);
      return { claspo, monkeyman };
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const result = inventoryQuery.data;
  const listings = [...(result?.claspo.listings ?? []), ...(result?.monkeyman.listings ?? [])];

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Flipkart Inventory</h2>
          <p className="mt-1 text-xs text-muted-foreground">Claspo and Monkeyman product listings</p>
        </div>
        <button
          type="button"
          onClick={() => void inventoryQuery.refetch()}
          disabled={inventoryQuery.isFetching}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${inventoryQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {inventoryQuery.isPending ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading Flipkart inventory…</p>
      ) : inventoryQuery.isError ? (
        <p className="px-5 py-8 text-sm text-destructive">{inventoryQuery.error instanceof Error ? inventoryQuery.error.message : "Could not load inventory."}</p>
      ) : (
        <>
          {!result?.claspo.configured ? <p className="border-b border-border px-5 py-3 text-sm text-muted-foreground">Claspo inventory requires Claspo Flipkart Seller API credentials on the server.</p> : null}
          {result?.claspo.error ? <p className="border-b border-border px-5 py-3 text-sm text-destructive">Claspo: {result.claspo.error}</p> : null}
          {!result?.monkeyman.configured ? <p className="border-b border-border px-5 py-3 text-sm text-muted-foreground">Monkeyman inventory requires Monkeyman Flipkart Seller API credentials on the server.</p> : null}
          {result?.monkeyman.error ? <p className="border-b border-border px-5 py-3 text-sm text-destructive">Monkeyman: {result.monkeyman.error}</p> : null}
          {listings.map((listing) => <InventoryListing key={listing.sku} result={listing} />)}
        </>
      )}
    </section>
  );
}
