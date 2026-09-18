/*
 * NOVU Admin — hidden site controls.
 * Best-effort client-side gate (disclosed), token check, draft editor, content.json export.
 * Zero dependencies, ES5.
 */
(function () {
  'use strict';

  var core = window.NovuCore;
  if (!core) { throw new Error('NovuCore missing — load js/core.js first'); }

  var TOKEN_HASH = 'a091b956c4d45dbaa101d43e7f99bf0f81cf5e5b3335731152c6aa7982c6a644';

  var AUTH_FLAG = 'novu-admin-auth';
  var ATTEMPT_KEY = 'novu-admin-attempts';
  var DRAFT_KEY = 'novu-admin-draft';
  var MAX_FAILS = 5;
  var LOCK_MS = 15 * 60 * 1000;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------------- Theme (mirrors the site) ---------------- */

  var themeBtn = $('themeToggle');
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-checked', t === 'light' ? 'true' : 'false');
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    try { localStorage.setItem('novu-theme', t); } catch (e) {}
  }
  var storedTheme = null;
  try { storedTheme = localStorage.getItem('novu-theme'); } catch (e) {}
  applyTheme(core.themeInit(storedTheme));
  themeBtn.addEventListener('click', function () {
    applyTheme(core.themeToggle(document.documentElement.getAttribute('data-theme')));
  });

  /* ---------------- Crypto helpers ---------------- */

  function sha256Hex(text) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        var bytes = new Uint8Array(buf);
        var hex = '';
        for (var i = 0; i < bytes.length; i++) { hex += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16); }
        return hex;
      });
    }
    return Promise.reject(new Error('WebCrypto unavailable — open via http(s) or localhost'));
  }

  function constTimeEq(a, b) {
    if (a.length !== b.length) { return false; }
    var diff = 0;
    for (var i = 0; i < a.length; i++) { diff |= a.charCodeAt(i) ^ b.charCodeAt(i); }
    return diff === 0;
  }

  /* ---------------- Attempts + lockout ---------------- */

  function readAttempts() {
    try {
      var raw = localStorage.getItem(ATTEMPT_KEY);
      return raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 };
    } catch (e) { return { count: 0, lockUntil: 0 }; }
  }
  function writeAttempts(a) { try { localStorage.setItem(ATTEMPT_KEY, JSON.stringify(a)); } catch (e) {} }
  function gateMsg(text, kind) {
    var m = $('gateMsg');
    m.textContent = text || '';
    m.className = 'gate-msg' + (kind ? ' ' + kind : '');
  }

  function doLogin() {
    if (TOKEN_HASH === 'set-me') { gateMsg('Admin is not configured yet — run admin/make-credentials.ps1 to set a token.', 'is-error'); return; }
    var now = Date.now();
    var att = readAttempts();
    if (att.lockUntil > now) {
      var mins = Math.ceil((att.lockUntil - now) / 60000);
      gateMsg('Too many failed attempts. Retry in ' + mins + ' min.', 'is-error');
      return;
    }
    var token = $('tokenInput').value;
    $('loginBtn').disabled = true;
    sha256Hex(token).then(function (hex) {
      if (constTimeEq(hex, TOKEN_HASH)) {
        att.count = 0; writeAttempts(att);
        try { sessionStorage.setItem(AUTH_FLAG, '1'); } catch (e) {}
        showDash();
        core.log('info', 'admin', 'authenticated');
      } else {
        $('tokenInput').value = '';
        att.count += 1;
        if (att.count >= MAX_FAILS) { att.lockUntil = now + LOCK_MS; att.count = 0; }
        writeAttempts(att);
        gateMsg('Incorrect token (' + att.count + '/' + MAX_FAILS + ' attempts).', 'is-error');
        core.log('warn', 'admin', 'login failed');
      }
    }).catch(function (err) {
      gateMsg(err.message, 'is-error');
    }).then(function () {
      $('loginBtn').disabled = false;
      $('tokenInput').focus();
    });
  }

  $('loginForm').addEventListener('submit', function (e) { e.preventDefault(); doLogin(); });

  /* ---------------- Content model ---------------- */

  function defaultContent() {
    return {
      meta: { version: 1, note: 'Editable content for the NOVU website. Edit via admin.html' },
      hero: {
        eyebrow: 'Creative & Digital Studio',
        lines: ['NOVU —', 'Design that', 'moves.'],
        sub: 'A creative and digital studio shaping brands, interfaces and experiences — from identity and visual design to web design and front-end development.'
      },
      marquee: [
        'Graphic Design', '—', 'Visual Identity', '—', 'Branding', '—',
        'UI/UX Design', '—', 'Web Design', '—', 'Development', '—',
        'Graphic Design', '—', 'Visual Identity', '—', 'Branding', '—',
        'UI/UX Design', '—', 'Web Design', '—', 'Development', '—'
      ],
      services: core.SERVICES.map(function (s) { return { id: s.id, title: s.title, desc: s.desc }; }),
      workNote: 'Portfolio slots are ready. Replace placeholder visuals with real project assets when available.',
      work: [],
      about: { main: 'NOVU is a creative and digital studio working at the intersection of design and technology.' },
      contact: { copy: 'Prefer email or a structured handover? Use the full Client Brief file to send everything upfront — identity, website and UI inputs in one message.' },
      products: core.PRODUCTS.map(function (p) { return { name: p.name, tagline: p.tagline, url: p.url, icon: p.icon }; }),
      footer: { note: 'Creative & digital studio — design, identity and front-end development.' }
    };
  }

  var content = defaultContent();
  var draft = null;
  var activeTab = 'text';

  function readDraft() {
    try { var raw = localStorage.getItem(DRAFT_KEY); draft = raw ? JSON.parse(raw) : null; } catch (e) { draft = null; }
  }
  function writeDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(content)); } catch (e) {}
    readDraft();
    updateDraftState();
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    readDraft();
    updateDraftState();
  }
  function updateDraftState() {
    var el = $('draftState');
    if (el) { el.textContent = draft ? 'saved just now' : 'none'; }
  }

  function sanitize(v) {
    if (typeof v === 'string') { return v; }
    if (typeof v === 'number') { return v; }
    return v == null ? '' : String(v);
  }

  /* ---------------- Editor rendering ---------------- */

  function bindSave(btnId, hintId, build) {
    $(btnId).addEventListener('click', function () {
      build();
      writeDraft();
      var h = $(hintId);
      if (h) { h.textContent = 'Saved to local draft.'; setTimeout(function () { h.textContent = ''; }, 1800); }
    });
  }

  function renderText() {
    var h = content.hero || {};
    $('f-eyebrow').value = h.eyebrow || '';
    $('f-line1').value = (h.lines && h.lines[0]) || '';
    $('f-line2').value = (h.lines && h.lines[1]) || '';
    $('f-line3').value = (h.lines && h.lines[2]) || '';
    $('f-sub').value = h.sub || '';
    $('f-workNote').value = content.workNote || '';
    $('f-aboutMain').value = (content.about && content.about.main) || '';
    $('f-contactCopy').value = (content.contact && content.contact.copy) || '';
    $('f-footerNote').value = (content.footer && content.footer.note) || '';
    $('f-marquee').value = (content.marquee || []).join('\n');
  }

  function collectText() {
    content.hero = content.hero || {};
    content.hero.eyebrow = sanitize($('f-eyebrow').value);
    content.hero.lines = [$('f-line1').value, $('f-line2').value, $('f-line3').value];
    content.hero.sub = sanitize($('f-sub').value);
    content.workNote = sanitize($('f-workNote').value);
    content.about = content.about || {};
    content.about.main = sanitize($('f-aboutMain').value);
    content.contact = content.contact || {};
    content.contact.copy = sanitize($('f-contactCopy').value);
    content.footer = content.footer || {};
    content.footer.note = sanitize($('f-footerNote').value);
    content.marquee = $('f-marquee').value.split('\n').map(function (s) { return s.replace(/^\s+|\s+$/g, ''); }).filter(function (s) { return s.length > 0; });
    content.hero.lines = content.hero.lines.map(function (s) { return sanitize(s); });
  }

  function renderServices() {
    var box = $('rows-services');
    box.innerHTML = '';
    (content.services || []).forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'row-card';
      row.innerHTML =
        '<div class="rc-top"><span class="rc-title">Service ' + (i + 1) + '</span>' +
        '<button type="button" data-rm="service" data-idx="' + i + '">Remove</button></div>' +
        '<div class="grp tight">' +
        '<label>id <input type="text" data-f="id" value="' + esc(s.id) + '" /></label>' +
        '<label>title <input type="text" data-f="title" value="' + esc(s.title) + '" /></label>' +
        '<label>desc <input type="text" data-f="desc" value="' + esc(s.desc) + '" /></label>' +
        '</div>';
      box.appendChild(row);
    });
  }
  function collectServices() {
    content.services = [];
    var rows = $('rows-services').querySelectorAll('.row-card');
    for (var i = 0; i < rows.length; i++) {
      var id = parseInt(rows[i].querySelector('[data-f="id"]').value, 10);
      content.services.push({
        id: isNaN(id) ? content.services.length + 1 : id,
        title: rows[i].querySelector('[data-f="title"]').value,
        desc: rows[i].querySelector('[data-f="desc"]').value
      });
    }
  }

  function renderWork() {
    var box = $('rows-work');
    box.innerHTML = '';
    (content.work || []).forEach(function (w, i) {
      var row = document.createElement('div');
      row.className = 'row-card';
      row.innerHTML =
        '<div class="rc-top"><span class="rc-title">Work item ' + (i + 1) + '</span>' +
        '<button type="button" data-rm="work" data-idx="' + i + '">Remove</button></div>' +
        '<div class="grp">' +
        '<label>title <input type="text" data-f="title" value="' + esc(w.title) + '" /></label>' +
        '<label>category <input type="text" data-f="category" value="' + esc(w.category) + '" /></label>' +
        '</div>' +
        '<div class="grp">' +
        '<label>image path (empty = placeholder) <input type="text" data-f="image" value="' + esc(w.image || '') + '" /></label>' +
        '<label>link (optional) <input type="text" data-f="href" value="' + esc(w.href || '') + '" /></label>' +
        '</div>' +
        '<p class="row-mini">Put uploaded images under assets/portfolio/ and reference them as assets/portfolio/name.png</p>';
      box.appendChild(row);
    });
  }
  function collectWork() {
    content.work = [];
    var rows = $('rows-work').querySelectorAll('.row-card');
    for (var i = 0; i < rows.length; i++) {
      var title = rows[i].querySelector('[data-f="title"]').value;
      if (!title) { continue; }
      var image = rows[i].querySelector('[data-f="image"]').value;
      var item = {
        title: title,
        category: rows[i].querySelector('[data-f="category"]').value,
        image: image || undefined,
        href: rows[i].querySelector('[data-f="href"]').value || undefined
      };
      content.work.push(item);
    }
  }

  function renderProducts() {
    var box = $('rows-products');
    box.innerHTML = '';
    (content.products || []).forEach(function (p, i) {
      var row = document.createElement('div');
      row.className = 'row-card';
      row.innerHTML =
        '<div class="rc-top"><span class="rc-title">' + esc(p.name) + '</span>' +
        '<button type="button" data-rm="product" data-idx="' + i + '">Remove</button></div>' +
        '<div class="grp">' +
        '<label>name <input type="text" data-f="name" value="' + esc(p.name) + '" /></label>' +
        '<label>tagline <input type="text" data-f="tagline" value="' + esc(p.tagline) + '" /></label>' +
        '</div>' +
        '<div class="grp">' +
        '<label>url <input type="text" data-f="url" value="' + esc(p.url) + '" /></label>' +
        '<label>icon path <input type="text" data-f="icon" value="' + esc(p.icon) + '" /></label>' +
        '</div>';
      box.appendChild(row);
    });
  }
  function collectProducts() {
    content.products = [];
    var rows = $('rows-products').querySelectorAll('.row-card');
    for (var i = 0; i < rows.length; i++) {
      var name = rows[i].querySelector('[data-f="name"]').value;
      if (!name) { continue; }
      content.products.push({
        name: name,
        tagline: rows[i].querySelector('[data-f="tagline"]').value,
        url: rows[i].querySelector('[data-f="url"]').value,
        icon: rows[i].querySelector('[data-f="icon"]').value
      });
    }
  }

  function rerenderRowBoxes() {
    renderServices();
    renderWork();
    renderProducts();
  }

  function addRow(kind) {
    if (kind === 'service') { content.services = content.services || []; content.services.push({ id: (content.services.length + 1), title: 'New service', desc: '' }); }
    if (kind === 'work') { content.work = content.work || []; content.work.push({ title: 'New project', category: 'Branding' }); }
    if (kind === 'product') { content.products = content.products || []; content.products.push({ name: 'New product', tagline: '', url: 'products/.html', icon: '' }); }
    rerenderRowBoxes();
  }

  document.addEventListener('click', function (e) {
    var b = e.target;
    if (!b || !b.getAttribute) { return; }
    var rm = b.getAttribute('data-rm');
    var idx = parseInt(b.getAttribute('data-idx'), 10);
    if (rm && !isNaN(idx)) {
      var list = rm === 'service' ? content.services : rm === 'work' ? content.work : rm === 'product' ? content.products : null;
      if (list) { list.splice(idx, 1); rerenderRowBoxes(); }
    }
  });

  $('add-service').addEventListener('click', function () { addRow('service'); });
  $('add-work').addEventListener('click', function () { addRow('work'); });
  $('add-product').addEventListener('click', function () { addRow('product'); });

  bindSave('save-text', 'saved-text', collectText);
  bindSave('save-services', 'saved-services', collectServices);
  bindSave('save-work', 'saved-work', collectWork);
  bindSave('save-products', 'saved-products', collectProducts);

  /* ---------------- Export ---------------- */

  function buildJson() {
    collectText();
    collectServices();
    collectWork();
    collectProducts();
    content.meta = { version: 1, note: 'Editable content for the NOVU website. Edited via admin.html' };
    return JSON.stringify(content, null, 2);
  }

  $('export-json').addEventListener('click', function () {
    var json = buildJson();
    writeDraft();
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  });

  $('copy-json').addEventListener('click', function () {
    var json = buildJson();
    writeDraft();
    var ta = document.createElement('textarea');
    ta.value = json;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    var out = $('copyResult');
    out.textContent = ok ? 'Copied — paste it into content.json and push.' : 'Copy failed — use the download button instead.';
    out.className = 'gate-msg ' + (ok ? 'is-ok' : 'is-error');
  });

  $('discard-draft').addEventListener('click', function () {
    clearDraft();
    loadPublished();
  });

  /* ---------------- Tabs ---------------- */

  var tabs = $('dashTabs').querySelectorAll('button');
  function showTab(name) {
    activeTab = name;
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute('data-tab') === name;
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      var panel = $('tab-' + tabs[i].getAttribute('data-tab'));
      panel.setAttribute('data-active', on ? 'true' : 'false');
    }
  }
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { showTab(this.getAttribute('data-tab')); });
  }

  /* ---------------- Load + boot ---------------- */

  function loadPublished() {
    if (typeof fetch === 'function') {
      fetch('content.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) {
          if (json && typeof json === 'object') { content = json; }
          readDraft();
          if (draft && typeof draft === 'object') { content = draft; }
          rerenderRowBoxes();
          renderText();
        })
        .catch(function () {
          readDraft();
          if (draft && typeof draft === 'object') { content = draft; }
          rerenderRowBoxes();
          renderText();
        });
    } else {
      readDraft();
      if (draft && typeof draft === 'object') { content = draft; }
      rerenderRowBoxes();
      renderText();
    }
  }

  function showDash() {
    $('gate').style.display = 'none';
    $('dash').hidden = false;
    $('logoutBtn').hidden = false;
    updateDraftState();
    loadPublished();
    showTab(activeTab);
  }

  $('logoutBtn').addEventListener('click', function () {
    try { sessionStorage.removeItem(AUTH_FLAG); } catch (e) {}
    $('dash').hidden = true;
    $('logoutBtn').hidden = true;
    $('gate').style.display = '';
    $('tokenInput').value = '';
  });

  var authed = false;
  try { authed = sessionStorage.getItem(AUTH_FLAG) === '1'; } catch (e) {}
  if (authed) { showDash(); }
})();