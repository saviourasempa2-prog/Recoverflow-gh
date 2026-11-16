import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { Text } from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  const adminShops = (process.env.ADMIN_SHOPS ?? "")
    .split(",")
    .map((shop) => shop.trim().toLowerCase())
    .filter(Boolean);

  const currentShop = String(session?.shop ?? "").trim().toLowerCase();
  const isAdmin = adminShops.includes(currentShop);

  return json({ isAdmin, currentShop });
}

export default function AppLayout() {
  const { isAdmin } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", to: "/app" },
    { label: "Abandoned Cart", to: "/app/carts" },
    { label: "Automation", to: "/app/automations" },
    ...(isAdmin ? [{ label: "Settings", to: "/app/settings" }] : []),
  ];

  const isActiveLink = (to: string) => {
    if (to === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }

    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="recoverflow-shell">
      <aside className="recoverflow-sidebar" aria-label="RecoverFlow navigation">
        <div className="recoverflow-brand">
          <div className="recoverflow-logo" aria-hidden="true">↻</div>
          <Text as="h2" variant="headingMd" tone="textInverted">
            RecoverFlow
          </Text>
        </div>
        <nav className="recoverflow-nav">
          {navItems.map((item) => {
            const isActive = isActiveLink(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`recoverflow-nav-link${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="recoverflow-mobile-nav" aria-label="RecoverFlow navigation">
        {navItems.map((item) => {
          const isActive = isActiveLink(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`recoverflow-mobile-nav-link${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="recoverflow-content">
        <Outlet />
      </main>
    </div>
  );
}
