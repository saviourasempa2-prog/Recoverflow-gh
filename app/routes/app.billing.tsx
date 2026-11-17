import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { authenticate } from "../shopify.server";
import { getMerchantPlan, getPlans, setMerchantPlan } from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = String(session?.shop ?? new URL(request.url).searchParams.get("shop") ?? "");

  if (!shop) {
    throw redirect("/auth/login");
  }

  const plans = await getPlans();
  const currentPlan = await getMerchantPlan(shop);

  return json({ shop, plans, currentPlan });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = String(session?.shop ?? new URL(request.url).searchParams.get("shop") ?? "");
  const formData = await request.formData();
  const planId = String(formData.get("plan_id") ?? "");

  if (!shop || !planId) {
    return json({ error: "Missing plan selection" }, { status: 400 });
  }

  await setMerchantPlan(shop, planId);
  return redirect("/app");
}

export default function BillingPage() {
  const { plans = [], currentPlan } = useLoaderData<typeof loader>();

  return (
    <main className="recoverflow-shell recoverflow-billing-wrap">
      <div className="recoverflow-billing-panel">
        <div className="recoverflow-header-row billing-header">
          <div>
            <div className="recoverflow-badge">Billing</div>
            <h1>Choose Your Plan</h1>
          </div>
        </div>

        <div className="recoverflow-plan-grid">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const isFree = plan.monthly_price_cents === 0;

            return (
              <div key={plan.id} className={`recoverflow-plan-card ${isCurrent ? "is-current" : ""}`}>
                <div className="recoverflow-card-head">
                  <h2>{plan.name}</h2>
                  {isCurrent ? <span className="recoverflow-status-pill">Current</span> : null}
                </div>

                <div className="recoverflow-price">GH¢ {(plan.monthly_price_cents / 100).toFixed(2)}</div>
                <div className="recoverflow-subtext">Commission: {plan.commission_percent}%</div>

                <ul className="recoverflow-feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <Form method="post">
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <button type="submit" className="recoverflow-primary-button full-width">
                    {isCurrent ? "Selected" : isFree ? "Start Free" : "Choose This Plan"}
                  </button>
                </Form>
              </div>
            );
          })}
        </div>

        <div className="recoverflow-billing-footer">
          <Link to="/app" className="recoverflow-secondary-button">
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
