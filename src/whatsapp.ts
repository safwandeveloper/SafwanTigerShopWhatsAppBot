import { config } from './config.js';
import type { AdminData, CustomerRow, MenuView, OrderRow, DepositRow } from './data.js';

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

export async function sendMainMenu(to: string, menuView: MenuView = 'list', balance = 0): Promise<void> {
  if (menuView === 'list') {
    await postMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'SafwanTiger Shop' },
        body: { text: `*Welcome to SafwanTiger Shop!*\n\nWallet balance: ${balance}\n\nChoose an option below.` },
        action: {
          button: 'Open Menu',
          sections: [
            {
              title: 'Store',
              rows: [
                { id: 'menu:shop', title: 'Shop', description: 'Browse products & offers' },
                { id: 'menu:topup', title: 'Top-up Wallet', description: 'Add balance securely' },
                { id: 'menu:profile', title: 'Settings', description: 'Profile, orders & deposits' },
              ],
            },
            {
              title: 'Help & More',
              rows: [
                { id: 'menu:support', title: 'Support', description: 'Chat with our team' },
                { id: 'menu:ai_support', title: 'Kiwi Ai', description: 'Instant AI assistant' },
                { id: 'menu:channel', title: 'Updates Channel', description: 'New stock & announcements' },
              ],
            },
          ],
        },
      },
    });
    return;
  }
  await sendMenuReply(to, `*Welcome to SafwanTiger Shop!*\n\nWallet balance: ${balance}`, [
    { id: 'menu:shop', title: 'Shop' },
    { id: 'menu:topup', title: 'Top-up' },
    { id: 'menu:more', title: 'More' },
  ]);
}

function formatProfileDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US');
}

function customerCode(phoneNumber: string): string {
  let hash = 0;
  for (const character of phoneNumber) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `U-${hash.toString(36).toUpperCase().padStart(6, '0').slice(-6)}`;
}

export async function sendSettingsMenu(
  to: string,
  customer: CustomerRow | null,
  orders: OrderRow[] = [],
): Promise<void> {
  const profile = customer?.display_name || 'WhatsApp customer';
  const balance = customer?.balance ?? 0;
  const phoneNumber = customer?.phone_number ?? to;
  const spent = orders.reduce((total, order) => total + order.amount, 0);
  const joined = customer ? formatProfileDate(customer.created_at) : 'Not recorded';
  const body = [
    '👤 *MY PROFILE*',
    '',
    `*Name:* ${profile}`,
    `*Customer ID:* \`${customerCode(phoneNumber)}\``,
    `*WhatsApp:* ${phoneNumber}`,
    '*Currency:* PKR',
    `*Wallet:* PKR ${balance}`,
    `*Orders:* ${orders.length}`,
    `*Spent:* PKR ${spent}`,
    `*Since:* ${joined}`,
    '',
    'Choose an option below:',
  ].join('\n');
  await sendMenuReply(to, body, [
    { id: 'settings:orders', title: 'Order History' },
    { id: 'settings:deposits', title: 'Deposit History' },
    { id: 'settings:view', title: 'Menu View' },
  ]);
}

export async function sendMenuViewMenu(to: string, current: MenuView): Promise<void> {
  await sendMenuReply(to, `*Menu View*\n\nCurrent view: ${current === 'list' ? 'List menu' : 'Compact buttons'}\n\nChoose your preferred WhatsApp menu style:`, [
    { id: 'settings:view:buttons', title: 'Compact Buttons' },
    { id: 'settings:view:list', title: 'List Menu' },
    { id: 'menu:profile', title: 'Back' },
  ]);
}

function formatHistoryDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export async function sendOrderHistory(to: string, rows: OrderRow[]): Promise<void> {
  const body = rows.length
    ? `*Order History*\n\n${rows.map((row) => `• ${row.product_name}\n  ${row.amount} — ${row.status} — ${formatHistoryDate(row.created_at)}`).join('\n')}`
    : '*Order History*\n\nNo orders recorded yet.';
  await sendMenuReply(to, body, [{ id: 'menu:profile', title: 'Back' }]);
}

export async function sendDepositHistory(to: string, rows: DepositRow[]): Promise<void> {
  const body = rows.length
    ? `*Deposit History*\n\n${rows.map((row) => `• ${row.amount}\n  ${row.status}${row.reference ? ` — ${row.reference}` : ''} — ${formatHistoryDate(row.created_at)}`).join('\n')}`
    : '*Deposit History*\n\nNo deposits recorded yet.';
  await sendMenuReply(to, body, [{ id: 'menu:profile', title: 'Back' }]);
}

