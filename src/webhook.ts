import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from './config.js';
import {
  getAdminData,
  getCustomer,
  getCustomerDeposits,
  getCustomerMenuView,
  getCustomerOrders,
  recordCustomer,
  setCustomerMenuView,
  type MenuView,
} from './data.js';
import { adminMenuId, commandMenuId, icebreakerMenuId, menuReplyText } from './menu.js';
import {
  sendAdminCommands,
  sendAdminData,
  sendAdminDataMenu,
  sendAdminDashboard,
  sendAdminMenu,
  sendAdminMoreMenu,
  sendAdminSettings,
  sendAdminSupport,
  sendCommandsReply,
  sendDepositHistory,
  sendMenuViewMenu,
  sendOrderHistory,
  sendSettingsMenu,
  sendLiveSupportPrompt,
  sendMainMenu,
  sendMenuReply,
  sendMoreMenu,
  sendSupportReply,
  sendTextMessage,
} from './whatsapp.js';

let liveSupportUser: string | null = null;

async function sendCustomerMainMenu(phoneNumber: string): Promise<void> {
  const customer = await getCustomer(phoneNumber);
  await sendMainMenu(phoneNumber, await getCustomerMenuView(phoneNumber), customer?.balance ?? 0);
}

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
  | { from: string; displayName: string | null; kind: 'text'; text: string }
  | { from: string; displayName: string | null; kind: 'interactive'; id: string };

function firstMessage(payload: unknown): FirstMessage | null {
  if (!payload || typeof payload !== 'object') return null;
  const entries = (payload as { entry?: unknown[] }).entry;
  const change = (entries?.[0] as { changes?: unknown[] } | undefined)?.changes?.[0] as
    | { value?: { contacts?: unknown[]; messages?: unknown[] } }
    | undefined;
  const contact = change?.value?.contacts?.[0] as { profile?: { name?: unknown } } | undefined;
  const displayName = typeof contact?.profile?.name === 'string' ? contact.profile.name : null;
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
    return { from: message.from, displayName, kind: 'text', text: message.text.body };
  }
  if (message.type === 'interactive') {
    const id = message.interactive?.list_reply?.id ?? message.interactive?.button_reply?.id;
    if (typeof id === 'string') {
      return { from: message.from, displayName, kind: 'interactive', id };
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
        if (message.from !== config.adminPhoneNumber) {
          void recordCustomer(message.from, message.displayName ?? undefined).catch((error: unknown) => {
            console.error('WhatsApp customer record failed', error);
          });
        }
        if (message.kind === 'text') {
        const adminId = adminMenuId(message.text);
        if (message.from === config.adminPhoneNumber && adminId === 'admin:main') {
          await sendAdminMenu(message.from);
          return;
        }
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
        if (id === 'menu:more') {
          await sendMoreMenu(message.from);
        } else if (id === 'menu:support') {
          await sendSupportReply(message.from);
        } else if (id === 'menu:profile') {
          const customer = await getCustomer(message.from);
          await sendSettingsMenu(message.from, customer, await getCustomerOrders(message.from));
        } else if (id === 'settings:orders') {
          await sendOrderHistory(message.from, await getCustomerOrders(message.from));
        } else if (id === 'settings:deposits') {
          await sendDepositHistory(message.from, await getCustomerDeposits(message.from));
        } else if (id === 'menu:main' || !reply) {
          await sendCustomerMainMenu(message.from);
        } else if (id === 'menu:commands') {
          await sendCommandsReply(message.from, reply);
        } else {
          await sendMenuReply(message.from, reply);
        }
      } else if (message.id === 'menu:main') {
        await sendCustomerMainMenu(message.from);
      } else if (message.from !== config.adminPhoneNumber && message.id === 'menu:profile') {
        const customer = await getCustomer(message.from);
        await sendSettingsMenu(message.from, customer, await getCustomerOrders(message.from));
      } else if (message.from !== config.adminPhoneNumber && message.id === 'settings:view') {
        await sendMenuViewMenu(message.from, await getCustomerMenuView(message.from));
      } else if (message.from !== config.adminPhoneNumber && message.id === 'settings:orders') {
        await sendOrderHistory(message.from, await getCustomerOrders(message.from));
      } else if (message.from !== config.adminPhoneNumber && message.id === 'settings:deposits') {
        await sendDepositHistory(message.from, await getCustomerDeposits(message.from));
      } else if (message.from !== config.adminPhoneNumber && (message.id === 'settings:view:buttons' || message.id === 'settings:view:list')) {
        const view: MenuView = message.id.endsWith(':list') ? 'list' : 'buttons';
        try {
          await setCustomerMenuView(message.from, view);
          const customer = await getCustomer(message.from);
          await sendMainMenu(message.from, view, customer?.balance ?? 0);
        } catch (error) {
          console.error('WhatsApp menu view update failed', error);
          await sendTextMessage(message.from, 'Menu view storage is not configured yet. Please try again after setup.');
        }
      } else if (message.from === config.adminPhoneNumber && message.id.startsWith('admin:')) {
        if (message.id === 'admin:main') {
          await sendAdminMenu(message.from);
        } else if (message.id === 'admin:dashboard') {
          await sendAdminDashboard(message.from, liveSupportUser);
        } else if (message.id === 'admin:support') {
          await sendAdminSupport(message.from, liveSupportUser);
        } else if (message.id === 'admin:more') {
          await sendAdminMoreMenu(message.from);
        } else if (message.id === 'admin:data') {
          await sendAdminDataMenu(message.from);
        } else if (message.id === 'admin:customers' || message.id === 'admin:orders' || message.id === 'admin:deposits') {
          try {
            const data = await getAdminData();
            const section = message.id.slice('admin:'.length) as 'customers' | 'orders' | 'deposits';
            await sendAdminData(message.from, section, data);
          } catch (error) {
            console.error('WhatsApp admin data query failed', error);
            await sendTextMessage(
              message.from,
              'WhatsApp data storage is not configured yet. Add the separate Supabase variables and try again.',
            );
          }
        } else if (message.id === 'admin:settings') {
          await sendAdminSettings(message.from);
        } else if (message.id === 'admin:commands') {
          await sendAdminCommands(message.from);
        } else if (message.id === 'admin:close_support') {
          const closedSupportUser = liveSupportUser;
          liveSupportUser = null;
          if (closedSupportUser) {
            await sendTextMessage(closedSupportUser, 'Live Support chat has been closed by the support team.');
          }
          await sendAdminSupport(message.from, liveSupportUser);
        }
      } else {
        const reply = menuReplyText(message.id);
        if (message.id === 'menu:more') {
          await sendMoreMenu(message.from);
        } else if (message.id === 'menu:support') {
          await sendSupportReply(message.from);
        } else if (message.id === 'menu:commands' && reply) {
          await sendCommandsReply(message.from, reply);
        } else if (reply) {
          await sendMenuReply(message.from, reply);
        } else {
          await sendCustomerMainMenu(message.from);
        }
      }
    }
  } catch (error) {
    console.error('WhatsApp webhook processing failed', error);
    if (!res.headersSent) respond(res, 400, 'invalid_request');
  }
}
