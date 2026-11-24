import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { createCookie } from "@remix-run/node";

const adminSessionCookie = createCookie("recoverflow_admin_session", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
  maxAge: 60 * 60 * 12,
});

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieValue = await adminSessionCookie.parse(request.headers.get("Cookie"));
  return json({ isAuthenticated: cookieValue === "authenticated" });
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

export default function AdminPage() {
  const { isAuthenticated } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!isAuthenticated) {
    return (
      <main className="recoverflow-admin-shell">
        <div className="recoverflow-admin-card recoverflow-admin-auth">
          <div className="recoverflow-badge">Owner portal</div>
          <h1>RecoverFlow Admin</h1>
          <p>Sign in to access the owner portal.</p>
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

  return (
    <main className="recoverflow-admin-shell">
      <div className="recoverflow-admin-card">
        <div className="recoverflow-badge">Owner portal</div>
        <h1>RecoverFlow Admin</h1>
        <p>Merchant payment plan selection is available in the merchant app under Settings. Plan pricing is no longer displayed on this admin page.</p>
      </div>
    </main>
  );
}
