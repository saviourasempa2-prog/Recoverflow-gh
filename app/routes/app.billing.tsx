import { redirect } from "@remix-run/node";

// Keep the previous merchant billing URL working while plans live in Settings.
export function loader() {
  return redirect("/app/settings");
}

export default function BillingRoute() {
  return null;
}
