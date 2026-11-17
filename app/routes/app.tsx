import { json } from "@remix-run/node";
import { AppProvider, Text } from "@shopify/polaris";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";

import { authenticate } from "../shopify.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");

  try {
    const { session } = await authenticate.admin(request);
    return json({ shop: session?.shop ?? shopParam });
  } catch (error) {
    if (shopParam) {
      return json({ shop: shopParam });
    }

    throw error;
  }
}

export default function AppLayout() {
  const { shop } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", to: "/app" },
    { label: "Abandoned Cart", to: "/app/carts" },
    { label: "Automation", to: "/app/automations" },
  ];

  const isActiveLink = (to: string) => {
    if (to === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }

    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <AppProvider i18n={{} as any}>
      <div className="recoverflow-shell">
        <aside className="recoverflow-sidebar" aria-label="RecoverFlow navigation">
          <div className="recoverflow-brand">
            <div className="recoverflow-logo" aria-hidden="true">↻</div>
            <Text as="h2" variant="headingMd" tone="textInverted">
              RecoverFlow
            </Text>
          </div>

          <div className="recoverflow-shop-chip">{shop ?? "Shop connected"}</div>

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
    </AppProvider>
  );
}
