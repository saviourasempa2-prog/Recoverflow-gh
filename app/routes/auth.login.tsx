import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { login } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return redirect("/auth/install");
  }

  return login(request);
}

export default function AuthLoginRoute() {
  return null;
}
