// ═══════════════════════════════════════════
//  SS Landing — app.js
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Nav scroll shadow ────────────────────
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ── Hamburger (mobile) ───────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav__links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.style.display === 'flex';
      navLinks.style.display = open ? '' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '64px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(10,10,15,.97)';
      navLinks.style.padding = '16px 24px 24px';
      navLinks.style.borderBottom = '1px solid rgba(255,255,255,.07)';
      if (open) navLinks.removeAttribute('style');
    });
  }

  // ── Tabs ─────────────────────────────────
  document.querySelectorAll('.tabs').forEach(tabs => {
    const btns   = tabs.querySelectorAll('.tab-btn');
    const panels = tabs.querySelectorAll('.tab-panel');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        btns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const panel = tabs.querySelector(`#tab-${target}`);
        if (panel) panel.classList.add('active');
      });
    });
  });

  // ── Copy buttons ─────────────────────────
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copy;
      const el = document.getElementById(targetId);
      if (!el) return;

      const text = el.innerText || el.textContent;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓ Copiado';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 1500);
      });
    });
  });

  // ── Cargar checksums desde JSON ──────────
  const checksumEl = document.getElementById('checksums-text');
  if (checksumEl) {
    fetch('packages/checksums.txt')
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(txt => { checksumEl.textContent = txt; })
      .catch(() => {
        checksumEl.textContent = [
          'Los checksums se generan automáticamente con cada release.',
          'Disponibles en: https://github.com/ass-project/ass-src/releases',
        ].join('\n');
      });
  }

  // ── Smooth scroll para links de nav ──────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        // Cerrar menú móvil si está abierto
        if (navLinks && navLinks.style.display === 'flex') {
          navLinks.removeAttribute('style');
        }
      }
    });
  });

  // ── Intersection observer: animaciones ───
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .pkg-card, .stat, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });

  // ── Detectar plataforma para resaltar tab ─
  const ua = navigator.userAgent.toLowerCase();
  let platform = 'linux';
  if (ua.includes('win'))  platform = 'windows';
  if (ua.includes('mac'))  platform = 'macos';

  const platformBtn = document.querySelector(`.tab-btn[data-tab="${platform}"]`);
  if (platformBtn) platformBtn.click();

  // ── Versión dinámica desde releases.json ─
  fetch('packages/latest.json')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      if (data.version) {
        document.querySelectorAll('.hero__badge').forEach(el => {
          el.innerHTML = el.innerHTML.replace(/v[\d.]+/, `v${data.version}`);
        });
        document.querySelectorAll('.footer__version').forEach(el => {
          el.textContent = `v${data.version}`;
        });
        // Actualizar URLs de descarga
        document.querySelectorAll('[href*="0.1.0"]').forEach(el => {
          el.href = el.href.replace(/0\.1\.0/g, data.version);
        });
      }
    })
    .catch(() => { /* Usar versión estática del HTML */ });

});
