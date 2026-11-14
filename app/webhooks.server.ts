type AbandonedCheckout = {
  phone?: string | null;
  email?: string | null;
  abandoned_checkout_url?: string | null;
  total_price?: string | number | null;
};

export async function sendArkeselSMS({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {
  const apiKey = process.env.ARKESEL_API_KEY;
  const sender = process.env.ARKESEL_SENDER_ID || "RecoverFlow";

  if (!apiKey) {
    console.warn("ARKESEL_API_KEY is not configured. Skipping SMS send.");
    return { sent: false, reason: "missing_api_key" };
  }

  const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      message,
      recipients: [phone],
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error("Arkesel SMS send failed", body);
    return { sent: false, status: response.status, body };
  }

  return { sent: true, status: response.status, body };
}

export async function handleAbandonedCheckout(checkout: AbandonedCheckout) {
  const phone = checkout.phone?.trim();
  const email = checkout.email?.trim();
  const abandonedCheckoutUrl = checkout.abandoned_checkout_url || "";
  const totalPrice = Number(checkout.total_price || 0);
  const recoveryMessage = `You left items in your cart! Complete your order here: ${abandonedCheckoutUrl} - Use code RECOVER10 for 10% off`;

  const sendEmail = () => {
    if (!email) return;
    console.log(`Email recovery queued for ${email} for GH₵ ${totalPrice.toFixed(2)}`);
  };

  const sendWhatsApp = async () => {
    if (!phone) return;
    console.log(`WhatsApp recovery queued for ${phone}: ${abandonedCheckoutUrl}`);
  };

  const sendSms = async () => {
    if (!phone) return;
    await sendArkeselSMS({
      phone,
      message: recoveryMessage,
    });
  };

  setTimeout(sendEmail, 30 * 60 * 1000);
  setTimeout(sendWhatsApp, 2 * 60 * 60 * 1000);
  setTimeout(sendSms, 24 * 60 * 60 * 1000);

  return {
    phone,
    email,
    totalPrice,
    abandonedCheckoutUrl,
    recoveryMessage,
  };
}
