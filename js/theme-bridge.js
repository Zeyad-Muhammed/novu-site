/* Itisam theme fusion — whole-page theming + live bridge to the app.
   - Sets html[data-pf-theme] so css/product-itisam.css re-paints every token.
   - Persists the choice in localStorage ('pf-theme').
   - Syncs the chosen theme to the Itisam app on the phone through the
     local theme bridge (GET/POST http://localhost:8090/api/theme).
   No external dependencies. */
(function () {
  'use strict';

  var MT = [
    'light', 'dark', 'emerald', 'midnight', 'rose',
    'ocean', 'desert', 'lavender', 'forest'
  ];
  var KEY = 'pf-theme';
  var LIVE = 'http://localhost:8090/api/theme';

  function currentLang() {
    return document.documentElement.getAttribute('lang') || 'en';
  }

  /* Flip the whole page palette + the stage mockup + labels. */
  function apply(id) {
    if (MT.indexOf(id) === -1) { id = 'emerald'; }
    document.documentElement.setAttribute('data-pf-theme', id);

    var swatches = Array.prototype.slice.call(document.querySelectorAll('.swatch'));
    var screen = document.getElementById('themeScreen');
    var nameEl = document.getElementById('themeName');
    var d = window.PF_I18N && window.PF_I18N[currentLang()] || null;

    for (var i = 0; i < swatches.length; i++) {
      swatches[i].classList.toggle('on', swatches[i].getAttribute('data-theme-id') === id);
    }
    if (screen) {
      screen.style.opacity = '0';
      window.setTimeout(function () {
        screen.setAttribute('src', '../assets/products/itisam/theme-' + id + '.png');
        screen.onload = function () { screen.style.opacity = '1'; };
        if (screen.complete) { screen.style.opacity = '1'; }
      }, 120);
    }
    if (nameEl) {
      nameEl.setAttribute('data-i18n', 'tn.' + id);
      nameEl.textContent = (d && d['tn.' + id]) ? d['tn.' + id] : id;
    }

    try { localStorage.setItem(KEY, id); } catch (e) { /* private mode */ }
  }

  /* Tell the phone to switch theme too (best effort). */
  function push(id) {
    if (window.navigator.onLine === false) { return; }
    window.fetch(LIVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).catch(function () { /* bridge offline */ });
  }

  /* Connect the theme-bridge.js object to the page handlers + auto-restore. */
  function boot() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (saved && MT.indexOf(saved) !== -1) { apply(saved); }

    var swatches = Array.prototype.slice.call(document.querySelectorAll('.swatch'));
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-theme-id');
        apply(id);
        push(id);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.PFApplyTheme = apply;
  window.PFMTHEMES = MT;
})();