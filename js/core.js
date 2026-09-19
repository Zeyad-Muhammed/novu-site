/*
 * NOVU — Core Domain.
 * Pure logic + data, no DOM. UMD export (browser window + Node).
 * ES5-compatible by design (zero-dependency constraint).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) { root.NovuCore = api; }
})(typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : this), function () {
  'use strict';

  /* ---------------- Data ---------------- */

  var BRAND = 'NOVU';

  var SERVICES = [
    { id: 1, title: 'Graphic Design',      desc: 'Editorial design, posters, social systems and print-ready creative assets.' },
    { id: 2, title: 'Visual Identity',     desc: 'Cohesive identity systems — color, type, grids and guidelines built to last.' },
    { id: 3, title: 'Branding',            desc: 'Brand strategy and expression that position you clearly in your market.' },
    { id: 4, title: 'UI/UX Design',        desc: 'Interfaces and experiences shaped by research, flows and pixel-precise design.' },
    { id: 5, title: 'Web Design',          desc: 'Responsive, accessible website design that reflects the brand and converts.' },
    { id: 6, title: 'Front-End Development', desc: 'Clean, fast, maintainable code — turning approved design into production builds.' }
  ];

  var PRODUCTS = [
    { name: 'Habit Flow', tagline: 'Habits \u00B7 Streaks \u00B7 Levels', url: 'products/habitflow.html', icon: 'assets/products/habitflow/icon.png' },
    { name: 'Itisam \u2014 \u0627\u0639\u062A\u0635\u0627\u0645', tagline: 'Quran \u00B7 Athkar \u00B7 Tasbih', url: 'products/itisam.html', icon: 'assets/products/itisam/icon.png' },
    { name: 'Hafiz \u2014 \u062D\u0627\u0641\u0638', tagline: 'Vault \u00B7 2FA \u00B7 Autofill', url: 'hafiz/', icon: 'assets/products/hafiz/icon.png?v=3' }
  ];

  var COLLABORATIONS = [
    { name: 'Doha', tagline: 'Digital Artist', url: 'collaboration/doha/', icon: 'assets/collaboration/doha.svg' }
  ];

  /* Placeholder visuals — replace with real project assets when available. */
  var WORK_CATEGORIES = ['Branding', 'Visual Identity', 'UI/UX', 'Web Design', 'Development', 'Graphic Design'];

  function art(category) {
    var symbol = {
      'Branding': '\u25C6',
      'Visual Identity': '\u2295',
      'UI/UX': '\u25D0',
      'Web Design': '\u2691',
      'Development': '\u003C/\u003E',
      'Graphic Design': '\u2736'
    }[category] || '\u25CB';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">' +
      '<text x="300" y="430" font-size="96" font-weight="bold" font-family="Georgia, serif" text-anchor="middle" fill="rgba(160,160,160,0.28)">' + symbol + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  function placeholderWork() {
    return WORK_CATEGORIES.map(function (cat, i) {
      return {
        id: i + 1,
        title: cat + ' — Case Study ' + (i + 1),
        category: cat,
        placeholder: true,
        svg: art(cat)
      };
    });
  }

  /* ---------------- Theme ---------------- */

  function themeInit(stored) {
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  }

  function themeToggle(current) {
    return current === 'dark' ? 'light' : 'dark';
  }

  /* ---------------- Contact validation ---------------- */

  function emailProblem(email) {
    if (!email) { return 'Enter your email address.'; }
    var at = email.indexOf('@');
    var lastAt = email.lastIndexOf('@');
    if (at <= 0 || lastAt >= email.length - 1) { return 'The address is missing a valid "@" placement.'; }
    if (at !== lastAt) { return 'Only one "@" is allowed.'; }
    var local = email.slice(0, at);
    var domain = email.slice(at + 1);
    if (/\s/.test(local) || /\s/.test(domain)) { return 'Remove spaces from the address.'; }
    if (domain.indexOf('.') <= 0) { return 'The domain needs a dot (e.g. gmail.com).'; }
    return null;
  }

  function validateContact(input) {
    var errors = {};
    var name = (input.name || '').replace(/^\s+|\s+$/g, '');
    var email = (input.email || '').replace(/^\s+|\s+$/g, '');
    var message = (input.message || '').replace(/^\s+|\s+$/g, '');
    if (name.length < 2) { errors.name = 'Name must be at least 2 characters.'; }
    var ep = emailProblem(email);
    if (ep) { errors.email = ep; }
    if (message.length < 10) { errors.message = 'Message must be at least 10 characters.'; }
    return { ok: Object.keys(errors).length === 0, errors: errors, value: { name: name, email: email, message: message } };
  }

  /* ---------------- Safe logging (async, non-blocking) ---------------- */

  var LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
  var threshold = LEVELS.info;
  var queue = [];

  function setLevel(name) { if (LEVELS[name] !== undefined) { threshold = LEVELS[name]; } }

  function flush() {
    var item = queue.shift();
    try {
      var line = '[NOVU][' + item.level + '][' + item.ctx + '] ' + item.message;
      if (item.level === 'error') { console.error(line, item.extra); }
      else if (item.level === 'warn') { console.warn(line, item.extra); }
      else { console.log(line, item.extra === undefined ? '' : item.extra); }
    } catch (e) { /* logging must never throw */ }
    if (queue.length) { setTimeout(flush, 0); }
  }

  function log(level, ctx, message, extra) {
    if (LEVELS[level] === undefined) { level = 'info'; }
    if (LEVELS[level] < threshold) { return; }
    queue.push({ level: level, ctx: ctx, message: message, extra: extra });
    if (queue.length === 1) { setTimeout(flush, 0); }
  }

  /* ---------------- Self-test ---------------- */

  function selfTest() {
    var results = [];
    function check(name, fn) {
      try { results.push({ name: name, pass: !!fn(), error: '' }); }
      catch (e) { results.push({ name: name, pass: false, error: String((e && e.message) || e) }); }
    }

    check('brand name is N-O-V-U', function () { return BRAND === 'NOVU' && BRAND.length === 4; });
    check('services = 6', function () { return SERVICES.length === 6; });
    check('services have unique ids', function () {
      var seen = {}, i;
      for (i = 0; i < SERVICES.length; i++) { if (seen[SERVICES[i].id]) { return false; } seen[SERVICES[i].id] = 1; }
      return true;
    });
    check('work categories = 6', function () { return WORK_CATEGORIES.length === 6; });
    check('placeholderWork returns 6 placeholders', function () {
      var w = placeholderWork();
      return w.length === 6 && w[0].placeholder === true && !!w[0].svg;
    });
    check('themeInit defaults to dark', function () { return themeInit(null) === 'dark'; });
    check('themeInit preserves light', function () { return themeInit('light') === 'light'; });
    check('themeToggle flips dark→light→dark', function () {
      return themeToggle('dark') === 'light' && themeToggle('light') === 'dark';
    });
    check('validate empty reports all errors', function () {
      var r = validateContact({ name: '', email: '', message: '' });
      return !r.ok && r.errors.name && r.errors.email && r.errors.message;
    });
    check('validate valid passes', function () {
      return validateContact({ name: 'NOVU', email: 'hello@novu.studio', message: 'I would like to start a project' }).ok;
    });
    check('validate bad email rejected', function () {
      return !!validateContact({ name: 'NOVU', email: 'bad', message: 'I would like to start a project' }).errors.email;
    });
    check('validate real outlook email passes', function () {
      return validateContact({ name: 'NOVU', email: 'zeyadmohammed14@outlook.com', message: 'I would like to start a project' }).ok;
    });
    check('validate plus-tagged email passes', function () {
      return validateContact({ name: 'NOVU', email: 'user.name+tag@gmail.com', message: 'I would like to start a project' }).ok;
    });
    check('validate email with space gives clear reason', function () {
      var ep = validateContact({ name: 'NOVU', email: 'novu @gmail.com', message: 'I would like to start a project' }).errors.email;
      return ep && ep.indexOf('spaces') !== -1;
    });
    check('validate email without dot rejected', function () {
      return !!validateContact({ name: 'NOVU', email: 'novu@outlook', message: 'I would like to start a project' }).errors.email;
    });
    check('logger enqueues without throwing', function () { log('error', 'selfTest', 'probe'); return true; });
    return results;
  }

  return {
    BRAND: BRAND,
    SERVICES: SERVICES,
    PRODUCTS: PRODUCTS,
    COLLABORATIONS: COLLABORATIONS,
    WORK_CATEGORIES: WORK_CATEGORIES,
    placeholderWork: placeholderWork,
    themeInit: themeInit,
    themeToggle: themeToggle,
    validateContact: validateContact,
    log: log,
    setLevel: setLevel,
    selfTest: selfTest
  };
});