import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { getDB } from '@/database/db';

interface BackupPayload {
  version: 1;
  exportedAt: number;
  products: any[];
  customers: any[];
  orders: any[];
  order_items: any[];
}

export async function createBackup(): Promise<string> {
  const db = await getDB();
  const [products, customers, orders, order_items] = await Promise.all([
    db.getAllAsync(`SELECT * FROM products`),
    db.getAllAsync(`SELECT * FROM customers`),
    db.getAllAsync(`SELECT * FROM orders`),
    db.getAllAsync(`SELECT * FROM order_items`),
  ]);

  const payload: BackupPayload = { version: 1, exportedAt: Date.now(), products, customers, orders, order_items };
  const fileUri = `${FileSystem.documentDirectory}pharma_order_book_backup_${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload));
  return fileUri;
}

export async function pickAndRestoreBackup(): Promise<{ restored: number }> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (result.canceled || !result.assets?.length) return { restored: 0 };

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const payload: BackupPayload = JSON.parse(content);
  const db = await getDB();
  let restored = 0;

  await db.execAsync('BEGIN TRANSACTION');
  try {
    for (const table of ['products', 'customers', 'orders', 'order_items'] as const) {
      for (const row of payload[table] ?? []) {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(',');
        const updates = cols.map((c) => `${c} = excluded.${c}`).join(',');
        await db.runAsync(
          `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})
           ON CONFLICT(id) DO UPDATE SET ${updates}`,
          cols.map((c) => row[c])
        );
        restored += 1;
      }
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return { restored };
}
