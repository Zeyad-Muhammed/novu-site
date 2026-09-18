/*
 * NOVU — UI Layer.
 * DOM construction + event wiring. Reads NovuCore only; never mutates core state.
 * ES5-compatible by design.
 */
(function () {
  'use strict';

  var core = window.NovuCore;
  if (!core) { throw new Error('NovuCore missing — load js/core.js first'); }

  function $(id) { return document.getElementById(id); }

  /* ---------------- Theme ---------------- */

  var themeToggleBtn = $('themeToggle');
  var themeState = core.themeInit((function () {
    try { return localStorage.getItem('novu-theme'); } catch (e) { return null; }
  })());

  function applyTheme(t) {
    themeState = t;
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-theme-effective', core.themeInit(t));
    themeToggleBtn.setAttribute('aria-checked', t === 'light' ? 'true' : 'false');
    themeToggleBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    try { localStorage.setItem('novu-theme', t); } catch (e) { /* persist is best-effort */ }
    core.log('info', 'theme', 'set=' + t);
  }

  themeToggleBtn.addEventListener('click', function () {
    applyTheme(core.themeToggle(themeState));
  });
  applyTheme(themeState);

  /* ---------------- Header / menu ---------------- */

  var header = $('header');
  function onScroll() {
    if (window.scrollY > 40) { header.classList.add('scrolled'); } else { header.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('burger');
  var navLinks = $('navLinks');
  burger.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target && e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ---------------- Products dropdown ---------------- */

  var navDrop = $('navDrop');
  var productsBtn = $('productsBtn');
  function closeDrop() {
    navDrop.classList.remove('open');
    productsBtn.setAttribute('aria-expanded', 'false');
  }
  productsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = navDrop.classList.toggle('open');
    productsBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) {
    if (!navDrop.contains(e.target)) { closeDrop(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrop(); }
  });

  /* ---------------- Content overlay + render ---------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  var servicesGrid = $('servicesGrid');
  var workGrid = $('workGrid');
  var marqueeTrack = $('marqueeTrack');
  var dropPanel = $('dropPanel');
  var footerProducts = $('footerProducts');

  var overlay = null;
  var current = {
    services: core.SERVICES,
    work: null,
    products: core.PRODUCTS,
    marquee: [],
    texts: {}
  };

  function setText(id, val) {
    if (val === undefined || val === null) { return; }
    var node = document.getElementById(id);
    if (node) { node.textContent = val; }
  }

  function renderServices() {
    servicesGrid.innerHTML = '';
    current.services.forEach(function (s) {
      var card = el('article', 'service');
      card.appendChild(el('span', 'num', (s.id < 10 ? '0' : '') + s.id));
      card.appendChild(el('h3', null, s.title));
      card.appendChild(el('p', null, s.desc));
      card.appendChild(el('span', 'arrow', '\u2192'));
      servicesGrid.appendChild(card);
    });
  }

  function renderWork() {
    workGrid.innerHTML = '';
    var list = current.work || core.placeholderWork();
    list.forEach(function (w) {
      var item = el('a', 'work-item');
      item.href = (w.href && w.href !== '#') ? w.href : '#work';
      item.setAttribute('aria-label', w.title + (w.placeholder ? ' — placeholder' : ''));
      var ph = el('span', 'ph');
      if (w.image) {
        var img = document.createElement('img');
        img.src = w.image;
        img.alt = w.title;
        img.className = 'ph-img';
        ph.appendChild(img);
        item.appendChild(ph);
      } else {
        var sym = document.createElement('img');
        sym.src = w.svg;
        sym.alt = '';
        sym.className = 'ph-sym';
        ph.appendChild(sym);
        item.appendChild(ph);
        item.appendChild(el('span', 'badge', 'Placeholder'));
      }
      var tag = el('div', 'tag');
      tag.appendChild(el('small', null, w.category));
      tag.appendChild(el('h3', null, w.title));
      item.appendChild(tag);
      workGrid.appendChild(item);
    });
  }

  function renderProducts() {
    dropPanel.innerHTML = '';
    current.products.forEach(function (p) {
      var a = el('a', 'drop-item');
      a.href = p.url;
      a.setAttribute('role', 'menuitem');
      var img = document.createElement('img');
      img.src = p.icon;
      img.alt = '';
      img.width = 38;
      img.height = 38;
      var span = el('span');
      span.appendChild(el('b', null, p.name));
      span.appendChild(el('small', null, p.tagline));
      a.appendChild(img);
      a.appendChild(span);
      dropPanel.appendChild(a);
    });
    footerProducts.innerHTML = '';
    footerProducts.appendChild(el('h4', null, 'Products'));
    current.products.forEach(function (p) {
      var a = el('a');
      a.href = p.url;
      a.textContent = p.name;
      footerProducts.appendChild(a);
    });
  }

  function renderMarquee() {
    if (!current.marquee.length) { return; }
    marqueeTrack.innerHTML = '';
    current.marquee.forEach(function (w) {
      marqueeTrack.appendChild(el('span', null, w));
    });
  }

  function renderTexts() {
    var t = current.texts;
    setText('heroEyebrow', t.heroEyebrow);
    setText('heroL1', t.heroL1);
    setText('heroL2', t.heroL2);
    setText('heroL3', t.heroL3);
    setText('heroSub', t.heroSub);
    setText('workNote', t.workNote);
    setText('aboutMain', t.aboutMain);
    setText('contactCopy', t.contactCopy);
    setText('footerNote', t.footerNote);
  }

  function applyOverlay(json) {
    if (!json || typeof json !== 'object') { return; }
    overlay = json;
    if (json.services && json.services.length) { current.services = json.services; }
    if (json.work && json.work.length) { current.work = json.work; }
    if (json.products && json.products.length) { current.products = json.products; }
    if (Array.isArray(json.marquee) && json.marquee.length) { current.marquee = json.marquee; }
    if (json.hero) {
      var h = json.hero;
      if (typeof h.eyebrow === 'string') { current.texts.heroEyebrow = h.eyebrow; }
      if (Array.isArray(h.lines)) {
        if (h.lines[0]) { current.texts.heroL1 = h.lines[0]; }
        if (h.lines[1]) { current.texts.heroL2 = h.lines[1]; }
        if (h.lines[2]) { current.texts.heroL3 = h.lines[2]; }
      }
      if (typeof h.sub === 'string') { current.texts.heroSub = h.sub; }
    }
    if (typeof json.workNote === 'string') { current.texts.workNote = json.workNote; }
    if (json.about && typeof json.about.main === 'string') { current.texts.aboutMain = json.about.main; }
    if (json.contact && typeof json.contact.copy === 'string') { current.texts.contactCopy = json.contact.copy; }
    if (json.footer && typeof json.footer.note === 'string') { current.texts.footerNote = json.footer.note; }
  }

  function renderAll() {
    renderServices();
    renderWork();
    renderProducts();
    renderMarquee();
    renderTexts();
    core.log('info', 'render', 'content overlay=' + (overlay ? 'applied' : 'defaults'));
  }

  function boot() {
    renderAll();
    if (typeof fetch === 'function') {
      fetch('content.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) { applyOverlay(json); renderAll(); })
        .catch(function () { core.log('warn', 'content', 'overlay load failed, using defaults'); });
    } else {
      core.log('info', 'content', 'no fetch available — built-in defaults active');
    }
  }
  boot();

  /* ---------------- Contact ---------------- */

  var form = $('contactForm');
  var result = $('formResult');

  var ENDPOINT = 'https://formsubmit.co/ajax/zeyadmohammed14@outlook.com';
  var RELAY_URL = 'https://formsubmit.co/zeyadmohammed14@outlook.com';

  /* ---------------- Attachments ---------------- */

  var fileInput = $('contactFiles');
  var fileListEl = $('fileList');
  var submitFrame = $('submitFrame');
  var selectedFiles = [];
  var MAX_COUNT = 8;
  var MAX_PER_FILE = 5 * 1024 * 1024;
  var MAX_TOTAL = 10 * 1024 * 1024;
  var ALLOWED_EXT = /\.(png|jpe?g|gif|webp|svg|pdf|docx?|txt|zip)$/i;

  function fmtSize(b) {
    return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB';
  }

  function showMsg(text, kind) {
    result.textContent = text || '';
    result.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  function renderFiles() {
    fileListEl.innerHTML = '';
    for (var i = 0; i < selectedFiles.length; i++) {
      var li = el('li', 'file-chip');
      var name = el('b', null, selectedFiles[i].name);
      var size = el('span', 'file-size', fmtSize(selectedFiles[i].size));
      var rm = el('button', 'file-remove', '\u00d7');
      rm.type = 'button';
      rm.setAttribute('data-file-index', String(i));
      rm.setAttribute('aria-label', 'Remove ' + selectedFiles[i].name);
      li.appendChild(name);
      li.appendChild(size);
      li.appendChild(rm);
      fileListEl.appendChild(li);
    }
  }

  function syncInput() {
    if (!window.DataTransfer || !fileInput.files) { return; }
    var dt = new DataTransfer();
    for (var i = 0; i < selectedFiles.length; i++) { dt.items.add(selectedFiles[i]); }
    fileInput.files = dt.files;
  }

  fileListEl.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) { return; }
    var idx = parseInt(t.getAttribute('data-file-index'), 10);
    if (!isNaN(idx) && idx >= 0 && idx < selectedFiles.length) {
      selectedFiles.splice(idx, 1);
      renderFiles();
      syncInput();
      showMsg('');
    }
  });

  fileInput.addEventListener('change', function () {
    var incoming = Array.prototype.slice.call(fileInput.files || []);
    var problems = [];
    var total = 0;
    for (var i = 0; i < selectedFiles.length; i++) { total += selectedFiles[i].size; }
    for (var j = 0; j < incoming.length; j++) {
      var f = incoming[j];
      if (!ALLOWED_EXT.test(f.name)) { problems.push('"' + f.name + '" not an allowed type'); continue; }
      if (f.size > MAX_PER_FILE) { problems.push('"' + f.name + '" exceeds 5 MB'); continue; }
      if (selectedFiles.length >= MAX_COUNT) { problems.push('max 8 files'); break; }
      if (total + f.size > MAX_TOTAL) { problems.push('total exceeds 10 MB'); break; }
      selectedFiles.push(f);
      total += f.size;
    }
    renderFiles();
    syncInput();
    if (problems.length) { showMsg('Files: ' + problems.join(' \u00b7 '), 'is-error'); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = core.validateContact({
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    });
    if (!r.ok) {
      var parts = [];
      var keys = Object.keys(r.errors);
      for (var i = 0; i < keys.length; i++) { parts.push('- ' + r.errors[keys[i]]); }
      result.textContent = 'Please fix: ' + parts.join(' ');
      result.className = 'form-msg is-error';
      core.log('warn', 'contact', 'validation failed ' + JSON.stringify(r.errors));
      return;
    }

    if (selectedFiles.length) {
      var attached = selectedFiles.length;
      showMsg('Sending message + ' + attached + ' attachment(s)\u2026', 'is-pending');
      form.enctype = 'multipart/form-data';
      form.target = 'novu-submit-frame';
      var finalized = false;
      function done() {
        if (finalized) { return; }
        finalized = true;
        showMsg('Thanks, ' + r.value.name + ' \u2014 message with ' + attached + ' attachment(s) sent to NOVU.', 'is-ok');
        form.reset();
        form.removeAttribute('enctype');
        form.removeAttribute('target');
        selectedFiles = [];
        renderFiles();
        core.log('info', 'contact', 'sent attachments=' + attached + ' name=' + r.value.name);
      }
      submitFrame.addEventListener('load', done);
      window.setTimeout(done, 6000);
      form.submit();
      return;
    }

    var payload = {
      name: r.value.name,
      email: r.value.email,
      company: (form.company && form.company.value) ? form.company.value : '',
      message: r.value.message
    };

    function onSuccess() {
      result.textContent = 'Thanks, ' + r.value.name + ' — message sent to NOVU.';
      result.className = 'form-msg is-ok';
      form.reset();
      core.log('info', 'contact', 'sent name=' + r.value.name);
    }

    if (typeof fetch === 'function') {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) { throw new Error('relay status ' + res.status); }
        return res.json();
      }).then(function (data) {
        if (data && String(data.success).toLowerCase() === 'true') {
          onSuccess();
        } else {
          throw new Error((data && data.message) || 'relay rejected submission');
        }
      })
        .catch(function (err) {
          core.log('error', 'contact', 'relay failed: ' + err.message);
          result.textContent = 'Sending needs the site served over HTTP (open via start-server.ps1, not as a file). Please try again from http://localhost:8080.';
          result.className = 'form-msg is-error';
        });
    } else {
      form.action = RELAY_URL;
      form.submit();
    }
  });

  /* ---------------- Footer year ---------------- */

  $('year').textContent = String(new Date().getFullYear());

  /* ---------------- Reveal on scroll ---------------- */

  var revealEls = document.querySelectorAll('.reveal');
  function revealAll() {
    for (var i = 0; i < revealEls.length; i++) { revealEls[i].classList.add('visible'); }
  }
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    for (var i = 0; i < revealEls.length; i++) { observer.observe(revealEls[i]); }
  } else {
    revealAll();
  }

  /* ---------------- Self-test hook ---------------- */

  if (/[?&]self-test/.test(window.location.search)) {
    var out = el('pre', 'self-report');
    var tests = core.selfTest();
    var passed = 0;
    for (var i = 0; i < tests.length; i++) {
      if (tests[i].pass) { passed++; }
      out.textContent += (tests[i].pass ? 'PASS  ' : 'FAIL  ') + tests[i].name +
        (tests[i].error ? ' — ' + tests[i].error : '') + '\n';
    }
    out.textContent += '\n' + passed + '/' + tests.length + ' passed';
    core.log(passed === tests.length ? 'info' : 'error', 'selfTest', passed + '/' + tests.length + ' passed');
    document.body.appendChild(out);
  }
})();
