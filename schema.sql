-- Schema pronto para Cloudflare D1 (Free Tier — 0 custo mensal)
-- Gerado pelo backend-squad para evolucao opcional multi-dispositivo

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  neighborhood TEXT,
  whatsapp TEXT NOT NULL,
  pix_key TEXT,
  delivery_fee REAL DEFAULT 0,
  primary_color TEXT DEFAULT '#0F766E',
  mode TEXT DEFAULT 'pedido',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  badge TEXT,
  price REAL NOT NULL,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS orders_history (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_mode TEXT,
  payment_method TEXT,
  total REAL NOT NULL,
  items_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id)
);
