import { useState } from "react";
import { Card, Page, Text, Switch } from "@shopify/polaris";

export default function AutomationsPage() {
  const [settings, setSettings] = useState({
    email: true,
    whatsapp: true,
    sms: true,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <Page title="Automations - Automatic Recovery">
      <Card>
        <div style={{ padding: 16, display: "grid", gap: 20 }}>
          <Switch
            label="Email (30 mins after abandon)"
            checked={settings.email}
            onChange={(checked) => updateSetting("email", checked)}
          />

          <Switch
            label="WhatsApp via Arkesel (2 hours after)"
            checked={settings.whatsapp}
            onChange={(checked) => updateSetting("whatsapp", checked)}
          />

          <Switch
            label="SMS via Arkesel (24 hours after)"
            checked={settings.sms}
            onChange={(checked) => updateSetting("sms", checked)}
          />
        </div>
      </Card>
    </Page>
  );
}
