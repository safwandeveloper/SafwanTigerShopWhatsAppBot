import { config } from './config.js';

export type CustomerRow = {
  phone_number: string;
  display_name: string | null;
  balance: number;
  created_at: string;
  last_seen_at: string;
};

export type OrderRow = {
  id: string;
  customer_phone: string;
  product_name: string;
  amount: number;
  status: string;
  created_at: string;
};

export type DepositRow = {
  id: string;
  customer_phone: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
};

export type AdminData = {
  customers: CustomerRow[];
  orders: OrderRow[];
  deposits: DepositRow[];
};

function isConfigured(): boolean {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

async function request(
  table: string,
  search: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!isConfigured()) throw new Error('WhatsApp Supabase is not configured');
  return fetch(`${config.supabaseUrl}/rest/v1/${table}${search}`, {
    ...options,
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

async function readRows<T>(table: string, search: string): Promise<T[]> {
  const response = await request(table, search);
  if (!response.ok) {
    throw new Error(`WhatsApp Supabase ${table} query failed with HTTP ${response.status}`);
  }
  return (await response.json()) as T[];
}

export async function recordCustomer(phoneNumber: string): Promise<void> {
  if (!isConfigured()) return;
  const response = await request('whatsapp_customers', '?on_conflict=phone_number', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([
      {
        phone_number: phoneNumber,
        last_seen_at: new Date().toISOString(),
      },
    ]),
  });
  if (!response.ok) {
    throw new Error(`WhatsApp Supabase customer upsert failed with HTTP ${response.status}`);
  }
}

export async function getAdminData(): Promise<AdminData> {
  const [customers, orders, deposits] = await Promise.all([
    readRows<CustomerRow>(
      'whatsapp_customers',
      '?select=phone_number,display_name,balance,created_at,last_seen_at&order=last_seen_at.desc&limit=5',
    ),
    readRows<OrderRow>(
      'whatsapp_orders',
      '?select=id,customer_phone,product_name,amount,status,created_at&order=created_at.desc&limit=5',
    ),
    readRows<DepositRow>(
      'whatsapp_deposits',
      '?select=id,customer_phone,amount,status,reference,created_at&order=created_at.desc&limit=5',
    ),
  ]);
  return { customers, orders, deposits };
}
