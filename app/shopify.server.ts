import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";

const databaseUrl = process.env.DATABASE_URL?.trim();
const sessionStorage = databaseUrl
  ? new PostgreSQLSessionStorage(databaseUrl)
  : new MemorySessionStorage();

if (!databaseUrl) {
  console.warn("DATABASE_URL is not configured; using in-memory Shopify sessions.");
}

function isConfigured(value: string | undefined): boolean {
  const normalized = value?.trim();
  return Boolean(normalized) && normalized?.toUpperCase() !== "PASTE_LATER";
}

export const integrations = {
  paystackEnabled:
    isConfigured(process.env.PAYSTACK_SECRET_KEY) &&
    isConfigured(process.env.PAYSTACK_PUBLIC_KEY),
  arkeselEnabled: isConfigured(process.env.ARKESEL_API_KEY),
};

if (!integrations.paystackEnabled || !integrations.arkeselEnabled) {
  console.warn("Paystack/Arkesel not configured yet");
}

// Shopify's appUrl is the public origin; /app is the embedded app route and
// /auth/callback is handled by the auth.$ splat route.
const configuredAppUrl = process.env.SHOPIFY_APP_URL?.trim();
const appUrl = new URL(
  configuredAppUrl || "https://recoverflow-gh.onrender.com",
).origin;

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  appUrl,
  scopes: ["read_checkouts", "write_checkouts", "read_orders"],
  authPathPrefix: "/auth",
  sessionStorage,
});

export const authenticate = shopify.authenticate;
export const login = shopify.login;

export default shopify;
