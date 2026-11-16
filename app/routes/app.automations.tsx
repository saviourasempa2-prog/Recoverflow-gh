import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, Page, Text, Checkbox, Banner } from "@shopify/polaris";

import { integrations } from "../shopify.server";

export function loader() {
  return json({ arkeselEnabled: integrations.arkeselEnabled });
}

export default function AutomationsPage() {
  const { arkeselEnabled } = useLoaderData<typeof loader>();
  const [settings, setSettings] = useState({
    email: true,
    whatsapp: arkeselEnabled,
    sms: arkeselEnabled,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <Page title="Automations - Automatic Recovery">
      <Card>
        <div style={{ padding: 16, display: "grid", gap: 20 }}>
          {!arkeselEnabled && (
            <Banner tone="warning" title="Arkesel is not configured">
              <p>Add ARKESEL_API_KEY in your hosting environment to enable WhatsApp and SMS automations.</p>
            </Banner>
          )}
          <Checkbox
            label="Email (30 mins after abandon)"
            checked={settings.email}
            onChange={(checked) => updateSetting("email", checked)}
          />

          <Checkbox
            label="WhatsApp via Arkesel (2 hours after)"
            checked={settings.whatsapp}
            disabled={!arkeselEnabled}
            onChange={(checked) => updateSetting("whatsapp", checked)}
          />

          <Checkbox
            label="SMS via Arkesel (24 hours after)"
            checked={settings.sms}
            disabled={!arkeselEnabled}
            onChange={(checked) => updateSetting("sms", checked)}
          />
        </div>
      </Card>
    </Page>
  );
}
