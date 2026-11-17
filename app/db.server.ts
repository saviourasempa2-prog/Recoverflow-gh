import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim();
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes("render.com") ? { rejectUnauthorized: false } : false,
    })
  : null;

export type PlanRecord = {
  id: string;
  name: string;
  monthly_price_cents: number; // GH¢ cents; 5000 = GH¢50.00
  commission_percent: number;
  free_trial_days: number;
  features: string[];
  is_active: boolean;
};

const planDefaults = [
  { name: "Starter", price: 0, commission: 10, features: ["Up to 2 automations", "Email recovery", "Basic analytics"] },
  { name: "Growth", price: 5000, commission: 5, features: ["Unlimited automations", "WhatsApp recovery", "Priority support"] },
  { name: "Pro", price: 15000, commission: 2, features: ["Unlimited automations", "WhatsApp + SMS", "Advanced analytics"] },
];

let schemaReady: Promise<void> | null = null;
async function ensureSchema() {
  if (!pool) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          monthly_price_cents INTEGER NOT NULL DEFAULT 0,
          commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
          free_trial_days INTEGER NOT NULL DEFAULT 7,
          features JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS monthly_price_cents INTEGER NOT NULL DEFAULT 0`);
      await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0`);
      await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS free_trial_days INTEGER NOT NULL DEFAULT 7`);
      await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb`);
      await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS merchants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          shop TEXT NOT NULL UNIQUE,
          current_plan_id UUID REFERENCES plans(id),
          billing_status TEXT NOT NULL DEFAULT 'pending',
          trial_ends_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS pending_plan_id UUID REFERENCES plans(id)`);
      await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS shopify_subscription_id TEXT`);
      await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'pending'`);
      await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS recovered_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), shop TEXT NOT NULL,
          recovered_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
          commission_percent_used NUMERIC(5,2) NOT NULL DEFAULT 0,
          recoverflow_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
          merchant_earning NUMERIC(12,2) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'processed', plan_id UUID REFERENCES plans(id),
          billing_status TEXT NOT NULL DEFAULT 'pending_collection',
          shopify_usage_record_id TEXT, created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE recovered_orders ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'pending_collection'`);
      await pool.query(`ALTER TABLE recovered_orders ADD COLUMN IF NOT EXISTS shopify_usage_record_id TEXT`);

      // Keep exactly one active row per standard plan. Archive duplicate/extra rows
      // rather than deleting records that may be referenced by merchants or orders.
      const canonicalIds: string[] = [];
      for (const p of planDefaults) {
        const found = await pool.query(`SELECT id FROM plans WHERE LOWER(name) = LOWER($1) ORDER BY created_at ASC LIMIT 1`, [p.name]);
        let id: string;
        if (found.rows[0]) {
          id = found.rows[0].id;
          await pool.query(
            `UPDATE plans SET name=$2, is_active=true, free_trial_days=7, updated_at=NOW() WHERE id=$1`,
            [id, p.name],
          );
          await pool.query(
            `UPDATE merchants SET current_plan_id=$1, updated_at=NOW() WHERE current_plan_id IN (SELECT id FROM plans WHERE LOWER(name)=LOWER($2) AND id<>$1)`,
            [id, p.name],
          );
          await pool.query(`UPDATE plans SET is_active=false, updated_at=NOW() WHERE LOWER(name)=LOWER($1) AND id<>$2`, [p.name, id]);
        } else {
          const inserted = await pool.query(
            `INSERT INTO plans(name, monthly_price_cents, commission_percent, free_trial_days, features, is_active) VALUES($1,$2,$3,7,$4,true) RETURNING id`,
            [p.name, p.price, p.commission, JSON.stringify(p.features)],
          );
          id = inserted.rows[0].id;
        }
        canonicalIds.push(id);
      }
      await pool.query(`UPDATE plans SET is_active=false, updated_at=NOW() WHERE NOT (id = ANY($1::uuid[]))`, [canonicalIds]);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

const fallbackPlans: PlanRecord[] = planDefaults.map((p, index) => ({
  id: `fallback-${index + 1}`,
  name: p.name,
  monthly_price_cents: p.price,
  commission_percent: p.commission,
  free_trial_days: 7,
  features: p.features,
  is_active: true,
}));

function mapPlan(row: any): PlanRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    monthly_price_cents: Number(row.monthly_price_cents),
    commission_percent: Number(row.commission_percent),
    free_trial_days: Number(row.free_trial_days),
    features: Array.isArray(row.features) ? row.features : row.features ?? [],
    is_active: Boolean(row.is_active),
  };
}

export async function getPlans(): Promise<PlanRecord[]> {
  if (!pool) return fallbackPlans;
  await ensureSchema();
  const result = await pool.query(`SELECT id,name,monthly_price_cents,commission_percent,free_trial_days,COALESCE(features,'[]'::jsonb) features,is_active FROM plans WHERE is_active=true ORDER BY CASE name WHEN 'Starter' THEN 1 WHEN 'Growth' THEN 2 ELSE 3 END`);
  return result.rows.map(mapPlan);
}

