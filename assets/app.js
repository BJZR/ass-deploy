// ══════════════════════════════════════════════════
//  ASS — App Service Server  |  Landing Page JS
// ══════════════════════════════════════════════════
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Nav: sombra al hacer scroll ───────────────────
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Hamburger (mobile) ────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
      // Prevenir scroll del body cuando el menú está abierto
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Cerrar con Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  // ── Tabs ──────────────────────────────────────────
  // Tabs de instalación
  document.querySelectorAll('.tabs').forEach(tabsEl => {
    tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabsEl.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
        tabsEl.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        const panel = tabsEl.querySelector('#tab-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  });

  // Tabs de init systems
  const initNav = document.getElementById('initNav');
  if (initNav) {
    const initScope = initNav.parentElement;
    initNav.querySelectorAll('.init-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.init;
        initNav.querySelectorAll('.init-tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
        initScope.querySelectorAll('.init-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        const panel = initScope.querySelector('#init-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ── Detectar plataforma y seleccionar tab ─────────
  const ua = (navigator.userAgent + navigator.platform).toLowerCase();
  let detected = 'linux';
  if (ua.includes('win'))                  detected = 'windows';
  else if (ua.includes('mac') || ua.includes('iphone') || ua.includes('ipad')) detected = 'macos';

  const autoBtn = document.querySelector(`.tab-btn[data-tab="${detected}"]`);
  if (autoBtn) autoBtn.click();

  // ── Copiar al portapapeles ────────────────────────
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.copy;
      const el = document.getElementById(id);
      if (!el) return;

      // Obtener texto plano (sin HTML de syntax highlight)
      const text = el.innerText ?? el.textContent ?? '';

      try {
        await navigator.clipboard.writeText(text.trim());
      } catch {
        // Fallback para contextos sin permisos de clipboard
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        Object.assign(ta.style, { position:'fixed', top:'-9999px', opacity:'0' });
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      btn.classList.add('copied');
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
        btn.disabled = false;
      }, 2000);
    });
  });

  // ── Reveal on scroll (IntersectionObserver) ───────
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Añadir índice para stagger en pkg-grid
  document.querySelectorAll('.pkg-grid .reveal').forEach((el, i) => {
    el.style.setProperty('--i', String(i));
  });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ── Smooth scroll para anclas internas ────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Cargar checksums.txt ──────────────────────────
  const csEl = document.getElementById('checksums-text');
  if (csEl) {
    fetch('packages/checksums.txt')
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(txt => { csEl.textContent = txt.trim(); })
      .catch(() => {
        csEl.textContent =
          'Los checksums se generan con cada release.\n' +
          'Disponibles en: https://github.com/ass-project/ass-src/releases';
      });
  }

  // ── Actualizar versión desde latest.json ──────────
  fetch('packages/latest.json')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      const v = data.version;
      if (!v) return;

      // Badge de versión en hero
      document.querySelectorAll('.hero__badge').forEach(el => {
        el.innerHTML = el.innerHTML.replace(/v[\d.]+(-\w+)?/, `v${v}`);
      });

      // Versión en terminal
      document.querySelectorAll('.t-banner, .t-ok').forEach(el => {
        if (el.textContent.includes('ASS v0.')) {
          el.innerHTML = el.innerHTML.replace(/ASS v[\d.]+/, `ASS v${v}`);
        }
      });

      // URLs de descarga en botones
      document.querySelectorAll('[href*="0.1.0"], [href*="ASS-0.1"]').forEach(el => {
        el.href = el.href
          .replace(/0\.1\.0/g, v)
          .replace(/ASS-[\d.]+/g, `ASS-${v}`);
      });
    })
    .catch(() => {});

  // ── Active nav link en scroll ─────────────────────
  const sections  = document.querySelectorAll('section[id], div[id="home"]');
  const navAnchors = document.querySelectorAll('.nav__links a[href^="#"]');

  const navIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}`
            ? 'var(--text)' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => navIO.observe(s));

});
