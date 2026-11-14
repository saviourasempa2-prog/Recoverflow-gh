import { useState } from "react";
import { Button, Card, Form, FormLayout, Page, Text, TextField } from "@shopify/polaris";

export default function SettingsPage() {
  const [arkeselApiKey, setArkeselApiKey] = useState("");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");

  return (
    <Page title="Settings - API Keys">
      <Card>
        <div style={{ padding: 16 }}>
          <Form>
            <FormLayout>
              <TextField
                label="Arkesel API Key"
                value={arkeselApiKey}
                onChange={setArkeselApiKey}
                helpText="Use Test Key for testing"
                autoComplete="off"
              />

              <TextField
                label="Paystack Secret Key"
                value={paystackSecretKey}
                onChange={setPaystackSecretKey}
                helpText="Use Test Key for testing"
                autoComplete="off"
              />

              <Button primary onClick={() => undefined}>
                Save Settings
              </Button>
            </FormLayout>
          </Form>
        </div>
      </Card>
    </Page>
  );
}
