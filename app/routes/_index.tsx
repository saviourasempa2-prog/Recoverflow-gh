import { Link } from "@remix-run/react";

export default function RootIndex() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg, #effcf5 0%, #f5f3ff 55%, #fff7ed 100%)",
        color: "#17211b",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(100%, 620px)",
          padding: 36,
          borderRadius: 20,
          background: "#ffffff",
          boxShadow: "0 20px 60px rgba(23, 33, 27, 0.12)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 12 }} aria-hidden="true">↻</div>
        <h1 style={{ margin: 0, fontSize: 32 }}>RecoverFlow</h1>
        <p style={{ margin: "16px 0 24px", color: "#526158", lineHeight: 1.6 }}>
          Recover abandoned carts with automated follow-ups for your Shopify store.
        </p>
        <Link
          to="/app"
          style={{
            display: "inline-block",
            padding: "12px 22px",
            borderRadius: 10,
            background: "#16834b",
            color: "#ffffff",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Open the app
        </Link>
      </section>
    </main>
  );
}
