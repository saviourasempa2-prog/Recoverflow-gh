import { redirect } from "@remix-run/node";

// API credentials are managed by the app owner through server environment variables.
// This legacy merchant route intentionally redirects and never renders or returns keys.
export function loader() {
  return redirect("/app/automations");
}

export default function SettingsRoute() {
  return null;
}
