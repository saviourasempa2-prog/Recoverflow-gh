import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getMerchantPlan, getPlanById, getPlans, setMerchantPlan } from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const [plans, currentPlan] = await Promise.all([getPlans(), getMerchantPlan(session.shop)]);
  return json({ plans, currentPlan });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const planId = String(formData.get("plan_id") ?? "");
  const plan = await getPlanById(planId);
  if (!plan) return json({ error: "Choose one of the available plans." }, { status: 400 });

  // Stores the selected plan only. Add Shopify subscription approval separately.
  await setMerchantPlan(session.shop, plan.id);
  return new Response(null, { status: 302, headers: { Location: "/app" } });
}

export default function MerchantPricingPage() {
  const { plans, currentPlan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <section className="recoverflow-merchant-pricing">
      <header className="recoverflow-pricing-header"><div className="recoverflow-badge">Merchant plans</div><h1>Choose your RecoverFlow plan</h1><p>Pick a plan for your store. GH¢ is the local display price; USD is shown as an equivalent.</p></header>
      {actionData?.error ? <p className="recoverflow-inline-error" role="alert">{actionData.error}</p> : null}
      <div className="recoverflow-merchant-plan-grid">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const ghc = plan.monthly_price_cents / 100;
          const usd = ghc / 10;
          return (
            <article key={plan.id} className={`recoverflow-merchant-plan-card${isCurrent ? " is-current" : ""}`}>
              <div className="recoverflow-card-head"><h2>{plan.name}</h2>{isCurrent ? <span className="recoverflow-status-pill">Current Plan</span> : null}</div>
              <div className="recoverflow-merchant-price">GH¢{ghc.toFixed(0)}<span>/month</span></div>
              <p className="recoverflow-usd-equivalent">USD equivalent: ${usd.toFixed(0)} / month</p>
              <p className="recoverflow-commission">Commission: <strong>{plan.commission_percent}%</strong></p>
              <p className="recoverflow-trial">{plan.free_trial_days}-day free trial</p>
              <ul className="recoverflow-feature-list">{plan.features.map((feature, index) => <li key={`${index}-${feature}`}>{feature}</li>)}</ul>
              <Form method="post" className="recoverflow-select-plan-form"><input type="hidden" name="plan_id" value={plan.id} /><button type="submit" className="recoverflow-primary-button full-width" disabled={isCurrent}>{isCurrent ? "Current Plan" : "Choose This Plan"}</button></Form>
            </article>
          );
        })}
      </div>
      <p className="recoverflow-billing-note">This page saves the plan selection in RecoverFlow. Shopify billing approval and charging are not implemented here.</p>
    </section>
  );
}
