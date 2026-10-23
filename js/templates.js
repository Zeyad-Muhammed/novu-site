/* ============================================================
   NOVU — store templates: bundle slideshow + template viewer
   ES5, no dependencies. Loaded by store.html after site.js.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Slideshow ---------- */
  function initSlides(root) {
    var slides = root.querySelectorAll('.slide');
    var dots = root.querySelectorAll('.dot');
    var cap = root.querySelector('.cap');
    var i = 0;
    var timer = null;

    function show(n) {
      i = (n + slides.length) % slides.length;
      for (var k = 0; k < slides.length; k++) {
        slides[k].classList.toggle('on', k === i);
        slides[k].setAttribute('aria-hidden', k === i ? 'false' : 'true');
        if (dots[k]) dots[k].setAttribute('aria-current', k === i ? 'true' : 'false');
      }
      if (cap) cap.textContent = slides[i].getAttribute('data-cap') || '';
    }
    function play() {
      if (reduceMotion || timer) return;
      timer = window.setInterval(function () { show(i + 1); }, 4500);
    }
    function stop() { window.clearInterval(timer); timer = null; }

    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go], .dot');
      if (!t) return;
      if (t.classList.contains('dot')) show(Number(t.getAttribute('data-i')));
      else show(i + Number(t.getAttribute('data-go')));
      stop(); play();
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', play);

    var startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); stop(); play(); }
      startX = null;
    });

    show(0);
    play();
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-slides]'), initSlides);

  /* ---------- Template viewer ---------- */
  var root = document.documentElement;

  function dialogFor(id) { return document.getElementById('tpl-' + id); }

  // site.js draws its own cursor in <body>; a modal dialog renders in the top layer above it,
  // so carry the cursor into the open dialog and hand it back to <body> on close.
  function moveCursor(to) {
    Array.prototype.forEach.call(document.querySelectorAll('.cursor-dot, .cursor-ring'), function (el) {
      if (el.parentNode !== to) to.appendChild(el);
    });
  }

  function open(id, push) {
    var d = dialogFor(id);
    if (!d || d.open) return;
    if (typeof d.showModal !== 'function') { d.setAttribute('open', ''); }
    else d.showModal();
    root.classList.add('tpl-open');
    moveCursor(d);
    var sc = d.querySelector('.tpl-scroll');
    if (sc) sc.scrollTop = 0;
    if (push !== false && window.history && history.replaceState) history.replaceState(null, '', '#tpl-' + id);
  }

  // Runs however the dialog ended up closed (button, backdrop, Escape, browser close watcher).
  function closed(d) {
    d.classList.remove('closing');
    if (!document.querySelector('dialog.tpl[open]')) {
      root.classList.remove('tpl-open');
      moveCursor(document.body);
    }
    if (window.history && history.replaceState && /^#tpl-/.test(location.hash)) {
      history.replaceState(null, '', location.pathname + location.search + '#templates');
    }
  }

  function close(d) {
    if (!d || !d.open || d.classList.contains('closing')) return;
    function done() {
      if (d.open) { if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }
      closed(d);
    }
    if (reduceMotion) done();
    else { d.classList.add('closing'); window.setTimeout(done, 220); }
  }

  Array.prototype.forEach.call(document.querySelectorAll('dialog.tpl'), function (d) {
    d.addEventListener('close', function () { closed(d); });
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(d); });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-tpl-close]')) close(d);
    });
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tpl-open]');
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute('data-tpl-open'));
  });

  var m = /^#tpl-([a-z]+)$/.exec(location.hash);
  if (m) open(m[1], false);
})();
