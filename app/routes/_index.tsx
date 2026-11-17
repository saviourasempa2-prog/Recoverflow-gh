import { Form, Link } from "@remix-run/react";

export default function LandingPage() {
  return (
    <main className="recoverflow-landing">
      <div className="recoverflow-hero-card">
        <div className="recoverflow-badge">Turn abandoned carts into recovered revenue</div>
        <h1>RecoverFlow</h1>
        <p>
          Recover lost sales with smart email, SMS, and WhatsApp follow-ups that help customers come back and finish checkout.
        </p>

        <div className="recoverflow-cta-row">
          <a
            className="recoverflow-primary-button"
            href="https://apps.shopify.com/recoverflow"
            target="_blank"
            rel="noreferrer"
          >
            Add App - Install Free
          </a>
          <Link className="recoverflow-secondary-button" to="/auth/install">
            Install options
          </Link>
        </div>

        <div className="recoverflow-feature-grid">
          <div className="recoverflow-feature-card">
            <strong>Realtime recovery</strong>
            <span>Send timely, personalized follow-ups.</span>
          </div>
          <div className="recoverflow-feature-card">
            <strong>Multi-channel</strong>
            <span>Email, SMS, and WhatsApp automation.</span>
          </div>
          <div className="recoverflow-feature-card">
            <strong>Higher conversion</strong>
            <span>Win back customers before they leave.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
