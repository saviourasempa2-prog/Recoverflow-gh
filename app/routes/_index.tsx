import { Navigate } from "@remix-run/react";

export default function RootIndex() {
  return <Navigate to="/merchant" replace />;
}
