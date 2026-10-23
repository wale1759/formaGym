import { prepareDocument } from './schemas/index.js';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createStore } from './database.js';

export async function migrateLegacy(store, directory = new URL('./data/', import.meta.url)) {
  const counts = {};
  // Read and validate every file before writing. Never remove the originals.
  const groups = [];
  for (const type of ['users', 'bookings', 'memberships', 'orders', 'contacts', 'subscriptions']) {
    let rows = [];
    try { rows = JSON.parse(await readFile(new URL(`${type}.json`, directory), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!Array.isArray(rows) || rows.some(row => !row.id || !row.createdAt)) throw new Error(`Invalid legacy ${type} file. Migration stopped.`);
    const prepared = rows.map(row => {
      const record = { ...row };
      delete record.password;
      delete record.confirmPassword;
      if (type === 'memberships') record.status = 'pending';
      return prepareDocument(type, record);
    });
    groups.push([type, prepared]);
  }
  for (const [type, rows] of groups) {
    counts[type] = 0;
    for (const row of rows) {
      const record = { ...row };
      delete record.password;
      delete record.confirmPassword;
      if (typeof record.email === 'string') record.email = record.email.trim().toLowerCase();
      if (type === 'memberships') record.status = 'pending';
      const result = await store.import(type, record);
      counts[type] += result.upsertedCount;
    }
  }
  return counts;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const store = createStore();
  try { console.log(await migrateLegacy(store)); }
  catch { console.error('Migration failed. Check MongoDB settings and legacy JSON files. Original files are unchanged.'); process.exitCode = 1; }
  finally { await store.close(); }
}
