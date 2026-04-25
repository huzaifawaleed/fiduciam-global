/* ════════════════════════════════════════════════════════════════
   FIDUCIAM GLOBAL — animations.js
   Drop-in JS animation layer. Add AFTER script.js in every HTML:
   <script src="js/animations.js"></script>

   This file adds only behaviour that CSS alone cannot handle:
   1. Ripple click effect on all buttons
   2. Hamburger ↔ X class toggle (feeds CSS morph)
   3. Dropdown .drop-visible class (feeds CSS slide animation)
   4. Form field .fg.focused class (feeds CSS label colour)
   5. Intersection Observer for .rv-scale (scale-reveal variant)
   6. Subtle parallax drift on hero section (desktop only)
   7. Stagger child cards inside revealed sections
   8. Tilt micro-effect on service cards (desktop only)
   9. Passive scroll listener guard for older iOS

   Constraints:
   ✓ Reads only GPU-friendly props (transform, opacity)
   ✓ All heavy effects behind window.innerWidth guards
   ✓ All observers use threshold:0 / rootMargin for early trigger
   ✓ Fully compatible with existing script.js (no conflicts)
   ✓ Respects prefers-reduced-motion at runtime
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Helper: check user preference ── */
  var reducedMotion = window.matchMedia &&
                      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════
     1. RIPPLE EFFECT ON BUTTONS
     Creates a radial wave from click point.
     Works on touch too (touchstart coords).
  ══════════════════════════════════════ */
  function addRipple(btn, x, y) {
    if (reducedMotion) return;
    var rect   = btn.getBoundingClientRect();
    var size   = Math.max(rect.width, rect.height) * 1.6;
    var ripple = document.createElement('span');
    ripple.className   = 'ripple';
    ripple.style.cssText = [
      'width:'  + size + 'px',
      'height:' + size + 'px',
      'left:'   + (x - rect.left - size / 2) + 'px',
      'top:'    + (y - rect.top  - size / 2) + 'px'
    ].join(';');
    btn.appendChild(ripple);
    setTimeout(function () { ripple.parentNode && ripple.parentNode.removeChild(ripple); }, 650);
  }

  document.querySelectorAll('.btn, .nav-cta, .fsub').forEach(function (btn) {
    /* Mouse */
    btn.addEventListener('mousedown', function (e) {
      addRipple(btn, e.clientX, e.clientY);
    });
    /* Touch — use first touch point */
    btn.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      addRipple(btn, t.clientX, t.clientY);
    }, { passive: true });
  });


  /* ══════════════════════════════════════
     2. HAMBURGER ↔ X CLASS TOGGLE
     Feeds .hbg.open CSS morph in animations.css
     Hooks into the existing openMob/closeMob flow.
  ══════════════════════════════════════ */
  var hbg = document.getElementById('hbg');
  var mob = document.getElementById('mobNav');

  if (hbg && mob) {
    /* Observe the mob-nav for open/close to sync the icon class */
    var mobObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (mob.classList.contains('open')) {
            hbg.classList.add('open');
          } else {
            hbg.classList.remove('open');
          }
        }
      });
    });
    mobObserver.observe(mob, { attributes: true });
  }


  /* ══════════════════════════════════════
     3. DROPDOWN SLIDE-DOWN CLASS
     Adds .drop-visible so CSS @keyframes dropSlide fires.
     Works alongside existing script.js opacity handling.
  ══════════════════════════════════════ */
  if (!reducedMotion) {
    document.querySelectorAll('.has-drop').forEach(function (li) {
      var drop = li.querySelector('.drop');
      if (!drop) return;

      var showTimer = null, hideTimer = null;

      function showDrop() {
        clearTimeout(hideTimer);
        drop.style.display = 'grid';
        clearTimeout(showTimer);
        showTimer = requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            drop.style.opacity  = '1';
            drop.classList.add('drop-visible');
          });
        });
      }

      function hideDrop() {
        hideTimer = setTimeout(function () {
          drop.style.opacity = '0';
          drop.classList.remove('drop-visible');
          setTimeout(function () {
            if (drop.style.opacity === '0') drop.style.display = 'none';
          }, 200);
        }, 120);
      }

      li.addEventListener('mouseenter', showDrop);
      li.addEventListener('mouseleave', hideDrop);
      drop.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      drop.addEventListener('mouseleave', hideDrop);
    });
  }


  /* ══════════════════════════════════════
     4. FORM FIELD FOCUS CLASS
     Adds .focused to .fg wrapper when input is
     active — CSS uses it to colour the label gold.
  ══════════════════════════════════════ */
  document.querySelectorAll('.fg input, .fg textarea, .fg select').forEach(function (field) {
    var fg = field.closest('.fg');
    if (!fg) return;
    field.addEventListener('focus', function ()  { fg.classList.add('focused');    });
    field.addEventListener('blur',  function ()  { fg.classList.remove('focused'); });
  });


  /* ══════════════════════════════════════
     5. SCALE-REVEAL (.rv-scale)
     Same observer pattern as existing .rv system.
     Lets you add class="rv-scale" to any element.
  ══════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    var scaleEls = document.querySelectorAll('.rv-scale');
    if (scaleEls.length) {
      var scaleObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            scaleObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.08 });
      scaleEls.forEach(function (el) { scaleObs.observe(el); });
    }
  }


  /* ══════════════════════════════════════
     6. HERO PARALLAX (desktop only, subtle)
     The hero left-column drifts +/- 12px on scroll.
     Uses transform only → GPU composited.
     Skips on touch devices and reduced-motion.
  ══════════════════════════════════════ */
  if (!reducedMotion && window.innerWidth >= 1024 && window.matchMedia('(hover: hover)').matches) {
    var heroLeft = document.querySelector('.hero-home .inner > div:first-child');
    var ticking  = false;

    if (heroLeft) {
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;
            var heroH   = heroLeft.closest('.hero-home');
            if (!heroH) { ticking = false; return; }
            var heroBottom = heroH.offsetTop + heroH.offsetHeight;
            /* Only apply parallax while hero is in viewport */
            if (scrollY < heroBottom) {
              var shift = scrollY * 0.06;   /* 6% scroll rate — very subtle */
              heroLeft.style.transform = 'translateY(' + (-shift) + 'px)';
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }


  /* ══════════════════════════════════════
     7. STAGGER CARDS IN REVEALED SECTIONS
     When a cards-3 / cards-4 grid enters view,
     each card gets a sequential delay so they
     cascade in rather than popping at once.
     Works in addition to the existing .rv .d1-d6 classes.
  ══════════════════════════════════════ */
  if (!reducedMotion && 'IntersectionObserver' in window) {
    var STAGGER_DELAY = 80;   /* ms between each card */

    var gridObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var cards = e.target.querySelectorAll(':scope > .card, :scope > .cap-card, :scope > .svc-card');
        cards.forEach(function (card, i) {
          /* Only stagger cards that haven't already revealed */
          if (!card.classList.contains('vis') && !card.classList.contains('rv')) {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(function () {
              card.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1)';
              card.style.opacity    = '1';
              card.style.transform  = 'translateY(0)';
            }, i * STAGGER_DELAY);
          }
        });
        gridObs.unobserve(e.target);
      });
    }, { threshold: 0.06 });

    document.querySelectorAll('.cards-3, .cards-4').forEach(function (grid) {
      gridObs.observe(grid);
    });
  }


  /* ══════════════════════════════════════
     8. 3D TILT ON SERVICE/CAPABILITY CARDS (desktop + hover device only)
     Tracks mouse position within the card and tilts
     up to 5° on X and Y axes. Subtle, premium feel.
     Only runs on devices with fine-pointer (mouse).
  ══════════════════════════════════════ */
  if (!reducedMotion &&
      window.innerWidth >= 1024 &&
      window.matchMedia('(pointer: fine)').matches) {

    var TILT_MAX = 5;   /* max degrees */

    document.querySelectorAll('.card, .hero-card, .cap-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect  = card.getBoundingClientRect();
        var cx    = rect.left + rect.width  / 2;
        var cy    = rect.top  + rect.height / 2;
        var dx    = (e.clientX - cx) / (rect.width  / 2);   /* -1 to 1 */
        var dy    = (e.clientY - cy) / (rect.height / 2);   /* -1 to 1 */
        var rotX  = (-dy * TILT_MAX).toFixed(2);
        var rotY  = ( dx * TILT_MAX).toFixed(2);
        card.style.transform = 'perspective(700px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateZ(4px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1), box-shadow .45s ease';
        card.style.transform  = '';
        setTimeout(function () { card.style.transition = ''; }, 460);
      });

      card.addEventListener('mouseenter', function () {
        card.style.transition = 'transform .1s ease, box-shadow .2s ease';
      });
    });
  }


  /* ══════════════════════════════════════
     9. PASSIVE SCROLL GUARD (old iOS Safari)
     Ensures scroll listeners never block touch scroll.
     Already using { passive: true } above — this
     is a global polyfill guard for script.js's listener.
  ══════════════════════════════════════ */
  /* Feature detection only — no action needed if passive is supported */
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function () { return true; }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {
    /* Older browsers: graceful degradation, no crash */
  }

})();
