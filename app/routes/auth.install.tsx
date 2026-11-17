import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";

const SHOPIFY_APP_STORE_URL = "https://apps.shopify.com/recoverflow";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    return redirect(`/auth/login?shop=${encodeURIComponent(shop)}`);
  }

  return json({ appStoreUrl: SHOPIFY_APP_STORE_URL });
}

export default function AuthInstallRoute() {
  const { appStoreUrl } = ({} as any);

  return (
    <main className="recoverflow-install-shell">
      <div className="recoverflow-install-card">
        <span className="recoverflow-badge">Shopify app install</span>
        <h1>Install RecoverFlow</h1>
        <p>Bring back lost sales with smart recovery automations and faster follow-up.</p>
        <a className="recoverflow-primary-button" href={appStoreUrl} target="_blank" rel="noreferrer">
          Install via Shopify App Store
        </a>
      </div>
    </main>
  );
}
