import { Link, Outlet, useLocation } from "@remix-run/react";
import { Text } from "@shopify/polaris";

const navItems = [
  { label: "Dashboard", to: "/app" },
  { label: "Automations", to: "/app/automations" },
  { label: "Abandoned Carts", to: "/app/carts" },
];

export default function AppLayout() {
  const location = useLocation();

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
            const isActive = location.pathname === item.to;
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
          const isActive = location.pathname === item.to;
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
