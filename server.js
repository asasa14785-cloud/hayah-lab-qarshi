/* معمل الحياه بالقرشيه — سيرفر محلي للتجربة قبل الرفع
   Node.js + SQLite مدمجة (node:sqlite) بدون أي قواعد خارجية
   التشغيل: npm install ثم npm start ثم افتح http://localhost:3000
*/
'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync } = require('node:sqlite');

// ---------- الإعدادات (تتغير من .env) ----------
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

const PORT = parseInt(process.env.PORT || '3000', 10);
// المسار السري للوحة التحكم — غيره من .env ولا تشاركه مع أحد
const ADMIN_PATH = (process.env.ADMIN_PATH || '/life-qarshia-9137').trim() || '/life-qarshia-9137';
const JWT_SECRET = process.env.JWT_SECRET || 'hayah-qarshia-change-me-please-7391';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hayat2026';

const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'lab.db');

const app = express();
app.use(express.json({ limit: '1mb' }));
// منع كشف السيرفر
app.disable('x-powered-by');

// ---------- قاعدة البيانات ----------
const db = new DatabaseSync(DB_FILE);
db.exec(`
PRAGMA journal_mode = WAL;
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
CREATE TABLE IF NOT EXISTS promos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge TEXT NOT NULL DEFAULT 'العروض الحصرية',
  badge_color TEXT NOT NULL DEFAULT 'amber',
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
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
`);

function getMeta(k, fallback = '') {
  const r = db.prepare('SELECT value FROM meta WHERE key = ?').get(k);
  return r ? r.value : fallback;
}
function setMeta(k, v) {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'.replace('settings', 'meta')).run(k, v);
}
function getSetting(k, fallback = '') {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k);
  return r ? r.value : fallback;
}
function setSetting(k, v) {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v ?? ''));
}

// ---------- البذور الافتراضية (من code.html الأصلي) ----------
function count(t) { return db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c; }
// ترحيل خفيف لقواعد قديمة أُنشئت قبل عمود subtitle
try { db.exec(`ALTER TABLE tests ADD COLUMN subtitle TEXT NOT NULL DEFAULT ''`); } catch (e) { /* موجود مسبقاً */ }

