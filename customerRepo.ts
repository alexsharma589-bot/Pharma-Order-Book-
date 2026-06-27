import { getDB, newId } from './db';
import { Customer } from '@/types';

export async function listCustomers(searchQuery = ''): Promise<Customer[]> {
  const db = await getDB();
  let sql = `SELECT * FROM customers WHERE deleted = 0`;
  const params: any[] = [];
  if (searchQuery.trim()) {
    sql += ` AND (name LIKE ? OR shopName LIKE ? OR mobile LIKE ? OR area LIKE ?)`;
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like, like);
  }
  sql += ` ORDER BY name ASC`;
  return db.getAllAsync<Customer>(sql, params);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<Customer>(`SELECT * FROM customers WHERE id = ?`, [id]);
  return row ?? null;
}

export async function upsertCustomer(input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'dirty'> & { id?: string }): Promise<Customer> {
  const db = await getDB();
  const now = Date.now();
  if (input.id) {
    await db.runAsync(
      `UPDATE customers SET name=?, shopName=?, mobile=?, area=?, gstNumber=?, updatedAt=?, dirty=1 WHERE id=?`,
      [input.name, input.shopName ?? null, input.mobile ?? null, input.area ?? null, input.gstNumber ?? null, now, input.id]
    );
    return (await getCustomer(input.id))!;
  }
  const id = newId();
  await db.runAsync(
    `INSERT INTO customers (id, name, shopName, mobile, area, gstNumber, createdAt, updatedAt, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
    [id, input.name, input.shopName ?? null, input.mobile ?? null, input.area ?? null, input.gstNumber ?? null, now, now]
  );
  return (await getCustomer(id))!;
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`UPDATE customers SET deleted=1, dirty=1, updatedAt=? WHERE id=?`, [Date.now(), id]);
}

export async function countCustomers(): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM customers WHERE deleted = 0`);
  return row?.c ?? 0;
}
