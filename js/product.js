/*
 * NOVU — Product pages engine.
 * Scroll-driven showcase: pinned 3D scenes, reveals, tilt, counters, parallax.
 * Vanilla ES5, zero dependencies. Shared by every NOVU product page.
 */
(function () {
  'use strict';

  document.documentElement.classList.add('pfjs');

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hoverable = true;
  try { hoverable = window.matchMedia('(hover: hover)').matches; } catch (e) {}

  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function easeOutCubic(k) { return 1 - Math.pow(1 - k, 3); }

  /* ---------------- Language (EN / AR) ---------------- */

  var I18N = {
    en: {
      'meta.title': 'Habit Flow — عاداتك | A NOVU Product',
      'nav.tour': 'Tour', 'nav.levels': 'Levels', 'nav.stats': 'Stats', 'nav.screens': 'Screens',
      'back': 'NOVU Studio &larr;',
      'hero.eyebrow': 'A NOVU Product &middot; Mobile App',
      'hero.title': 'Habit <span class="grad-text">Flow</span>',
      'hero.ar': 'عاداتك',
      'hero.sub': 'Build habits that stick. <strong>Daily targets, streaks, XP levels and honest stats</strong> — in one calm, dark-first app. Arabic-first, English-ready, fully offline.',
      'hero.cta1': 'Explore the Tour', 'hero.cta2': 'Get a Similar App',
      'dl.nav': 'Get the App',
      'dl.btn': 'Download the App',
      'dl.title': 'Almost there — finish the setup',
      'dl.sub': 'The download has started. Since Habit Flow isn\'t on Google Play yet, follow these 4 quick steps:',
      'dl.s1h': 'Open the downloaded file',
      'dl.s1p': 'Pull down your notifications and tap the Habit Flow file (or find it in your Downloads folder).',
      'dl.s2h': 'Allow unknown apps',
      'dl.s2p': 'Your phone asks for permission to install from your browser. Tap Settings → Allow from this source → go back.',
      'dl.s3h': 'Install & keep going',
      'dl.s3p': 'Tap Install. If Google Play Protect shows a warning, choose More details → Install anyway. The app is safe and fully offline.',
      'dl.s4h': 'Sign in & start your streak',
      'dl.s4p': 'Create your account in seconds, log in, and your streak starts today.',
      'dl.meta': 'Android only &middot; 56 MB &middot; works fully offline',
      'dl.again': 'Download again',
      'dl.done': 'Done',
      'dl.close': 'Close',
      'hint': 'Scroll',
      'fc1': '<span>&#128293; 12-day streak</span>',
      'fc2': '<span>Level 4 &middot; 690 XP</span>',
      'fc3': '<span>&#10003; 53 completed</span>',
      's1.idx': '01 / THE DAY',
      's1.h': 'Your day, one screen',
      's1.p': 'A greeting, a completion ring, today\'s XP and every habit target — no tabs to dig through. The whole day, calm at a glance.',
      's2.idx': '02 / THE CHECK-IN',
      's2.h': 'Check in, in seconds',
      's2.p': 'One tap logs a habit. Measurable goals get precise dialogs — pages read, cups of water, minutes of focus.',
      's3.idx': '03 / THE STREAK',
      's3.h': 'Keep the chain alive',
      's3.p': 'Streak cards with a flame that grows as you show up — plus your best streak on record. Momentum, without the guilt.',
      'lv.eyebrow': 'Gamified, not childish',
      'lv.h': 'Every check-in levels you up',
      'lv.p': 'Habit Flow scores your consistency like a game worth playing. Completions earn <strong>XP</strong>, XP fills the level bar, and milestones unlock <strong>badges with a real celebration</strong> — a small reward loop that keeps you coming back tomorrow.',
      'lv.b1': 'XP on every completion — instant feedback',
      'lv.b2': 'Level-up badge moments worth celebrating',
      'lv.b3': 'Progress to the next level, always visible',
      'st.eyebrow': 'Numbers that motivate',
      'st.h': 'Stats that keep you honest',
      'st.p': 'A weekly rhythm chart, a 12-month heatmap of every single day, best-day highlights and per-habit breakdowns — the truth, streaks and slumps alike.',
      'lbl1': 'Best streak &middot; days',
      'lbl2': 'Total completions',
      'lbl3': 'Monthly completion',
      'lbl4': 'XP earned &middot; Level 5',
      'ga.eyebrow': 'Every screen',
      'ga.h': 'Designed to disappear',
      'ga.p': 'The interface stays out of the way — so the only thing you think about is the habit itself.',
      'cap1': 'Habits', 'cap2': 'New Habit', 'cap3': 'Heatmap', 'cap4': 'Habit Flow Pro',
      'sp1': 'Flutter', 'sp2': 'Offline-first', 'sp3': 'العربية + English', 'sp4': 'Dark & Light',
      'sp5': 'Local notifications', 'sp6': 'Home widget', 'sp7': 'Gamified XP', 'sp8': '12-month heatmap',
      'end.name': 'Habit Flow', 'end.nameAr': 'عاداتك',
      'end.h': 'Want an app<br />like this?',
      'end.p': 'NOVU designs and builds complete mobile products — identity, UI and the working app itself. Tell us what you imagine.',
      'end.btn': 'Start a Project',
      'ft.brand': 'Habit Flow (عاداتك) — designed & built by NOVU.',
      'ft.l1': 'Studio', 'ft.l2': 'Tour', 'ft.l3': 'Screens',
      'ft.copy': '&copy; <span id="pfYear"></span> NOVU — All rights reserved.'
    },
    ar: {
      'meta.title': 'عاداتك — Habit Flow | منتج من NOVU',
      'nav.tour': 'الجولة', 'nav.levels': 'المستويات', 'nav.stats': 'الإحصائيات', 'nav.screens': 'الشاشات',
      'back': 'استوديو NOVU &rarr;',
      'hero.eyebrow': 'منتج من استوديو NOVU &middot; تطبيق موبايل',
      'hero.title': '<span class="grad-text">عاداتك</span>',
      'hero.ar': 'Habit Flow',
      'hero.sub': 'ابنِ عادات تدوم. <strong>أهداف يومية، سلاسل إنجاز، نقاط XP ومستويات، وإحصائيات صادقة</strong> — في تطبيق هادئ داكن الواجهة. عربي أولًا، وإنجليزي كمان، وبيشتغل أوفلاين بالكامل.',
      'hero.cta1': 'استكشف الجولة', 'hero.cta2': 'اطلب تطبيقًا مشابهًا',
      'dl.nav': 'حمّل التطبيق',
      'dl.btn': 'حمّل التطبيق',
      'dl.title': 'خطوة واحدة وتخلّص — ظبّط التسطيب',
      'dl.sub': 'التحميل بدأ. ولإن عاداتك لسه مش على جوجل بلاي، امشي على ٤ خطوات سريعة:',
      'dl.s1h': 'افتح الملف اللي اتحمّل',
      'dl.s1p': 'انزل من الإشعارات ودوس على ملف عاداتك (أو دور عليه في فولدر Downloads).',
      'dl.s2h': 'اسمح بالتثبيت من مصدر غير معروف',
      'dl.s2p': 'الموبايل هيطلب تصريح للتثبيت من المتصفح. افتح الإعدادات ← اسمح من هذا المصدر ← ارجع.',
      'dl.s3h': 'ثبّت وكمل',
      'dl.s3p': 'دوس تثبيت. ولو Google Play Protect وراك تحذير، اختار تفاصيل أكثر ← تثبيت على أي حال — التطبيق آمن وشغال أوفلاين.',
      'dl.s4h': 'سجّل وابدأ سلسلتك',
      'dl.s4p': 'اعمل حسابك في ثواني، وسجّل دخولك — وسلسلتك تبدأ النهاردة.',
      'dl.meta': 'أندرويد بس &middot; 56 ميجا &middot; شغال أوفلاين بالكامل',
      'dl.again': 'حمّله تاني',
      'dl.done': 'تمام',
      'dl.close': 'اقفل',
      'hint': 'مرّر',
      'fc1': '<span>&#128293; سلسلة 12 يوم</span>',
      'fc2': '<span>المستوى 4 &middot; 690 XP</span>',
      'fc3': '<span>&#10003; 53 إنجاز</span>',
      's1.idx': '01 / شاشتك',
      's1.h': 'يومك في شاشة واحدة',
      's1.p': 'تحية، حلقة إنجاز، نقاط خبرة اليوم، وكل أهداف عاداتك — بدون تنقّل بين تبويبات. يومك كله بوضوح وهادئة.',
      's2.idx': '02 / تسجيلك',
      's2.h': 'سجّل إنجازك في ثوانٍ',
      's2.p': 'لمسة واحدة تسجّل العادة. والأهداف القابلة للقياس ليها نافذة دقيقة — صفحات قرأتها، أكواب مية، دقائق تركيز.',
      's3.idx': '03 / سلسلتك',
      's3.h': 'حافظ على السلسلة',
      's3.p': 'بطاقات سلاسل بلهب بيكبر كل ما تظهر — وأفضل سلسلة سجّلتها. دافع مستمر من غير شعور بالذنب.',
      'lv.eyebrow': 'تسلية بذكاء، مش طفولية',
      'lv.h': 'كل إنجاز بيرفع مستواك',
      'lv.p': 'التطبيق بيحسب التزامك زي لعبة تستاهل تلعبها. كل إنجاز يجيب <strong>XP</strong>، والـXP بيملّي شريط المستوى، وكل محطة بتفتح <strong>شارة باحتفال حقيقي</strong> — حلقة مكافآت صغيرة بتخليك ترجع بكرة.',
      'lv.b1': 'XP مع كل إنجاز — رد فعل فوري',
      'lv.b2': 'لحظات شارات عند ترقية المستوى',
      'lv.b3': 'تقدمك للمستوى اللي بعدك ظاهر دايمًا',
      'st.eyebrow': 'أرقام بتحفّز',
      'st.h': 'إحصائيات صادقة معاك',
      'st.p': 'رسم إيقاع أسبوعي، خريطة حرارية 12 شهر يوم بيوم، إبراز أحسن يوم، وتفصيل لكل عادة — الحقيقة كلها، بالسلاسل والتراجع كمان.',
      'lbl1': 'أطول سلسلة &middot; أيام',
      'lbl2': 'إجمالي الإنجازات',
      'lbl3': 'إنجاز الشهر',
      'lbl4': 'نقاط الخبرة &middot; المستوى 5',
      'ga.eyebrow': 'كل شاشة',
      'ga.h': 'تصميم بيختفي',
      'ga.p': 'الواجهة بتسيبك تركز على العادة نفسها — مش على التطبيق.',
      'cap1': 'العادات', 'cap2': 'عادة جديدة', 'cap3': 'الخريطة الحرارية', 'cap4': 'Habit Flow Pro',
      'sp1': 'Flutter', 'sp2': 'بدون إنترنت', 'sp3': 'العربية + English', 'sp4': 'داكن وفاتح',
      'sp5': 'تنبيهات محلية', 'sp6': 'ودجت للرئيسية', 'sp7': 'نقاط وتحفيز', 'sp8': 'خريطة 12 شهر',
      'end.name': 'Habit Flow', 'end.nameAr': 'عاداتك',
      'end.h': 'عايز تطبيق<br />زي ده؟',
      'end.p': 'استوديو NOVU بتصمّم ويبني منتجات موبايل كاملة — هوية، وواجهات، والتطبيق الشغال نفسه. احكينا بتحلم بإيه.',
      'end.btn': 'ابدأ مشروعك',
      'ft.brand': 'Habit Flow (عاداتك) — تصميم وتطوير NOVU.',
      'ft.l1': 'الاستوديو', 'ft.l2': 'الجولة', 'ft.l3': 'الشاشات',
      'ft.copy': '&copy; <span id="pfYear"></span> NOVU — جميع الحقوق محفوظة.'
    }
  };

  function applyLang(lang) {
    if (lang !== 'ar' && lang !== 'en') { lang = 'en'; }
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem('hf-lang', lang); } catch (e) {}
    var dict = (window.PF_I18N && window.PF_I18N[lang]) ? window.PF_I18N[lang] : I18N[lang];
    if (!dict) { return; }
    var nodes = all('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute('data-i18n');
      if (dict[k] !== undefined) { nodes[i].innerHTML = dict[k]; }
    }
    var imgs = all('img[data-en]');
    for (var j = 0; j < imgs.length; j++) {
      var src = (lang === 'ar') ? imgs[j].getAttribute('data-ar') : imgs[j].getAttribute('data-en');
      if (src) { imgs[j].setAttribute('src', src); }
    }
    var opts = all('.pf-lang .lg-opt');
    for (var m = 0; m < opts.length; m++) {
      opts[m].classList.toggle('on', opts[m].getAttribute('data-lg') === lang);
    }
    var btn = document.getElementById('pfLang');
    if (btn) {
      btn.classList.toggle('ar', lang === 'ar');
      btn.title = (lang === 'ar') ? 'Switch to English' : 'التبديل للعربية';
    }
    var y = document.getElementById('pfYear');
    if (y) { y.textContent = String(new Date().getFullYear()); }
    document.title = dict['meta.title'];
  }

  (function initLang() {
    var stored = null;
    try { stored = localStorage.getItem('hf-lang'); } catch (e) {}
    var forced = null;
    try {
      var m = location.search.match(/[?&]lang=(ar|en)(&|$)/);
      if (m) { forced = m[1]; }
    } catch (e) {}
    applyLang(forced || (stored === 'en' ? 'en' : 'ar'));
  })();

  var langBtn = document.getElementById('pfLang');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('lang') === 'ar' ? 'en' : 'ar';
      if (reduce) { applyLang(next); return; }
      /* Fade out → swap → fade back in for a buttery language change. */
      var root = document.documentElement;
      root.classList.add('pf-switching');
      window.setTimeout(function () {
        applyLang(next);
        root.classList.remove('pf-switching');
      }, 240);
    });
  }

  /* ---------------- Header glass ---------------- */

  var header = document.getElementById('pfHeader');
  function onScrollHeader() {
    if (!header) { return; }
    if (window.scrollY > 30) { header.classList.add('scrolled'); } else { header.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------- Scroll progress ---------------- */

  var bar = document.getElementById('pfProgressBar');
  if (bar) {
    var onProgress = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var k = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
      bar.style.width = (k * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onProgress, { passive: true });
    window.addEventListener('resize', onProgress);
    onProgress();
  }

  /* ---------------- Reveals ---------------- */

  var reveals = all('[data-reveal]');
  reveals.forEach(function (el) {
    var d = parseInt(el.getAttribute('data-delay') || '0', 10);
    if (d > 0) { el.style.transitionDelay = (d * 110) + 'ms'; }
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- Counters ---------------- */

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (!isFinite(target)) { return; }
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1500;
    var t0 = null;
    function frame(ts) {
      if (t0 === null) { t0 = ts; }
      var k = clamp((ts - t0) / dur, 0, 1);
      el.textContent = Math.round(target * easeOutCubic(k)) + suffix;
      if (k < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }

  var counters = all('[data-counter]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------------- Tilt (mouse 3D) ---------------- */

  if (!reduce && hoverable) {
    all('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 10;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * max * 2).toFixed(2) + 'deg');
      });
      el.addEventListener('mouseleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------- Parallax ---------------- */

  var pxEls = all('[data-parallax]').map(function (el) {
    return { el: el, sp: parseFloat(el.getAttribute('data-parallax')) || 0 };
  });

  function applyParallax(vh) {
    for (var i = 0; i < pxEls.length; i++) {
      var o = pxEls[i];
      var host = o.el.parentElement || o.el;
      var r = host.getBoundingClientRect();
      if (r.bottom < -160 || r.top > vh + 160) { continue; }
      var mid = r.top + r.height / 2 - vh / 2;
      o.el.style.transform = 'translate3d(0,' + (mid * o.sp).toFixed(2) + 'px,0)';
    }
  }

  /* ---------------- Pinned 3D scenes ---------------- */

  var scenes = all('[data-scene]').map(function (sc) {
    return {
      sc: sc,
      flip: sc.getAttribute('data-flip') === '1' ? -1 : 1,
      phone: sc.querySelector('[data-scene-phone]'),
      screens: Array.prototype.slice.call(sc.querySelectorAll('[data-screen]')),
      steps: Array.prototype.slice.call(sc.querySelectorAll('[data-step]')),
      dots: Array.prototype.slice.call(sc.querySelectorAll('.pin-dots span')),
      p: 0
    };
  });

  function setActive(list, idx, goneClass) {
    for (var i = 0; i < list.length; i++) {
      list[i].classList.toggle('on', i === idx);
      if (goneClass) { list[i].classList.toggle(goneClass, i < idx); }
    }
  }

  function updateScene(s, vh) {
    var r = s.sc.getBoundingClientRect();
    if (r.bottom < -120 || r.top > vh + 120) { return; }
    var total = Math.max(1, r.height - vh);
    var raw = clamp(-r.top / total, 0, 1);
    s.p += (raw - s.p) * (reduce ? 1 : 0.16);
    if (Math.abs(raw - s.p) < 0.0004) { s.p = raw; }
    var p = s.p;

    var n = s.screens.length;
    if (n > 0) {
      var idx = Math.min(n - 1, Math.floor(p * n * 0.9999));
      setActive(s.screens, idx);
      setActive(s.steps, idx, 'gone');
      if (s.dots.length > 0) { setActive(s.dots, idx); }
    }

    if (reduce || !s.phone) { return; }

    /* tilt-in 0→34% : tilted → face-on. hold. last 22% : drift to opposite tilt. */
    var t1 = easeOutCubic(clamp(p / 0.34, 0, 1));
    var t2r = clamp((p - 0.78) / 0.22, 0, 1);
    var t2 = t2r * t2r;
    var rotY = s.flip * (-20 * (1 - t1) + 16 * t2);
    var rotX = 9 * (1 - t1) - 5 * t2;
    var scale = 0.86 + 0.14 * t1 - 0.05 * t2;
    var ty = 36 * (1 - t1) - 26 * t2;

    s.phone.style.transform = 'translate3d(0,' + ty.toFixed(2) + 'px,0) rotateX(' +
      rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
  }

  function loop() {
    var vh = window.innerHeight;
    if (!reduce) { applyParallax(vh); }
    for (var i = 0; i < scenes.length; i++) { updateScene(scenes[i], vh); }
    requestAnimationFrame(loop);
  }
  if (scenes.length > 0 || pxEls.length > 0) { requestAnimationFrame(loop); }

  /* ---------------- Setup wizard (post-download) ---------------- */

  var setup = document.getElementById('pfSetup');
  function openSetup() {
    if (!setup) { return; }
    setup.classList.add('open');
    setup.setAttribute('aria-hidden', 'false');
  }
  function closeSetup() {
    if (!setup) { return; }
    setup.classList.remove('open');
    setup.setAttribute('aria-hidden', 'true');
  }
  all('.pf-dl').forEach(function (a) {
    a.addEventListener('click', function () { setTimeout(openSetup, 350); });
  });
  if (setup) {
    setup.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeSetup);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && setup.classList.contains('open')) { closeSetup(); }
    });
  }

  /* ---------------- Footer year ---------------- */

  var y = document.getElementById('pfYear');
  if (y) { y.textContent = String(new Date().getFullYear()); }
})();
