import { getDB, newId } from './db';
import { Order, OrderItem } from '@/types';

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export interface OrderFilters {
  searchQuery?: string; // matches customer name / shop name
  dateFrom?: number;
  dateTo?: number;
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const db = await getDB();
  let sql = `SELECT * FROM orders WHERE deleted = 0`;
  const params: any[] = [];

  if (filters.searchQuery?.trim()) {
    sql += ` AND (customerName LIKE ? OR shopName LIKE ?)`;
    const like = `%${filters.searchQuery.trim()}%`;
    params.push(like, like);
  }
  if (filters.dateFrom) {
    sql += ` AND orderDate >= ?`;
    params.push(startOfDay(filters.dateFrom));
  }
  if (filters.dateTo) {
    sql += ` AND orderDate <= ?`;
    params.push(endOfDay(filters.dateTo));
  }
  sql += ` ORDER BY orderDate DESC, createdAt DESC`;

  return db.getAllAsync<Order>(sql, params);
}

export async function getOrderWithItems(id: string): Promise<Order | null> {
  const db = await getDB();
  const order = await db.getFirstAsync<Order>(`SELECT * FROM orders WHERE id = ?`, [id]);
  if (!order) return null;
  const items = await db.getAllAsync<OrderItem>(`SELECT * FROM order_items WHERE orderId = ?`, [id]);
  return { ...order, items };
}

export interface SaveOrderInput {
  id?: string;
  customerId: string;
  customerName: string;
  shopName?: string;
  orderDate: number;
  remarks?: string;
  items: Array<Omit<OrderItem, 'id' | 'orderId'>>;
}

export async function saveOrder(input: SaveOrderInput): Promise<Order> {
  const db = await getDB();
  const now = Date.now();
  const totalItems = input.items.reduce((sum, it) => sum + it.quantity + it.freeQuantity, 0);
  const id = input.id ?? newId();

  await db.execAsync('BEGIN TRANSACTION');
  try {
    if (input.id) {
      await db.runAsync(
        `UPDATE orders SET customerId=?, customerName=?, shopName=?, orderDate=?, remarks=?, totalItems=?, updatedAt=?, dirty=1 WHERE id=?`,
        [input.customerId, input.customerName, input.shopName ?? null, input.orderDate, input.remarks ?? null, totalItems, now, id]
      );
      await db.runAsync(`DELETE FROM order_items WHERE orderId = ?`, [id]);
    } else {
      await db.runAsync(
        `INSERT INTO orders (id, customerId, customerName, shopName, orderDate, remarks, totalItems, createdAt, updatedAt, deleted, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
        [id, input.customerId, input.customerName, input.shopName ?? null, input.orderDate, input.remarks ?? null, totalItems, now, now]
      );
    }
    for (const item of input.items) {
      await db.runAsync(
        `INSERT INTO order_items (id, orderId, productId, productName, strength, packing, quantity, freeQuantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId(), id, item.productId, item.productName, item.strength ?? null, item.packing ?? null, item.quantity, item.freeQuantity ?? 0]
      );
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return (await getOrderWithItems(id))!;
}

export async function deleteOrder(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`UPDATE orders SET deleted=1, dirty=1, updatedAt=? WHERE id=?`, [Date.now(), id]);
}

export async function duplicateOrder(id: string): Promise<Order> {
  const original = await getOrderWithItems(id);
  if (!original) throw new Error('Order not found');
  return saveOrder({
    customerId: original.customerId,
    customerName: original.customerName,
    shopName: original.shopName,
    orderDate: Date.now(),
    remarks: original.remarks,
    items: (original.items ?? []).map((it) => ({
      productId: it.productId,
      productName: it.productName,
      strength: it.strength,
      packing: it.packing,
      quantity: it.quantity,
      freeQuantity: it.freeQuantity,
    })),
  });
}

export async function countOrdersToday(): Promise<number> {
  const db = await getDB();
  const now = Date.now();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM orders WHERE deleted = 0 AND orderDate >= ? AND orderDate <= ?`,
    [startOfDay(now), endOfDay(now)]
  );
  return row?.c ?? 0;
}

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  const db = await getDB();
  return db.getAllAsync<Order>(
    `SELECT * FROM orders WHERE deleted = 0 ORDER BY orderDate DESC, createdAt DESC LIMIT ?`,
    [limit]
  );
}
