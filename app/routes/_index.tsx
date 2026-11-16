import { redirect } from "@remix-run/node";

export function loader() {
  return redirect("/app");
}

export default function RootIndex() {
  return null;
}
