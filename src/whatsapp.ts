import { config } from './config.js';

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
  await sendMenuReply(to, '*Welcome to SafwanTiger Shop!*\n\nYour wallet balance is available in Settings.', [
    { id: 'menu:shop', title: 'Shop' },
    { id: 'menu:topup', title: 'Top-up Wallet' },
    { id: 'menu:profile', title: 'Settings' },
  ]);
  await sendMenuReply(to, '*More options*', [
    { id: 'menu:support', title: 'Support' },
    { id: 'menu:ai_support', title: 'Kiwi Ai' },
    { id: 'menu:more', title: 'More' },
  ]);
}

export async function sendMoreMenu(to: string): Promise<void> {
  await sendMenuReply(to, '*More options*', [
    { id: 'menu:refer', title: 'Refer & Earn' },
    { id: 'menu:channel', title: 'Updates' },
    { id: 'menu:main', title: 'Back' },
  ]);
}

export async function sendMenuReply(to: string, body: string, buttons?: Array<{ id: string; title: string }>): Promise<void> {
  const defaultButtons = [{ id: 'menu:main', title: '→' }];
  const safeButtons = (buttons ?? defaultButtons).slice(0, 3).map((b) => ({
    type: 'reply' as const,
    reply: { id: b.id, title: b.title },
  }));

  await postMessage({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      header: { type: 'text', text: 'SafwanTiger Shop' },
      body: { text: body },
      footer: { text: 'Need help? Tap Support anytime.' },
      action: { buttons: safeButtons },
    },
  });
}

export async function sendCommandsReply(to: string, body: string): Promise<void> {
  await sendMenuReply(to, body, [{ id: 'menu:main', title: '→' }]);
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
