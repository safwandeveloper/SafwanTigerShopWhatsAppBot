import { config } from './config.js';
import { MAIN_MENU_ROWS } from './menu.js';

async function postMessage(payload: Record<string, unknown>): Promise<void> {
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
        ...payload,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API returned HTTP ${response.status}: ${errorBody.slice(0, 1_000)}`);
  }
}

export async function sendTextMessage(to: string, body: string): Promise<void> {
  await postMessage({
    to,
    type: 'text',
    text: { preview_url: false, body },
  });
}

export async function sendMainMenu(to: string): Promise<void> {
  await postMessage({
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: 'Welcome to SafwanTiger Shop!' },
      body: { text: 'Choose an option from the menu below.' },
      action: {
        button: 'Main Menu',
        sections: [{ title: 'SafwanTiger Shop', rows: MAIN_MENU_ROWS }],
      },
    },
  });
}

export async function sendMenuReply(to: string, body: string): Promise<void> {
  await postMessage({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: { id: 'menu:main', title: '⬅️ Main Menu' },
          },
        ],
      },
    },
  });
}
