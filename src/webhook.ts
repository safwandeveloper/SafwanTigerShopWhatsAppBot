import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from './config.js';
import { commandMenuId, menuReplyText } from './menu.js';
import { sendMainMenu, sendMenuReply } from './whatsapp.js';

function respond(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('request body too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

type FirstMessage =
  | { from: string; kind: 'text'; text: string }
  | { from: string; kind: 'interactive'; id: string };

function firstMessage(payload: unknown): FirstMessage | null {
  if (!payload || typeof payload !== 'object') return null;
  const entries = (payload as { entry?: unknown[] }).entry;
  const change = (entries?.[0] as { changes?: unknown[] } | undefined)?.changes?.[0] as
    | { value?: { messages?: unknown[] } }
    | undefined;
  const message = change?.value?.messages?.[0] as
    | {
        from?: unknown;
        type?: unknown;
        text?: { body?: unknown };
        interactive?: {
          list_reply?: { id?: unknown };
          button_reply?: { id?: unknown };
        };
      }
    | undefined;
  if (typeof message?.from !== 'string') return null;
  if (message.type === 'text' && typeof message.text?.body === 'string') {
    return { from: message.from, kind: 'text', text: message.text.body };
  }
  if (message.type === 'interactive') {
    const id = message.interactive?.list_reply?.id ?? message.interactive?.button_reply?.id;
    if (typeof id === 'string') {
      return { from: message.from, kind: 'interactive', id };
    }
  }
  return null;
}

export async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'GET') {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === config.verifyToken && challenge) {
      respond(res, 200, challenge);
      return;
    }
    respond(res, 403, 'verification_failed');
    return;
  }

  if (req.method !== 'POST') {
    respond(res, 405, 'method_not_allowed');
    return;
  }

  try {
    const payload = JSON.parse(await readBody(req)) as unknown;
    const message = firstMessage(payload);
    respond(res, 200, 'EVENT_RECEIVED');
    if (message) {
      console.info('Received WhatsApp message', {
        from: message.from,
        kind: message.kind,
      });
      if (message.kind === 'text') {
        const id = commandMenuId(message.text);
        const reply = id ? menuReplyText(id) : null;
        if (id === 'menu:main' || !reply) {
          await sendMainMenu(message.from);
        } else {
          await sendMenuReply(message.from, reply);
        }
      } else if (message.id === 'menu:main') {
        await sendMainMenu(message.from);
      } else {
        const reply = menuReplyText(message.id);
        if (reply) {
          await sendMenuReply(message.from, reply);
        } else {
          await sendMainMenu(message.from);
        }
      }
    }
  } catch (error) {
    console.error('WhatsApp webhook processing failed', error);
    if (!res.headersSent) respond(res, 400, 'invalid_request');
  }
}
