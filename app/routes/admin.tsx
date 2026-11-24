import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { createCookie } from "@remix-run/node";
import { getAdminDashboardStats } from "../admin-dashboard.server";

const adminSessionCookie = createCookie("recoverflow_admin_session", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
  maxAge: 60 * 60 * 12,
  secrets: process.env.ADMIN_SESSION_SECRET
    ? [process.env.ADMIN_SESSION_SECRET]
    : process.env.ADMIN_PASSWORD
      ? [process.env.ADMIN_PASSWORD]
      : [],
});

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieValue = await adminSessionCookie.parse(request.headers.get("Cookie"));
  const isAuthenticated = cookieValue === "authenticated";
  if (!isAuthenticated) return json({ isAuthenticated: false, stats: null });

  try {
    const stats = await getAdminDashboardStats();
    return json({ isAuthenticated: true, stats, dashboardError: null });
  } catch (error) {
    console.error("Failed to load admin dashboard metrics", error);
    return json({
      isAuthenticated: true,
      stats: null,
      dashboardError: "Dashboard metrics could not be loaded. Check the database connection.",
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  if (String(formData.get("_intent") ?? "") !== "login") {
    return json({ error: "Unknown action." }, { status: 400 });
  }

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminPage() {
  const { isAuthenticated, stats, dashboardError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!isAuthenticated) {
    return (
      <main className="recoverflow-admin-shell">
        <div className="recoverflow-admin-card recoverflow-admin-auth">
          <div className="recoverflow-badge">Owner portal</div>
          <h1>RecoverFlow Admin</h1>
          <p>Sign in to access the owner dashboard.</p>
          {actionData?.error ? <p role="alert">{actionData.error}</p> : null}
          <Form method="post">
            <input type="hidden" name="_intent" value="login" />
            <label htmlFor="password">Admin password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" />
            <button type="submit" className="recoverflow-primary-button full-width">Sign in</button>
          </Form>
        </div>
      </main>
    );
  }

  const metrics = stats ? [
    { label: "Total merchants", value: stats.totalMerchants.toLocaleString(), detail: `${stats.activeMerchants.toLocaleString()} active` },
    { label: "Revenue recovered", value: formatCurrency(stats.recoveredRevenue), detail: `${stats.recoveredOrders.toLocaleString()} recovered orders` },
    { label: "Fees collected", value: formatCurrency(stats.feesCollected), detail: `${formatCurrency(stats.feesPending)} pending collection` },
    { label: "Recovered this week", value: stats.recoveredOrdersLast7Days.toLocaleString(), detail: "Orders in the last 7 days" },
    { label: "Abandoned carts", value: "Not tracked", detail: "Checkout records are not currently stored" },
  ] : [];

  return (
    <main className="recoverflow-admin-shell">
      <div className="recoverflow-admin-card" style={{ width: "min(1100px, 100%)" }}>
        <div className="recoverflow-header-row">
          <div>
            <div className="recoverflow-badge">Owner portal</div>
            <h1>RecoverFlow Admin Dashboard</h1>
            <p>Platform-wide merchant, recovery, and fee collection overview.</p>
          </div>
          <span className="recoverflow-status-pill">Live metrics</span>
        </div>

        {dashboardError ? <p className="recoverflow-inline-error" role="alert">{dashboardError}</p> : null}

        {stats ? (
          <>
            <section aria-label="Platform metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
              {metrics.map((metric) => (
                <article key={metric.label} className="recoverflow-plan-card" style={{ margin: 0 }}>
                  <p style={{ margin: 0, opacity: 0.75 }}>{metric.label}</p>
                  <h2 style={{ margin: "10px 0", fontSize: "1.6rem" }}>{metric.value}</h2>
                  <p style={{ margin: 0, fontSize: ".9rem", opacity: 0.75 }}>{metric.detail}</p>
                </article>
              ))}
            </section>
            <section style={{ marginTop: 24 }}>
              <h2>Data coverage</h2>
              <p>Merchant and recovered-order totals come from the connected database. Abandoned checkout events are not persisted yet, so a reliable abandoned-cart count is unavailable.</p>
              <p>Fees are counted as collected only when their billing status is marked <code>collected</code> or <code>paid</code>.</p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
