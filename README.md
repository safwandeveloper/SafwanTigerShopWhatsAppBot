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

Text messages open the WhatsApp main menu. Menu items return placeholder replies
until the product catalog, inventory, payments, and delivery are wired up.

## Meta configuration

Deploy this service behind a public HTTPS URL, then set:

- Callback URL: `https://your-domain.example/webhook`
- Verify token: the exact value of `WEBHOOK_VERIFY_TOKEN`

Subscribe the app to the WhatsApp `messages` field after verification.

## WhatsApp commands

Available commands:

- `/start` — Open the main menu
- `/products` — Browse products
- `/deposit` — Add funds to your wallet
- `/settings` — Your account & settings
- `/support` — Get help

Run `npm run setup:commands` once after deployment with the same environment
variables. Commands can also be configured manually in WhatsApp Manager →
Phone numbers → Automations → Commands. Enabling `enable_welcome_message`
makes Meta send a `request_welcome` event when someone opens the chat for the
first time; this bot ignores that event.

## Commands

```bash
npm run build
npm run typecheck
npm run lint
npm start
```
