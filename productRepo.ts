import { getDB, newId } from './db';
import { Product, ProductCategory } from '@/types';

export async function listProducts(searchQuery = '', category?: ProductCategory): Promise<Product[]> {
  const db = await getDB();
  let sql = `SELECT * FROM products WHERE deleted = 0`;
  const params: any[] = [];

  if (searchQuery.trim()) {
    sql += ` AND (name LIKE ? OR companyName LIKE ? OR strength LIKE ?)`;
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like);
  }
  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }
  sql += ` ORDER BY name ASC`;

  return db.getAllAsync<Product>(sql, params);
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<Product>(`SELECT * FROM products WHERE id = ?`, [id]);
  return row ?? null;
}

export async function upsertProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'dirty'> & { id?: string }): Promise<Product> {
  const db = await getDB();
  const now = Date.now();
  if (input.id) {
    await db.runAsync(
      `UPDATE products SET name=?, strength=?, packing=?, category=?, companyName=?, mrp=?, updatedAt=?, dirty=1 WHERE id=?`,
      [input.name, input.strength ?? null, input.packing ?? null, input.category, input.companyName ?? null, input.mrp ?? null, now, input.id]
    );
    return (await getProduct(input.id))!;
  }
  const id = newId();
  await db.runAsync(
    `INSERT INTO products (id, name, strength, packing, category, companyName, mrp, createdAt, updatedAt, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
    [id, input.name, input.strength ?? null, input.packing ?? null, input.category, input.companyName ?? null, input.mrp ?? null, now, now]
  );
  return (await getProduct(id))!;
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  // Soft delete so it can sync the deletion to the cloud later.
  await db.runAsync(`UPDATE products SET deleted=1, dirty=1, updatedAt=? WHERE id=?`, [Date.now(), id]);
}

export async function countProducts(): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM products WHERE deleted = 0`);
  return row?.c ?? 0;
}