export async function sendMoreMenu(to: string): Promise<void> {
  await sendMenuReply(to, '*More options*', [
    { id: 'menu:profile', title: 'Settings' },
    { id: 'menu:support', title: 'Support' },
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
      action: { buttons: safeButtons },
    },
  });
}

export async function sendAdminMenu(to: string): Promise<void> {
  await sendMenuReply(to, '*Admin Panel*\n\nChoose an admin section:', [
    { id: 'admin:dashboard', title: 'Dashboard' },
    { id: 'admin:support', title: 'Support' },
    { id: 'admin:more', title: 'More' },
  ]);
}

export async function sendAdminMoreMenu(to: string): Promise<void> {
  await sendMenuReply(to, '*Admin Panel*\n\nMore tools:', [
    { id: 'admin:data', title: 'Data' },
    { id: 'admin:settings', title: 'Settings' },
    { id: 'admin:main', title: 'Back' },
  ]);
}

export async function sendAdminDataMenu(to: string): Promise<void> {
  await sendMenuReply(to, '*Data Details*\n\nChoose a data section:', [
    { id: 'admin:customers', title: 'Customers' },
    { id: 'admin:orders', title: 'Orders' },
    { id: 'admin:deposits', title: 'Deposits' },
  ]);
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export async function sendAdminData(
  to: string,
  section: 'customers' | 'orders' | 'deposits',
  data: AdminData,
): Promise<void> {
  const body =
    section === 'customers'
      ? `*Customers*\n\n${data.customers.length ? data.customers.map((row) => `• ${row.display_name || row.phone_number} — balance ${row.balance} — seen ${formatDate(row.last_seen_at)}`).join('\n') : 'No customer records yet.'}`
      : section === 'orders'
        ? `*Orders*\n\n${data.orders.length ? data.orders.map((row) => `• ${row.id} — ${row.product_name} — ${row.amount} — ${row.status}`).join('\n') : 'No order records yet.'}`
        : `*Deposits*\n\n${data.deposits.length ? data.deposits.map((row) => `• ${row.id} — ${row.amount} — ${row.status}${row.reference ? ` — ${row.reference}` : ''}`).join('\n') : 'No deposit records yet.'}`;
  await sendMenuReply(to, body, [
    { id: 'admin:data', title: 'Data' },
    { id: 'admin:main', title: 'Back' },
  ]);
}

export async function sendAdminDashboard(to: string, activeSupportUser: string | null): Promise<void> {
  const supportStatus = activeSupportUser ? 'Active customer support chat' : 'No active support chat';
  await sendMenuReply(to, `*Dashboard*\n\n${supportStatus}\n\nWhatsApp menu: active\nTop-up response: configured\nTelegram support link: ${config.telegramSupportUrl ? 'configured' : 'not configured'}`, [
    { id: 'admin:support', title: 'Support' },
    { id: 'admin:settings', title: 'Settings' },
    { id: 'admin:main', title: 'Back' },
  ]);
}

export async function sendAdminSupport(to: string, activeSupportUser: string | null): Promise<void> {
  const status = activeSupportUser
    ? 'One customer is currently connected to live support.'
    : 'No customer is currently connected to live support.';
  await sendMenuReply(to, `*Support*\n\n${status}`, [
    { id: 'admin:close_support', title: 'Close Chat' },
    { id: 'admin:main', title: 'Back' },
  ]);
}

export async function sendAdminSettings(to: string): Promise<void> {
  await sendMenuReply(to, '*Admin Settings*\n\nTop-up response is controlled by WHATSAPP_TOPUP_RESPONSE in Railway Variables.\n\nSupport URL is controlled by WHATSAPP_TELEGRAM_SUPPORT_URL.\n\nAfter changing either value, redeploy the WhatsApp service.', [
    { id: 'admin:commands', title: 'Commands' },
    { id: 'admin:main', title: 'Back' },
  ]);
}

export async function sendAdminCommands(to: string): Promise<void> {
  await sendMenuReply(to, '*Commands*\n\n/admin — Open this admin panel\n/start — Open the customer menu\n/products — Browse products\n/deposit — Add wallet funds\n/settings — Open customer settings\n/support — Get help', [
    { id: 'admin:main', title: 'Back' },
  ]);
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
  await sendMenuReply(to, menuReplyTextForSupport(), [{ id: 'menu:main', title: 'Main Menu' }]);
}

export async function sendLiveSupportPrompt(to: string): Promise<void> {
  await sendMenuReply(
    to,
    '💬 *Live Support*\n\nPlease describe your issue in your next message. Our support team will continue the conversation here.',
    [{ id: 'menu:main', title: 'Main Menu' }],
  );
}

function menuReplyTextForSupport(): string {
  return '💬 *Live Support*\n\nPlease describe your issue in your next message. Our support team will continue the conversation here.';
}
