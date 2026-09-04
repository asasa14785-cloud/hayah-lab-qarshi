/* طبقة قاعدة البيانات الموحدة
   - محلياً: SQLite مدمجة (node:sqlite) في ملف lab.db — بدون أي إعداد
   - على Vercel: Turso السحابية (متوافقة مع SQLite) عبر TURSO_URL + TURSO_TOKEN
   الواجهة غير متزامنة دائماً: all/get/run/exec
*/
'use strict';

function createLocalDb(dbFile) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbFile);
  const norm = (v) => (typeof v === 'bigint' ? Number(v) : v);
  return {
    kind: 'local',
    all: async (sql, params = []) => db.prepare(sql).all(...params),
    get: async (sql, params = []) => db.prepare(sql).get(...params),
    run: async (sql, params = []) => {
      const r = db.prepare(sql).run(...params);
      return { lastInsertRowid: norm(r.lastInsertRowid), changes: norm(r.changes) };
    },
    exec: async (sql) => { db.exec(sql); },
    close: () => db.close(),
  };
}

function createTursoDb(url, token) {
  const { createClient } = require('@libsql/client');
  const client = createClient({ url, authToken: token });
  const toObjects = (rs) => {
    if (!rs.rows || !rs.rows.length) return [];
    if (!Array.isArray(rs.rows[0])) return rs.rows;
    const cols = rs.columns || [];
    return rs.rows.map((row) => {
      const o = {};
      cols.forEach((c, i) => { o[c] = row[i]; });
      return o;
    });
  };
  const splitStatements = (sql) =>
    sql.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
  return {
    kind: 'turso',
    all: async (sql, params = []) => toObjects(await client.execute({ sql, args: params })),
    get: async (sql, params = []) => {
      const rows = toObjects(await client.execute({ sql, args: params }));
      return rows[0];
    },
    run: async (sql, params = []) => {
      const rs = await client.execute({ sql, args: params });
      // libsql يعيد lastInsertRowid كـ BigInt أحياناً
      const id = rs.lastInsertRowid;
      return {
        lastInsertRowid: id === undefined || id === null ? 0 : Number(id),
        changes: Number(rs.rowsAffected || 0),
      };
    },
    exec: async (sql) => {
      for (const stmt of splitStatements(sql)) {
        await client.execute(stmt);
      }
    },
    close: () => { try { client.close(); } catch (e) { /* ignore */ } },
  };
}

function openDatabase({ dbFile }) {
  const url = (process.env.TURSO_URL || '').trim();
  const token = (process.env.TURSO_TOKEN || '').trim();
  if (url && token) return createTursoDb(url, token);
  return createLocalDb(dbFile);
}

module.exports = { openDatabase };
