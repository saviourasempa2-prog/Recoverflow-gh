import { shopifyApp } from "@shopify/shopify-app-remix/server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  appUrl: process.env.SHOPIFY_APP_URL || "",
  scopes: ["read_checkouts", "write_checkouts", "read_orders"],
  authPathPrefix: "/auth",
});

export const authenticate = shopify.authenticate;

export default shopify;
