import { redirect } from "@remix-run/node";

export function loader() {
  return redirect("/app/automations");
}

export default function AppIndex() {
  return null;
}
