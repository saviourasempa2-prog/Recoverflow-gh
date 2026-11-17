import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { AppProvider, Text } from "@shopify/polaris";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getMerchantPlan } from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const { session } = await authenticate.admin(request);
  const billingPath = url.pathname === "/app/billing" || url.pathname.startsWith("/app/billing/");
  const currentPlan = await getMerchantPlan(session.shop);
  if (!currentPlan && !billingPath) throw redirect("/app/billing");
  return json({ shop: session.shop, currentPlanName: currentPlan?.name ?? null });
}

export default function AppLayout() {
  const { shop, currentPlanName } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navItems = [
    { label: "Dashboard", to: "/app" },
    { label: "Plans", to: "/app/billing" },
    { label: "Abandoned Cart", to: "/app/carts" },
    { label: "Automation", to: "/app/automations" },
  ];
  const active = (to: string) => to === "/app"
    ? location.pathname === "/app" || location.pathname === "/app/"
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <AppProvider i18n={{} as any}>
      <div className="recoverflow-shell">
        <aside className="recoverflow-sidebar" aria-label="RecoverFlow navigation">
          <div className="recoverflow-brand"><div className="recoverflow-logo" aria-hidden="true">↻</div><Text as="h2" variant="headingMd" tone="textInverted">RecoverFlow</Text></div>
          <div className="recoverflow-shop-chip">{shop}{currentPlanName ? ` · ${currentPlanName}` : " · Choose a plan"}</div>
          <nav className="recoverflow-nav">{navItems.map((item) => <Link key={item.to} to={item.to} className={`recoverflow-nav-link${active(item.to) ? " is-active" : ""}`} aria-current={active(item.to) ? "page" : undefined}>{item.label}</Link>)}</nav>
        </aside>
        <nav className="recoverflow-mobile-nav" aria-label="RecoverFlow navigation">{navItems.map((item) => <Link key={item.to} to={item.to} className={`recoverflow-mobile-nav-link${active(item.to) ? " is-active" : ""}`} aria-current={active(item.to) ? "page" : undefined}>{item.label}</Link>)}</nav>
        <main className="recoverflow-content"><Outlet /></main>
      </div>
    </AppProvider>
  );
}
