import { Card, Grid, Page, Text, Badge } from "@shopify/polaris";

export default function DashboardPage() {
  const statuses = [
    { label: "Email", value: "ON" },
    { label: "WhatsApp", value: "ON" },
    { label: "SMS via Arkesel", value: "ON" },
  ];

  const steps = ["Connect channels", "Customize messages", "Monitor results"];

  return (
    <Page title="RecoverFlow Dashboard">
      <Grid>
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
          <Card>
            <div style={{ padding: "16px" }}>
              <Text as="p" variant="bodyMd" tone="subdued">
                Recovered Revenue
              </Text>
              <Text as="h2" variant="heading2xl">
                GH₵ 0.00
              </Text>
            </div>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
          <Card>
            <div style={{ padding: "16px" }}>
              <Text as="p" variant="bodyMd" tone="subdued">
                Carts Recovered
              </Text>
              <Text as="h2" variant="heading2xl">
                0
              </Text>
            </div>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
          <Card>
            <div style={{ padding: "16px" }}>
              <Text as="p" variant="bodyMd" tone="subdued">
                Recovered Orders
              </Text>
              <Text as="h2" variant="heading2xl">
                0
              </Text>
            </div>
          </Card>
        </Grid.Cell>
      </Grid>

      <div style={{ marginTop: 24 }}>
        <Card>
          <div style={{ padding: "16px" }}>
            <Text as="h3" variant="headingMd">
              Automation Status
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
              {statuses.map((status) => (
                <Badge key={status.label} tone="success">
                  {status.label}: {status.value}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card>
          <div style={{ padding: "16px" }}>
            <Text as="h3" variant="headingMd">
              Getting Started
            </Text>
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {steps.map((step, index) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge tone="info">{index + 1}</Badge>
                  <Text as="span" variant="bodyMd">
                    {step}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
