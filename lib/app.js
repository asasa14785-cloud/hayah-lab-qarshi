/* معمل الحياه بالقرشيه — التطبيق المشترك
   يعمل محلياً (SQLite ملف) وعلى Vercel (Turso سحابية) بدون تغيير.
   الاستخدام: const { createApp } = require('./lib/app'); const app = await createApp({ root: __dirname });
*/
'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { openDatabase } = require('./db');
const seedData = require('./seed-data');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  fasting TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  sample TEXT NOT NULL DEFAULT '',
  points TEXT NOT NULL DEFAULT '[]',
  whatsapp_text TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'bloodtype',
  available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  subtitle TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_label TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  badge_color TEXT NOT NULL DEFAULT 'emerald',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  price TEXT NOT NULL DEFAULT '',
  old_price TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  whatsapp_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS advice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'medical_information',
  color TEXT NOT NULL DEFAULT 'secondary',
  whatsapp_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  order_no TEXT NOT NULL DEFAULT '',
  test_name TEXT NOT NULL DEFAULT '',
  tests TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS promos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge TEXT NOT NULL DEFAULT '',
  badge_color TEXT NOT NULL DEFAULT 'amber',
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS images (
  slot TEXT PRIMARY KEY,
  mime TEXT NOT NULL DEFAULT 'image/png',
  data TEXT NOT NULL DEFAULT ''
);
`;

const IMG_DEFAULTS = { logo: 'logo.png', icon: 'logo-icon.png', hero: 'hero-lab.jpg', map: 'map-sat.jpg' };
const IMG_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const PROMO_COLORS = ['amber', 'teal', 'emerald', 'sky', 'rose'];
const PHONE_RE = /^01[0-9]{9}$/;

function cleanStr(v, max = 500) { return String(v ?? '').trim().slice(0, max); }
function parseList(v) { try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }

async function createApp({ root }) {
  const ADMIN_PATH = (process.env.ADMIN_PATH || '/life-qarshia-9137').trim() || '/life-qarshia-9137';
  const JWT_SECRET = process.env.JWT_SECRET || 'hayah-qarshia-change-me-please-7391';
  const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hayat2026';
  const DB_FILE = path.join(root, 'lab.db');

  const db = openDatabase({ dbFile: DB_FILE });
  if (db.kind === 'local') {
    try { await db.exec('PRAGMA journal_mode = WAL;'); } catch (e) { /* ignore */ }
  }
  await db.exec(SCHEMA);
  try { await db.exec('ALTER TABLE tests ADD COLUMN subtitle TEXT NOT NULL DEFAULT ""'); } catch (e) { /* موجود */ }

  const count = async (t) => (await db.get(`SELECT COUNT(*) AS c FROM ${t}`)).c;
  const getMeta = async (k, fb = '') => { const r = await db.get('SELECT value FROM meta WHERE key = ?', [k]); return r ? r.value : fb; };
  const setMeta = async (k, v) => { await db.run('INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, v]); };
  const getSetting = async (k, fb = '') => { const r = await db.get('SELECT value FROM settings WHERE key = ?', [k]); return r ? r.value : fb; };
  const setSetting = async (k, v) => { await db.run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, String(v ?? '')]); };

  // ---------- البذور ----------
  if ((await count('tests')) === 0) {
    for (let i = 0; i < seedData.tests.length; i++) {
      const t = seedData.tests[i];
      await db.run('INSERT INTO tests(key,code,title,subtitle,description,price,fasting,duration,sample,points,whatsapp_text,icon,available,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [t.key, t.code, t.title, t.subtitle, t.description, t.price, t.fasting, t.duration, t.sample, JSON.stringify(t.points), t.whatsapp_text, t.icon, 1, i + 1]);
    }
  } else {
    const subs = { cbc: 'الأنيميا، كرات الدم البيضاء، الصفائح', liver: 'إنزيمات الكبد، الصفراء، الألبومين', kidney: 'الكرياتينين، البولينا، حمض اليوريك', sugar: 'سكر صائم، بعد الأكل بساعتين، تراكمي', lipids: 'الكوليسترول الكلي، الدهون الثلاثية، HDL، LDL', thyroid: 'TSH, Free T3, Free T4', vitamins: 'فيتامين د، مخزون الحديد (Ferritin)، الكالسيوم' };
    for (const [k, v] of Object.entries(subs)) {
      try { await db.run("UPDATE tests SET subtitle=? WHERE key=? AND (subtitle IS NULL OR subtitle='')", [v, k]); } catch (e) { /* ignore */ }
    }
  }
  if ((await count('packages')) === 0) {
    for (let i = 0; i < seedData.packages.length; i++) {
      const p = seedData.packages[i];
      await db.run('INSERT INTO packages(type_label,badge,badge_color,title,description,features,price,old_price,featured,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
        [p.type_label, p.badge, p.badge_color, p.title, p.description, JSON.stringify(p.features), p.price, p.old_price, p.featured, p.whatsapp_text, i + 1]);
    }
  }
  if ((await count('advice')) === 0) {
    for (let i = 0; i < seedData.advice.length; i++) {
      const a = seedData.advice[i];
      await db.run('INSERT INTO advice(category,title,description,icon,color,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?)',
        [a.category, a.title, a.description, a.icon, a.color, a.whatsapp_text, i + 1]);
    }
  }
  if ((await count('promos')) === 0) {
    for (let i = 0; i < seedData.promos.length; i++) {
      const pr = seedData.promos[i];
      await db.run('INSERT INTO promos(badge,badge_color,text,active,sort_order) VALUES(?,?,?,?,?)', [pr.badge, pr.badge_color, pr.text, 1, i + 1]);
    }
  }
  for (const [k, v] of Object.entries(seedData.settings)) {
    if (!(await getSetting(k, ''))) await setSetting(k, v);
  }
  if (!(await getMeta('admin_hash', ''))) {
    await setMeta('admin_hash', bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10));
  }
  // الصور الافتراضية Base64 — تُزرع كل خانة ناقصة على حدة (آمن ضد الزرع الجزئي)
  for (const im of seedData.images) {
    try {
      const exists = await db.get('SELECT slot FROM images WHERE slot=?', [im.slot]);
      if (!exists) {
        const fp = path.join(root, 'assets', 'img', im.file);
        if (fs.existsSync(fp)) {
          await db.run('INSERT INTO images(slot,mime,data) VALUES(?,?,?)', [im.slot, im.mime, fs.readFileSync(fp).toString('base64')]);
        }
      }
    } catch (e) { /* ignore */ }
  }

  // ---------- قراءات ----------
  const rowsTests = async () => (await db.all('SELECT * FROM tests ORDER BY sort_order ASC, id ASC')).map((r) => ({ ...r, available: !!r.available, points: parseList(r.points) }));
  const rowsPackages = async () => (await db.all('SELECT * FROM packages ORDER BY sort_order ASC, id ASC')).map((r) => ({ ...r, featured: !!r.featured, features: parseList(r.features) }));
  const rowsAdvice = async () => await db.all('SELECT * FROM advice ORDER BY sort_order ASC, id ASC');
  const rowsPromos = async () => (await db.all('SELECT * FROM promos ORDER BY sort_order ASC, id ASC')).map((r) => ({ ...r, active: !!r.active }));
  const allSettings = async () => {
    const out = {};
    (await db.all('SELECT key,value FROM settings')).forEach((r) => { out[r.key] = r.value; });
    return out;
  };
  const signToken = () => jwt.sign({ role: 'owner' }, JWT_SECRET, { expiresIn: '12h' });
  const requireAuth = (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'غير مسجل الدخول' });
    try { jwt.verify(token, JWT_SECRET); next(); }
    catch { return res.status(401).json({ error: 'انتهت الجلسة، سجل الدخول مجدداً' }); }
  };
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

  const app = express();
  app.use(express.json({ limit: '8mb' }));
  app.disable('x-powered-by');

  // ---------- API عام ----------
  app.get('/api/public/settings', wrap(async (req, res) => res.json(await allSettings())));
  app.get('/api/public/tests', wrap(async (req, res) => res.json((await rowsTests()).filter((t) => t.available))));
  app.get('/api/public/packages', wrap(async (req, res) => res.json(await rowsPackages())));
  app.get('/api/public/advice', wrap(async (req, res) => res.json(await rowsAdvice())));
  app.get('/api/public/promos', wrap(async (req, res) => res.json((await rowsPromos()).filter((p) => p.active))));
  app.post('/api/public/requests', wrap(async (req, res) => {
    const type = cleanStr(req.body.type, 20) === 'result' ? 'result' : 'home';
    const name = cleanStr(req.body.name, 120);
    const phone = cleanStr(req.body.phone, 20).replace(/[\s-]/g, '');
    if (!name || !phone) return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
    await db.run('INSERT INTO requests(type,name,phone,address,order_no,test_name,tests,created_at) VALUES(?,?,?,?,?,?,?,?)',
      [type, name, phone, cleanStr(req.body.address, 300), cleanStr(req.body.order_no, 120), cleanStr(req.body.test_name, 300), cleanStr(req.body.tests, 1000), new Date().toISOString()]);
    res.json({ ok: true });
  }));

  // ---------- الدخول ----------
  app.post('/api/admin/login', wrap(async (req, res) => {
    const password = String(req.body.password || '');
    if (!password) return res.status(400).json({ error: 'اكتب كلمة السر' });
    const hash = await getMeta('admin_hash', '');
    if (!hash || !bcrypt.compareSync(password, hash)) return res.status(401).json({ error: 'كلمة السر غير صحيحة' });
    res.json({ token: signToken() });
  }));

  // ---------- التحاليل ----------
  app.get('/api/admin/tests', requireAuth, wrap(async (req, res) => res.json(await rowsTests())));
  app.post('/api/admin/tests', requireAuth, wrap(async (req, res) => {
    const b = req.body || {};
    const key = cleanStr(b.key, 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || ('t' + Date.now());
    const code = cleanStr(b.code, 40) || key.toUpperCase();
    const title = cleanStr(b.title, 200);
    if (!title) return res.status(400).json({ error: 'اسم التحليل مطلوب' });
    if (await db.get('SELECT id FROM tests WHERE key=?', [key])) return res.status(400).json({ error: 'المفتاح (key) مستخدم من قبل، اختر اسماً آخر بالإنجليزية' });
    const pts = Array.isArray(b.points) ? b.points.map((x) => cleanStr(x, 300)).filter(Boolean).slice(0, 12) : [];
    const maxOrder = (await db.get('SELECT COALESCE(MAX(sort_order),0) AS m FROM tests')).m;
    const r = await db.run('INSERT INTO tests(key,code,title,subtitle,description,price,fasting,duration,sample,points,whatsapp_text,icon,available,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [key, code, title, cleanStr(b.subtitle, 160), cleanStr(b.description, 2000), cleanStr(b.price, 60), cleanStr(b.fasting, 500), cleanStr(b.duration, 500), cleanStr(b.sample, 500), JSON.stringify(pts), cleanStr(b.whatsapp_text, 300), cleanStr(b.icon, 60) || 'bloodtype', b.available === false ? 0 : 1, Number(b.sort_order) || (maxOrder + 1)]);
    res.json({ ok: true, id: Number(r.lastInsertRowid) });
  }));
  app.put('/api/admin/tests/:id', requireAuth, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const cur = await db.get('SELECT * FROM tests WHERE id=?', [id]);
    if (!cur) return res.status(404).json({ error: 'غير موجود' });
    const b = req.body || {};
    const pts = Array.isArray(b.points) ? b.points.map((x) => cleanStr(x, 300)).filter(Boolean).slice(0, 12) : parseList(cur.points);
    await db.run('UPDATE tests SET code=?,title=?,subtitle=?,description=?,price=?,fasting=?,duration=?,sample=?,points=?,whatsapp_text=?,icon=?,available=?,sort_order=? WHERE id=?',
      [cleanStr(b.code ?? cur.code, 40), cleanStr(b.title ?? cur.title, 200), cleanStr(b.subtitle ?? cur.subtitle ?? '', 160), cleanStr(b.description ?? cur.description, 2000), cleanStr(b.price ?? cur.price, 60), cleanStr(b.fasting ?? cur.fasting, 500), cleanStr(b.duration ?? cur.duration, 500), cleanStr(b.sample ?? cur.sample, 500), JSON.stringify(pts), cleanStr(b.whatsapp_text ?? cur.whatsapp_text, 300), cleanStr(b.icon ?? cur.icon, 60) || 'bloodtype', (b.available === false ? 0 : 1), Number(b.sort_order) || cur.sort_order, id]);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/tests/:id', requireAuth, wrap(async (req, res) => {
    await db.run('DELETE FROM tests WHERE id=?', [Number(req.params.id)]);
    res.json({ ok: true });
  }));

  // ---------- الباقات ----------
  app.get('/api/admin/packages', requireAuth, wrap(async (req, res) => res.json(await rowsPackages())));
  app.post('/api/admin/packages', requireAuth, wrap(async (req, res) => {
    const b = req.body || {};
    const title = cleanStr(b.title, 200);
    if (!title) return res.status(400).json({ error: 'اسم الباقة مطلوب' });
    const feats = Array.isArray(b.features) ? b.features.map((x) => cleanStr(x, 300)).filter(Boolean).slice(0, 15) : [];
    const maxOrder = (await db.get('SELECT COALESCE(MAX(sort_order),0) AS m FROM packages')).m;
    if (b.featured) await db.exec('UPDATE packages SET featured=0');
    const r = await db.run('INSERT INTO packages(type_label,badge,badge_color,title,description,features,price,old_price,featured,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      [cleanStr(b.type_label, 80), cleanStr(b.badge, 80), cleanStr(b.badge_color, 20) || 'emerald', title, cleanStr(b.description, 2000), JSON.stringify(feats), cleanStr(b.price, 40), cleanStr(b.old_price, 60), b.featured ? 1 : 0, cleanStr(b.whatsapp_text, 300), Number(b.sort_order) || (maxOrder + 1)]);
    res.json({ ok: true, id: Number(r.lastInsertRowid) });
  }));
  app.put('/api/admin/packages/:id', requireAuth, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const cur = await db.get('SELECT * FROM packages WHERE id=?', [id]);
    if (!cur) return res.status(404).json({ error: 'غير موجود' });
    const b = req.body || {};
    const feats = Array.isArray(b.features) ? b.features.map((x) => cleanStr(x, 300)).filter(Boolean).slice(0, 15) : parseList(cur.features);
    if (b.featured) await db.run('UPDATE packages SET featured=0 WHERE id<>?', [id]);
    await db.run('UPDATE packages SET type_label=?,badge=?,badge_color=?,title=?,description=?,features=?,price=?,old_price=?,featured=?,whatsapp_text=?,sort_order=? WHERE id=?',
      [cleanStr(b.type_label ?? cur.type_label, 80), cleanStr(b.badge ?? cur.badge, 80), cleanStr(b.badge_color ?? cur.badge_color, 20), cleanStr(b.title ?? cur.title, 200), cleanStr(b.description ?? cur.description, 2000), JSON.stringify(feats), cleanStr(b.price ?? cur.price, 40), cleanStr(b.old_price ?? cur.old_price, 60), b.featured ? 1 : 0, cleanStr(b.whatsapp_text ?? cur.whatsapp_text, 300), Number(b.sort_order) || cur.sort_order, id]);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/packages/:id', requireAuth, wrap(async (req, res) => {
    await db.run('DELETE FROM packages WHERE id=?', [Number(req.params.id)]);
    res.json({ ok: true });
  }));

  // ---------- الإرشادات ----------
  app.get('/api/admin/advice', requireAuth, wrap(async (req, res) => res.json(await rowsAdvice())));
  app.post('/api/admin/advice', requireAuth, wrap(async (req, res) => {
    const b = req.body || {};
    const title = cleanStr(b.title, 200);
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' });
    const maxOrder = (await db.get('SELECT COALESCE(MAX(sort_order),0) AS m FROM advice')).m;
    const r = await db.run('INSERT INTO advice(category,title,description,icon,color,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?)',
      [cleanStr(b.category, 120), title, cleanStr(b.description, 2000), cleanStr(b.icon, 60) || 'medical_information', cleanStr(b.color, 20) || 'secondary', cleanStr(b.whatsapp_text, 300), Number(b.sort_order) || (maxOrder + 1)]);
    res.json({ ok: true, id: Number(r.lastInsertRowid) });
  }));
  app.put('/api/admin/advice/:id', requireAuth, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const cur = await db.get('SELECT * FROM advice WHERE id=?', [id]);
    if (!cur) return res.status(404).json({ error: 'غير موجود' });
    const b = req.body || {};
    await db.run('UPDATE advice SET category=?,title=?,description=?,icon=?,color=?,whatsapp_text=?,sort_order=? WHERE id=?',
      [cleanStr(b.category ?? cur.category, 120), cleanStr(b.title ?? cur.title, 200), cleanStr(b.description ?? cur.description, 2000), cleanStr(b.icon ?? cur.icon, 60), cleanStr(b.color ?? cur.color, 20), cleanStr(b.whatsapp_text ?? cur.whatsapp_text, 300), Number(b.sort_order) || cur.sort_order, id]);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/advice/:id', requireAuth, wrap(async (req, res) => {
    await db.run('DELETE FROM advice WHERE id=?', [Number(req.params.id)]);
    res.json({ ok: true });
  }));

  // ---------- الشريط المتحرك ----------
  app.get('/api/admin/promos', requireAuth, wrap(async (req, res) => res.json(await rowsPromos())));
  app.post('/api/admin/promos', requireAuth, wrap(async (req, res) => {
    const b = req.body || {};
    const text = cleanStr(b.text, 300);
    if (!text) return res.status(400).json({ error: 'نص العرض مطلوب' });
    const maxOrder = (await db.get('SELECT COALESCE(MAX(sort_order),0) AS m FROM promos')).m;
    const color = PROMO_COLORS.includes(b.badge_color) ? b.badge_color : 'amber';
    const r = await db.run('INSERT INTO promos(badge,badge_color,text,active,sort_order) VALUES(?,?,?,?,?)',
      [cleanStr(b.badge, 60) || 'العروض الحصرية', color, text, b.active === false ? 0 : 1, Number(b.sort_order) || (maxOrder + 1)]);
    res.json({ ok: true, id: Number(r.lastInsertRowid) });
  }));
  app.put('/api/admin/promos/:id', requireAuth, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const cur = await db.get('SELECT * FROM promos WHERE id=?', [id]);
    if (!cur) return res.status(404).json({ error: 'غير موجود' });
    const b = req.body || {};
    const color = PROMO_COLORS.includes(b.badge_color) ? b.badge_color : cur.badge_color;
    await db.run('UPDATE promos SET badge=?,badge_color=?,text=?,active=?,sort_order=? WHERE id=?',
      [cleanStr(b.badge ?? cur.badge, 60), color, cleanStr(b.text ?? cur.text, 300), b.active === false ? 0 : 1, Number(b.sort_order) || cur.sort_order, id]);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/promos/:id', requireAuth, wrap(async (req, res) => {
    await db.run('DELETE FROM promos WHERE id=?', [Number(req.params.id)]);
    res.json({ ok: true });
  }));

  // ---------- الإعدادات ----------
  app.get('/api/admin/settings', requireAuth, wrap(async (req, res) => res.json(await allSettings())));
  app.put('/api/admin/settings', requireAuth, wrap(async (req, res) => {
    const b = req.body || {};
    const allowed = ['phone_local', 'phone_intl', 'address', 'plus_code', 'hours', 'maps_url'];
    for (const k of allowed) {
      if (k in b) {
        const v = cleanStr(b[k], 1000);
        if (k === 'phone_local' && v && !PHONE_RE.test(v.replace(/[\s-]/g, ''))) {
          return res.status(400).json({ error: 'رقم الهاتف المحلي يجب أن يكون 11 رقماً يبدأ بـ 01' });
        }
        await setSetting(k, v);
      }
    }
    const local = (await getSetting('phone_local', '01038879791')).replace(/\D/g, '');
    if (!('phone_intl' in b) && /^01\d{9}$/.test(local)) await setSetting('phone_intl', '2' + local);
    res.json({ ok: true, settings: await allSettings() });
  }));

  // ---------- الطلبات ----------
  app.get('/api/admin/requests', requireAuth, wrap(async (req, res) => {
    res.json(await db.all('SELECT * FROM requests ORDER BY id DESC LIMIT 300'));
  }));
  app.delete('/api/admin/requests/:id', requireAuth, wrap(async (req, res) => {
    await db.run('DELETE FROM requests WHERE id=?', [Number(req.params.id)]);
    res.json({ ok: true });
  }));

  // ---------- الإحصائيات ----------
  app.get('/api/admin/stats', requireAuth, wrap(async (req, res) => {
    const rows = await db.all('SELECT type,created_at FROM requests');
    const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date();
    const todayK = dayKey(today);
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      last7.push({ day: dayKey(d), label: `${d.getDate()}/${d.getMonth() + 1}`, home: 0, result: 0 });
    }
    const map = Object.fromEntries(last7.map((x) => [x.day, x]));
    let today_home = 0, today_result = 0;
    rows.forEach((r) => {
      const k = String(r.created_at || '').slice(0, 10);
      if (k === todayK) { if (r.type === 'result') today_result++; else today_home++; }
      if (map[k]) { if (r.type === 'result') map[k].result++; else map[k].home++; }
    });
    res.json({ today_home, today_result, total: rows.length, last7 });
  }));

  // ---------- كلمة السر + نسخ احتياطي ----------
  app.post('/api/admin/change-password', requireAuth, wrap(async (req, res) => {
    const { old_password, new_password } = req.body || {};
    const hash = await getMeta('admin_hash', '');
    if (!bcrypt.compareSync(String(old_password || ''), hash)) return res.status(401).json({ error: 'كلمة السر الحالية غير صحيحة' });
    if (String(new_password || '').length < 6) return res.status(400).json({ error: 'كلمة السر الجديدة 6 أحرف على الأقل' });
    await setMeta('admin_hash', bcrypt.hashSync(String(new_password), 10));
    res.json({ ok: true });
  }));
  app.get('/api/admin/backup', requireAuth, wrap(async (req, res) => {
    res.json({ tests: await rowsTests(), packages: await rowsPackages(), advice: await rowsAdvice(), settings: await allSettings(), exported_at: new Date().toISOString() });
  }));

  // ---------- الصور: القاعدة أولاً ثم الملفات ----------
  app.get('/img/:slot', wrap(async (req, res) => {
    const slot = String(req.params.slot || '');
    if (!IMG_DEFAULTS[slot]) return res.status(404).send('Not found');
    const row = await db.get('SELECT mime,data FROM images WHERE slot=?', [slot]);
    if (row && row.data) {
      res.setHeader('Content-Type', row.mime || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(row.data, 'base64'));
    }
    const imgDir = path.join(root, 'assets', 'img');
    let fp = path.join(imgDir, IMG_DEFAULTS[slot]);
    if (!fs.existsSync(fp)) return res.status(404).send('Not found');
    const ext = path.extname(fp).toLowerCase();
    res.setHeader('Content-Type', IMG_MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(fp);
  }));
  app.post('/api/admin/upload', requireAuth, wrap(async (req, res) => {
    const { slot, dataUrl } = req.body || {};
    if (!IMG_DEFAULTS[slot]) return res.status(400).json({ error: 'خانة غير صالحة' });
    const m = String(dataUrl || '').match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return res.status(400).json({ error: 'صيغة الصورة غير مدعومة (PNG أو JPG أو WebP فقط)' });
    const buf = Buffer.from(m[3], 'base64');
    if (!buf.length || buf.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'حجم الصورة كبير (الحد 6MB)' });
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const isJpg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const isWebp = buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
    if (!isPng && !isJpg && !isWebp) return res.status(400).json({ error: 'ملف الصورة تالف' });
    const mime = isPng ? 'image/png' : isJpg ? 'image/jpeg' : 'image/webp';
    await db.run('INSERT INTO images(slot,mime,data) VALUES(?,?,?) ON CONFLICT(slot) DO UPDATE SET mime=excluded.mime, data=excluded.data', [slot, mime, buf.toString('base64')]);
    // نسخة ملف محلية أيضاً عند الإمكان (تُتجاهل على أنظمة القراءة فقط)
    try {
      const ext = isPng ? '.png' : isJpg ? '.jpg' : '.webp';
      fs.writeFileSync(path.join(root, 'assets', 'img', `${slot}-custom${ext}`), buf);
    } catch (e) { /* read-only fs (Vercel) */ }
    res.json({ ok: true, url: `/img/${slot}` });
  }));

  // ---------- اللوحة على مسار سري ----------
  app.use(ADMIN_PATH, express.static(path.join(root, 'admin'), { index: 'index.html' }));
  ['/admin', '/dashboard', '/control', '/cpanel', '/manage'].forEach((p) => {
    app.use(p, (req, res) => res.status(404).send('Not found'));
  });

  // ---------- الموقع ----------
  app.use('/assets', express.static(path.join(root, 'assets')));
  app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith(ADMIN_PATH)) return next();
    if (req.method !== 'GET') return next();
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') return next();
    if (req.path !== '/' && fs.existsSync(path.join(root, 'index.html'))) {
      return res.sendFile(path.join(root, 'index.html'));
    }
    next();
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('API error:', err && err.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'خطأ داخلي، حاول مجدداً' });
  });

  return { app, db, ADMIN_PATH };
}

module.exports = { createApp };
