import { useDashboard } from "@/lib/dashboard/filters-context";
import { formatCurrency } from "@/lib/dashboard/format";
import { canonicalFlipkartSku } from "@/lib/dashboard/brands";
import { OrderStatusBadge } from "./OrderStatusBadge";

function dateLabel(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function FlipkartOrders() {
  const { data, filters } = useDashboard();
  if (filters.marketplace !== "all" && filters.marketplace !== "Flipkart") return null;
  const orders = [...(data?.flipkartOrders ?? [])]
    .filter((order) => filters.product === "all" || canonicalFlipkartSku(order.sku, order.title) === filters.product)
    .sort((a, b) => (b.orderDate || "").localeCompare(a.orderDate || ""));

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Flipkart Orders</h2>
          <p className="mt-1 text-xs text-muted-foreground">Live seller order items · refreshes every minute</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{orders.length} items</span>
      </div>
      {!data?.sourceLabel.includes("Flipkart") ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">Connect Flipkart Seller API credentials on the server to show live orders.</p>
      ) : orders.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">No Flipkart orders found for this date range.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{["Order / Item", "Product", "Brand", "Status", "Qty", "Customer price", "Order date", "Dispatch by"].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 50).map((order, index) => (
                <tr key={`${order.orderItemId}-${index}`} className="text-foreground">
                  <td className="px-4 py-3"><div className="font-medium">{order.orderId || "—"}</div><div className="text-xs text-muted-foreground">Item {order.orderItemId || "—"} · Shipment {order.shipmentId || "—"}</div></td>
                  <td className="max-w-48 truncate px-4 py-3">{order.title}</td>
                  <td className="px-4 py-3">{order.brand}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(order.customerPrice)}</td>
                  <td className="px-4 py-3">{dateLabel(order.orderDate)}</td>
                  <td className="px-4 py-3">{dateLabel(order.dispatchByDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length > 50 ? <p className="px-5 py-3 text-xs text-muted-foreground">Showing the latest 50 order items.</p> : null}
        </div>
      )}
    </section>
  );
}
