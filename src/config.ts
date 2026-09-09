import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  verifyToken: required('WEBHOOK_VERIFY_TOKEN'),
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '',
  graphVersion: process.env.WHATSAPP_GRAPH_VERSION?.trim() || 'v23.0',
  topupResponse:
    process.env.WHATSAPP_TOPUP_RESPONSE?.trim() ||
    '👛 *Top-up Wallet*\n\nWallet top-ups on WhatsApp are coming soon.\n_Your balance and payments will stay secure and instant._',
  telegramSupportUrl: process.env.WHATSAPP_TELEGRAM_SUPPORT_URL?.trim() ?? '',
  adminPhoneNumber: process.env.WHATSAPP_ADMIN_PHONE_NUMBER?.replace(/\D/g, '') ?? '',
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65_535) {
  throw new Error('PORT must be a valid TCP port');
}
