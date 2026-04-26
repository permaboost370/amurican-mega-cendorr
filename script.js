// $AMC — Amurican Mega Cendorr — interactions

// Copy-to-clipboard helpers
(function () {
  const showToast = (msg) => {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  };

  const wireCopy = (triggerEl, addrEl, btnEl, btnLabel = '📋 COPY') => {
    if (!triggerEl || !addrEl) return;
    triggerEl.addEventListener('click', async () => {
      const text = addrEl.textContent.trim();
      if (!text || text.toUpperCase() === 'TBA') {
        showToast('CA NOT REVEALED YET — STAY TUNED');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        if (btnEl) btnEl.textContent = '✓ COPIED';
        showToast('CONTRACT COPIED — MOVIEZ GO HIYOR!!!');
        setTimeout(() => { if (btnEl) btnEl.textContent = btnLabel }, 1500);
      } catch (e) {
        const r = document.createRange();
        r.selectNodeContents(addrEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        showToast('SELECT + COPY');
      }
    });
  };

  wireCopy(
    document.getElementById('contractPill'),
    document.getElementById('contractAddr'),
    document.getElementById('copyBtn')
  );
  wireCopy(
    document.getElementById('contractDisplay'),
    document.getElementById('contractAddrBig'),
    document.getElementById('copyBtnBig')
  );
})();

// Reveal-on-scroll
(function () {
  const targets = document.querySelectorAll(
    '.section-header, .lore-card, .ticket, .step, .poster, .cta'
  );
  targets.forEach((el) => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => io.observe(el));
})();

// Tilt-on-hover for posters (subtle)
(function () {
  const posters = document.querySelectorAll('.poster');
  posters.forEach((p) => {
    p.addEventListener('mousemove', (e) => {
      const r = p.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      p.style.transform = `rotate(0deg) scale(1.04) perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    });
    p.addEventListener('mouseleave', () => {
      p.style.transform = '';
    });
  });
})();

// Konami-ish easter egg: typing "amc" anywhere fires popcorn
(function () {
  let buf = '';
  window.addEventListener('keydown', (e) => {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-3);
    if (buf === 'amc') popcornBurst();
  });

  function popcornBurst() {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const k = document.createElement('div');
      k.textContent = '🍿';
      Object.assign(k.style, {
        position: 'fixed',
        left: Math.random() * 100 + 'vw',
        top: '-30px',
        fontSize: 18 + Math.random() * 22 + 'px',
        zIndex: 999,
        pointerEvents: 'none',
        transition: 'transform 2.6s linear, opacity 2.6s linear',
      });
      document.body.appendChild(k);
      requestAnimationFrame(() => {
        k.style.transform = `translateY(${window.innerHeight + 60}px) rotate(${Math.random() * 720 - 360}deg)`;
        k.style.opacity = '0';
      });
      setTimeout(() => k.remove(), 2800);
    }
  }
})();
