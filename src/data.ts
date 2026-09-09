import { config } from './config.js';

export type CustomerRow = {
  phone_number: string;
  display_name: string | null;
  balance: number;
  menu_view: MenuView;
  created_at: string;
  last_seen_at: string;
};

export type MenuView = 'buttons' | 'list';

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

export async function getCustomer(phoneNumber: string): Promise<CustomerRow | null> {
  if (!isConfigured()) return null;
  try {
    const rows = await readRows<CustomerRow>(
      'whatsapp_customers',
      `?select=phone_number,display_name,balance,menu_view,created_at,last_seen_at&phone_number=eq.${encodeURIComponent(phoneNumber)}&limit=1`,
    );
    return rows[0] ?? null;
  } catch (error) {
    console.error('WhatsApp customer lookup failed', error);
    return null;
  }
}

export async function getCustomerMenuView(phoneNumber: string): Promise<MenuView> {
  try {
    const customer = await getCustomer(phoneNumber);
    return customer?.menu_view === 'buttons' ? 'buttons' : 'list';
  } catch {
    return 'buttons';
  }
}

export async function setCustomerMenuView(phoneNumber: string, menuView: MenuView): Promise<void> {
  if (!isConfigured()) throw new Error('WhatsApp Supabase is not configured');
  const response = await request('whatsapp_customers', '?on_conflict=phone_number', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([
      {
        phone_number: phoneNumber,
        menu_view: menuView,
        last_seen_at: new Date().toISOString(),
      },
    ]),
  });
  if (!response.ok) {
    throw new Error(`WhatsApp Supabase menu view update failed with HTTP ${response.status}`);
  }
}

export async function getCustomerOrders(phoneNumber: string): Promise<OrderRow[]> {
  if (!isConfigured()) return [];
  return readRows<OrderRow>(
    'whatsapp_orders',
    `?select=id,customer_phone,product_name,amount,status,created_at&customer_phone=eq.${encodeURIComponent(phoneNumber)}&order=created_at.desc&limit=10`,
  );
}

export async function getCustomerDeposits(phoneNumber: string): Promise<DepositRow[]> {
  if (!isConfigured()) return [];
  return readRows<DepositRow>(
    'whatsapp_deposits',
    `?select=id,customer_phone,amount,status,reference,created_at&customer_phone=eq.${encodeURIComponent(phoneNumber)}&order=created_at.desc&limit=10`,
  );
}

export async function getAdminData(): Promise<AdminData> {
  const [customers, orders, deposits] = await Promise.all([
    readRows<CustomerRow>(
      'whatsapp_customers',
      '?select=phone_number,display_name,balance,menu_view,created_at,last_seen_at&order=last_seen_at.desc&limit=5',
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
