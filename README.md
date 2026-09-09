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

Optional response settings:

- `WHATSAPP_TOPUP_RESPONSE`: admin-editable reply for the “How do I top up?” icebreaker. Update it in Railway Variables and redeploy.
- `WHATSAPP_TELEGRAM_SUPPORT_URL`: Telegram support URL used by the Support icebreaker.
- `WHATSAPP_ADMIN_PHONE_NUMBER`: admin WhatsApp number for live-support relay and `/admin` access. Local Pakistani numbers such as `03276996499` are normalized automatically.
- `WHATSAPP_SUPABASE_URL`: URL of the separate Supabase project used only by the WhatsApp bot.
- `WHATSAPP_SUPABASE_SERVICE_ROLE_KEY`: service-role key for that separate Supabase project. Keep it only in Railway Variables.

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

## Icebreakers

Recommended icebreakers are:

- `Show Commands` — shows `/start`, `/products`, `/deposit`, `/settings`, and `/support`.
- `What can this bot do?` — explains the shop categories and features.
- `Browse products` — opens the shop response.
- `How do I top up?` — uses `WHATSAPP_TOPUP_RESPONSE`.
- `I need support` — offers the configured Telegram support link and a live chat button.

Meta stores the icebreaker labels; the bot supplies the responses through the webhook.
Live support relays one active customer at a time to `WHATSAPP_ADMIN_PHONE_NUMBER`.

The admin can send `/admin` from the configured admin number to open the private
admin panel. It includes a dashboard, live-support status/close control,
command reference, and links to the Railway-managed settings. Customer numbers
cannot open this panel.

Run `supabase/schema.sql` in the separate WhatsApp Supabase project's SQL
editor. The admin panel then exposes recent customers, orders, and deposits;
the Telegram Supabase project is never queried.

## Commands

```bash
npm run build
npm run typecheck
npm run lint
npm start
```
