import { Card, DataTable, Page, Text } from "@shopify/polaris";

export default function CartsPage() {
  const rows = [
    ["Kwame - Accra", "GH₵ 250.00", "Email Sent", "View"],
    ["Ama - Kumasi", "GH₵ 180.00", "WhatsApp Sent", "Recover"],
  ];

  return (
    <Page title="Abandoned Carts - Admin Only">
      <Card>
        <div style={{ padding: 16 }}>
          <Text as="p" variant="bodyMd" tone="subdued">
            This is private. Only the store owner sees this.
          </Text>
        </div>
        <DataTable
          columnContentTypes={["text", "text", "text", "text"]}
          headings={["Customer", "Total", "Status", "Action"]}
          rows={rows}
          stickyHeader
          verticalAlign="middle"
        />
      </Card>
    </Page>
  );
}
