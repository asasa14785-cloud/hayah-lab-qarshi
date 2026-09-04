/* معمل الحياه بالقرشيه — المدخل المحلي
   التشغيل: npm install ثم npm start ثم افتح http://localhost:3000
   يستخدم SQLite ملف lab.db — بدون أي إعداد.
*/
'use strict';
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const p = path.join(__dirname, '.env');
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i < 0) return;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  });
}
loadEnv();

const { createApp } = require('./lib/app');

const PORT = parseInt(process.env.PORT || '3000', 10);

createApp({ root: __dirname }).then(({ app, db }) => {
  const using = process.env.TURSO_URL ? 'Turso ☁️' : 'SQLite محلي 📁';
  app.listen(PORT, () => {
    console.log('==============================================');
    console.log(' معمل الحياه بالقرشيه — يعمل الآن');
    console.log(` قاعدة البيانات: ${using} (${db.kind})`);
    console.log(` الموقع:  http://localhost:${PORT}`);
    console.log(` التحكم:  http://localhost:${PORT}${process.env.ADMIN_PATH || '/life-qarshia-9137'}`);
    console.log(` الباسورد الافتراضي: ${process.env.ADMIN_PASSWORD || 'hayat2026'} (غيره فوراً من اللوحة)`);
    console.log('==============================================');
  });
}).catch((e) => {
  console.error('فشل التشغيل:', e.message);
  process.exit(1);
});
