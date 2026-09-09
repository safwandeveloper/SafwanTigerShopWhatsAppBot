export const MAIN_MENU_ROWS = [
  { id: 'menu:shop', title: '🛍️ Shop', description: 'Browse products & offers' },
  { id: 'menu:topup', title: '👛 Top-up Wallet', description: 'Add balance securely' },
  { id: 'menu:profile', title: '⚙️ My Account', description: 'Orders, balance & settings' },
  { id: 'menu:support', title: '💬 Support', description: 'Chat with our team' },
  { id: 'menu:ai_support', title: '🥝 Kiwi Ai', description: 'Instant AI assistant' },
  { id: 'menu:refer', title: '🎁 Refer & Earn', description: 'Invite friends, get rewards' },
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
    case 'support':
      return 'menu:support';
    default:
      return null;
  }
}

export function menuReplyText(id: string): string | null {
  switch (id) {
    case 'menu:shop':
      return '🛍️ *Shop*\n\nOur product catalog is arriving on WhatsApp very soon.\n_Until then, you can browse and order on Telegram._';
    case 'menu:topup':
      return '👛 *Top-up Wallet*\n\nWallet top-ups on WhatsApp are coming soon.\n_Your balance and payments will stay secure and instant._';
    case 'menu:profile':
      return '⚙️ *My Account*\n\nOrders, balance and settings will appear here soon.';
    case 'menu:support':
      return '💬 *Support*\n\nOur team is here for you.\nWe usually reply within a few minutes — just describe your issue.';
    case 'menu:ai_support':
      return '🥝 *Kiwi Ai*\n\nYour instant AI assistant is coming soon to WhatsApp.';
    case 'menu:refer':
      return '🎁 *Refer & Earn*\n\nInvite friends and earn rewards on every purchase.\n_Referral links on WhatsApp are coming soon._';
    case 'menu:channel':
      return '📢 *Updates Channel*\n\nGet new stock alerts and announcements first:\nhttps://t.me/safwantigerstore';
    default:
      return null;
  }
}
