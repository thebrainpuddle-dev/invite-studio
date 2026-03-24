// invite.studio — Customization Form Handler
// ============================================================

(function () {
  'use strict';

  const LS_KEY    = 'is_invites';
  const LS_PURCH  = 'is_purchases';

  // ── LocalStorage helpers ─────────────────────────────────
  function getInvites() {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  }
  function saveInvite(id, data) {
    const all = getInvites();
    all[id] = { ...data, _savedAt: Date.now() };
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  }
  function getInvite(id) {
    return getInvites()[id] || null;
  }

  // ── ID from URL ──────────────────────────────────────────
  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  // ── URL-encoded data helpers ───────────────────────────
  function encodeData(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }
  function decodeData(str) {
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
    catch { return null; }
  }
  function getUrlData() {
    const d = new URLSearchParams(window.location.search).get('d');
    return d ? decodeData(d) : null;
  }

  // ── Generate shareable ID ────────────────────────────────
  function generateId() {
    return Date.now().toString(36).toUpperCase() +
           Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  // ── Check purchase guard ─────────────────────────────────
  function isPurchased(templateId) {
    const p = JSON.parse(localStorage.getItem(LS_PURCH) || '{}');
    return !!p[templateId];
  }

  // ── Live preview: replace {{key}} tokens in preview pane ─
  function applyPreview(data, previewEl) {
    if (!previewEl) return;
    let html = previewEl.dataset.template || previewEl.innerHTML;
    if (!previewEl.dataset.template) previewEl.dataset.template = html;
    Object.keys(data).forEach(k => {
      const re = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
      html = html.replace(re, data[k] || `{{${k}}}`);
    });
    previewEl.innerHTML = html;
  }

  // ── Collect form data ────────────────────────────────────
  function collectForm(form) {
    const data = {};
    form.querySelectorAll('[name]').forEach(el => {
      data[el.name] = el.value.trim();
    });
    return data;
  }

  // ── Collect data from [data-preview] inputs ─────────────
  function collectPreviewInputs() {
    const data = {};
    document.querySelectorAll('[data-preview]').forEach(el => {
      const key = el.dataset.preview;
      const val = (el.value || '').trim();
      if (val) data[key] = val;
    });
    return data;
  }

  // ── Public API ───────────────────────────────────────────
  window.InviteCustomize = {
    getUrlId,
    getInvite,
    saveInvite,
    generateId,
    isPurchased,
    applyPreview,
    collectForm,
    encodeData,
    collectPreviewInputs,

    /** Build a shareable preview URL with embedded data from form inputs */
    generateShareUrl(baseUrl) {
      const data = collectPreviewInputs();
      return baseUrl + '?d=' + encodeData(data);
    },

    /**
     * Build a clean shareable invite URL for the /i/ viewer.
     * Format: /i/<human-slug>--<templateId>#<base64data>
     * @param {string} templateId - e.g. "wedding-1"
     * @param {object} [data]     - data to encode (defaults to collecting from form)
     */
    generateInviteUrl(templateId, data) {
      if (!data) {
        // Collect from both data-preview and name inputs, with formatting
        data = {};
        document.querySelectorAll('[data-preview]').forEach(el => {
          const key = el.dataset.preview;
          let val = (el.value || '').trim();
          if (el.type === 'date' && val) {
            const d = new Date(val + 'T12:00:00');
            if (!isNaN(d)) val = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
          } else if (el.type === 'time' && val) {
            const [h, m] = val.split(':').map(Number);
            if (!isNaN(h)) { const ap = h >= 12 ? 'PM' : 'AM'; val = `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`; }
          }
          if (val) data[key] = val;
        });
        const form = document.getElementById('customize-form');
        if (form) {
          form.querySelectorAll('[name]').forEach(el => {
            const key = el.name;
            if (data[key] !== undefined) return;
            let val = (el.value || '').trim();
            if (el.type === 'date' && val) {
              const d = new Date(val + 'T12:00:00');
              if (!isNaN(d)) val = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            } else if (el.type === 'time' && val) {
              const [h, m] = val.split(':').map(Number);
              if (!isNaN(h)) { const ap = h >= 12 ? 'PM' : 'AM'; val = `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`; }
            }
            if (val) data[key] = val;
          });
        }
      }

      // Build a human-readable slug from names
      const nameFields = ['groom','bride','groomName','brideName','name1','name2','name','family'];
      const parts = [];
      nameFields.forEach(k => { if (data[k]) parts.push(data[k].split(' ')[0].toLowerCase()); });
      const slug = (parts.length ? parts.slice(0, 2).join('-') : 'invite') + '--' + templateId;

      const encoded = encodeData(data);
      const origin = window.location.origin;
      const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('invite.studio');
      // Netlify: /i/<slug>#<data>  |  Local/other: /i/index.html#<templateId>.<data>
      if (isNetlify) {
        return origin + '/i/' + encodeURIComponent(slug) + '#' + encoded;
      }
      return origin + '/i/index.html#' + templateId + '.' + encoded;
    },

    /**
     * Initialize a customize page.
     * @param {string} templateId  - e.g. "birthday-1"
     * @param {string} previewUrl  - base URL of the preview page
     * @param {string} marketUrl   - URL to return to marketplace (default: /)
     */
    init(templateId, previewUrl, marketUrl = '/') {
      // Guard: redirect to preview page if not purchased so user can pay
      if (!isPurchased(templateId)) {
        window.location.href = previewUrl;
        return;
      }

      const form    = document.getElementById('customize-form');
      const preview = document.getElementById('live-preview');
      const shareEl = document.getElementById('share-url');
      const saveBannerEl = document.getElementById('save-banner');

      if (!form) return;

      // Pre-fill if returning to edit
      const existingId = getUrlId();
      if (existingId) {
        const saved = getInvite(existingId);
        if (saved) {
          Object.keys(saved).forEach(k => {
            const el = form.querySelector(`[name="${k}"]`);
            if (el) el.value = saved[k];
          });
          if (preview) applyPreview(saved, preview);
        }
      }

      // Live preview on input
      if (preview) {
        form.addEventListener('input', () => {
          applyPreview(collectForm(form), preview);
        });
      }

      // Form submit → save & generate shareable URL with data embedded
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id   = existingId || generateId();
        const data = collectForm(form);
        saveInvite(id, { ...data, _templateId: templateId });

        // Build shareable URL with data encoded in ?d= param
        const encoded = encodeData(data);
        const url = `${previewUrl}?d=${encoded}`;
        if (shareEl) {
          shareEl.value = url;
          shareEl.closest('.share-row')?.classList.remove('hidden');
        }
        if (saveBannerEl) {
          saveBannerEl.textContent = '✓ Invitation saved! Share the link below.';
          saveBannerEl.classList.add('show');
        }

        // Update browser URL without reload
        history.replaceState(null, '', `?id=${id}`);
      });

      // Copy link button
      document.getElementById('copy-link-btn')?.addEventListener('click', () => {
        const url = shareEl?.value;
        if (url) navigator.clipboard.writeText(url).then(() => {
          const btn = document.getElementById('copy-link-btn');
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy Link', 2000);
        });
      });

      // Preview button (opens preview in new tab)
      document.getElementById('open-preview-btn')?.addEventListener('click', () => {
        const id = getUrlId() || generateId();
        const data = collectForm(form);
        saveInvite(id, { ...data, _templateId: templateId });
        history.replaceState(null, '', `?id=${id}`);
        const encoded = encodeData(data);
        window.open(`${previewUrl}?d=${encoded}`, '_blank');
      });
    },

    /**
     * Initialize a preview page — loads data from URL ?d= (embedded)
     * or ?id= (localStorage), falling back to defaults.
     * @param {object} defaults - default demo data to show when no id present
     */
    initPreview(defaults) {
      const urlData = getUrlData();
      const id = getUrlId();
      const data = urlData || (id ? (getInvite(id) || defaults) : defaults);
      window._inviteData = data;

      // Replace all [data-field="key"] elements
      document.querySelectorAll('[data-field]').forEach(el => {
        const key = el.dataset.field;
        if (data[key] !== undefined && data[key] !== '') el.textContent = data[key];
      });

      // Replace background images
      document.querySelectorAll('[data-field-bg]').forEach(el => {
        const key = el.dataset.fieldBg;
        if (data[key]) el.style.backgroundImage = `url(${data[key]})`;
      });

      return data;
    }
  };

  // ── Scroll reveal (used on both preview + customize pages) ─
  document.addEventListener('DOMContentLoaded', () => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('v'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.r').forEach(el => obs.observe(el));
  });

})();
