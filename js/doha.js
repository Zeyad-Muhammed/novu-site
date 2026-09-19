/* Doha — Digital Artist · page interactions (vanilla ES5, zero dependencies) */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function one(sel) { return document.querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  var header = one('.d-head');

  function onScrollHeader() {
    if (!header) { return; }
    if (window.scrollY > 30) { header.classList.add('scrolled'); } else { header.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  var burger = one('#dBurger');
  var navLinks = one('#dNav');
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    var closes = all('#dNav a');
    for (var ci = 0; ci < closes.length; ci++) {
      closes[ci].addEventListener('click', function () {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  var reveals = all('[data-reveal]');
  for (var r = 0; r < reveals.length; r++) {
    var d = parseInt(reveals[r].getAttribute('data-delay') || '0', 10);
    if (d > 0) { reveals[r].style.transitionDelay = (d * 110) + 'ms'; }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    for (var r2 = 0; r2 < reveals.length; r2++) { io.observe(reveals[r2]); }
  } else {
    for (var r3 = 0; r3 < reveals.length; r3++) { reveals[r3].classList.add('in'); }
  }

  var canvas = one('.d-canvas');
  if (canvas && !reduce) {
    var hoverable = true;
    try { hoverable = window.matchMedia('(hover: hover)').matches; } catch (e) {}
    if (hoverable) {
      canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        canvas.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg) translateY(-2px)';
      });
      canvas.addEventListener('mouseleave', function () {
        canvas.style.transform = '';
      });
    }
  }

  window.addEventListener('scroll', function () {
    var el = one('.d-canvas');
    if (!el || reduce) { return; }
    var rect = el.parentElement.getBoundingClientRect();
    if (rect.bottom < -80 || rect.top > window.innerHeight + 80) { return; }
    var mid = rect.top + rect.height / 2 - window.innerHeight / 2;
    el.style.translate = '0 ' + (mid * -0.06).toFixed(2) + 'px';
  }, { passive: true });

  var year = one('#dYear');
  if (year) { year.textContent = String(new Date().getFullYear()); }

  /* ---------------- Contact form ---------------- */

  var dForm = one('#dForm');
  if (dForm) {
    var RELAY = 'https://formsubmit.co/ajax/zeyadmohammed14@outlook.com';
    var RELAY_FALLBACK = 'https://formsubmit.co/zeyadmohammed14@outlook.com';
    var dResult = one('#dFormResult');

    function dMsg(text, kind) {
      if (!dResult) { return; }
      dResult.textContent = text || '';
      dResult.className = 'd-form-msg' + (kind ? ' ' + kind : '');
    }

    function emailProblem(v) {
      if (!v) { return 'Enter an email address.'; }
      var at = v.indexOf('@');
      var lastAt = v.lastIndexOf('@');
      if (at <= 0 || lastAt >= v.length - 1) { return 'This email looks incomplete.'; }
      if (at !== lastAt) { return 'Only one "@" is allowed.'; }
      var domain = v.slice(at + 1);
      if (/\s/.test(v)) { return 'Remove spaces from the address.'; }
      if (domain.indexOf('.') <= 0) { return 'The domain needs a dot (e.g. gmail.com).'; }
      return null;
    }

    function dFormErrors() {
      var name = (dForm.name.value || '').replace(/^\s+|\s+$/g, '');
      var email = (dForm.email.value || '').replace(/^\s+|\s+$/g, '');
      var msg = (dForm.message.value || '').replace(/^\s+|\s+$/g, '');
      var errors = [];
      if (name.length < 2) { errors.push('Name must be at least 2 characters.'); }
      var ep = emailProblem(email);
      if (ep) { errors.push(ep); }
      if (msg.length < 10) { errors.push('Message must be at least 10 characters.'); }
      return { errors: errors, value: { name: name, email: email, message: msg } };
    }

    dForm.addEventListener('submit', function (e) {
      var r = dFormErrors();
      if (r.errors.length) {
        e.preventDefault();
        dMsg('Please fix: ' + r.errors.join(' \u00B7 '), 'is-error');
        return;
      }
      if (typeof fetch !== 'function') {
        dForm.action = RELAY_FALLBACK;
        dForm.removeAttribute('novalidate');
        return;
      }
      e.preventDefault();
      dMsg('Sending message\u2026', 'is-pending');
      fetch(RELAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: 'Doha portfolio \u2014 new inquiry',
          _template: 'table',
          _captcha: 'false',
          name: r.value.name,
          email: r.value.email,
          type: dForm.type.value || '',
          message: r.value.message
        })
      }).then(function (res) {
        if (!res.ok) { throw new Error('relay status ' + res.status); }
        return res.json();
      }).then(function (data) {
        if (data && String(data.success).toLowerCase() === 'true') {
          dMsg('Thanks, ' + r.value.name + ' \u2014 your message is on its way to Doha.', 'is-ok');
          dForm.reset();
        } else {
          throw new Error('relay rejected the message');
        }
      }).catch(function () {
        dMsg('Sending needs the site served over HTTP. Open via start-server.ps1, not as a file.', 'is-error');
      });
    });
  }

  /* ---------------- Quick view (project presentation) ---------------- */

  var PROJECTS = [
    {
      title: 'Ember', category: 'Character Study',
      desc: 'A study in quiet power \u2014 a wandering alchemist drawn at dusk. The figure is blocked from a rough silhouette; light, fabric and the glowing amulet do the rest.',
      story: 'The piece started as a silhouette test: how much character can survive without a visible face? The amulet became the anchor \u2014 a single light source that pulls the eye before the subject does.',
      tools: ['Procreate', 'Photoshop', 'Custom brushes']
    },
    {
      title: 'Tides', category: 'Concept Environment',
      desc: 'A water spirit rendered in flowing curves. The hair is one continuous stroke family, tinted from lilac to deep violet to build depth without losing airiness.',
      story: 'The brief was \u201Cmake stillness move\u201D. Every wave in the hair follows the same rhythm as the water at her feet, so the whole image reads as a single breeze.',
      tools: ['Procreate', 'Photoshop', 'Color study']
    },
    {
      title: 'Grace', category: 'Portrait Study',
      desc: 'A quiet portrait that leans on negative space and one soft highlight to give the face its calm. Nothing is overstated; everything is placed.',
      story: 'Painted over a gradient wash, the hair mass was blocked before the face existed. By the time the features appeared, they had nowhere to hide.',
      tools: ['Procreate', 'Photoshop', 'Soft airbrush']
    },
    {
      title: 'Bloom', category: 'Editorial Illustration',
      desc: 'A bloom-spirit portrait built from symmetric stroke work: petals grow outward around a soft core while the face stays grounding and still.',
      story: '\u201CBloom\u201D is about growth as decoration. The crown of petals frames the character instead of overpowering her \u2014 the center keeps its silence.',
      tools: ['Procreate', 'Photoshop', 'Symmetry tools']
    },
    {
      title: 'Finch', category: 'Creature Design',
      desc: 'A creature study that reads as a mask first, a being second. Symmetry and orbit lines carry the mythology; the rest is negative space.',
      story: 'Designed around two glowing slits and nothing else. The horns and orbit rings arrived afterwards, to place the creature inside a world that has rules.',
      tools: ['Photoshop', 'Blender', 'Gradient maps']
    },
    {
      title: 'Lantern', category: 'Visual Development',
      desc: 'A lone walker under a violet night sky. One light source, one silhouette \u2014 everything else is empty air and mood.',
      story: 'The lantern came first as a light-paint test. The traveller was drawn afterwards to give the light a reason to exist.',
      tools: ['Blender', 'Photoshop', 'Lighting study']
    }
  ];

  var TOOL_APPS = {
    Procreate: { ab: 'Pr', c1: '#23232b', c2: '#0f0f13', fg: '#f6f6f7' },
    Photoshop: { ab: 'Ps', c1: '#001e36', c2: '#0b3664', fg: '#31a8ff' },
    Illustrator: { ab: 'Ai', c1: '#330000', c2: '#6b1a1a', fg: '#ff9a00' },
    Blender: { ab: 'Bl', c1: '#ea7600', c2: '#c75f00', fg: '#ffffff' },
    'Clip Studio Paint': { ab: 'Cs', c1: '#2c2c34', c2: '#10101a', fg: '#ffffff' }
  };
  var TOOL_GLYPHS = {
    'Custom brushes': '<path d="M13 4 l5 5 -9 9 a4 4 0 0 1 -6 -6 Z"/><circle cx="4" cy="18" r="2.2"/>',
    'Color study': '<circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/><circle cx="6.5" cy="6.5" r="1"/>',
    'Soft airbrush': '<circle cx="9" cy="13" r="4.5"/><circle cx="14" cy="11" r="3.5"/><circle cx="15" cy="15" r="3"/>',
    'Symmetry tools': '<path d="M11 5 v12"/><path d="M7 9 l4 4 -4 4"/><path d="M15 9 l-4 4 4 4"/>',
    'Gradient maps': '<path d="M5 5 h6 v6 h-6 z"/><path d="M11 11 h6 v6 h-6 z"/><path d="M9 9 l4 4"/>',
    'Lighting study': '<circle cx="10" cy="10" r="3.4"/><path d="M10 3.5 v2.4 M10 14.1 v2.4 M3.5 10 h2.4 M14.1 10 h2.4"/>',
    'Color palettes': '<circle cx="7" cy="7" r="2.8"/><circle cx="14" cy="10" r="2.8"/><circle cx="8.5" cy="15" r="2.8"/>',
    'Texturing': '<path d="M4 4 h14 v14 h-14 z"/><path d="M4 10 h14 M10 4 v16"/>'
  };
  function toolSvg(name, idx) {
    var app = TOOL_APPS[name];
    if (app) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ta' + idx + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + app.c1 + '"/><stop offset="1" stop-color="' + app.c2 + '"/></linearGradient></defs><rect width="24" height="24" rx="7" fill="url(#ta' + idx + ')"/><text x="12" y="15.5" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="11" fill="' + app.fg + '" text-anchor="middle">' + app.ab + '</text></svg>';
    }
    var g = TOOL_GLYPHS[name] || '<path d="M6 16 L11 8 l5 8 Z"/>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="tt' + idx + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs><rect width="24" height="24" rx="7" fill="url(#tt' + idx + ')"/><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + g + '</g></svg>';
  }
  function toolPill(name, idx) {
    return '<span class="d-tool"><span class="d-tool-ic">' + toolSvg(name, idx) + '</span><span class="d-tool-name">' + name + '</span></span>';
  }

  var dm = null, dmIndex = 0, dmLastFocus = null, dmClosing = false;

  function dmEls() {
    if (dm) { return dm; }
    var el = one('#dModal');
    dm = el ? {
      el: el,
      art: one('[data-dm-art]'),
      cat: one('[data-dm-cat]'),
      meta: one('[data-dm-meta]'),
      title: one('#dModalTitle'),
      desc: one('[data-dm-desc]'),
      story: one('[data-dm-storytext]'),
      tools: one('[data-dm-tools]'),
      panel: el.querySelector('.d-modal-panel')
    } : {};
    return dm;
  }

  function dmRender() {
    var m = dmEls();
    var p = PROJECTS[dmIndex];
    var figures = all('.d-piece');
    var src = figures[dmIndex] ? figures[dmIndex].querySelector('svg') : null;
    m.art.innerHTML = '';
    if (src) { m.art.appendChild(src.cloneNode(true)); }
    m.cat.textContent = p.category;
    m.meta.textContent = 'Case ' + (String(dmIndex + 1).length === 1 ? '0' : '') + (dmIndex + 1) + ' / ' + PROJECTS.length;
    m.title.textContent = p.title;
    m.desc.textContent = p.desc;
    m.story.textContent = p.story;
    var chips = '<span class="d-tools-label">Tools &amp; programs</span><div class="d-modal-chips">';
    for (var ti = 0; ti < p.tools.length; ti++) { chips += toolPill(p.tools[ti], ti); }
    m.tools.innerHTML = chips + '</div>';
  }

  function dmOpen(i) {
    var m = dmEls();
    if (!m.el || dmClosing) { return; }
    dmIndex = i;
    dmRender();
    dmLastFocus = document.activeElement;
    document.body.classList.add('d-lock');
    m.el.setAttribute('aria-hidden', 'false');
    m.el.classList.add('dm-in');
    if (m.panel) { m.panel.focus(); }
  }

  function dmClose() {
    var m = dmEls();
    if (!m.el || dmClosing) { return; }
    dmClosing = true;
    m.el.classList.remove('dm-in');
    setTimeout(function () {
      dmClosing = false;
      m.el.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('d-lock');
      if (dmLastFocus && dmLastFocus.focus) { dmLastFocus.focus(); }
    }, 240);
  }

  function dmStep(d) {
    var m = dmEls();
    dmIndex = (dmIndex + d + PROJECTS.length) % PROJECTS.length;
    dmRender();
    m.el.classList.remove('dm-swap');
    void m.el.offsetWidth;
    m.el.classList.add('dm-swap');
  }

  var dFigures = all('.d-piece');
  for (var fi = 0; fi < dFigures.length; fi++) {
    (function (f, i) {
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Open project presentation: ' + PROJECTS[i].title);
      f.addEventListener('click', function () { dmOpen(i); });
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dmOpen(i); }
      });
    })(dFigures[fi], fi);
  }

  if (one('#dModal')) {
    var closeEls = all('[data-dm-close]');
    for (var ci2 = 0; ci2 < closeEls.length; ci2++) { closeEls[ci2].addEventListener('click', dmClose); }
    var prevEls = all('[data-dm-prev]');
    for (var pi = 0; pi < prevEls.length; pi++) { prevEls[pi].addEventListener('click', function () { dmStep(-1); }); }
    var nextEls = all('[data-dm-next]');
    for (var ni = 0; ni < nextEls.length; ni++) { nextEls[ni].addEventListener('click', function () { dmStep(1); }); }
    document.addEventListener('keydown', function (e) {
      if (dmEls().el.getAttribute('aria-hidden') !== 'false') { return; }
      if (e.key === 'Escape') { dmClose(); }
      else if (e.key === 'ArrowLeft') { dmStep(-1); }
      else if (e.key === 'ArrowRight') { dmStep(1); }
    });
  }
})();