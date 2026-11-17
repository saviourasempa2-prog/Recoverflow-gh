import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (url.pathname === "/auth/login") {
    return redirect(shop ? `/auth/login?shop=${encodeURIComponent(shop)}` : "/auth/install");
  }

  if (url.pathname === "/auth/callback") {
    return redirect(shop ? `/app?shop=${encodeURIComponent(shop)}` : "/app");
  }

  return redirect("/app");
}

export default function AuthFallbackRoute() {
  return null;
}
