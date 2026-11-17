import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createCookie } from "@remix-run/node";

import { deletePlan, getPlans, upsertPlan } from "../db.server";

const adminSessionCookie = createCookie("recoverflow_admin_session", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
  maxAge: 60 * 60 * 12,
});

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieValue = await adminSessionCookie.parse(request.headers.get("Cookie"));
  const isAuthenticated = cookieValue === "authenticated";

  if (!isAuthenticated) {
    return json({ isAuthenticated: false, plans: [] });
  }

  const plans = await getPlans();
  return json({ isAuthenticated: true, plans });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("_intent") ?? "");

  if (intent === "login") {
    const submitted = String(formData.get("password") ?? "");
    if (!process.env.ADMIN_PASSWORD || submitted !== process.env.ADMIN_PASSWORD.trim()) {
      return json({ error: "Invalid admin password." }, { status: 401 });
    }

    return redirect("/admin", {
      headers: {
        "Set-Cookie": await adminSessionCookie.serialize("authenticated"),
      },
    });
  }

  if (intent === "create" || intent === "update") {
    const id = formData.get("id") ? String(formData.get("id")) : undefined;
    const name = String(formData.get("name") ?? "");
    const monthlyPriceCents = Number(formData.get("monthly_price_cents") ?? 0);
    const commissionPercent = Number(formData.get("commission_percent") ?? 0);
    const freeTrialDays = Number(formData.get("free_trial_days") ?? 0);
    const features = String(formData.get("features") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await upsertPlan({
      id,
      name,
      monthly_price_cents: monthlyPriceCents,
      commission_percent: commissionPercent,
      free_trial_days: freeTrialDays,
      features,
    });

    return redirect("/admin");
  }

  if (intent === "delete") {
    const planId = String(formData.get("id") ?? "");
    if (planId) {
      await deletePlan(planId);
    }
    return redirect("/admin");
  }

  return json({ error: "Unknown action" }, { status: 400 });
}

export default function AdminPricingPage() {
  const { isAuthenticated, plans = [] } = useLoaderData<typeof loader>();

  if (!isAuthenticated) {
    return (
      <main className="recoverflow-admin-shell">
        <div className="recoverflow-admin-card recoverflow-admin-auth">
          <div className="recoverflow-badge">Owner portal</div>
          <h1>RecoverFlow Admin</h1>
          <p>Use your admin password to publish pricing and control commission settings.</p>

          <Form method="post">
            <input type="hidden" name="_intent" value="login" />
            <label htmlFor="password">Admin password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" />
            <button type="submit" className="recoverflow-primary-button full-width">
              Sign in
            </button>
          </Form>
        </div>
      </main>
    );
  }

  return (
    <main className="recoverflow-admin-shell">
      <div className="recoverflow-admin-card">
        <div className="recoverflow-header-row">
          <div>
            <div className="recoverflow-badge">Pricing & Payments</div>
            <h1>Plan management</h1>
          </div>
          <span className="recoverflow-status-pill">Live</span>
        </div>

        <div className="recoverflow-plan-grid">
          {plans.map((plan) => (
            <Form key={plan.id} method="post" className="recoverflow-plan-card">
              <input type="hidden" name="_intent" value="update" />
              <input type="hidden" name="id" value={plan.id} />

              <label>
                Name
                <input name="name" defaultValue={plan.name} />
              </label>

              <label>
                Monthly Price GH¢
                <input name="monthly_price_cents" type="number" defaultValue={plan.monthly_price_cents} />
              </label>

              <label>
                Commission %
                <input name="commission_percent" type="number" step="0.01" defaultValue={plan.commission_percent} />
              </label>

              <label>
                Free Trial Days
                <input name="free_trial_days" type="number" defaultValue={plan.free_trial_days} />
              </label>

              <label>
                Features (comma separated)
                <input name="features" defaultValue={plan.features.join(", ")} />
              </label>

              <div className="recoverflow-plan-actions">
                <button type="submit" className="recoverflow-primary-button">Save</button>
                <button type="submit" name="_intent" value="delete" className="recoverflow-secondary-button danger-btn">
                  Delete
                </button>
              </div>
            </Form>
          ))}
        </div>

        <div className="recoverflow-plan-card recoverflow-add-plan">
          <h2>Add New Plan</h2>
          <Form method="post">
            <input type="hidden" name="_intent" value="create" />
            <label>
              Name
              <input name="name" placeholder="Starter" />
            </label>
            <label>
              Monthly Price GH¢
              <input name="monthly_price_cents" type="number" placeholder="0" />
            </label>
            <label>
              Commission %
              <input name="commission_percent" type="number" step="0.01" placeholder="10" />
            </label>
            <label>
              Free Trial Days
              <input name="free_trial_days" type="number" placeholder="14" />
            </label>
            <label>
              Features (comma separated)
              <input name="features" placeholder="Email recovery, Basic analytics" />
            </label>
            <button type="submit" className="recoverflow-primary-button">Create plan</button>
          </Form>
        </div>
      </div>
    </main>
  );
}
