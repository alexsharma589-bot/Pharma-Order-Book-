import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('pharma_order_book.db');
  await migrate(dbInstance);
  return dbInstance;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      strength TEXT,
      packing TEXT,
      category TEXT NOT NULL,
      companyName TEXT,
      mrp REAL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      shopName TEXT,
      mobile TEXT,
      area TEXT,
      gstNumber TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      customerId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      shopName TEXT,
      orderDate INTEGER NOT NULL,
      remarks TEXT,
      totalItems INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(orderDate);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerName);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY NOT NULL,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      strength TEXT,
      packing TEXT,
      quantity INTEGER NOT NULL,
      freeQuantity INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);

    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