function seed() {
  if (count('tests') === 0) {
    const tests = [
      { key: 'cbc', code: 'CBC', title: 'صورة الدم الكاملة (Complete Blood Count)', subtitle: 'الأنيميا، كرات الدم البيضاء، الصفائح', description: 'تحليل رئيسي للكشف عن فقر الدم (الأنيميا)، والاطمئنان على المناعة ومستوى الصفائح الدموية ومتابعة الحالات العامة.', price: '90 ج.م', fasting: 'لا يشترط الصيام المسبق، يمكن إجراؤه في أي وقت طوال اليوم.', duration: 'خلال ساعتين إلى 3 ساعات في نفس اليوم.', sample: 'عينة دم وريدي في أنبوبة مخصصة ومعقمة.', points: ['الشعور بالدوخة والإرهاق السريع وشحوب الوجه', 'متابعة الأنيميا ونقص الحديد لدى الأطفال والحوامل', 'الاطمئنان عند تكرار نزلات البرد أو الاشتباه في وجود التهاب', 'الفحص الروتيني الشامل قبل التدخلات الجراحية'], whatsapp_text: 'تحليل صورة الدم الكاملة CBC', icon: 'bloodtype' },
      { key: 'liver', code: 'LFTs', title: 'وظائف الكبد والمرارة الكاملة', subtitle: 'إنزيمات الكبد، الصفراء، الألبومين', description: 'تقييم كفاءة إنزيمات الكبد (ALT و AST) ومستوى الصفراء الكلية والمباشرة والألبومين في الدم.', price: '180 ج.م', fasting: 'يُفضل صيام من 6 إلى 8 ساعات لتفادي تأثر قراءة الصفراء.', duration: 'في نفس اليوم خلال 3 إلى 4 ساعات.', sample: 'عينة مصل دم نقي.', points: ['الشعور بالخمول أو اصفرار بياض العينين والجلد', 'المتابعة الدورية لمستخدمي أدوية الضغط أو الدهون', 'الاطمئنان في حالات الكبد الدهني والتهابات المرارة', 'تقييم الحالة الغذائية العامة ومستوى البروتين'], whatsapp_text: 'تحليل وظائف الكبد', icon: 'vital_signs' },
      { key: 'kidney', code: 'RFTs', title: 'وظائف الكلى والأملاح (Creatinine & Uric Acid)', subtitle: 'الكرياتينين، البولينا، حمض اليوريك', description: 'قياس تركيز الكرياتينين والبولينا لتقييم كفاءة الكليتين، مع فحص حمض اليوريك لتشخيص النقرس وآلام المفاصل.', price: '140 ج.م', fasting: 'لا يشترط الصيام التام، لكن يُنصح بالاعتدال في اللحوم قبل الفحص.', duration: 'خلال ساعتين إلى 3 ساعات.', sample: 'عينة دم مصلية.', points: ['متابعة دورية أساسية لمرضى السكري وارتفاع ضغط الدم', 'آلام المفاصل خصوصاً في إصبع القدم أو القدمين (النقرس)', 'الشعور بآلام في الجانبين أو تغير في التبول', 'الاطمئنان على الكليتين عند تناول مسكنات لفترات طويلة'], whatsapp_text: 'تحليل وظائف الكلى والنقرس', icon: 'water_drop' },
      { key: 'sugar', code: 'HbA1c & Glucose', title: 'السكر والتراكمي (HbA1c & Glucose)', subtitle: 'سكر صائم، بعد الأكل بساعتين، تراكمي', description: 'يقيس السكر التراكمي متوسط نسبة السكر بالدم خلال الأشهر الثلاثة السابقة، وهو الأساس لتقييم انتظام العلاج.', price: '110 ج.م', fasting: 'التراكمي لا يحتاج صيام. أما سكر الصائم فيحتاج صيام 8 ساعات.', duration: 'نفس اليوم خلال ساعتين.', sample: 'عينة دم وريدي.', points: ['المتابعة الدورية لمرضى السكر كل 3 أشهر لتجنب أي مضاعفات', 'الشعور بالعطش الشديد أو كثرة التبول وفقدان الوزن غير المبرر', 'فحص السكر العشوائي وفحص ما بعد الأكل بساعتين', 'الاطمئنان لمن لديهم تاريخ عائلي لمرض السكري'], whatsapp_text: 'تحليل السكر التراكمي وسكر الدم', icon: 'monitoring' },
      { key: 'lipids', code: 'Lipids', title: 'الدهون والكوليسترول الكامل', subtitle: 'الكوليسترول الكلي، الدهون الثلاثية، HDL، LDL', description: 'قياس الكوليسترول الكلي والدهون الثلاثية والكوليسترول النافع والضار لحماية صحة القلب والشرايين.', price: '170 ج.م', fasting: 'صيام ضروري من 10 إلى 12 ساعة (يُسمح بشرب الماء فقط).', duration: 'خلال 3 ساعات في نفس اليوم.', sample: 'مصل دم صائم.', points: ['فحص وقائي دوري لمن هم فوق الأربعين أو لمن يعانون من السمنة', 'متابعة تأثير أدوية خفض الكوليسترول', 'الحفاظ على سلامة الشرايين التاجية وضغط الدم', 'متابعة منتظمة لمرضى السكر والضغط'], whatsapp_text: 'تحليل الدهون والكوليسترول الكامل', icon: 'cardiology' },
      { key: 'thyroid', code: 'Thyroid', title: 'هرمونات الغدة الدرقية (TSH, FT3, FT4)', subtitle: 'TSH, Free T3, Free T4', description: 'التحليل الأهم لتشخيص خمول أو نشاط الغدة الدرقية ومعرفة أسباب بطء الحرق أو خفقان القلب السريع.', price: '130 ج.م', fasting: 'لا يشترط الصيام المسبق، ويفضل أخذ العينة صباحاً.', duration: 'في نفس اليوم.', sample: 'عينة مصل دم.', points: ['الخمول الشديد وزيادة الوزن غير المبررة أو تساقط الشعر', 'التوتر ونوبات ضربات القلب السريعة ونزول الوزن المفاجئ', 'ضبط الجرعة الصحيحة لعلاج الثيروكسين', 'فحص ضروري لمتابعة انتظام الدورة الشهرية'], whatsapp_text: 'تحليل هرمونات الغدة الدرقية', icon: 'tune' },
      { key: 'vitamins', code: 'Vit-D & Ferritin', title: 'فيتامين د ومخزون الحديد (Vitamin D & Ferritin)', subtitle: 'فيتامين د، مخزون الحديد (Ferritin)، الكالسيوم', description: 'فحص مستوى فيتامين د3 لصحة العظام والمناعة، ومخزون الحديد لمعرفة سبب الأنيميا المستمرة وضعف الشعر.', price: '290 ج.م', fasting: 'لا يشترط الصيام.', duration: 'في نفس اليوم أو خلال 24 ساعة كحد أقصى.', sample: 'عينة مصل دم نقي.', points: ['آلام العظام والمفاصل وضعف النشاط البدني العام', 'تساقط الشعر الشديد وضعف الأظافر عند السيدات', 'تحديد الجرعة العلاجية الدقيقة لمكملات فيتامين د والحديد', 'الاطمئنان على كفاءة امتصاص الجسم للعناصر الأساسية'], whatsapp_text: 'تحليل فيتامين د ومخزون الحديد', icon: 'medication' }
    ];
    const ins = db.prepare('INSERT INTO tests(key,code,title,subtitle,description,price,fasting,duration,sample,points,whatsapp_text,icon,available,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    tests.forEach((t, i) => ins.run(t.key, t.code, t.title, t.subtitle, t.description, t.price, t.fasting, t.duration, t.sample, JSON.stringify(t.points), t.whatsapp_text, t.icon, 1, i + 1));
  } else {
    // تعبئة العناوين الفرعية للقواعد القديمة
    const subs = { cbc: 'الأنيميا، كرات الدم البيضاء، الصفائح', liver: 'إنزيمات الكبد، الصفراء، الألبومين', kidney: 'الكرياتينين، البولينا، حمض اليوريك', sugar: 'سكر صائم، بعد الأكل بساعتين، تراكمي', lipids: 'الكوليسترول الكلي، الدهون الثلاثية، HDL، LDL', thyroid: 'TSH, Free T3, Free T4', vitamins: 'فيتامين د، مخزون الحديد (Ferritin)، الكالسيوم' };
    const up = db.prepare("UPDATE tests SET subtitle=? WHERE key=? AND (subtitle IS NULL OR subtitle='')");
    for (const [k, v] of Object.entries(subs)) { try { up.run(v, k); } catch (e) { /* ignore */ } }
  }
  if (count('packages') === 0) {
    const pkgs = [
      { type_label: 'الفحص الأساسي', badge: 'عرض حصري', badge_color: 'emerald', title: 'باقة الاطمئنان السريع للأطفال والكبار', description: 'فحص أساسي للاطمئنان على الأنيميا، السكر، وظائف الكلى، والبول.', features: ['صورة دم كاملة شاملة (CBC)', 'سكر عشوائي بالدم (RBS)', 'كرياتينين الكلى (Creatinine)', 'تحليل بول كامل ميكروسكوبياً'], price: '240', old_price: '310 ج.م', featured: 0, whatsapp_text: 'باقة الاطمئنان السريع' },
      { type_label: 'الفحص الشامل', badge: 'خصم خاص لفترة محدودة', badge_color: 'amber', title: 'باقة الصحة العامة المتكاملة', description: 'فحص شامل للكبد، الكلى، السكر التراكمي، والدهون الثلاثية.', features: ['صورة دم كاملة تفصيلية (CBC)', 'السكر التراكمي لـ 3 شهور (HbA1c)', 'إنزيمات الكبد (SGPT & SGOT)', 'وظائف كلى ونقرس (Creatinine + Uric Acid)', 'ملف كوليسترول ودهون ثلاثية كامل'], price: '490', old_price: '650 ج.م', featured: 1, whatsapp_text: 'باقة الصحة العامة المتكاملة' },
      { type_label: 'رعاية كبار السن', badge: 'خصم 20% على الغدة', badge_color: 'teal', title: 'باقة الأمراض المزمنة والغدة', description: 'متابعة دقيقة لمرضى الضغط، السكر، وهرمون الغدة الدرقية والكوليسترول.', features: ['هرمون الغدة الدرقية (TSH)', 'سكر تراكمي وصائم بدقة', 'كفاءة الكلى وأملاح النقرس', 'الدهون منخفضة وعالية الكثافة'], price: '580', old_price: '780 ج.م', featured: 0, whatsapp_text: 'باقة الأمراض المزمنة والغدة' }
    ];
    const ins = db.prepare('INSERT INTO packages(type_label,badge,badge_color,title,description,features,price,old_price,featured,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
    pkgs.forEach((p, i) => ins.run(p.type_label, p.badge, p.badge_color, p.title, p.description, JSON.stringify(p.features), p.price, p.old_price, p.featured, p.whatsapp_text, i + 1));
  }
  if (count('advice') === 0) {
    const adv = [
      { category: 'دليل الصيام الطبي', title: 'شروط الصيام قبل التحاليل', description: 'الدهون تحتاج 10-12 ساعة صيام، والسكر الصائم 8 ساعات. يسمح فقط بشرب الماء النقي لأنه لا يؤثر على تركيز كيمياء الدم.', icon: 'no_meals', color: 'secondary', whatsapp_text: 'استفسار عن شروط صيام التحليل' },
      { category: 'مرضى السكري', title: 'السكر التراكمي ومتابعته', description: 'تحليل HbA1c لا يتطلب أي صيام. يقيس انتظام السكر في آخر 90 يوماً ويجب إجراؤه كل 3 أشهر بانتظام لتجنب مضاعفات الأعصاب.', icon: 'monitoring', color: 'teal', whatsapp_text: 'استفسار عن السكر التراكمي' },
      { category: 'رعاية الأطفال', title: 'سحب العينات للأطفال بدون خوف', description: 'نهتم بالتهيئة النفسية واستخدام إبر فراشية دقيقة جداً مخصصة للأطفال لمنع أي ألم أو خوف، مع مكافأة تشجيعية لطفلك بعد السحب.', icon: 'child_care', color: 'amber', whatsapp_text: 'استفسار عن سحب عينات الأطفال' },
      { category: 'طب وقائي', title: 'أهمية الفحص الدوري الشامل', description: 'الفحص السنوي يكتشف اضطرابات الكبد، الكلى، والأنيميا قبل ظهور أي أعراض، مما يجعل العلاج أسهل وأكثر فاعلية بنسبة 90%.', icon: 'health_and_safety', color: 'emerald', whatsapp_text: 'استفسار عن باقات الفحص الدوري' }
    ];
    const ins = db.prepare('INSERT INTO advice(category,title,description,icon,color,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?)');
    adv.forEach((a, i) => ins.run(a.category, a.title, a.description, a.icon, a.color, a.whatsapp_text, i + 1));
  }
  const defaults = {
    phone_local: '01038879791',
    phone_intl: '201038879791',
    address: 'الطريق السريع بين ميت يزيد والقرشية - مركز السنطة',
    plus_code: 'V42F+CJ3، ميت يزيد، السنطه، محافظة الغربية 6656588، مصر',
    hours: 'يومياً من 9:00 صباحاً حتى 12:00 منتصف الليل',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=V42F%2BCJ3%2C%20ميت%20يزيد%2C%20السنطه%2C%20محافظة%20الغربية%206656588%2C%20مصر'
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (!getSetting(k, '')) setSetting(k, v);
  }
  if (count('promos') === 0) {
    const promos = [
      { badge: 'العروض الحصرية', badge_color: 'amber', text: 'باقة الفحص الشامل — خصم خاص لفترة محدودة' },
      { badge: 'العروض الحصرية', badge_color: 'teal', text: 'باقة كبار السن والسكر التراكمي الشاملة' },
      { badge: 'العروض الحصرية', badge_color: 'emerald', text: 'خصم 20% على تحاليل الغدة الدرقية وملف الدهون' },
      { badge: 'العروض الحصرية', badge_color: 'sky', text: 'باقة الاطمئنان السريع للأطفال والأنيميا' },
      { badge: 'العروض الحصرية', badge_color: 'rose', text: 'عرض خاص لجميع حاملي الروشتات الطبية بالقرشية' }
    ];
    const pins = db.prepare('INSERT INTO promos(badge,badge_color,text,active,sort_order) VALUES(?,?,?,?,?)');
    promos.forEach((p, i) => pins.run(p.badge, p.badge_color, p.text, 1, i + 1));
  }
  if (!getMeta('admin_hash', '')) {
    const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
    setMeta('admin_hash', hash);
  }
}
seed();

// ---------- أدوات ----------
function parseList(v) { try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }
function rowsTests() {
  return db.prepare('SELECT * FROM tests ORDER BY sort_order ASC, id ASC').all().map(r => ({ ...r, available: !!r.available, points: parseList(r.points) }));
}
function rowsPackages() {
  return db.prepare('SELECT * FROM packages ORDER BY sort_order ASC, id ASC').all().map(r => ({ ...r, featured: !!r.featured, features: parseList(r.features) }));
}
function rowsAdvice() {
  return db.prepare('SELECT * FROM advice ORDER BY sort_order ASC, id ASC').all().map(r => ({ ...r }));
}
function rowsPromos() {
  return db.prepare('SELECT * FROM promos ORDER BY sort_order ASC, id ASC').all().map(r => ({ ...r, active: !!r.active }));
}
function allSettings() {
  const out = {};
  db.prepare('SELECT key,value FROM settings').all().forEach(r => { out[r.key] = r.value; });
  return out;
}
function signToken() { return jwt.sign({ role: 'owner' }, JWT_SECRET, { expiresIn: '12h' }); }
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'غير مسجل الدخول' });
  try { jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'انتهت الجلسة، سجل الدخول مجدداً' }); }
}
const phoneRe = /^01[0-9]{9}$/;
function cleanStr(v, max = 500) { return String(v ?? '').trim().slice(0, max); }

