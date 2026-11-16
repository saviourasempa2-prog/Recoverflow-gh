import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { authenticate, login } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // The splat route handles both /auth/login and /auth/callback. The login
  // endpoint must use Shopify's login helper, never authenticate.admin().
  if (url.pathname === "/auth/login") {
    if (!url.searchParams.get("shop")) {
      return json({ needsShop: true as const });
    }

    return login(request);
  }

  // Keep the OAuth callback exchange working for /auth/callback.
  await authenticate.admin(request);
  return json({ needsShop: false as const });
}

export default function AuthRoute() {
  const data = useLoaderData<typeof loader>();

  if (!data.needsShop) return null;

  return (
    <main style={{ maxWidth: 420, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Log in to RecoverFlow</h1>
      <p>Enter your Shopify store domain to continue.</p>
      <Form method="get" action="/auth/login">
        <label htmlFor="shop">Shop domain</label>
        <input
          id="shop"
          name="shop"
          type="text"
          placeholder="your-store.myshopify.com"
          autoComplete="url"
          required
          style={{ display: "block", width: "100%", margin: "0.5rem 0 1rem", padding: "0.6rem" }}
        />
        <button type="submit">Continue</button>
      </Form>
    </main>
  );
}
