import { getDB } from './db';

export async function kvGet(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM kv_store WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}
