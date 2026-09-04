// Usage: node reset-password.js <new-password>
// Resets the admin panel password (min 6 chars).
'use strict';
const path = require('path');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const pw = String(process.argv[2] || '');
if (pw.length < 6) {
  console.error('Usage: node reset-password.js <new-password-min-6-chars>');
  process.exit(1);
}
const dbPath = path.join(__dirname, 'lab.db');
const db = new DatabaseSync(dbPath);
db.prepare(
  'INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
).run('admin_hash', bcrypt.hashSync(pw, 10));
db.close();
console.log('Admin password has been reset. Use the new password on the secret panel URL.');
