/* ============================================================
   NOVU — site behaviour (v2 redesign). ES5, no dependencies.
   1. Page enter / exit transitions
   2. Header scroll state + mobile menu
   3. Scroll reveals ([data-r], .split-words)
   4. Card pointer spotlight
   5. Filters ([data-filters] → [data-items]) + store search
   6. Store cart (drawer, badge, toast, email checkout)
   7. Project brief form (chips, validation, email handoff)
   Nothing is hidden unless this script runs, and all motion is
   skipped under prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var STUDIO_EMAIL = 'studio@novu.design';
  var doc = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (!reduce) doc.classList.add('js-anim');

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------- 1. Page transitions ---------- */
  onReady(function () {
    function show() { document.body.classList.add('page-in'); }
    requestAnimationFrame(function () { requestAnimationFrame(show); });
    /* rAF is paused in background tabs; never leave the page invisible. */
    window.setTimeout(show, 120);
  });

  document.addEventListener('click', function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:|javascript:)/.test(href)) return;
    /* Same-page hash links (e.g. index.html#brief while on index) scroll instead. */
    var url;
    try { url = new URL(href, window.location.href); } catch (err) { return; }
    if (url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    doc.classList.add('nav-out');
    window.setTimeout(function () { window.location.href = href; }, 240);
  }, false);

  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) {
      doc.classList.remove('nav-out');
      document.body.classList.add('page-in');
    }
  });

  /* ---------- Ambient background + custom cursor ---------- */
  onReady(function () {
    var grid = document.createElement('div');
    grid.className = 'bg-grid';
    grid.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(grid, document.body.firstChild);

    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (reduce || !fine) return;

    var glow = document.createElement('div');
    glow.className = 'bg-glow';
    glow.setAttribute('aria-hidden', 'true');
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.insertBefore(glow, grid.nextSibling);
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    doc.classList.add('has-cursor');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, running = false;
    function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(loop);
      else running = false;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      doc.style.setProperty('--cx', mx + 'px');
      doc.style.setProperty('--cy', my + 'px');
      document.body.classList.add('cursor-on');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-on'); });
    document.addEventListener('pointerdown', function () { ring.classList.add('down'); });
    document.addEventListener('pointerup', function () { ring.classList.remove('down'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('a, button, input, textarea, label, .card, .emblem') : null;
      ring.classList.toggle('hover', !!t);
    });
  });

  onReady(function () {
    /* ---------- 2. Header + mobile menu ---------- */
    var header = $('.site-header');
    function onScroll() {
      if (header) header.classList.toggle('scrolled', window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var burger = $('.burger');
    var menu = $('.mobile-menu');
    function setMenu(open) {
      document.body.classList.toggle('menu-open', open);
      if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (menu) menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (burger) burger.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    if (menu) $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMenu(false); setCart(false); }
    });

    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    /* ---------- 3. Reveals ---------- */
    $$('.split-words').forEach(function (el) {
      /* Wrap each word (keeping inner tags such as <span class="accent">) */
      var i = 0;
      /* background-clip:text does not reach into the per-word inline-blocks,
         so a .grad-text wrapper hands its class down to each word instead. */
      function walk(node, grad) {
        var kids = Array.prototype.slice.call(node.childNodes);
        kids.forEach(function (k) {
          if (k.nodeType === 3) {
            var parts = k.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement('span'); w.className = 'w';
              var inner = document.createElement('span'); inner.textContent = p;
              if (grad) inner.className = 'grad-text';
              inner.style.setProperty('--d', (i++ * 60) + 'ms');
              w.appendChild(inner); frag.appendChild(w);
            });
            node.replaceChild(frag, k);
          } else if (k.nodeType === 1 && k.tagName !== 'BR') {
            var g = grad || k.classList.contains('grad-text');
            k.classList.remove('grad-text');
            walk(k, g);
          }
        });
      }
      walk(el);
    });

    $$('[data-stagger]').forEach(function (group) {
      Array.prototype.slice.call(group.children).forEach(function (c, i) {
        if (!c.hasAttribute('data-r')) c.setAttribute('data-r', '');
        c.style.setProperty('--d', Math.min(i * 80, 400) + 'ms');
      });
    });

    var targets = $$('[data-r], .split-words');
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      targets.forEach(function (t) { io.observe(t); });
      /* Safety net so nothing stays hidden. */
      window.setTimeout(function () {
        targets.forEach(function (t) {
          var r = t.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) t.classList.add('in');
        });
      }, 2500);
    } else {
      targets.forEach(function (t) { t.classList.add('in'); });
    }

    /* ---------- 4. Card spotlight ---------- */
    if (!reduce && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('pointermove', function (e) {
        var card = e.target && e.target.closest ? e.target.closest('.card') : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    }

    /* ---------- 5. Filters + search ---------- */
    $$('[data-filters]').forEach(function (bar) {
      var items = $('#' + bar.getAttribute('data-filters'));
      if (!items) return;
      var empty = $('[data-empty-for="' + items.id + '"]');
      var search = $('[data-search-for="' + items.id + '"]');
      var current = 'all';
      function apply() {
        var q = search ? search.value.toLowerCase().trim() : '';
        var shown = 0;
        Array.prototype.slice.call(items.children).forEach(function (el) {
          var cats = (el.getAttribute('data-cat') || '').split(/\s+/);
          var okCat = current === 'all' || cats.indexOf(current) !== -1;
          var okQ = !q || el.textContent.toLowerCase().indexOf(q) !== -1;
          var show = okCat && okQ;
          el.classList.toggle('is-hidden', !show);
          if (show) { shown++; el.classList.add('in'); }
        });
        if (empty) empty.classList.toggle('show', shown === 0);
      }
      $$('.filter', bar).forEach(function (btn) {
        btn.addEventListener('click', function () {
          current = btn.getAttribute('data-filter') || 'all';
          $$('.filter', bar).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
          apply();
        });
      });
      if (search) search.addEventListener('input', apply);
    });

    /* ---------- 6. Cart ---------- */
    var cart = [];
    try { cart = JSON.parse(window.localStorage.getItem('novu-cart') || '[]') || []; } catch (e) { cart = []; }
    var drawer = $('.drawer');
    var toast = $('.toast');
    var toastTimer;

    function save() { try { window.localStorage.setItem('novu-cart', JSON.stringify(cart)); } catch (e) {} }
    function money(n) { return '$' + n.toFixed(2); }
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
    }
    function render() {
      $$('[data-cart-count]').forEach(function (b) {
        b.textContent = cart.length;
        b.hidden = cart.length === 0;
      });
      if (!drawer) return;
      var list = $('.items', drawer);
      var total = 0;
      list.innerHTML = '';
      if (!cart.length) {
        list.innerHTML = '<p class="empty">Your cart is empty.</p>';
      }
      cart.forEach(function (it, i) {
        total += it.price;
        var row = document.createElement('div');
        row.className = 'item';
        var info = document.createElement('div');
        var b = document.createElement('b'); b.textContent = it.name;
        var s = document.createElement('span'); s.className = 'label'; s.textContent = money(it.price) + ' USD';
        info.appendChild(b); info.appendChild(s);
        var rm = document.createElement('button');
        rm.type = 'button'; rm.textContent = 'Remove';
        rm.setAttribute('aria-label', 'Remove ' + it.name);
        rm.addEventListener('click', function () { cart.splice(i, 1); save(); render(); });
        row.appendChild(info); row.appendChild(rm);
        list.appendChild(row);
      });
      var t = $('[data-cart-total]', drawer);
      if (t) t.textContent = money(total);
      var co = $('[data-checkout]', drawer);
      if (co) co.disabled = !cart.length;
    }
    function setCart(open) {
      if (!drawer) return;
      document.body.classList.toggle('cart-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) { var c = $('.d-head button', drawer); if (c) c.focus(); }
    }
    window.__setCart = setCart;

    $$('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-add');
        var price = parseFloat(btn.getAttribute('data-price')) || 0;
        var exists = cart.some(function (c) { return c.name === name; });
        if (exists) { showToast(name + ' is already in your cart'); return; }
        cart.push({ name: name, price: price });
        save(); render();
        showToast('Added ' + name);
      });
    });
    $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', function () { setCart(true); }); });
    $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', function () { setCart(false); }); });
    var checkout = drawer ? $('[data-checkout]', drawer) : null;
    if (checkout) checkout.addEventListener('click', function () {
      if (!cart.length) return;
      var total = 0;
      var lines = cart.map(function (c) { total += c.price; return '- ' + c.name + ' (' + money(c.price) + ')'; });
      var body = 'Hi NOVU,\n\nI would like to purchase:\n' + lines.join('\n') +
        '\n\nTotal: ' + money(total) + ' USD\n\nName:\nCompany (optional):\n\n— Sent from the NOVU store';
      window.location.href = 'mailto:' + STUDIO_EMAIL + '?subject=' +
        encodeURIComponent('NOVU Store order — ' + cart.length + ' item' + (cart.length > 1 ? 's' : '')) +
        '&body=' + encodeURIComponent(body);
    });
    render();

    /* ---------- 7. Brief form ---------- */
    var form = $('#brief-form');
    if (form) {
      $$('.chip', form).forEach(function (chip) {
        chip.addEventListener('click', function () {
          chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        });
      });
      var status = $('.form-status', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        $$('[required]', form).forEach(function (inp) {
          var f = inp.closest('.field');
          var valid = inp.value.trim() !== '' && (inp.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()));
          if (f) f.classList.toggle('invalid', !valid);
          if (!valid && ok) { inp.focus(); ok = false; }
        });
        if (!ok) {
          if (status) { status.className = 'form-status'; status.textContent = 'Please fill in the highlighted fields.'; }
          return;
        }
        var v = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
        var disc = $$('.chip[aria-pressed="true"]', form).map(function (c) { return c.textContent.trim(); });
        var body = 'Name: ' + v('name') +
          '\nEmail: ' + v('email') +
          '\nCompany: ' + (v('company') || '—') +
          '\nTarget launch: ' + (v('launch') || '—') +
          '\nBudget: ' + (v('budget') || '—') +
          '\nDisciplines: ' + (disc.join(', ') || '—') +
          '\n\nProject context:\n' + v('message') +
          '\n\n— Sent from the NOVU site brief form';
        window.location.href = 'mailto:' + STUDIO_EMAIL + '?subject=' +
          encodeURIComponent('NOVU Project Brief — ' + (v('company') || v('name') || 'New inquiry')) +
          '&body=' + encodeURIComponent(body);
        if (status) {
          status.className = 'form-status ok';
          status.textContent = 'Your email app should open with the brief filled in. Attach any files there and hit send.';
        }
      });
      $$('input, textarea', form).forEach(function (inp) {
        inp.addEventListener('input', function () {
          var f = inp.closest('.field');
          if (f) f.classList.remove('invalid');
        });
      });
    }
  });
})();