export async function getPlanById(id: string): Promise<PlanRecord | null> {
  const plans = await getPlans();
  return plans.find((p) => p.id === id) ?? null;
}

export async function upsertPlan(plan: { id: string; name: string; monthly_price_cents: number; commission_percent: number; free_trial_days: number; features: string[] }) {
  if (!pool) throw new Error("DATABASE_URL is required to save pricing.");
  await ensureSchema();
  if (!["Starter", "Growth", "Pro"].includes(plan.name)) throw new Error("Only Starter, Growth, and Pro plans can be edited.");
  await pool.query(
    `UPDATE plans SET name=$2, monthly_price_cents=$3, commission_percent=$4, free_trial_days=7, features=$5, updated_at=NOW() WHERE id=$1 AND is_active=true`,
    [plan.id, plan.name, plan.monthly_price_cents, plan.commission_percent, JSON.stringify(plan.features)],
  );
}

export async function deletePlan(_planId: string) {
  throw new Error("The three standard plans cannot be deleted. Edit their pricing instead.");
}

export async function getMerchantPlan(shop: string) {
  if (!pool) return null;
  await ensureSchema();
  const result = await pool.query(`SELECT p.* FROM merchants m JOIN plans p ON p.id=m.current_plan_id AND p.is_active=true WHERE m.shop=$1 AND m.billing_status='active'`, [shop]);
  return result.rows[0] ? mapPlan(result.rows[0]) : null;
}

export async function getMerchantBilling(shop: string) {
  if (!pool) return null;
  await ensureSchema();
  const result = await pool.query(`SELECT shop,current_plan_id,pending_plan_id,shopify_subscription_id,billing_status,trial_ends_at FROM merchants WHERE shop=$1`, [shop]);
  return result.rows[0] ?? null;
}

export async function setMerchantPlan(shop: string, planId: string) {
  if (!pool) throw new Error("DATABASE_URL is required to save plan selection.");
  await ensureSchema();
  await pool.query(`INSERT INTO merchants(shop,current_plan_id,pending_plan_id,billing_status) VALUES($1,$2,NULL,'active') ON CONFLICT(shop) DO UPDATE SET current_plan_id=EXCLUDED.current_plan_id,pending_plan_id=NULL,shopify_subscription_id=NULL,billing_status='active',updated_at=NOW()`, [shop, planId]);
}

export async function setPendingMerchantPlan(shop: string, planId: string, subscriptionId: string) {
  if (!pool) throw new Error("DATABASE_URL is required to save billing state.");
  await ensureSchema();
  await pool.query(`INSERT INTO merchants(shop,pending_plan_id,shopify_subscription_id,billing_status) VALUES($1,$2,$3,'pending') ON CONFLICT(shop) DO UPDATE SET pending_plan_id=EXCLUDED.pending_plan_id,shopify_subscription_id=EXCLUDED.shopify_subscription_id,billing_status='pending',updated_at=NOW()`, [shop, planId, subscriptionId]);
}

export async function activateMerchantPlan(shop: string, planId: string, subscriptionId: string, trialEndsAt?: string | null) {
  if (!pool) throw new Error("DATABASE_URL is required to save billing state.");
  await ensureSchema();
  await pool.query(`UPDATE merchants SET current_plan_id=$2,pending_plan_id=NULL,shopify_subscription_id=$3,billing_status='active',trial_ends_at=$4,updated_at=NOW() WHERE shop=$1`, [shop, planId, subscriptionId, trialEndsAt ?? null]);
}

export async function recordRecoveredOrder({ shop, recoveredAmount, planId, commissionPercent }: { shop: string; recoveredAmount: number; planId?: string; commissionPercent: number }) {
  if (!pool) return { recoveredAmount, commissionPercent, recoverflowFee: 0, merchantEarning: recoveredAmount };
  await ensureSchema();
  const fee = recoveredAmount * commissionPercent / 100;
  const merchantEarning = recoveredAmount - fee;
  await pool.query(`INSERT INTO recovered_orders(shop,recovered_amount,commission_percent_used,recoverflow_fee,merchant_earning,plan_id) VALUES($1,$2,$3,$4,$5,$6)`, [shop, recoveredAmount, commissionPercent, fee, merchantEarning, planId ?? null]);
  return { recoveredAmount, commissionPercent, recoverflowFee: fee, merchantEarning };
}

export async function getMerchantEarnings(shop: string) {
  if (!pool) return { total_recovered_amount: 0, total_recoverflow_fee: 0, total_merchant_earning: 0 };
  await ensureSchema();
  const result = await pool.query(`SELECT COALESCE(SUM(recovered_amount),0) total_recovered_amount,COALESCE(SUM(recoverflow_fee),0) total_recoverflow_fee,COALESCE(SUM(merchant_earning),0) total_merchant_earning FROM recovered_orders WHERE shop=$1`, [shop]);
  return result.rows[0];
}

export { pool as dbPool };
