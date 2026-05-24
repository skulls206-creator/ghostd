import { useGetOrders, useCancelOrder, getGetOrdersQueryKey, getGetBalanceQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatCrypto, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function Orders() {
  const { data, isLoading } = useGetOrders({ status: "open" });
  const cancelMutation = useCancelOrder();
  const queryClient = useQueryClient();

  const handleCancel = (orderId: number) => {
    toast.loading(`Cancelling order #${orderId}…`, { id: `cancel-${orderId}` });
    cancelMutation.mutate({ orderId }, {
      onSuccess: () => {
        toast.success(`Order #${orderId} cancelled`, { id: `cancel-${orderId}` });
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err?.error || `Failed to cancel order #${orderId}`, { id: `cancel-${orderId}` });
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Open Orders</h1>
        <p className="text-muted-foreground text-[11px] mt-0.5">Manage your active trading orders</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 font-semibold border-b border-white/[0.04]">
              <th className="py-2 pl-1 pr-4">Date</th>
              <th className="py-2 px-4">Pair</th>
              <th className="py-2 px-4">Side</th>
              <th className="py-2 px-4 text-right">Price</th>
              <th className="py-2 px-4 text-right">Amount</th>
              <th className="py-2 px-4 text-right">Total</th>
              <th className="py-2 pl-4 pr-1 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="h-9 border-b border-white/[0.02]">
                  <td className="py-2 pl-1 pr-4"><Skeleton className="h-3 w-20" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-3 w-12" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-4 w-10 rounded-full" /></td>
                  <td className="py-2 px-4 text-right"><Skeleton className="h-3 w-16 ml-auto" /></td>
                  <td className="py-2 px-4 text-right"><Skeleton className="h-3 w-14 ml-auto" /></td>
                  <td className="py-2 px-4 text-right"><Skeleton className="h-3 w-14 ml-auto" /></td>
                  <td className="py-2 pl-4 pr-1" />
                </tr>
              ))
            ) : (data?.orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center font-sans">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 border border-white/[0.04] flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground/60">No open orders</p>
                      <p className="text-[11px] text-muted-foreground/30 mt-0.5">Place a buy or sell order to get started</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              (data?.orders ?? []).map((o) => (
                <tr key={o.orderId} className="h-9 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] group">
                  <td className="py-2 pl-1 pr-4 text-muted-foreground/40 font-sans text-[10px]">
                    {formatDate(o.dateReg)}
                  </td>
                  <td className="py-2 px-4 font-sans font-semibold uppercase text-xs">
                    {o.cur}/{o.ecur}
                  </td>
                  <td className="py-2 px-4 font-sans">
                    <Badge variant={o.task === 'buy' ? 'success' : 'destructive'}>
                      {o.task}
                    </Badge>
                  </td>
                  <td className="py-2 px-4 text-right text-foreground tabular-nums font-semibold">
                    {formatCrypto(o.price)}
                  </td>
                  <td className="py-2 px-4 text-right text-foreground/70 tabular-nums">
                    {formatCrypto(o.amount)}
                  </td>
                  <td className="py-2 px-4 text-right text-muted-foreground/50 tabular-nums">
                    {formatCrypto(o.value)}
                  </td>
                  <td className="py-2 pl-4 pr-1 text-right">
                    <button
                      className="text-muted-foreground/30 hover:text-danger transition-colors text-[11px] font-medium opacity-0 group-hover:opacity-100"
                      onClick={() => handleCancel(o.orderId)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
