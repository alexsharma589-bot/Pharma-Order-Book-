import * as Network from 'expo-network';
import { collection, doc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebaseConfig';
import { getDB } from '@/database/db';
import { kvGet, kvSet } from '@/database/kv';

const LAST_SYNC_KEY = 'lastSyncAt';
const COLLECTIONS = ['products', 'customers', 'orders', 'order_items'] as const;

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

/**
 * Pushes locally-dirty rows up to Firestore, then pulls down anything newer
 * than our last sync. Requires a signed-in user (userId acts as the
 * per-distributor data namespace: users/{uid}/products, etc.)
 *
 * This is intentionally simple (last-write-wins by updatedAt) which is
 * appropriate for a single-user-per-account order book app.
 */
export async function syncNow(userId: string): Promise<{ pushed: number; pulled: number }> {
  if (!isFirebaseConfigured) return { pushed: 0, pulled: 0 };
  if (!(await isOnline())) return { pushed: 0, pulled: 0 };

  const db = await getDB();
  let pushed = 0;
  let pulled = 0;

  for (const table of COLLECTIONS) {
    const dirtyRows = await db.getAllAsync<any>(`SELECT * FROM ${table} WHERE dirty = 1`);
    if (dirtyRows.length) {
      const batch = writeBatch(firestore);
      const colRef = collection(firestore, 'users', userId, table);
      for (const row of dirtyRows) {
        batch.set(doc(colRef, row.id), row, { merge: true });
      }
      await batch.commit();
      for (const row of dirtyRows) {
        await db.runAsync(`UPDATE ${table} SET dirty = 0 WHERE id = ?`, [row.id]);
      }
      pushed += dirtyRows.length;
    }

    const lastSync = Number((await kvGet(`${LAST_SYNC_KEY}_${table}`)) ?? '0');
    const colRef = collection(firestore, 'users', userId, table);
    const remoteSnap = await getDocs(query(colRef, where('updatedAt', '>', lastSync)));
    for (const docSnap of remoteSnap.docs) {
      const remote = docSnap.data();
      const cols = Object.keys(remote).filter((k) => k !== 'dirty');
      const placeholders = cols.map(() => '?').join(',');
      const updateAssignments = cols.map((c) => `${c} = excluded.${c}`).join(',');
      await db.runAsync(
        `INSERT INTO ${table} (${cols.join(',')}, dirty) VALUES (${placeholders}, 0)
         ON CONFLICT(id) DO UPDATE SET ${updateAssignments}, dirty = 0
         WHERE excluded.updatedAt > ${table}.updatedAt`,
        cols.map((c) => remote[c])
      );
      pulled += 1;
    }
    await kvSet(`${LAST_SYNC_KEY}_${table}`, String(Date.now()));
  }

  return { pushed, pulled };
}
