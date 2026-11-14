import { Link } from "@remix-run/react";
import { Button, Card, Page, Text } from "@shopify/polaris";

export default function MerchantPage() {
  return (
    <Page>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#111111",
          padding: 40,
        }}
      >
        <Card>
          <div style={{ maxWidth: 760, padding: 32, textAlign: "center" }}>
            <Text as="h1" variant="heading2xl">
              RecoverFlow - Recover Abandoned Carts Automatically
            </Text>

            <div style={{ marginTop: 16 }}>
              <Text as="p" variant="bodyLg">
                Automatic Email + WhatsApp + SMS via Arkesel. Paystack Ready. Recover 30% more sales without lifting a finger.
              </Text>
            </div>

            <div style={{ marginTop: 28 }}>
              <Link to="/app">
                <Button primary size="large">
                  Install App - Start Free
                </Button>
              </Link>
            </div>

            <div style={{ marginTop: 20 }}>
              <Text as="p" variant="bodyMd" tone="subdued">
                For Merchants in Ghana & Africa
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
