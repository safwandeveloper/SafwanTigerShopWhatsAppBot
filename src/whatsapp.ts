import { config } from './config.js';

export async function sendTextMessage(to: string, body: string): Promise<void> {
  if (!config.accessToken || !config.phoneNumberId) {
    console.warn('WhatsApp credentials are not configured; message was not sent');
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API returned HTTP ${response.status}: ${errorBody.slice(0, 1_000)}`);
  }
}
