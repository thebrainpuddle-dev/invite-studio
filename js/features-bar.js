// invite.studio — Floating Features Bar
// Injected into all template preview pages automatically.
// ============================================================

(function () {
  'use strict';

  // Determine template ID and invite ID from page context or URL
  const params   = new URLSearchParams(window.location.search);
  const inviteId = params.get('id') || '';

  // Template ID is embedded by each page as window._templateId
  // Falls back to parsing the path
  function getTemplateId() {
    if (window._templateId) return window._templateId;
    const path = window.location.pathname;
    const match = path.match(/templates\/[^/]+\/([^/]+)\.html/);
    return match ? match[1] : 'unknown';
  }

  // Derive event code: use inviteId if present, else generate/read from localStorage
  function getEventCode() {
    if (inviteId) return inviteId;
    const key = 'is_event_' + getTemplateId();
    let code = localStorage.getItem(key);
    if (!code) {
      code = 'EVT_' + Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(key, code);
    }
    return code;
  }

  function getDepth() {
    // Count how many directories deep we are from root
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    // If path contains "templates/category/file.html" → depth 2
    const idx = parts.indexOf('templates');
    return idx >= 0 ? parts.length - idx - 1 : 0;
  }

  function rootPrefix() {
    const depth = getDepth();
    return depth >= 2 ? '../../' : depth === 1 ? '../' : '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const templateId = getTemplateId();
    const eventCode  = getEventCode();
    const root       = rootPrefix();

    // ── Build URLs ──────────────────────────────────────────
    const videoUrl  = `${root}video-preview.html?template=${templateId}${inviteId ? '&id=' + inviteId : ''}`;
    const rsvpUrl   = `${root}rsvp.html?event=${eventCode}`;
    const vaultUrl  = `${root}memory-vault.html?event=${eventCode}`;
    const hostUrl   = `${root}rsvp.html?event=${eventCode}&host=1`;

    // ── Inject CSS ──────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
      #is-fab {
        position: fixed;
        bottom: 2rem;
        right: 1.5rem;
        z-index: 500;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.6rem;
      }
      #is-fab-toggle {
        width: 52px; height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7b1818, #c9942a);
        border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.4rem;
        box-shadow: 0 4px 20px rgba(201,148,42,0.4);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        color: #fff;
      }
      #is-fab-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 30px rgba(201,148,42,0.55);
      }
      #is-fab-menu {
        display: flex; flex-direction: column; gap: 0.5rem;
        opacity: 0; pointer-events: none;
        transform: translateY(10px) scale(0.95);
        transform-origin: bottom right;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      #is-fab-menu.open {
        opacity: 1; pointer-events: auto;
        transform: translateY(0) scale(1);
      }
      .is-fab-btn {
        display: flex; align-items: center; gap: 0.6rem;
        background: linear-gradient(135deg, rgba(26,8,0,0.95), rgba(40,12,0,0.98));
        border: 1px solid rgba(201,148,42,0.45);
        color: #f5dfa0;
        padding: 0.6rem 1rem;
        border-radius: 2px;
        font-family: 'Inter', sans-serif;
        font-size: 0.72rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        text-decoration: none;
        cursor: pointer;
        white-space: nowrap;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
      }
      .is-fab-btn:hover {
        background: linear-gradient(135deg, #7b1818, #9b2020);
        border-color: rgba(201,148,42,0.75);
        transform: translateX(-4px);
      }
      .is-fab-btn .fab-icon { font-size: 1rem; flex-shrink: 0; }
      .is-fab-btn .fab-label { font-family: inherit; }

      /* Premium badge (top-right on purchase banner area) */
      .is-premium-badge {
        display: inline-flex; align-items: center; gap: 0.3rem;
        background: linear-gradient(135deg, #c9942a, #e8b84b);
        color: #1a0800;
        font-size: 0.62rem; font-weight: 700;
        letter-spacing: 0.15em; text-transform: uppercase;
        padding: 0.2rem 0.6rem; border-radius: 20px;
        margin-left: 0.5rem; vertical-align: middle;
      }

      @media (max-width: 640px) {
        #is-fab { bottom: 1rem; right: 1rem; }
        .is-fab-btn { font-size: 0.68rem; padding: 0.55rem 0.9rem; }
      }
    `;
    document.head.appendChild(style);

    // ── Build FAB HTML ───────────────────────────────────────
    const fab = document.createElement('div');
    fab.id = 'is-fab';
    fab.innerHTML = `
      <div id="is-fab-menu">
        <a href="${videoUrl}" class="is-fab-btn" title="Watch as animated video invitation">
          <span class="fab-icon">🎬</span>
          <span class="fab-label">Video Mode</span>
        </a>
        <a href="${rsvpUrl}" class="is-fab-btn" target="_blank" rel="noopener" title="RSVP to this event">
          <span class="fab-icon">✅</span>
          <span class="fab-label">RSVP</span>
        </a>
        <a href="${vaultUrl}" class="is-fab-btn" target="_blank" rel="noopener" title="View & upload event photos">
          <span class="fab-icon">📸</span>
          <span class="fab-label">Memory Vault</span>
        </a>
        <a href="${hostUrl}" class="is-fab-btn" target="_blank" rel="noopener" title="Host dashboard — view RSVPs">
          <span class="fab-icon">📊</span>
          <span class="fab-label">Host Dashboard</span>
        </a>
      </div>
      <button id="is-fab-toggle" aria-label="Toggle features menu" title="invite.studio features">✦</button>
    `;
    document.body.appendChild(fab);

    // Toggle open/close
    const toggle = fab.querySelector('#is-fab-toggle');
    const menu   = fab.querySelector('#is-fab-menu');
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.textContent = isOpen ? '✕' : '✦';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target)) {
        menu.classList.remove('open');
        toggle.textContent = '✦';
      }
    });

    // ── QR Code on invite pages (if inviteId present) ────────
    // Append a small "Share" QR section before footer if data-field elements exist
    if (inviteId && document.querySelectorAll('[data-field]').length > 0) {
      const shareSection = document.createElement('div');
      shareSection.style.cssText = `
        text-align:center; padding:2rem 1rem; background:rgba(201,148,42,0.06);
        border-top:1px solid rgba(201,148,42,0.2);
      `;
      const shareUrl = encodeURIComponent(window.location.href);
      shareSection.innerHTML = `
        <p style="font-family:'Inter',sans-serif;font-size:0.65rem;letter-spacing:0.4em;text-transform:uppercase;color:rgba(201,148,42,0.7);margin-bottom:0.8rem;">Share This Invitation</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=c9942a&bgcolor=fdf6e3&data=${shareUrl}"
             alt="QR Code" style="width:100px;height:100px;border:4px solid rgba(201,148,42,0.3);display:inline-block;">
        <p style="font-family:'Inter',sans-serif;font-size:0.7rem;color:rgba(201,148,42,0.5);margin-top:0.5rem;">Scan to open on phone</p>
      `;
      // Insert before footer or at end of body
      const footer = document.querySelector('footer');
      if (footer) footer.before(shareSection);
      else document.body.appendChild(shareSection);
    }
  });

})();
