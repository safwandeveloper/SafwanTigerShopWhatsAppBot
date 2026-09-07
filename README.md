# SafwanTiger WhatsApp Bot

Standalone WhatsApp Cloud API webhook service. This repository is intentionally
separate from the Telegram shop bot.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Required environment variables:

- `WEBHOOK_VERIFY_TOKEN`: any long, private string you choose
- `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID`: the phone number ID from WhatsApp Manager

The service listens on `PORT` (default `3000`) and exposes:

- `GET /webhook`: Meta webhook verification
- `POST /webhook`: incoming WhatsApp events
- `GET /health`: deployment health check
- `GET /privacy`: public privacy policy page for Meta app settings

For the first smoke test, the bot replies with a confirmation message. Product
catalog, inventory, payments, and delivery are not connected yet.

## Meta configuration

Deploy this service behind a public HTTPS URL, then set:

- Callback URL: `https://your-domain.example/webhook`
- Verify token: the exact value of `WEBHOOK_VERIFY_TOKEN`

Subscribe the app to the WhatsApp `messages` field after verification.

## Commands

```bash
npm run build
npm run typecheck
npm run lint
npm start
```
