import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim();
const isPgEnabled = Boolean(connectionString);

const pool = isPgEnabled
  ? new Pool({
      connectionString,
      ssl: connectionString?.includes("render.com") ? { rejectUnauthorized: false } : false,
    })
  : null;

export type PlanRecord = {
  id: string;
  name: string;
  monthly_price_cents: number;
  commission_percent: number;
  free_trial_days: number;
  features: string[];
  is_active: boolean;
};

const defaultPlans: PlanRecord[] = [
  {
    id: "starter",
    name: "Starter",
    monthly_price_cents: 0,
    commission_percent: 10,
    free_trial_days: 14,
    features: ["Up to 2 automations", "Email recovery", "Basic analytics"],
    is_active: true,
  },
  {
    id: "growth",
    name: "Growth",
    monthly_price_cents: 5000,
    commission_percent: 5,
    free_trial_days: 14,
    features: ["Unlimited automations", "WhatsApp recovery", "Priority support"],
    is_active: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthly_price_cents: 15000,
    commission_percent: 2,
    free_trial_days: 14,
    features: ["Unlimited automations", "WhatsApp + SMS", "Advanced analytics"],
    is_active: true,
  },
];

async function ensureSchema() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      monthly_price_cents INTEGER NOT NULL DEFAULT 0,
      commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
      free_trial_days INTEGER NOT NULL DEFAULT 0,
      features JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS merchants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shop TEXT NOT NULL UNIQUE,
      current_plan_id UUID REFERENCES plans(id),
      billing_status TEXT NOT NULL DEFAULT 'active',
      trial_ends_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovered_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shop TEXT NOT NULL,
      recovered_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      commission_percent_used NUMERIC(5,2) NOT NULL DEFAULT 0,
      recoverflow_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
      merchant_earning NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processed',
      plan_id UUID REFERENCES plans(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const count = await pool.query(`SELECT COUNT(*)::int AS count FROM plans`);
  if (Number(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO plans (name, monthly_price_cents, commission_percent, free_trial_days, features, is_active)
      VALUES
        ('Starter', 0, 10, 14, '["Up to 2 automations","Email recovery","Basic analytics"]'::jsonb, true),
        ('Growth', 5000, 5, 14, '["Unlimited automations","WhatsApp recovery","Priority support"]'::jsonb, true),
        ('Pro', 15000, 2, 14, '["Unlimited automations","WhatsApp + SMS","Advanced analytics"]'::jsonb, true)
    `);
  }
}

export async function getPlans(): Promise<PlanRecord[]> {
  if (!pool) {
    return defaultPlans;
  }

  await ensureSchema();
  const result = await pool.query(`
    SELECT id, name, monthly_price_cents, commission_percent, free_trial_days,
           COALESCE(features, '[]'::jsonb) AS features, is_active
    FROM plans
    WHERE is_active = true
    ORDER BY monthly_price_cents ASC
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    monthly_price_cents: Number(row.monthly_price_cents),
    commission_percent: Number(row.commission_percent),
    free_trial_days: Number(row.free_trial_days),
    features: Array.isArray(row.features) ? row.features : row.features ?? [],
    is_active: Boolean(row.is_active),
  }));
}

export async function getPlanById(planId: string): Promise<PlanRecord | null> {
  if (!pool) {
    return defaultPlans.find((plan) => plan.id === planId) ?? null;
  }

  const result = await pool.query(`
    SELECT id, name, monthly_price_cents, commission_percent, free_trial_days,
           COALESCE(features, '[]'::jsonb) AS features, is_active
    FROM plans
    WHERE id = $1 AND is_active = true
  `, [planId]);

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    monthly_price_cents: Number(row.monthly_price_cents),
    commission_percent: Number(row.commission_percent),
    free_trial_days: Number(row.free_trial_days),
    features: Array.isArray(row.features) ? row.features : row.features ?? [],
    is_active: Boolean(row.is_active),
  };
}

export async function upsertPlan(plan: {
  id?: string;
  name: string;
  monthly_price_cents: number;
  commission_percent: number;
  free_trial_days: number;
  features: string[];
}) {
  if (!pool) {
    return;
  }

  if (plan.id) {
    await pool.query(
      `
        UPDATE plans
        SET name = $2,
            monthly_price_cents = $3,
            commission_percent = $4,
            free_trial_days = $5,
            features = $6,
            updated_at = NOW()
        WHERE id = $1
      `,
      [plan.id, plan.name, plan.monthly_price_cents, plan.commission_percent, plan.free_trial_days, JSON.stringify(plan.features)]
    );
    return;
  }

  await pool.query(
    `
      INSERT INTO plans (name, monthly_price_cents, commission_percent, free_trial_days, features, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
    `,
    [plan.name, plan.monthly_price_cents, plan.commission_percent, plan.free_trial_days, JSON.stringify(plan.features)]
  );
}

export async function deletePlan(planId: string) {
  if (!pool) return;
  await pool.query(`DELETE FROM plans WHERE id = $1`, [planId]);
}

export async function getMerchantPlan(shop: string) {
  if (!pool) {
    return defaultPlans[0];
  }

  const result = await pool.query(
    `
      SELECT p.*
      FROM merchants m
      LEFT JOIN plans p ON p.id = m.current_plan_id
      WHERE m.shop = $1
    `,
    [shop]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    monthly_price_cents: Number(row.monthly_price_cents),
    commission_percent: Number(row.commission_percent),
    free_trial_days: Number(row.free_trial_days),
    features: Array.isArray(row.features) ? row.features : row.features ?? [],
    is_active: Boolean(row.is_active),
  };
}

export async function setMerchantPlan(shop: string, planId: string) {
  if (!pool) return;

  await pool.query(
    `
      INSERT INTO merchants (shop, current_plan_id, billing_status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (shop)
      DO UPDATE SET current_plan_id = EXCLUDED.current_plan_id,
                    billing_status = 'active',
                    updated_at = NOW()
    `,
    [shop, planId]
  );
}

export async function recordRecoveredOrder({
  shop,
  recoveredAmount,
  planId,
  commissionPercent,
}: {
  shop: string;
  recoveredAmount: number;
  planId?: string;
  commissionPercent: number;
}) {
  if (!pool) {
    return { recoveredAmount, commissionPercent, recoverflowFee: 0, merchantEarning: recoveredAmount };
  }

  const fee = recoveredAmount * (commissionPercent / 100);
  const merchantEarning = recoveredAmount - fee;

  await pool.query(
    `
      INSERT INTO recovered_orders (
        shop, recovered_amount, commission_percent_used, recoverflow_fee, merchant_earning, plan_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [shop, recoveredAmount, commissionPercent, fee, merchantEarning, planId ?? null]
  );

  return {
    recoveredAmount,
    commissionPercent,
    recoverflowFee: fee,
    merchantEarning,
  };
}

export async function getMerchantEarnings(shop: string) {
  if (!pool) {
    return {
      total_recovered_amount: 0,
      total_recoverflow_fee: 0,
      total_merchant_earning: 0,
    };
  }

  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(recovered_amount), 0) AS total_recovered_amount,
        COALESCE(SUM(recoverflow_fee), 0) AS total_recoverflow_fee,
        COALESCE(SUM(merchant_earning), 0) AS total_merchant_earning
      FROM recovered_orders
      WHERE shop = $1
    `,
    [shop]
  );

  return result.rows[0];
}

export { pool as dbPool };
