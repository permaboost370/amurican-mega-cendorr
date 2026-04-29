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

// Vault & Furnace: live locked / burned scoreboard
(function () {
  const TOKEN_CA      = '5cNjpWpx31jvHqE8HDM6X61PD8qoXePeakA25H9Ppump';
  const TOTAL_SUPPLY  = 1_000_000_000;
  const LOCKED_PCT    = 0.025;
  const BURNED_PCT    = 0.085;
  const REFRESH_MS    = 30_000;

  const vault = document.getElementById('vault');
  if (!vault) return;

  const fmtUsd = (n) => {
    if (!Number.isFinite(n)) return '—';
    if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B';
    if (n >= 1_000_000)     return '$' + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1_000)         return '$' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n >= 1)             return '$' + n.toFixed(2);
    return '$' + n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  };
  const fmtTokens = (n) => Math.round(n).toLocaleString('en-US');
  const fmtPrice  = (n) => {
    if (!Number.isFinite(n)) return '—';
    if (n >= 1)        return '$' + n.toFixed(4);
    if (n >= 0.0001)   return '$' + n.toFixed(6);
    return '$' + n.toExponential(2);
  };

  // count-up animator
  function countUp(el, target, opts = {}) {
    const dur = opts.duration ?? 1800;
    const fmt = opts.formatter ?? ((v) => v.toFixed(opts.decimals ?? 0));
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // reveal-once animations
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    vault.classList.add('in');

    vault.querySelectorAll('.tile-num').forEach((el) => {
      const target = parseFloat(el.dataset.target);
      if (!Number.isFinite(target)) return;
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      countUp(el, target, {
        duration: decimals > 0 ? 1500 : 2000,
        formatter: decimals > 0
          ? (v) => v.toFixed(decimals)
          : (v) => fmtTokens(v),
      });
    });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { reveal(); io.disconnect(); }
      }),
      { threshold: 0.25 }
    );
    io.observe(vault);
  } else {
    reveal();
  }

  // live USD via DexScreener
  const usdLockedEl = vault.querySelector('.usd-locked');
  const usdBurnedEl = vault.querySelector('.usd-burned');
  const usdPriceEl  = vault.querySelector('.usd-price');
  const usdMcapEl   = vault.querySelector('.usd-mcap');
  const liveEl      = document.getElementById('vaultLive');

  let lastPrice = null;

  const setText = (el, text, bump) => {
    if (!el) return;
    el.textContent = text;
    if (bump) {
      el.classList.remove('usd-bump');
      void el.offsetWidth;
      el.classList.add('usd-bump');
    }
  };

  async function fetchPrice() {
    try {
      const r = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_CA}`,
        { cache: 'no-store' }
      );
      if (!r.ok) throw new Error('http ' + r.status);
      const d = await r.json();
      const pairs = (d.pairs || []).filter((p) => p.chainId === 'solana');
      if (!pairs.length) return;
      pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      const best = pairs[0];
      const price = parseFloat(best.priceUsd);
      if (!Number.isFinite(price) || price <= 0) return;

      const mcap   = price * TOTAL_SUPPLY;
      const locked = price * TOTAL_SUPPLY * LOCKED_PCT;
      const burned = price * TOTAL_SUPPLY * BURNED_PCT;
      const changed = lastPrice !== null && lastPrice !== price;

      setText(usdLockedEl, fmtUsd(locked), changed);
      setText(usdBurnedEl, fmtUsd(burned), changed);
      setText(usdPriceEl,  fmtPrice(price), changed);
      setText(usdMcapEl,   fmtUsd(mcap),   changed);

      if (changed && liveEl) {
        liveEl.classList.remove('flicker');
        void liveEl.offsetWidth;
        liveEl.classList.add('flicker');
      }
      lastPrice = price;
    } catch (e) {
      // silent — keep prior values
    }
  }

  fetchPrice();
  setInterval(fetchPrice, REFRESH_MS);
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
