import { Link, Outlet, useLocation } from "@remix-run/react";
import { Page, Text, Card, Divider } from "@shopify/polaris";

const navItems = [
  { label: "Dashboard", to: "/app" },
  { label: "Automations", to: "/app/automations" },
  { label: "Settings", to: "/app/settings" },
  { label: "Abandoned Carts", to: "/app/carts" },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <Page>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f6f6f7" }}>
        <aside
          style={{
            width: 260,
            background: "#111111",
            color: "#ffffff",
            padding: "24px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#32d583",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111111",
                fontWeight: 700,
              }}
            >
              ↻
            </div>
            <Text as="h2" variant="headingMd" tone="textInverted">
              RecoverFlow
            </Text>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                    color: isActive ? "#ffffff" : "#d1d5db",
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <main style={{ flex: 1, padding: 32 }}>
          <Card>
            <div style={{ padding: 12 }}>
              <Outlet />
            </div>
          </Card>
        </main>
      </div>
    </Page>
  );
}
