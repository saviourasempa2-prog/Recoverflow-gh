import { dbPool } from "./db.server";
import { getPlans } from "./db.server";

export type AdminDashboardStats = {
  totalMerchants: number;
  activeMerchants: number;
  recoveredOrders: number;
  recoveredOrdersLast7Days: number;
  recoveredRevenue: number;
  feesCollected: number;
  feesPending: number;
  abandonedCartsTracked: boolean;
};

const emptyStats: AdminDashboardStats = {
  totalMerchants: 0,
  activeMerchants: 0,
  recoveredOrders: 0,
  recoveredOrdersLast7Days: 0,
  recoveredRevenue: 0,
  feesCollected: 0,
  feesPending: 0,
  // The app currently does not persist abandoned checkout records.
  abandonedCartsTracked: false,
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!dbPool) return emptyStats;

  // Ensures the application's database schema exists before querying its tables.
  await getPlans();

  const [merchantCounts, orderStats] = await Promise.all([
    dbPool.query(`
      SELECT COUNT(*)::int AS total_merchants,
             COUNT(*) FILTER (WHERE billing_status = 'active')::int AS active_merchants
      FROM merchants
    `),
    dbPool.query(`
      SELECT COUNT(*)::int AS recovered_orders,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS recovered_orders_last_7_days,
             COALESCE(SUM(recovered_amount), 0)::float8 AS recovered_revenue,
             COALESCE(SUM(recoverflow_fee) FILTER (WHERE LOWER(billing_status) IN ('collected', 'paid')), 0)::float8 AS fees_collected,
             COALESCE(SUM(recoverflow_fee) FILTER (WHERE LOWER(billing_status) NOT IN ('collected', 'paid')), 0)::float8 AS fees_pending
      FROM recovered_orders
    `),
  ]);

  const merchants = merchantCounts.rows[0] ?? {};
  const orders = orderStats.rows[0] ?? {};
  return {
    totalMerchants: Number(merchants.total_merchants ?? 0),
    activeMerchants: Number(merchants.active_merchants ?? 0),
    recoveredOrders: Number(orders.recovered_orders ?? 0),
    recoveredOrdersLast7Days: Number(orders.recovered_orders_last_7_days ?? 0),
    recoveredRevenue: Number(orders.recovered_revenue ?? 0),
    feesCollected: Number(orders.fees_collected ?? 0),
    feesPending: Number(orders.fees_pending ?? 0),
    abandonedCartsTracked: false,
  };
}
