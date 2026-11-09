/* NOVU desktop app pages (Dev Notes, CYVEX): language switch, reveal on scroll, tabs.
   Each page sets window.APP_I18N = { ar: { key: "html" } } and marks text with data-i18n="key".
   English lives in the HTML itself; Arabic comes from the page dictionary. Shares the site's
   language choice (localStorage "hf-lang"). Plain ES5, no dependencies. */
(function () {
  var html = document.documentElement;
  var dict = (window.APP_I18N || {}).ar || {};
  var nodes = document.querySelectorAll("[data-i18n]");
  var original = [];
  for (var i = 0; i < nodes.length; i++) original.push(nodes[i].innerHTML);
  var attrNodes = document.querySelectorAll("[data-i18n-attr]");
  var originalAttr = [];
  for (var j = 0; j < attrNodes.length; j++) {
    var spec = attrNodes[j].getAttribute("data-i18n-attr").split(":");
    originalAttr.push(attrNodes[j].getAttribute(spec[0]));
  }

  function setLang(lang) {
    var ar = lang === "ar";
    html.setAttribute("lang", ar ? "ar" : "en");
    html.setAttribute("dir", ar ? "rtl" : "ltr");
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute("data-i18n");
      nodes[i].innerHTML = ar && dict[k] != null ? dict[k] : original[i];
    }
    for (var j = 0; j < attrNodes.length; j++) {
      var spec = attrNodes[j].getAttribute("data-i18n-attr").split(":");
      attrNodes[j].setAttribute(spec[0], ar && dict[spec[1]] != null ? dict[spec[1]] : originalAttr[j]);
    }
    var imgs = document.querySelectorAll("img[data-src-ar]");
    for (var m = 0; m < imgs.length; m++) {
      var el = imgs[m];
      if (!el.getAttribute("data-src-en")) el.setAttribute("data-src-en", el.getAttribute("src"));
      el.setAttribute("src", ar ? el.getAttribute("data-src-ar") : el.getAttribute("data-src-en"));
    }
    if (dict["meta.title"] && ar) document.title = dict["meta.title"];
    else if (window.APP_TITLE_EN) document.title = window.APP_TITLE_EN;
    var btns = document.querySelectorAll("[data-lang-toggle]");
    for (var b = 0; b < btns.length; b++) btns[b].textContent = ar ? "EN" : "ع";
    try { localStorage.setItem("hf-lang", ar ? "ar" : "en"); } catch (e) { /* private mode */ }
    if (window.APP_ON_LANG) window.APP_ON_LANG(ar ? "ar" : "en");
  }

  var start = "ar";
  try { if (localStorage.getItem("hf-lang") === "en") start = "en"; } catch (e) { /* ignore */ }
  var q = /[?&]lang=(en|ar)/.exec(location.search);
  if (q) start = q[1];
  window.APP_TITLE_EN = document.title;
  setLang(start);

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("[data-lang-toggle]") : null;
    if (t) { ev.preventDefault(); setLang(html.getAttribute("lang") === "ar" ? "en" : "ar"); return; }
    var tab = ev.target.closest ? ev.target.closest("[data-tab]") : null;
    if (tab) {
      var group = tab.getAttribute("data-tab-group");
      var all = document.querySelectorAll('[data-tab-group="' + group + '"]');
      for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-selected", all[i] === tab ? "true" : "false");
      var panes = document.querySelectorAll('[data-pane-group="' + group + '"]');
      for (var p = 0; p < panes.length; p++) panes[p].hidden = panes[p].getAttribute("data-pane") !== tab.getAttribute("data-tab");
    }
  });

  /* reveal on scroll */
  var rev = document.querySelectorAll("[data-rv]");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) { entries[i].target.classList.add("in"); io.unobserve(entries[i].target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    for (var r = 0; r < rev.length; r++) io.observe(rev[r]);
  } else {
    for (var s = 0; s < rev.length; s++) rev[s].classList.add("in");
  }

  /* header shadow once scrolled */
  var top = document.querySelector(".ap-top");
  if (top) {
    var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
})();
