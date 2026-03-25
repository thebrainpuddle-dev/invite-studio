// invite.studio — Global UX Polish Script
// Emil Kowalski principles: stagger reveals, smooth navbar, precise timing
// ============================================================
(function () {
  'use strict';

  // ── WhatsApp floating button ─────────────────────────────────
  function injectWhatsApp() {
    if (document.getElementById('wa-chat-btn')) return;
    const phone = '919999999999';
    const msg   = encodeURIComponent('Hi! I have a question about invite.studio');
    const link  = document.createElement('a');
    link.id     = 'wa-chat-btn';
    link.href   = `https://wa.me/${phone}?text=${msg}`;
    link.target = '_blank';
    link.rel    = 'noopener noreferrer';
    link.innerHTML = '💬';
    link.setAttribute('aria-label', 'Chat on WhatsApp');
    document.body.appendChild(link);

    const tip = document.createElement('span');
    tip.id = 'wa-chat-tooltip';
    tip.textContent = 'Chat with us';
    document.body.appendChild(tip);
  }

  // ── Smooth scroll for all anchor links ──────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── Lazy-load images (native + fade-in) ─────────────────────
  function initLazyImages() {
    document.querySelectorAll('img:not([loading])').forEach((img, i) => {
      if (i > 1) img.setAttribute('loading', 'lazy');
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
      if (img.complete) {
        img.style.opacity = '1';
      } else {
        img.addEventListener('load', () => { img.style.opacity = '1'; });
        img.addEventListener('error', () => {
          img.style.opacity = '0.4';
        });
      }
    });
  }

  // ── Animated counter for stat numbers ───────────────────────
  function animateCounter(el, target, duration) {
    const startTime = performance.now();
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Emil: ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = prefix + current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function initCounters() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const val = parseInt(el.dataset.count, 10);
          if (!isNaN(val)) animateCounter(el, val, 1600);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
  }

  // ── Scroll reveal with batch stagger (Emil pattern) ─────────
  function initScrollReveal() {
    const obs = new IntersectionObserver((entries) => {
      // Batch: stagger items that become visible in the same frame
      const visibles = entries.filter(e => e.isIntersecting && !e.target.classList.contains('v'));
      visibles.forEach((e, batchIdx) => {
        const delay = Math.min(batchIdx * 60, 280);
        e.target.style.transitionDelay = `${delay}ms`;
        e.target.classList.add('v');
        // Clean up delay after animation completes
        setTimeout(() => { e.target.style.transitionDelay = ''; }, 600 + delay);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.r').forEach(el => {
      // Skip hero content items if they're revealed manually by splash screen
      if (!el.closest('.hero-content') || !document.getElementById('loading-screen')) {
        obs.observe(el);
      }
    });
  }

  // ── Navbar hide/show on scroll (Emil: smooth, not jarring) ──
  function initNavScroll() {
    const nav = document.querySelector('nav, .navbar, #navbar');
    if (!nav) return;
    let lastY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > lastY && y > 150) {
          nav.style.transform = 'translateY(-100%)';
        } else {
          nav.style.transform = 'translateY(0)';
        }
        // Add shadow when scrolled
        if (y > 10) {
          nav.style.boxShadow = '0 1px 12px rgba(0,0,0,0.06)';
        } else {
          nav.style.boxShadow = 'none';
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  // ── Image error fallback ─────────────────────────────────────
  function initImgFallbacks() {
    document.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', function () {
        const fb = this.dataset.fallback;
        if (fb && this.src !== fb) this.src = fb;
      });
    });
  }

  // ── Init all ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    injectWhatsApp();
    initSmoothScroll();
    initLazyImages();
    initCounters();
    initScrollReveal();
    initNavScroll();
    initImgFallbacks();
  });

})();
