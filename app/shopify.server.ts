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

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  appUrl: process.env.SHOPIFY_APP_URL || "",
  scopes: ["read_checkouts", "write_checkouts", "read_orders"],
  authPathPrefix: "/auth",
  sessionStorage,
});

export const authenticate = shopify.authenticate;

export default shopify;
