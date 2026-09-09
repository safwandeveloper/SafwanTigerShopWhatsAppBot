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
      header: { type: 'text', text: 'SafwanTiger Shop' },
      body: {
        text: '👋 *Welcome to SafwanTiger Shop*\n\nPremium digital products, delivered instantly.\n_Secure payments • 24/7 support_\n\nTap the button below to open the menu.',
      },
      footer: { text: 'SafwanTiger Shop • Trusted since day one' },
      action: {
        button: 'Open Menu',
        sections: [
          {
            title: 'Store',
            rows: MAIN_MENU_ROWS.slice(0, 3),
          },
          {
            title: 'Help & More',
            rows: MAIN_MENU_ROWS.slice(3),
          },
        ],
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
      header: { type: 'text', text: 'SafwanTiger Shop' },
      body: { text: body },
      footer: { text: 'Need help? Tap Support anytime.' },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: { id: 'menu:main', title: '🏠 Main Menu' },
          },
          {
            type: 'reply',
            reply: { id: 'menu:live_support', title: '💬 Live Support' },
          },
        ],
      },
    },
  });
}

export async function sendSupportReply(to: string): Promise<void> {
  if (config.telegramSupportUrl) {
    await postMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: {
          text: '💬 *Telegram Support*\n\nFor direct contact, use the button below. You can also start live support here.',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'Telegram Support',
            url: config.telegramSupportUrl,
          },
        },
      },
    });
  }
  await sendMenuReply(to, menuReplyTextForSupport());
}

export async function sendLiveSupportPrompt(to: string): Promise<void> {
  await sendMenuReply(
    to,
    '💬 *Live Support*\n\nPlease describe your issue in your next message. Our support team will continue the conversation here.',
  );
}

function menuReplyTextForSupport(): string {
  return '💬 *Live Support*\n\nTap Live Support and send your issue here. Our team can continue the conversation in this chat.';
}
