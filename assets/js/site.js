/* معمل الحياه بالقرشيه — طبقة الربط بالباك اند
   - تجلب الإعدادات/التحاليل/الباقات/الإرشادات من /api/public
   - لو السيرفر مقفول: المحتوى الثابت الأصلي يفضل ظاهراً (Fallback)
   - توحد كل أرقام الهواتف ولينكات واتساب والخرائط من الإعدادات
*/
(function () {
  'use strict';

  var DEFAULT_LOCAL = '01038879791';
  var DEFAULT_INTL = '201038879791';

  var SETTINGS = null;
  var TESTS = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    });
  }

  function waLink(text) {
    var intl = (SETTINGS && SETTINGS.phone_intl) || DEFAULT_INTL;
    return 'https://wa.me/' + intl + '?text=' + encodeURIComponent(text || '');
  }

  /* ---------- 1) الإعدادات: هواتف + واتساب + خرائط + عناوين ---------- */
  function applySettings(s) {
    var local = (s.phone_local || DEFAULT_LOCAL).replace(/[\s-]/g, '');
    var intl = (s.phone_intl || DEFAULT_INTL).replace(/\D/g, '');

    // كل لينكات واتساب -> الرقم الدولي الجديد (مع الاحتفاظ بنص الرسالة)
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      try {
        var raw = a.getAttribute('href');
        var textMatch = raw.match(/[?&]text=([^&]*)/);
        var text = textMatch ? decodeURIComponent(textMatch[1]) : '';
        a.href = 'https://wa.me/' + intl + (text ? '?text=' + encodeURIComponent(text) : '');
      } catch (e) { /* ignore */ }
    });

    // كل لينكات الاتصال -> الرقم المحلي الجديد
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.setAttribute('href', 'tel:' + local);
    });

    // أي نص ظاهر يحمل الرقم القديم -> الرقم الجديد
    if (local !== DEFAULT_LOCAL) {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (n) {
        if (n.parentElement && /^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) return;
        if (n.nodeValue && n.nodeValue.indexOf(DEFAULT_LOCAL) !== -1) {
          n.nodeValue = n.nodeValue.split(DEFAULT_LOCAL).join(local);
        }
      });
    }

    // لينكات خرائط جوجل -> رابط الإعدادات
    if (s.maps_url) {
      document.querySelectorAll('a[href*="google.com/maps"]').forEach(function (a) {
        a.href = s.maps_url;
      });
    }

    // العنوان / المواعيد / الرمز البريدي (عناصر موسومة data-s)
    bindSetting('address', s.address);
    bindSetting('plus', s.plus_code);
    var hoursEl = document.querySelector('[data-s="hours"]');
    if (hoursEl && s.hours) hoursEl.textContent = 'مواعيد العمل: ' + s.hours;
    // أي عنصر يحمل الرمز القديم حرفياً (احتياطي)
    if (s.plus_code && s.plus_code !== 'V42F+CJ3') {
      document.querySelectorAll('.font-mono').forEach(function (el) {
        if (el.textContent && el.textContent.indexOf('V42F+CJ3') !== -1 && el.children.length === 0) {
          el.textContent = s.plus_code;
        }
      });
    }
  }

  function bindSetting(name, value) {
    if (!value) return;
    document.querySelectorAll('[data-s="' + name + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  /* ---------- 2) التحاليل: القائمة الجانبية + بطاقة التفاصيل ---------- */
  var BTN_BASE = 'cat-btn w-full flex items-center justify-between p-3.5 rounded-xl text-right transition-all ';
  var BTN_OFF = BTN_BASE + 'hover:bg-surface-container-low text-slate-700 font-medium';
  var BTN_ON = BTN_BASE + 'bg-primary-container text-white font-semibold';

  function shortTitle(t) {
    var s = String(t || '').split('(')[0].trim();
    return s || t;
  }

  function renderTestList() {
    var box = document.getElementById('category-selector-list');
    if (!box || !TESTS.length) return;
    if (!box.dataset.scrollHook) {
      box.dataset.scrollHook = '1';
      box.addEventListener('scroll', function () {
        box.classList.toggle('is-scrolled', box.scrollTop > 8);
      }, { passive: true });
    }
    var search = document.getElementById('quick-test-filter');
    if (search) search.setAttribute('placeholder', 'ابحث في ' + TESTS.length + ' تحليل (مثال: سكر، غدة، CBC)...');
    box.innerHTML = TESTS.map(function (t, i) {
      var on = i === 0;
      return '<button class="' + (on ? esc(BTN_ON) : esc(BTN_OFF)) + '" onclick="selectCategory(\'' + esc(t.key) + '\', this)">' +
        '<div class="flex items-center gap-3">' +
        '<span class="material-symbols-outlined text-[20px] ' + (on ? 'text-teal-soft' : 'text-secondary') + '">' + esc(t.icon || 'bloodtype') + '</span>' +
        '<div class="flex flex-col">' +
        '<span class="text-sm">' + esc(shortTitle(t.title)) + (t.code && shortTitle(t.title).indexOf(t.code) === -1 ? ' (' + esc(t.code) + ')' : '') + '</span>' +
        (t.subtitle ? '<span class="text-[11px] ' + (on ? 'opacity-80 font-normal' : 'text-slate-400 font-normal') + '">' + esc(t.subtitle) + '</span>' : '') +
        '</div></div>' +
        '<span class="material-symbols-outlined text-[18px]">chevron_left</span>' +
        '</button>';
    }).join('');
  }

  function showTestByKey(key, btnElement) {
    var data = null;
    for (var i = 0; i < TESTS.length; i++) if (TESTS[i].key === key) data = TESTS[i];
    if (!data) return;

    if (btnElement) {
      document.querySelectorAll('.cat-btn').forEach(function (btn) {
        btn.className = BTN_OFF;
        var ic = btn.querySelector('.material-symbols-outlined');
        if (ic) ic.className = 'material-symbols-outlined text-[20px] text-secondary';
      });
      btnElement.className = BTN_ON;
      var aic = btnElement.querySelector('.material-symbols-outlined');
      if (aic) aic.className = 'material-symbols-outlined text-[20px] text-teal-soft';
      try { btnElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }

    setText('active-test-code', data.code);
    setText('active-test-title', data.title);
    setText('active-test-desc', data.description);
    setText('active-test-price', data.price);
    setText('active-test-fasting', data.fasting);
    setText('active-test-duration', data.duration);
    setText('active-test-sample', data.sample);

    var box = document.getElementById('active-test-points');
    if (box) {
      box.innerHTML = '';
      (data.points || []).forEach(function (pt) {
        var li = document.createElement('li');
        li.className = 'flex items-center gap-2';
        var dot = document.createElement('span');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-secondary';
        var tx = document.createElement('span');
        tx.textContent = pt;
        li.appendChild(dot); li.appendChild(tx);
        box.appendChild(li);
      });
    }
    var wa = document.getElementById('active-test-whatsapp');
    if (wa) wa.href = waLink('السلام عليكم معمل الحياه بالقرشيه، أرغب في الاستفسار وحجز ' + (data.whatsapp_text || data.title));
  }

  function setText(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = v == null ? '' : v;
  }

  // تجاوز دوال النسخة الثابتة لتعمل على بيانات الباك اند
  window.selectCategory = function (catKey, btnElement) {
    if (TESTS.length) showTestByKey(catKey, btnElement);
  };
  window.liveFilterTests = function (term) {
    var q = String(term || '').trim().toLowerCase();
    if (!q || !TESTS.length) return;
    for (var i = 0; i < TESTS.length; i++) {
      var t = TESTS[i];
      var hay = ((t.title || '') + ' ' + (t.code || '') + ' ' + (t.description || '') + ' ' + (t.subtitle || '')).toLowerCase();
      if (hay.indexOf(q) !== -1) {
        var btn = document.querySelector('button[onclick*="\'' + t.key + '\'"]');
        if (btn) { showTestByKey(t.key, btn); btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        break;
      }
    }
  };

  /* ---------- 3) الباقات ---------- */
  var BADGE_CLS = {
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-400 text-slate-950',
    teal: 'bg-teal-100 text-teal-800',
    sky: 'bg-sky-400 text-slate-950',
    rose: 'bg-rose-400 text-slate-950'
  };

  function pkgMsg(p) {
    var lines = [];
    lines.push(waHead());
    lines.push(waDiv());
    lines.push('\uD83C\uDF81 *\u062d\u062c\u0632 \u0628\u0627\u0642\u0629 \u0637\u0628\u064a\u0629*');
    lines.push(waDiv());
    lines.push('\uD83D\uDCCC *\u0627\u0644\u0628\u0627\u0642\u0629:* ' + (p.title || ''));
    if (p.type_label) lines.push('\uD83C\uDFF7\uFE0F *\u0627\u0644\u062a\u0635\u0646\u064a\u0641:* ' + p.type_label);
    if (p.badge) lines.push('\u2728 *\u0627\u0644\u0639\u0631\u0636:* ' + p.badge);
    if (p.description) lines.push('\uD83D\uDCDD ' + p.description);
    var feats = p.features || [];
    if (feats.length) {
      lines.push('\uD83E\uDDEA *\u062a\u0634\u0645\u0644 ' + feats.length + ' \u0641\u062d\u0648\u0635\u0627\u062a:*');
      feats.forEach(function (f) { lines.push('\u25AA\uFE0F ' + f); });
    }
    var priceLine = '\uD83D\uDCB0 *\u0627\u0644\u0633\u0639\u0631:* ' + (p.price || '') + ' \u062c\u0646\u064a\u0629 \u0645\u0635\u0631\u064a';
    if (p.old_price) priceLine += ' (\u0628\u062f\u0644\u0627\u064b \u0645\u0646 ' + p.old_price + ')';
    lines.push(priceLine);
    lines.push(waDiv());
    lines.push('\u2705 \u0628\u0631\u062c\u0627\u0621 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u062c\u0632 \u2014 \u0634\u0643\u0631\u0627\u064b \u0644\u062b\u0642\u062a\u0643\u0645 \uD83D\uDE4F');
    return lines.join('\n');
  }
  function renderPackages(pkgs) {
    var grid = document.querySelector('#packages .grid');
    if (!grid || !pkgs.length) return;
    var featured = null, normal = [];
    pkgs.forEach(function (p) { if (p.featured && !featured) featured = p; else normal.push(p); });
    var ordered = [];
    if (normal.length >= 1 && featured) {
      ordered = [normal[0], featured].concat(normal.slice(1));
    } else if (featured) {
      ordered = [featured].concat(normal);
    } else { ordered = pkgs; }

    grid.innerHTML = ordered.map(function (p) {
      var feats = (p.features || []).map(function (f) {
        return '<li class="flex items-center gap-2">' +
          '<span class="material-symbols-outlined ' + (p.featured ? 'text-teal-soft' : 'text-health-dark') + ' text-[18px]">' + (p.featured ? 'verified' : 'check_circle') + '</span>' +
          '<span>' + esc(f) + '</span></li>';
      }).join('');
      var badgeCls = BADGE_CLS[p.badge_color] || BADGE_CLS.emerald;
      var bookHref = waLink(pkgMsg(p));
      if (p.featured) {
        return '<div class="p-6 rounded-3xl bg-primary-container text-white border-2 border-secondary/50 flex flex-col justify-between shadow-xl relative lg:-translate-y-2">' +
          '<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-secondary text-white text-[11px] font-bold shadow">الأكثر طلباً بالقرشيه</div>' +
          '<div><div class="flex items-center justify-between mb-2">' +
          '<span class="text-xs font-bold text-teal-soft">' + esc(p.type_label || 'الفحص الشامل') + '</span>' +
          '<span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold">' + esc(p.badge || 'خصم خاص') + '</span></div>' +
          '<h3 class="text-xl font-bold text-white mb-2">' + esc(p.title) + '</h3>' +
          '<p class="text-xs text-slate-300 mb-6">' + esc(p.description) + '</p>' +
          '<ul class="space-y-2.5 text-xs text-slate-200 mb-8">' + feats + '</ul></div>' +
          '<div><div class="flex items-baseline gap-2 mb-4">' +
          '<span class="text-3xl font-bold font-mono text-white">' + esc(p.price) + '</span>' +
          '<span class="text-xs text-slate-300">جنية مصري</span>' +
          (p.old_price ? '<span class="text-xs text-slate-400 line-through mr-2">' + esc(p.old_price) + '</span>' : '') + '</div>' +
          '<a class="w-full py-3 rounded-xl bg-whatsapp-green hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md" target="_blank" rel="noopener noreferrer" href="' + esc(bookHref) + '">' +
          '<span class="material-symbols-outlined text-[18px]">chat</span><span>حجز الباقة مع إمكانية السحب المنزلي</span></a></div></div>';
      }
      return '<div class="p-6 rounded-3xl bg-surface-container-low border border-border-hairline flex flex-col justify-between hover:border-secondary/40 transition-all">' +
        '<div><div class="flex items-center justify-between mb-2">' +
        '<span class="text-xs font-bold text-slate-500">' + esc(p.type_label || '') + '</span>' +
        (p.badge ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold ' + badgeCls + '">' + esc(p.badge) + '</span>' : '') + '</div>' +
        '<h3 class="text-lg font-bold text-primary mb-2">' + esc(p.title) + '</h3>' +
        '<p class="text-xs text-text-muted mb-6">' + esc(p.description) + '</p>' +
        '<ul class="space-y-2.5 text-xs text-slate-700 mb-8">' + feats + '</ul></div>' +
        '<div><div class="flex items-baseline gap-2 mb-4">' +
        '<span class="text-2xl font-bold font-mono text-primary">' + esc(p.price) + '</span>' +
        '<span class="text-xs text-slate-500">جنية مصري</span>' +
        (p.old_price ? '<span class="text-xs text-slate-400 line-through mr-2">' + esc(p.old_price) + '</span>' : '') + '</div>' +
        '<a class="w-full py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5" target="_blank" rel="noopener noreferrer" href="' + esc(bookHref) + '">' +
        '<span class="material-symbols-outlined text-[16px] text-whatsapp-green">chat</span><span>حجز الباقة عبر واتساب</span></a></div></div>';
    }).join('');
  }

  /* ---------- 3.5) الشريط المتحرك للعروض ---------- */
  var PROMO_BADGE = {
    amber: 'bg-amber-400', teal: 'bg-teal-soft', emerald: 'bg-emerald-400',
    sky: 'bg-sky-400', rose: 'bg-rose-400'
  };
  function renderPromos(list) {
    var track = document.querySelector('.marquee-track');
    if (!track || !Array.isArray(list) || !list.length) return;
    function one(p) {
      var bc = PROMO_BADGE[p.badge_color] || PROMO_BADGE.amber;
      return '<a class="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-teal-soft/30 transition-all text-xs sm:text-sm group" href="#packages">' +
        '<span class="px-2.5 py-0.5 rounded-md ' + bc + ' text-slate-950 font-bold text-[11px] shadow-sm">' + esc(p.badge || 'العروض الحصرية') + '</span>' +
        '<span class="font-medium text-slate-100">' + esc(p.text) + '</span>' +
        '<span class="material-symbols-outlined text-[16px] text-teal-soft group-hover:-translate-x-1 transition-transform">arrow_back</span></a>' +
        '<span class="text-teal-soft/40 text-xs">◆</span>';
    }
    var half = list.map(one).join('');
    track.innerHTML = '<div class="flex items-center gap-6 pl-6">' + half + '</div>' +
      '<div aria-hidden="true" class="flex items-center gap-6 pl-6">' + half + '</div>';
  }

  /* ---------- 4) الإرشادات ---------- */
  var ADVICE_CLS = {
    secondary: { bg: 'bg-secondary/10', tx: 'text-secondary' },
    teal: { bg: 'bg-teal-soft/10', tx: 'text-teal-soft' },
    amber: { bg: 'bg-amber-500/10', tx: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-500/10', tx: 'text-health-dark' }
  };

  function renderAdvice(list) {
    var grid = document.querySelector('#medical-advice .grid');
    if (!grid || !list.length) return;
    grid.innerHTML = list.map(function (a) {
      var c = ADVICE_CLS[a.color] || ADVICE_CLS.secondary;
      return '<div class="p-6 rounded-3xl bg-white border border-border-hairline shadow-sm hover:shadow-md transition-all flex flex-col justify-between">' +
        '<div><div class="w-10 h-10 rounded-2xl ' + c.bg + ' ' + c.tx + ' flex items-center justify-center mb-4">' +
        '<span class="material-symbols-outlined text-[22px]">' + esc(a.icon || 'medical_information') + '</span></div>' +
        '<span class="text-[11px] font-bold ' + c.tx + ' block mb-1">' + esc(a.category || '') + '</span>' +
        '<h3 class="font-bold text-primary text-base mb-2">' + esc(a.title) + '</h3>' +
        '<p class="text-xs text-text-muted leading-relaxed mb-4">' + esc(a.description) + '</p></div>' +
        '<a class="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 pt-3 border-t border-slate-100" target="_blank" rel="noopener noreferrer" href="' + esc(waLink('استفسار: ' + (a.whatsapp_text || a.title))) + '">' +
        '<span>اسأل المعمل عبر واتساب</span><span class="material-symbols-outlined text-[15px]">arrow_back</span></a></div>';
    }).join('');
  }

  /* ---------- 5) تسجيل طلبات الزوار لصاحب المعمل ---------- */
  function logRequest(payload) {
    try {
      fetch('/api/public/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* ignore */ }
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function hookForms() {
    var homeForm = document.querySelector('#home-collection form');
    if (homeForm) homeForm.addEventListener('submit', function () {
      logRequest({ type: 'home', name: val('home-name'), phone: val('home-phone'), address: val('home-address'), tests: val('home-tests') });
    });
    var portal = document.getElementById('portal-form');
    if (portal) portal.addEventListener('submit', function () {
      logRequest({ type: 'result', name: val('res-name'), phone: val('res-phone'), order_no: val('res-order-no'), test_name: val('res-test-name') });
    });
  }

  /* ---------- 6) قوائم التحاليل + معاينة واتساب الحية ---------- */
  function buildResSelect() {
    var old = document.getElementById('res-test-name');
    if (!old || old.tagName === 'SELECT' || !TESTS.length) return;
    var sel = document.createElement('select');
    sel.id = 'res-test-name'; sel.required = true; sel.className = old.className;
    var ph = document.createElement('option');
    ph.value = ''; ph.disabled = true; ph.selected = true;
    ph.textContent = 'اختر التحليل من القائمة...';
    sel.appendChild(ph);
    TESTS.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.title;
      o.textContent = (t.code ? t.code + ' \u2014 ' : '') + shortTitle(t.title) + (t.price ? ' (' + t.price + ')' : '');
      sel.appendChild(o);
    });
    var mo = document.createElement('option');
    mo.value = 'عدة تحاليل / فحص شامل';
    mo.textContent = 'عدة تحاليل / فحص شامل';
    sel.appendChild(mo);
    old.parentElement.replaceChild(sel, old);
    sel.addEventListener('change', function () { sel.classList.remove('inp-err'); });
  }
  function buildHomeQuickAdd() {
    if (document.getElementById('home-quick-add') || !TESTS.length) return;
    var ta = document.getElementById('home-tests');
    if (!ta) return;
    var sel = document.createElement('select');
    sel.id = 'home-quick-add'; sel.className = ta.className;
    sel.style.marginTop = '.5rem';
    var ph = document.createElement('option');
    ph.value = ''; ph.selected = true;
    ph.textContent = '\u2795 \u0623\u0636\u0641 \u062a\u062d\u0644\u064a\u0644\u0627\u064b \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0625\u0644\u0649 \u0637\u0644\u0628\u0643...';
    sel.appendChild(ph);
    TESTS.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.title;
      o.textContent = (t.code ? t.code + ' \u2014 ' : '') + shortTitle(t.title);
      sel.appendChild(o);
    });
    ta.parentElement.appendChild(sel);
    sel.addEventListener('change', function () {
      if (!sel.value) return;
      var cur = ta.value.trim().replace(/\u060c\s*$/, '');
      ta.value = cur ? (cur + '\u060c ' + sel.value) : sel.value;
      sel.value = '';
    });
  }
  function waHead() { return '\uD83C\uDFE5 *\u0645\u0639\u0645\u0644 \u0627\u0644\u062d\u064a\u0627\u0629 \u0644\u0644\u062a\u062d\u0627\u0644\u064a\u0644 \u0627\u0644\u0637\u0628\u064a\u0629 \u0628\u0627\u0644\u0642\u0631\u0634\u064a\u0647*'; }
  function waDiv() { return '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501'; }
  function homeMsg(d) {
    return waHead() + '\n' + waDiv() + '\n\uD83D\uDE97 *\u0637\u0644\u0628 \u0632\u064a\u0627\u0631\u0629 \u0633\u062d\u0628 \u0645\u0646\u0632\u0644\u064a*\n' + waDiv() +
      '\n\uD83D\uDC64 *\u0627\u0644\u0627\u0633\u0645:* ' + (d.name || '...') +
      '\n\uD83D\uDCF1 *\u0627\u0644\u0647\u0627\u062a\u0641:* ' + (d.phone || '...') +
      '\n\uD83D\uDCCD *\u0627\u0644\u0639\u0646\u0648\u0627\u0646:* ' + (d.address || '...') +
      '\n\uD83E\uDDEA *\u0627\u0644\u062a\u062d\u0627\u0644\u064a\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629:*\n' + (d.tests || '...') +
      '\n' + waDiv() + '\n\u2705 \u0628\u0631\u062c\u0627\u0621 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0645\u0648\u0639\u062f \u2014 \u0634\u0643\u0631\u0627\u064b \u0644\u062b\u0642\u062a\u0643\u0645 \uD83D\uDE4F';
  }
  function resMsg(d) {
    return waHead() + '\n' + waDiv() + '\n\uD83D\uDCC4 *\u0637\u0644\u0628 \u0627\u0633\u062a\u0644\u0627\u0645 \u0646\u062a\u064a\u062c\u0629 \u062a\u062d\u0644\u064a\u0644*\n' + waDiv() +
      '\n\uD83D\uDC64 *\u0627\u0644\u0627\u0633\u0645:* ' + (d.name || '...') +
      '\n\uD83D\uDCF1 *\u0627\u0644\u0647\u0627\u062a\u0641:* ' + (d.phone || '...') +
      '\n\uD83E\uDDFE *\u0631\u0642\u0645 \u0627\u0644\u0625\u064a\u0635\u0627\u0644:* ' + (d.order || '\u2014') +
      '\n\uD83D\uDD2C *\u0627\u0644\u062a\u062d\u0644\u064a\u0644:* ' + (d.test || '...') +
      '\n' + waDiv() + '\n\u2705 \u0628\u0631\u062c\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0639\u0646\u062f \u062c\u0647\u0648\u0632\u064a\u062a\u0647 \u2014 \u0634\u0643\u0631\u0627\u064b \u0644\u0643\u0645 \uD83D\uDE4F';
  }
  function homeData() {
    return { name: val('home-name'), phone: val('home-phone'), address: val('home-address'), tests: val('home-tests') };
  }
  function resData() {
    return { name: val('res-name'), phone: val('res-phone'), order: val('res-order-no'), test: val('res-test-name') };
  }
  function validPhone(input) {
    if (!input) return false;
    var d = String(input.value || '').replace(/\D/g, '');
    var ok = /^01\d{9}$/.test(d);
    input.classList.toggle('inp-err', !ok);
    if (!ok) {
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.focus();
    } else { input.value = d; }
    return ok;
  }
  window.handleHomeOrderSubmit = function (e) {
    e.preventDefault();
    var nameEl = document.getElementById('home-name');
    if (!nameEl.value.trim()) { nameEl.focus(); return; }
    if (!validPhone(document.getElementById('home-phone'))) return;
    var d = homeData();
    if (!d.address) d.address = '\u2014';
    if (!d.tests) d.tests = '\u0633\u064a\u062a\u0645 \u0627\u0644\u062a\u0648\u0636\u064a\u062d (\u0631\u0648\u0634\u062a\u0629 \u062c\u0627\u0647\u0632\u0629)';
    window.open(waLink(homeMsg(d)), '_blank');
  };
  window.handleResultWhatsAppSubmit = function (e) {
    e.preventDefault();
    var nameEl = document.getElementById('res-name');
    if (!nameEl.value.trim()) { nameEl.focus(); return; }
    if (!validPhone(document.getElementById('res-phone'))) return;
    var sel = document.getElementById('res-test-name');
    if (sel && sel.tagName === 'SELECT' && !sel.value) {
      sel.classList.add('inp-err'); sel.focus(); return;
    }
    if (sel) sel.classList.remove('inp-err');
    window.open(waLink(resMsg(resData())), '_blank');
  };

  /* ---------- بدء التشغيل ---------- */
  function boot() {
    hookForms();
    ['home-name', 'home-phone', 'home-address', 'home-tests'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.addEventListener('input', function () { e.classList.remove('inp-err'); });
    });
    ['res-name', 'res-phone', 'res-order-no'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.addEventListener('input', function () { e.classList.remove('inp-err'); });
    });

    getJSON('/api/public/settings').then(function (s) {
      SETTINGS = s; applySettings(s);
    }).catch(function () {});
    getJSON('/api/public/tests').then(function (arr) {
      if (Array.isArray(arr) && arr.length) {
        TESTS = arr; renderTestList(); showTestByKey(arr[0].key, null); buildResSelect(); buildHomeQuickAdd();
      }
    }).catch(function () {});
    getJSON('/api/public/promos').then(function (arr) {
      if (Array.isArray(arr) && arr.length) renderPromos(arr);
    }).catch(function () {});
    getJSON('/api/public/packages').then(function (arr) {
      if (Array.isArray(arr) && arr.length) renderPackages(arr);
    }).catch(function () {});
    getJSON('/api/public/advice').then(function (arr) {
      if (Array.isArray(arr) && arr.length) renderAdvice(arr);
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
