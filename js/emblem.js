/* ============================================================
   NOVU — interactive hero emblem (home page only).
   Grab the logo and drag to spin it in 3D; let go and it keeps
   spinning with inertia, then settles back facing forward.
   When idle it tilts gently toward the pointer.
   The flat PNG is stacked into thin layers to fake thickness.
   To remove the experiment: delete the <script> tag for this
   file in index.html — the static emblem keeps working.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function init() {
    var box = document.querySelector('.emblem');
    var img = box && box.querySelector('img');
    if (!box || !img || reduce) return;

    /* Build the layered 3D object */
    var stage = document.createElement('div');
    stage.className = 'emblem-3d';
    var LAYERS = 12, STEP = 1.5;
    for (var i = LAYERS - 1; i >= 0; i--) {
      var l = img.cloneNode(false);
      l.alt = '';
      l.className = 'em-layer' + (i === 0 ? ' front' : '');
      l.style.transform = 'translateZ(' + (-i * STEP) + 'px)' + (i === LAYERS - 1 ? ' rotateY(180deg) scaleX(-1)' : '');
      l.style.filter = i === 0 ? '' : 'brightness(' + (0.75 - i * 0.03) + ') saturate(1.2)';
      stage.appendChild(l);
    }
    img.replaceWith(stage);
    box.classList.add('is-interactive');

    var hint = document.createElement('span');
    hint.className = 'em-hint';
    hint.textContent = '↻ Drag to spin';
    box.appendChild(hint);

    var rx = 0, ry = 0, vx = 0, vy = 0;      /* rotation (deg) and velocity */
    var tx = 0, ty = 0;                        /* idle tilt target */
    var dragging = false, lastX = 0, lastY = 0, lastT = 0, moved = false;

    function render() {
      stage.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      var speed = Math.min(Math.abs(vy) + Math.abs(vx), 30);
      box.style.setProperty('--spin', (speed / 30).toFixed(3));
    }

    function tick() {
      if (!dragging) {
        if (Math.abs(vx) + Math.abs(vy) > 0.05) {
          /* inertia */
          ry += vy; rx += vx;
          vy *= 0.955; vx *= 0.9;
        } else {
          vx = vy = 0;
          /* settle to the nearest full turn, plus the idle tilt */
          var home = Math.round(ry / 360) * 360;
          ry += (home + ty - ry) * 0.07;
          rx += (tx - rx) * 0.07;
        }
        rx = Math.max(-70, Math.min(70, rx));
      }
      render();
      requestAnimationFrame(tick);
    }

    box.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; moved = false;
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
      vx = vy = 0;
      box.classList.add('grabbing');
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
    });
    box.addEventListener('pointermove', function (e) {
      if (!dragging) {
        if (e.pointerType === 'mouse') {
          var r = box.getBoundingClientRect();
          ty = ((e.clientX - r.left) / r.width - 0.5) * 30;
          tx = -((e.clientY - r.top) / r.height - 0.5) * 24;
        }
        return;
      }
      var now = performance.now();
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      var dt = Math.max(now - lastT, 1);
      ry += dx * 0.6;
      rx -= dy * 0.45;
      rx = Math.max(-70, Math.min(70, rx));
      /* velocity in deg per ~16ms frame */
      vy = dx * 0.6 * (16 / dt);
      vx = -dy * 0.45 * (16 / dt);
      lastX = e.clientX; lastY = e.clientY; lastT = now;
      if (Math.abs(dx) + Math.abs(dy) > 2 && !moved) { moved = true; box.classList.add('touched'); }
    });
    function release(e) {
      if (!dragging) return;
      dragging = false;
      box.classList.remove('grabbing');
      if (performance.now() - lastT > 80) { vx = vy = 0; }   /* paused before letting go */
      vy = Math.max(-40, Math.min(40, vy));
      vx = Math.max(-20, Math.min(20, vx));
      try { box.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    box.addEventListener('pointerup', release);
    box.addEventListener('pointercancel', release);
    box.addEventListener('pointerleave', function () { if (!dragging) { tx = 0; ty = 0; } });
    /* Double-click: a quick showcase spin */
    box.addEventListener('dblclick', function () { vy = 28; box.classList.add('touched'); });

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
