import { config } from './config.js';

export const MAIN_MENU_ROWS = [
  { id: 'menu:shop', title: '🛍️ Shop', description: 'Browse products & offers' },
  { id: 'menu:topup', title: '👛 Top-up Wallet', description: 'Add balance securely' },
  { id: 'menu:profile', title: '⚙️ My Account', description: 'Orders, balance & settings' },
  { id: 'menu:support', title: '💬 Support', description: 'Chat with our team' },
  { id: 'menu:ai_support', title: '🥝 Kiwi Ai', description: 'Instant AI assistant' },
  { id: 'menu:channel', title: '📢 Updates Channel', description: 'New stock & announcements' },
] as const;

export const COMMANDS = [
  { name: 'start', description: 'Open the main menu' },
  { name: 'products', description: 'Browse products' },
  { name: 'deposit', description: 'Add funds to your wallet' },
  { name: 'settings', description: 'Your account & settings' },
  { name: 'support', description: 'Get help' },
] as const;

export function commandMenuId(text: string): string | null {
  const token = text.trim().toLowerCase().split(/\s+/)[0] ?? '';
  if (!token.startsWith('/')) return null;

  switch (token.slice(1)) {
    case 'start':
      return 'menu:main';
    case 'products':
      return 'menu:shop';
    case 'deposit':
      return 'menu:topup';
    case 'settings':
      return 'menu:profile';
    case 'orders':
      return 'settings:orders';
    case 'deposits':
      return 'settings:deposits';
    case 'support':
      return 'menu:support';
    default:
      return null;
  }
}

export function adminMenuId(text: string): string | null {
  return text.trim().toLowerCase() === '/admin' ? 'admin:main' : null;
}

export function icebreakerMenuId(text: string): string | null {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[?!]+$/g, '')
    .replace(/\s+/g, ' ');
  switch (normalized) {
    case 'show commands':
    case 'show me commands':
      return 'menu:commands';
    case 'what can this bot do':
    case 'what this bot can':
    case 'which purpose is this bot':
      return 'menu:purpose';
    case 'browse products':
    case 'show me products':
      return 'menu:shop';
    case 'how do i topup':
    case 'how do i top up':
      return 'menu:topup';
    case 'i need support':
      return 'menu:support';
    case 'order history':
      return 'settings:orders';
    case 'deposit history':
      return 'settings:deposits';
    default:
      return null;
  }
}

export function menuReplyText(id: string): string | null {
  switch (id) {
    case 'menu:commands':
      return `*Welcome To SafwanTiger Shop!*\n\n*Commands:*\n\n/start — Open the main menu\n/products — Browse products\n/deposit — Add funds to wallet\n/settings — Your Profile Data\n/support — Get help`;
    case 'menu:purpose':
      return '*What can this bot do?*\n\nSafwanTiger Shop is an official automated shopping assistant, available 24/7 to help you browse digital products and subscriptions, discover new stock, learn about wallet top-ups, and reach support.\n\nIt is designed to make shopping simple, secure, and convenient, with quick replies whenever you need assistance.';
    case 'menu:shop':
      return '🛍️ *Shop*\n\nOur product catalog is arriving on WhatsApp very soon.\n_Until then, you can browse and order on Telegram._';
    case 'menu:topup':
      return config.topupResponse;
    case 'menu:profile':
      return '👤 *My Profile*\n\n📊 View your account details, wallet balance, order history, and deposit history below.';
    case 'menu:support':
      return '💬 *Support*\n\nOur team is here for you. Choose Telegram Support for direct contact, or start a live chat here and describe your issue.';
    case 'menu:live_support':
      return '💬 *Live Support*\n\nPlease describe your issue in your next message. A support conversation can continue here.';
    case 'menu:ai_support':
      return '🥝 *Kiwi Ai*\n\nYour instant AI assistant is coming soon to WhatsApp.';
    case 'menu:channel':
      return '📢 *Updates Channel*\n\nStay up to date with new stock alerts, offers, and announcements.\n\nJoin the official channel:\nhttps://t.me/safwantigerstore';
    default:
      return null;
  }
}
