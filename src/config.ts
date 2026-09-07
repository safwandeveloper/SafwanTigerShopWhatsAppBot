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
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65_535) {
  throw new Error('PORT must be a valid TCP port');
}
