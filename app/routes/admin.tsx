import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createCookie } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

const adminSessionCookie = createCookie("recoverflow_admin_session", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
});

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieValue = await adminSessionCookie.parse(request.headers.get("Cookie"));
  const isAuthenticated = cookieValue === "authenticated";

  return json({
    isAuthenticated,
    stats: {
      stores: 128,
      recoveredRevenue: "GH₵ 48,280.00",
      cartsRecovered: 1043,
      activeAutomations: 7,
      appStatus: "Enabled",
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submittedPassword = String(formData.get("password") ?? "");
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedPassword || submittedPassword !== expectedPassword) {
    return json({ error: "Invalid admin password" }, { status: 401 });
  }

  return redirect("/admin", {
    headers: {
      "Set-Cookie": await adminSessionCookie.serialize("authenticated"),
    },
  });
}

export default function AdminRoute() {
  const { isAuthenticated, stats, error } = useLoaderData<typeof loader>();

  if (!isAuthenticated) {
    return (
      <main className="recoverflow-admin-shell">
        <div className="recoverflow-admin-card recoverflow-admin-auth">
          <div className="recoverflow-badge">Owner portal</div>
          <h1>RecoverFlow Admin</h1>
          <p>Use your admin password to access the control center.</p>

          <Form method="post">
            <label htmlFor="password">Admin password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" />
            {error ? <div className="recoverflow-inline-error">{error}</div> : null}
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
            <div className="recoverflow-badge">Operating status</div>
            <h1>RecoverFlow Admin</h1>
          </div>
          <span className="recoverflow-status-pill">{stats.appStatus}</span>
        </div>

        <div className="recoverflow-metric-grid">
          <div className="recoverflow-metric-card accent-purple">
            <span>Total stores</span>
            <strong>{stats.stores}</strong>
          </div>
          <div className="recoverflow-metric-card accent-green">
            <span>Recovered revenue</span>
            <strong>{stats.recoveredRevenue}</strong>
          </div>
          <div className="recoverflow-metric-card accent-blue">
            <span>Carts recovered</span>
            <strong>{stats.cartsRecovered}</strong>
          </div>
          <div className="recoverflow-metric-card accent-orange">
            <span>Active automations</span>
            <strong>{stats.activeAutomations}</strong>
          </div>
        </div>

        <div className="recoverflow-table-card">
          <h2>Overview</h2>
          <ul>
            <li>All merchant shops are connected and syncing.</li>
            <li>Checkout recovery automations are active.</li>
            <li>Marketing follow-ups are scheduled across email, SMS, and WhatsApp.</li>
            <li>App health remains stable across deployments.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
