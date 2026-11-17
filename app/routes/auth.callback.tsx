import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  return redirect(shop ? `/app?shop=${encodeURIComponent(shop)}` : "/app");
}

export default function AuthCallbackRoute() {
  return null;
}
