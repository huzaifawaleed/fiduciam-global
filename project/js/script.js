/* ── FIDUCIAM GLOBAL — SHARED SCRIPTS ── */

// ── PROGRESS BAR ──
(function () {
  var bar = document.getElementById('pgbar');
  var nav = document.getElementById('nav');
  if (!bar && !nav) return;
  window.addEventListener('scroll', function () {
    var scrolled = window.pageYOffset || document.documentElement.scrollTop;
    var total = document.body.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = Math.min((scrolled / total) * 100, 100) + '%';
    if (nav) nav.classList.toggle('scrolled', scrolled > 60);
  }, { passive: true });
})();

// ── SCROLL REVEAL ──
(function () {
  var els = document.querySelectorAll('.rv,.rvl,.rvr');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    // Fallback: just show all
    els.forEach(function (el) { el.classList.add('vis'); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { obs.observe(el); });
})();

// ── COUNTERS ──
function runCount(el) {
  var tgt = +el.dataset.target;
  var sfx = el.dataset.suffix || '';
  var dur = 1600, step = 16;
  var cur = 0, inc = tgt / (dur / step);
  var t = setInterval(function () {
    cur = Math.min(cur + inc, tgt);
    el.textContent = Math.round(cur) + sfx;
    if (cur >= tgt) clearInterval(t);
  }, step);
}
(function () {
  var els = document.querySelectorAll('[data-target]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { runCount(el); });
    return;
  }
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  els.forEach(function (el) { cObs.observe(el); });
})();

// ── MOBILE NAV ──
var hbg = document.getElementById('hbg');
var mob = document.getElementById('mobNav');

function openMob() {
  if (!mob) return;
  mob.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMob() {
  if (!mob) return;
  mob.classList.remove('open');
  document.body.style.overflow = '';
}
if (hbg) {
  hbg.addEventListener('click', function (e) {
    e.stopPropagation();
    if (mob && mob.classList.contains('open')) { closeMob(); } else { openMob(); }
  });
}
// Close mobile nav when clicking outside
document.addEventListener('click', function (e) {
  if (mob && mob.classList.contains('open') && !mob.contains(e.target) && e.target !== hbg) {
    closeMob();
  }
});
// Close on ESC
document.addEventListener('keydown', function (e) {
  if ((e.key === 'Escape' || e.keyCode === 27) && mob && mob.classList.contains('open')) {
    closeMob();
  }
});

// ── MOBILE SERVICES TOGGLE ──
function toggleMobServices() {
  var sub = document.getElementById('mobServicesSub');
  var arrow = document.getElementById('mobServArrow');
  if (!sub) return;
  sub.classList.toggle('open');
  if (arrow) arrow.innerHTML = sub.classList.contains('open') ? '&#9652;' : '&#9662;';
}

// ── DESKTOP DROPDOWN — hover with bridge delay ──
(function () {
  var items = document.querySelectorAll('.has-drop');
  items.forEach(function (li) {
    var drop = li.querySelector('.drop');
    if (!drop) return;
    var leaveTimer = null;

    function show() {
      clearTimeout(leaveTimer);
      drop.style.display = 'grid';
      // rAF ensures display:grid is applied before opacity transition
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { drop.style.opacity = '1'; });
      });
    }
    function hide() {
      leaveTimer = setTimeout(function () {
        drop.style.opacity = '0';
        setTimeout(function () {
          if (drop.style.opacity === '0') drop.style.display = 'none';
        }, 200);
      }, 120);
    }

    li.addEventListener('mouseenter', show);
    li.addEventListener('mouseleave', hide);
    drop.addEventListener('mouseenter', function () { clearTimeout(leaveTimer); });
    drop.addEventListener('mouseleave', hide);

    // Keyboard: open on Enter/Space, close on Escape
    var trigger = li.querySelector('.nav-link');
    if (trigger) {
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
        if (e.key === 'Escape') hide();
      });
    }
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-drop')) {
      document.querySelectorAll('.drop').forEach(function (d) {
        d.style.opacity = '0';
        d.style.display = 'none';
      });
    }
  });
})();

// ── CONTACT FORM ──
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('.fsub');
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = 'Sending\u2026';
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = 'Message sent \u2713';
      btn.style.background = '#16A34A';
      form.reset();
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.background = '';
        btn.disabled = false;
      }, 3500);
    }, 1200);
  });
})();

// ── HERO CANVAS PARTICLE ANIMATION ──
(function () {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  // Only run on screens wide enough
  if (window.innerWidth < 768) return;
  var ctx = canvas.getContext('2d');
  var W, H, particles = [], animId;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function Particle() {
    this.reset = function () {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.gold = Math.random() > 0.72;
    };
    this.reset();
  }

  function init() {
    resize();
    particles = [];
    var count = Math.floor((W * H) / 9000);
    for (var i = 0; i < count; i++) particles.push(new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(function (p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) p.reset();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? 'rgba(184,137,42,' + p.alpha + ')'
        : 'rgba(12,61,58,' + (p.alpha * 0.6) + ')';
      ctx.fill();
    });
    // Connecting lines
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(184,137,42,' + (0.06 * (1 - dist / 90)) + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(draw);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth < 768) {
        cancelAnimationFrame(animId);
        canvas.style.display = 'none';
        return;
      }
      canvas.style.display = 'block';
      init();
    }, 200);
  });

  init();
  draw();
})();
