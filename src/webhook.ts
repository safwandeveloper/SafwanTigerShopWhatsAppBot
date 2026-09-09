import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from './config.js';
import { commandMenuId, icebreakerMenuId, menuReplyText } from './menu.js';
import {
  sendLiveSupportPrompt,
  sendMainMenu,
  sendMenuReply,
  sendSupportReply,
  sendTextMessage,
} from './whatsapp.js';

let liveSupportUser: string | null = null;

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
        if (message.from === config.adminPhoneNumber && liveSupportUser) {
          await sendTextMessage(liveSupportUser, `💬 *Support*\n\n${message.text}`);
          return;
        }
        const id = icebreakerMenuId(message.text) ?? commandMenuId(message.text);
        if (id === 'menu:live_support') {
          if (liveSupportUser && liveSupportUser !== message.from) {
            await sendTextMessage(
              message.from,
              '⏳ Live Support is currently helping another customer. Please try again shortly.',
            );
            return;
          }
          liveSupportUser = message.from;
          await sendLiveSupportPrompt(message.from);
          if (config.adminPhoneNumber) {
            await sendTextMessage(
              config.adminPhoneNumber,
              '🔔 *New WhatsApp Live Support*\n\nA customer is waiting for help. Reply to this message to continue the chat.',
            );
          }
          return;
        }
        if (id === 'menu:main') {
          liveSupportUser = null;
        }
        if (liveSupportUser === message.from && !id) {
          if (config.adminPhoneNumber) {
            await sendTextMessage(config.adminPhoneNumber, `💬 *Customer message*\n\n${message.text}`);
            await sendTextMessage(message.from, 'Message received. A support team member will reply here shortly.');
          } else {
            await sendTextMessage(
              message.from,
              'Message received. Please configure the WhatsApp admin number for live support replies.',
            );
          }
          return;
        }
        const reply = id ? menuReplyText(id) : null;
        if (id === 'menu:main' || !reply) {
          await sendMainMenu(message.from);
        } else if (id === 'menu:support') {
          await sendSupportReply(message.from);
        } else {
          await sendMenuReply(message.from, reply);
        }
      } else if (message.id === 'menu:main') {
        await sendMainMenu(message.from);
      } else {
        const reply = menuReplyText(message.id);
        if (message.id === 'menu:support') {
          await sendSupportReply(message.from);
        } else if (reply) {
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
