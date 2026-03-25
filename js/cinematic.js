// invite.studio — Cinematic Transitions v2
// Apple depth parallax + Framer 3D reveals + progressive draws
// ============================================================
(function () {
  'use strict';

  const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

  // ── 1. HERO DEPTH PARALLAX — Apple "exploded view" ──────────
  // Each layer moves at its own speed, creating genuine Z-depth.
  // Background (gopuram) moves slowly — feels far away.
  // Text layers exit faster than scroll — feel close/foreground.
  function initHeroDepthParallax() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // Define layers: selector → speed coefficient
    //   speed > 0  : element translates DOWN relative to scroll → appears to move UP slowly (background / far away)
    //   speed < 0  : element translates UP extra → exits viewport faster than scroll (foreground / close)
    const layerDefs = [
      { sel: '.gopuram-container img',  speed:  0.30, scaleStart: 1.0,  scaleEnd: 1.08 }, // zoom toward temple as you scroll
      { sel: '.hero-garland',            speed:  0.14, fade: 3.2 },
      { sel: '.hero-diya-left',          speed: -0.05, fade: 2.8 },
      { sel: '.hero-diya-right',         speed: -0.05, fade: 2.8 },
      { sel: '.hero-shubh',              speed: -0.10, fade: 2.0 },
      { sel: '.hero-names',              speed: -0.18, fade: 1.8 },
      { sel: '.thirukkural-box',         speed: -0.24, fade: 2.2 },
      { sel: '.hero-date-box',           speed: -0.30, fade: 2.4 },
      { sel: '#countdown',               speed: -0.38, fade: 2.6 },
      { sel: '.kolam-container',         speed:  0.20, fade: 3.5 },
    ];

    const layers = layerDefs.map(def => {
      const el = def.sel.startsWith('#')
        ? document.getElementById(def.sel.slice(1))
        : hero.querySelector(def.sel);
      if (!el) return null;
      el.style.willChange = 'transform, opacity';
      return { el, ...def };
    }).filter(Boolean);

    // ── Load entrance animation ──
    // Show all hero text with stagger after loading screen closes
    const heroTextEls = [
      hero.querySelector('.hero-shubh'),
      hero.querySelector('.hero-names'),
      hero.querySelector('.thirukkural-box'),
      hero.querySelector('.hero-date-box'),
      document.getElementById('countdown'),
    ].filter(Boolean);

    heroTextEls.forEach((el, i) => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(32px)';
      el.style.transition = `opacity 0.85s ease-out ${280 + i * 110}ms, transform 0.85s ${EASE} ${280 + i * 110}ms`;
    });

    // Letter-spacing breathe on hero names
    const names = hero.querySelector('.hero-names');
    if (names) {
      names.style.letterSpacing = '0.30em';
      names.style.transition += `, letter-spacing 1.4s ${EASE} 200ms`;
    }

    let loadDone = false;
    function fireHeroEntrance() {
      if (loadDone) return;
      loadDone = true;
      heroTextEls.forEach(el => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      });
      if (names) names.style.letterSpacing = '0.05em';
    }

    const loader = document.getElementById('loading-screen') || document.getElementById('loader');
    if (loader) {
      // If loader is already hidden (e.g. ?preview=true mode), fire entrance immediately
      if (loader.style.display === 'none' || parseFloat(loader.style.opacity || '1') < 0.1) {
        setTimeout(fireHeroEntrance, 180);
      } else {
        const mo = new MutationObserver(() => {
          if (loader.style.display === 'none' || parseFloat(loader.style.opacity || '1') < 0.1) {
            setTimeout(fireHeroEntrance, 180);
            mo.disconnect();
          }
        });
        mo.observe(loader, { attributes: true, attributeFilter: ['style', 'class'] });
      }
    } else {
      setTimeout(fireHeroEntrance, 300);
    }

    // ── Scroll-driven depth ──
    let scrollStarted = false;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!scrollStarted) {
        // On first scroll: cut the load transitions so scroll feels instant
        scrollStarted = true;
        heroTextEls.forEach(el => { el.style.transition = 'none'; });
        if (names) names.style.transition = 'none';
      }

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH   = hero.offsetHeight;
        const t       = Math.min(scrollY / heroH, 1.0);

        layers.forEach(({ el, speed, scaleStart, scaleEnd, fade }) => {
          const ty = (scrollY * speed).toFixed(1);

          if (scaleStart !== undefined) {
            // Zoom: camera approaches temple as you scroll (scale grows)
            const scale = (scaleStart + t * (scaleEnd - scaleStart)).toFixed(4);
            el.style.transform = `scale(${scale}) translateY(${ty}px)`;
          } else {
            el.style.transform = `translateY(${ty}px)`;
          }

          if (fade !== undefined) {
            el.style.opacity = Math.max(0, 1 - t * fade).toFixed(3);
          }
        });

        ticking = false;
      });
    }, { passive: true });
  }

  // ── 2. SECTION REVEAL — Framer-style lift + scale ───────────
  // Replaces harsh clip-path with a smooth translateY + scale entrance.
  // Sections feel like cards sliding up from depth, not wiping in.
  function initSectionReveal() {
    const sections = document.querySelectorAll('section[id]:not(#hero)');
    sections.forEach(sec => {
      sec.style.opacity       = '0';
      sec.style.transform     = 'translateY(60px) scale(0.975)';
      sec.style.transformOrigin = 'top center';
      sec.style.transition    = `opacity 0.95s ${EASE}, transform 0.95s ${EASE}`;
      sec.style.willChange    = 'opacity, transform';
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateY(0) scale(1)';
        obs.unobserve(e.target);
      });
    }, { threshold: 0.04 });

    sections.forEach(s => obs.observe(s));
  }

  // ── 3. CARD REVEAL — 3D perspective tilt ────────────────────
  // Cards enter with a subtle rotateX so they appear to flip up from
  // the surface — the same micro-depth seen on Framer showcase sites.
  function initCardReveal3D() {
    const cards = document.querySelectorAll(
      '.event-card, .venue-card, .gallery-item, .inv-card,' +
      '.ceremony-card, .step-card, .timeline-card'
    );
    cards.forEach(card => {
      card.style.opacity         = '0';
      card.style.transform       = 'perspective(900px) rotateX(6deg) translateY(36px) scale(0.96)';
      card.style.transformOrigin = 'top center';
      card.style.transition      = `opacity 0.7s ${EASE}, transform 0.7s ${EASE}`;
      card.style.willChange      = 'opacity, transform';
    });

    const obs = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting);
      visible.forEach((e, i) => {
        const delay = i * 85;
        e.target.style.transitionDelay = `${delay}ms`;
        e.target.style.opacity         = '1';
        e.target.style.transform       = 'perspective(900px) rotateX(0deg) translateY(0) scale(1)';
        setTimeout(() => { e.target.style.transitionDelay = ''; }, 900 + delay);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    cards.forEach(c => obs.observe(c));
  }

  // ── 4. SECTION TITLE — slide up reveal ──────────────────────
  function initTitleReveal() {
    const titles = document.querySelectorAll(
      '.section-title, .section-heading, h2.title, .sec-title, .inv-names-script'
    );
    titles.forEach(title => {
      title.style.overflow = 'hidden';
      title.style.display  = 'block';
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el    = e.target;
        const delay = parseInt(el.dataset.delay || 0);
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(42px)';
        el.style.transition = `opacity 0.82s ${EASE} ${delay}ms, transform 0.82s ${EASE} ${delay}ms`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }));
        obs.unobserve(el);
      });
    }, { threshold: 0.18 });

    titles.forEach(t => obs.observe(t));
  }

  // ── 5. IMAGE ZOOM-IN on enter ────────────────────────────────
  function initImageReveal() {
    const imgs = document.querySelectorAll(
      '.gallery-item img, .venue-img, .hero-photo, .couple-photo, .venue-photo'
    );
    imgs.forEach(img => {
      img.style.transform  = 'scale(1.09)';
      img.style.opacity    = '0';
      img.style.transition = `transform 1.15s ${EASE}, opacity 0.85s ease-out`;
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.transform = 'scale(1)';
        e.target.style.opacity   = '1';
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12 });

    imgs.forEach(i => obs.observe(i));
  }

  // ── 6. EYEBROW — slide from left ─────────────────────────────
  function initEyebrowReveal() {
    const eyebrows = document.querySelectorAll('.section-eyebrow, .section-label, .sec-tag');
    eyebrows.forEach(el => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateX(-28px)';
      el.style.transition = `opacity 0.65s ease-out, transform 0.65s ${EASE}`;
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateX(0)';
        obs.unobserve(e.target);
      });
    }, { threshold: 0.28 });

    eyebrows.forEach(e => obs.observe(e));
  }

  // ── 7. DIVIDER draw animation ─────────────────────────────────
  function initDividerDraw() {
    const dividers = document.querySelectorAll('.divider-line, .section-divider-line');
    dividers.forEach(el => {
      el.style.transformOrigin = 'left center';
      el.style.transform       = 'scaleX(0)';
      el.style.transition      = `transform 0.95s ${EASE}`;
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.transform = 'scaleX(1)';
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });

    dividers.forEach(d => obs.observe(d));
  }

  // ── 8. TIMELINE LINE — progressive draw on scroll ────────────
  // Draws the vertical connecting line as you scroll through the ceremony timeline,
  // so events "connect" visually as you read down.
  function initTimelineDraw() {
    const MOBILE_BREAK = 640;
    const isMobile = () => window.innerWidth <= MOBILE_BREAK;

    document.querySelectorAll('.timeline').forEach(timeline => {
      const line = document.createElement('div');
      line.setAttribute('aria-hidden', 'true');

      function applyLinePosition() {
        const mobile = isMobile();
        // Desktop: center of 3-col grid at 50%; Mobile: center of 40px dot column at ~19px
        line.style.left      = mobile ? '19px' : '50%';
        line.style.transform = `translateX(${mobile ? '0' : '-50%'}) scaleY(0)`;
      }

      line.style.cssText = [
        'position:absolute', 'top:0', 'bottom:0', 'width:2px',
        'background:linear-gradient(180deg,transparent,var(--gold,#c9942a) 8%,var(--gold,#c9942a) 92%,transparent)',
        'transform-origin:top center',
        'pointer-events:none', 'z-index:1',
        'will-change:transform',
      ].join(';');
      applyLinePosition();
      timeline.appendChild(line);
      timeline.classList.add('js-timeline-draw');

      window.addEventListener('resize', applyLinePosition, { passive: true });

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const rect     = timeline.getBoundingClientRect();
          const viewH    = window.innerHeight;
          const progress = Math.max(0, Math.min(1,
            (-rect.top + viewH * 0.75) / (rect.height + viewH * 0.3)
          ));
          const tx = isMobile() ? '0' : '-50%';
          line.style.transform = `translateX(${tx}) scaleY(${progress.toFixed(4)})`;
          ticking = false;
        });
      }, { passive: true });
    });
  }

  // ── 9. SCROLL PROGRESS BAR ────────────────────────────────────
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${(window.scrollY / total).toFixed(4)})`;
        ticking = false;
      });
    }, { passive: true });
  }

  // ── 10. GALLERY DEPTH PARALLAX ────────────────────────────────
  // Gallery images subtly shift at different speeds as you scroll,
  // giving the grid a living, layered feel.
  function initGalleryDepth() {
    const items = document.querySelectorAll('.gallery-item');
    if (items.length < 2) return;

    // Alternate odd/even rows move at slightly different speeds
    items.forEach((item, i) => {
      item.style.willChange = 'transform';
      // Small offset based on column position
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        items.forEach((item, i) => {
          const rect   = item.getBoundingClientRect();
          const viewH  = window.innerHeight;
          const center = rect.top + rect.height / 2 - viewH / 2;
          // Items in different columns shift slightly
          const shift  = (i % 3 === 0) ? -0.04 : (i % 3 === 1) ? 0.04 : -0.02;
          const ty     = (center * shift).toFixed(1);
          item.style.transform = `translateY(${ty}px)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  // ── INIT ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    initHeroDepthParallax();
    initSectionReveal();
    initCardReveal3D();
    initTitleReveal();
    initImageReveal();
    initEyebrowReveal();
    initDividerDraw();
    initTimelineDraw();
    initScrollProgress();
    initGalleryDepth();
  });

})();
