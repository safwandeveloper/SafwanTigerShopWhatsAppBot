export const MAIN_MENU_ROWS = [
  { id: 'menu:shop', title: '🛍 Shop', description: 'Browse products' },
  { id: 'menu:topup', title: '👛 Top-up Wallet', description: 'Add balance' },
  { id: 'menu:profile', title: '⚙️ Settings', description: 'Account & preferences' },
  { id: 'menu:support', title: '💬 Support', description: 'Talk to our team' },
  { id: 'menu:ai_support', title: '🥝 Kiwi Ai', description: 'AI assistant' },
  { id: 'menu:refer', title: '🎁 Refer', description: 'Invite friends & earn' },
  { id: 'menu:channel', title: '📢 Channel', description: 'Updates & new stock' },
] as const;

export function menuReplyText(id: string): string | null {
  switch (id) {
    case 'menu:shop':
      return '🛍 Shop\n\nProduct catalog is coming soon on WhatsApp.';
    case 'menu:topup':
      return '👛 Top-up Wallet\n\nWallet top-ups are coming soon on WhatsApp.';
    case 'menu:profile':
      return '⚙️ Settings\n\nAccount preferences are coming soon on WhatsApp.';
    case 'menu:support':
      return '💬 Support\n\nOur support team will be available here soon.';
    case 'menu:ai_support':
      return '🥝 Kiwi Ai\n\nAI assistance is coming soon on WhatsApp.';
    case 'menu:refer':
      return '🎁 Refer\n\nReferral rewards are coming soon on WhatsApp.';
    case 'menu:channel':
      return '📢 Channel\n\nFollow our Telegram channel: https://t.me/safwantigerstore';
    default:
      return null;
  }
}