// ---------- API عام (للموقع — بدون دخول) ----------
app.get('/api/public/settings', (req, res) => res.json(allSettings()));
app.get('/api/public/tests', (req, res) => res.json(rowsTests().filter(t => t.available)));
app.get('/api/public/packages', (req, res) => res.json(rowsPackages()));
app.get('/api/public/advice', (req, res) => res.json(rowsAdvice()));
app.get('/api/public/promos', (req, res) => res.json(rowsPromos().filter(p => p.active)));

// تسجيل طلبات الزوار (سحب منزلي / نتيجة) ليطلع عليها صاحب المعمل
app.post('/api/public/requests', (req, res) => {
  const type = cleanStr(req.body.type, 20) === 'result' ? 'result' : 'home';
  const name = cleanStr(req.body.name, 120);
  const phone = cleanStr(req.body.phone, 20).replace(/[\s-]/g, '');
  const address = cleanStr(req.body.address, 300);
  const order_no = cleanStr(req.body.order_no, 120);
  const test_name = cleanStr(req.body.test_name, 300);
  const tests = cleanStr(req.body.tests, 1000);
  if (!name || !phone) return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
  db.prepare('INSERT INTO requests(type,name,phone,address,order_no,test_name,tests,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run(type, name, phone, address, order_no, test_name, tests, new Date().toISOString());
  res.json({ ok: true });
});

// ---------- API الإدارة (بباسورد) ----------
app.post('/api/admin/login', (req, res) => {
  const password = String(req.body.password || '');
  if (!password) return res.status(400).json({ error: 'اكتب كلمة السر' });
  const hash = getMeta('admin_hash', '');
  if (!hash || !bcrypt.compareSync(password, hash)) {
    return res.status(401).json({ error: 'كلمة السر غير صحيحة' });
  }
  res.json({ token: signToken() });
});

// --- التحاليل ---
app.get('/api/admin/tests', requireAuth, (req, res) => res.json(rowsTests()));
app.post('/api/admin/tests', requireAuth, (req, res) => {
  const b = req.body || {};
  const key = cleanStr(b.key, 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || ('t' + Date.now());
  const code = cleanStr(b.code, 40) || key.toUpperCase();
  const title = cleanStr(b.title, 200);
  if (!title) return res.status(400).json({ error: 'اسم التحليل مطلوب' });
  const exists = db.prepare('SELECT id FROM tests WHERE key=?').get(key);
  if (exists) return res.status(400).json({ error: 'المفتاح (key) مستخدم من قبل، اختر اسماً آخر بالإنجليزية' });
  const pts = Array.isArray(b.points) ? b.points.map(x => cleanStr(x, 300)).filter(Boolean).slice(0, 12) : [];
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM tests').get().m;
  const r = db.prepare('INSERT INTO tests(key,code,title,subtitle,description,price,fasting,duration,sample,points,whatsapp_text,icon,available,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(key, code, title, cleanStr(b.subtitle, 160), cleanStr(b.description, 2000), cleanStr(b.price, 60), cleanStr(b.fasting, 500), cleanStr(b.duration, 500), cleanStr(b.sample, 500), JSON.stringify(pts), cleanStr(b.whatsapp_text, 300), cleanStr(b.icon, 60) || 'bloodtype', b.available === false ? 0 : 1, Number(b.sort_order) || (maxOrder + 1));
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});
app.put('/api/admin/tests/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM tests WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ error: 'غير موجود' });
  const b = req.body || {};
  const pts = Array.isArray(b.points) ? b.points.map(x => cleanStr(x, 300)).filter(Boolean).slice(0, 12) : parseList(cur.points);
  db.prepare('UPDATE tests SET code=?,title=?,subtitle=?,description=?,price=?,fasting=?,duration=?,sample=?,points=?,whatsapp_text=?,icon=?,available=?,sort_order=? WHERE id=?')
    .run(cleanStr(b.code ?? cur.code, 40), cleanStr(b.title ?? cur.title, 200), cleanStr(b.subtitle ?? cur.subtitle ?? '', 160), cleanStr(b.description ?? cur.description, 2000), cleanStr(b.price ?? cur.price, 60), cleanStr(b.fasting ?? cur.fasting, 500), cleanStr(b.duration ?? cur.duration, 500), cleanStr(b.sample ?? cur.sample, 500), JSON.stringify(pts), cleanStr(b.whatsapp_text ?? cur.whatsapp_text, 300), cleanStr(b.icon ?? cur.icon, 60) || 'bloodtype', (b.available === false ? 0 : 1), Number(b.sort_order) || cur.sort_order, id);
  res.json({ ok: true });
});
app.delete('/api/admin/tests/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM tests WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- الباقات ---
app.get('/api/admin/packages', requireAuth, (req, res) => res.json(rowsPackages()));
app.post('/api/admin/packages', requireAuth, (req, res) => {
  const b = req.body || {};
  const title = cleanStr(b.title, 200);
  if (!title) return res.status(400).json({ error: 'اسم الباقة مطلوب' });
  const feats = Array.isArray(b.features) ? b.features.map(x => cleanStr(x, 300)).filter(Boolean).slice(0, 15) : [];
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM packages').get().m;
  if (b.featured) db.exec('UPDATE packages SET featured=0');
  const r = db.prepare('INSERT INTO packages(type_label,badge,badge_color,title,description,features,price,old_price,featured,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(cleanStr(b.type_label, 80), cleanStr(b.badge, 80), cleanStr(b.badge_color, 20) || 'emerald', title, cleanStr(b.description, 2000), JSON.stringify(feats), cleanStr(b.price, 40), cleanStr(b.old_price, 60), b.featured ? 1 : 0, cleanStr(b.whatsapp_text, 300), Number(b.sort_order) || (maxOrder + 1));
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});
app.put('/api/admin/packages/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM packages WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ error: 'غير موجود' });
  const b = req.body || {};
  const feats = Array.isArray(b.features) ? b.features.map(x => cleanStr(x, 300)).filter(Boolean).slice(0, 15) : parseList(cur.features);
  if (b.featured) db.prepare('UPDATE packages SET featured=0 WHERE id<>?').run(id);
  db.prepare('UPDATE packages SET type_label=?,badge=?,badge_color=?,title=?,description=?,features=?,price=?,old_price=?,featured=?,whatsapp_text=?,sort_order=? WHERE id=?')
    .run(cleanStr(b.type_label ?? cur.type_label, 80), cleanStr(b.badge ?? cur.badge, 80), cleanStr(b.badge_color ?? cur.badge_color, 20), cleanStr(b.title ?? cur.title, 200), cleanStr(b.description ?? cur.description, 2000), JSON.stringify(feats), cleanStr(b.price ?? cur.price, 40), cleanStr(b.old_price ?? cur.old_price, 60), b.featured ? 1 : 0, cleanStr(b.whatsapp_text ?? cur.whatsapp_text, 300), Number(b.sort_order) || cur.sort_order, id);
  res.json({ ok: true });
});
app.delete('/api/admin/packages/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM packages WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- الإرشادات ---
app.get('/api/admin/advice', requireAuth, (req, res) => res.json(rowsAdvice()));
app.post('/api/admin/advice', requireAuth, (req, res) => {
  const b = req.body || {};
  const title = cleanStr(b.title, 200);
  if (!title) return res.status(400).json({ error: 'العنوان مطلوب' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM advice').get().m;
  const r = db.prepare('INSERT INTO advice(category,title,description,icon,color,whatsapp_text,sort_order) VALUES(?,?,?,?,?,?,?)')
    .run(cleanStr(b.category, 120), title, cleanStr(b.description, 2000), cleanStr(b.icon, 60) || 'medical_information', cleanStr(b.color, 20) || 'secondary', cleanStr(b.whatsapp_text, 300), Number(b.sort_order) || (maxOrder + 1));
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});
app.put('/api/admin/advice/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM advice WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ error: 'غير موجود' });
  const b = req.body || {};
  db.prepare('UPDATE advice SET category=?,title=?,description=?,icon=?,color=?,whatsapp_text=?,sort_order=? WHERE id=?')
    .run(cleanStr(b.category ?? cur.category, 120), cleanStr(b.title ?? cur.title, 200), cleanStr(b.description ?? cur.description, 2000), cleanStr(b.icon ?? cur.icon, 60), cleanStr(b.color ?? cur.color, 20), cleanStr(b.whatsapp_text ?? cur.whatsapp_text, 300), Number(b.sort_order) || cur.sort_order, id);
  res.json({ ok: true });
});
app.delete('/api/admin/advice/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM advice WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- الشريط المتحرك للعروض ---
const PROMO_COLORS = ['amber', 'teal', 'emerald', 'sky', 'rose'];
app.get('/api/admin/promos', requireAuth, (req, res) => res.json(rowsPromos()));
app.post('/api/admin/promos', requireAuth, (req, res) => {
  const b = req.body || {};
  const text = cleanStr(b.text, 300);
  if (!text) return res.status(400).json({ error: 'نص العرض مطلوب' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM promos').get().m;
  const color = PROMO_COLORS.includes(b.badge_color) ? b.badge_color : 'amber';
  const r = db.prepare('INSERT INTO promos(badge,badge_color,text,active,sort_order) VALUES(?,?,?,?,?)')
    .run(cleanStr(b.badge, 60) || 'العروض الحصرية', color, text, b.active === false ? 0 : 1, Number(b.sort_order) || (maxOrder + 1));
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});
app.put('/api/admin/promos/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM promos WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ error: 'غير موجود' });
  const b = req.body || {};
  const color = PROMO_COLORS.includes(b.badge_color) ? b.badge_color : cur.badge_color;
  db.prepare('UPDATE promos SET badge=?,badge_color=?,text=?,active=?,sort_order=? WHERE id=?')
    .run(cleanStr(b.badge ?? cur.badge, 60), color, cleanStr(b.text ?? cur.text, 300), b.active === false ? 0 : 1, Number(b.sort_order) || cur.sort_order, id);
  res.json({ ok: true });
});
app.delete('/api/admin/promos/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM promos WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- إحصائيات الطلبات (اليوم + آخر 7 أيام) ---
app.get('/api/admin/stats', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT type,created_at FROM requests').all();
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
});

// --- صور الموقع: عرض بالخانة + رفع من اللوحة ---
const IMG_SLOTS = {
  logo: { setting: 'img_logo', def: 'logo.png' },
  icon: { setting: 'img_icon', def: 'logo-icon.png' },
  hero: { setting: 'img_hero', def: 'hero-lab.jpg' },
  map: { setting: 'img_map', def: 'map-sat.jpg' }
};
const IMG_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
app.get('/img/:slot', (req, res) => {
  const cfg = IMG_SLOTS[req.params.slot];
  if (!cfg) return res.status(404).send('Not found');
  const imgDir = path.join(ROOT, 'assets', 'img');
  let file = getSetting(cfg.setting, '') || cfg.def;
  file = path.basename(file);
  let fp = path.join(imgDir, file);
  if (!fs.existsSync(fp)) fp = path.join(imgDir, cfg.def);
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');
  const ext = path.extname(fp).toLowerCase();
  res.setHeader('Content-Type', IMG_MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(fp);
});
app.post('/api/admin/upload', requireAuth, (req, res) => {
  const { slot, dataUrl } = req.body || {};
  const cfg = IMG_SLOTS[slot];
  if (!cfg) return res.status(400).json({ error: 'خانة غير صالحة' });
  const m = String(dataUrl || '').match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return res.status(400).json({ error: 'صيغة الصورة غير مدعومة (PNG أو JPG أو WebP فقط)' });
  const buf = Buffer.from(m[3], 'base64');
  if (!buf.length || buf.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'حجم الصورة كبير (الحد 6MB)' });
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  const isJpg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const isWebp = buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  if (!isPng && !isJpg && !isWebp) return res.status(400).json({ error: 'ملف الصورة تالف' });
  const ext = isPng ? '.png' : isJpg ? '.jpg' : '.webp';
  const filename = `${slot}-custom${ext}`;
  const imgDir = path.join(ROOT, 'assets', 'img');
  fs.writeFileSync(path.join(imgDir, filename), buf);
  const prev = getSetting(cfg.setting, '');
  if (prev && prev !== filename && prev !== cfg.def) {
    try { fs.unlinkSync(path.join(imgDir, path.basename(prev))); } catch (e) { /* ignore */ }
  }
  setSetting(cfg.setting, filename);
  res.json({ ok: true, url: `/img/${slot}` });
});

// --- الإعدادات ---
app.get('/api/admin/settings', requireAuth, (req, res) => res.json(allSettings()));
app.put('/api/admin/settings', requireAuth, (req, res) => {
  const b = req.body || {};
  const allowed = ['phone_local', 'phone_intl', 'address', 'plus_code', 'hours', 'maps_url'];
  for (const k of allowed) {
    if (k in b) {
      let v = cleanStr(b[k], 1000);
      if (k === 'phone_local' && v && !phoneRe.test(v.replace(/[\s-]/g, ''))) {
        return res.status(400).json({ error: 'رقم الهاتف المحلي يجب أن يكون 11 رقماً يبدأ بـ 01' });
      }
      setSetting(k, v);
    }
  }
  // توليد الدولي تلقائياً من المحلي لو لم يُرسل
  const local = getSetting('phone_local', '01038879791').replace(/\D/g, '');
  if (!('phone_intl' in b) && /^01\d{9}$/.test(local)) setSetting('phone_intl', '2' + local);
  res.json({ ok: true, settings: allSettings() });
});

// --- الطلبات الواردة ---
app.get('/api/admin/requests', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM requests ORDER BY id DESC LIMIT 300').all());
});
app.delete('/api/admin/requests/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM requests WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- تغيير الباسورد + نسخ احتياطي ---
app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { old_password, new_password } = req.body || {};
  const hash = getMeta('admin_hash', '');
  if (!bcrypt.compareSync(String(old_password || ''), hash)) return res.status(401).json({ error: 'كلمة السر الحالية غير صحيحة' });
  if (String(new_password || '').length < 6) return res.status(400).json({ error: 'كلمة السر الجديدة 6 أحرف على الأقل' });
  setMeta('admin_hash', bcrypt.hashSync(String(new_password), 10));
  res.json({ ok: true });
});
app.get('/api/admin/backup', requireAuth, (req, res) => {
  res.json({ tests: rowsTests(), packages: rowsPackages(), advice: rowsAdvice(), settings: allSettings(), exported_at: new Date().toISOString() });
});

// ---------- لوحة التحكم على مسار سري فقط ----------
// لا نعرض مجلد admin على أي مسار آخر
app.use(ADMIN_PATH, express.static(path.join(ROOT, 'admin'), { index: 'index.html' }));
// منع التخمين: أي محاولة لمسارات أدمن شائعة -> 404 صامت
['/admin', '/dashboard', '/control', '/cpanel', '/manage'].forEach(p => {
  app.use(p, (req, res) => res.status(404).send('Not found'));
});

// ---------- الموقع ----------
app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
// صفحات الموقع ملف واحد (روابط # داخلية) — أي مسار غير معروف يرجع الرئيسية
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.path.startsWith(ADMIN_PATH)) return next();
  if (req.method !== 'GET') return next();
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') return next();
  if (req.path !== '/' && fs.existsSync(path.join(ROOT, 'index.html'))) {
    // لا نفصح عن وجود لوحة التحكم
    return res.sendFile(path.join(ROOT, 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log('==============================================');
  console.log(' معمل الحياه بالقرشيه — يعمل الآن');
  console.log(` الموقع:  http://localhost:${PORT}`);
  console.log(` التحكم:  http://localhost:${PORT}${ADMIN_PATH}`);
  console.log(` الباسورد الافتراضي: ${DEFAULT_ADMIN_PASSWORD} (غيره فوراً من اللوحة)`);
  console.log('==============================================');
});
