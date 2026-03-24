// TODO: Replace with Razorpay integration
// invite.studio — Dummy Payment System
// ============================================================

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  const PRICE = 500; // INR

  // ── Helpers ─────────────────────────────────────────────
  function generateTxnId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'TXN';
    for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  function generateInviteId() {
    return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function markPurchased(templateId) {
    const purchases = JSON.parse(localStorage.getItem('is_purchases') || '{}');
    purchases[templateId] = { ts: Date.now(), txnId: generateTxnId() };
    localStorage.setItem('is_purchases', JSON.stringify(purchases));
    return purchases[templateId];
  }

  function isPurchased(templateId) {
    const purchases = JSON.parse(localStorage.getItem('is_purchases') || '{}');
    return !!purchases[templateId];
  }

  // ── Public API ───────────────────────────────────────────
  window.InvitePayment = {
    isPurchased,
    markPurchased,
    generateInviteId,

    /**
     * Show payment modal for a given template.
     * @param {string} templateId  - e.g. "birthday-1"
     * @param {string} templateName - Display name
     * @param {string} customizeUrl - Redirect URL after payment
     */
    showModal(templateId, templateName, customizeUrl) {
      // If already purchased, go straight to customize
      if (isPurchased(templateId)) {
        window.location.href = customizeUrl;
        return;
      }

      let modal = document.getElementById('pay-modal');
      if (!modal) modal = _createModal();

      // Populate
      modal.querySelector('.pay-template-name').textContent = templateName;
      modal.querySelector('.pay-amount-display').textContent = `₹${PRICE}`;

      // Reset to form state
      modal.querySelector('.pay-form').classList.remove('hide');
      modal.querySelector('.pay-success').classList.remove('show');

      // Pay button handler
      const payBtn = modal.querySelector('#pay-confirm-btn');
      const newPayBtn = payBtn.cloneNode(true); // remove old listeners
      payBtn.replaceWith(newPayBtn);
      newPayBtn.addEventListener('click', () => {
        _processPayment(modal, templateId, templateName, customizeUrl);
      });

      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    },

    closeModal() {
      const modal = document.getElementById('pay-modal');
      if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
    }
  };

  // ── Internal ─────────────────────────────────────────────
  function _processPayment(modal, templateId, templateName, customizeUrl) {
    const btn = modal.querySelector('#pay-confirm-btn');
    btn.textContent = 'Processing…';
    btn.disabled = true;

    // Simulate payment delay
    setTimeout(() => {
      const result = markPurchased(templateId);

      // Switch to success state
      modal.querySelector('.pay-form').classList.add('hide');
      const success = modal.querySelector('.pay-success');
      success.querySelector('.pay-tid').textContent = `Transaction ID: ${result.txnId}`;
      success.classList.add('show');

      // Auto-redirect after 2s
      setTimeout(() => {
        window.InvitePayment.closeModal();
        window.location.href = customizeUrl;
      }, 2000);
    }, 1200);
  }

  function _createModal() {
    const div = document.createElement('div');
    div.id = 'pay-modal';
    div.innerHTML = `
      <div class="pay-box">
        <div class="pay-form">
          <div class="pay-icon">🪷</div>
          <div class="pay-title">Complete Purchase</div>
          <div class="pay-sub">
            You're buying access to<br>
            <strong class="pay-template-name"></strong>
          </div>
          <div class="pay-amount pay-amount-display">₹500</div>
          <div style="font-size:0.72rem;color:#7a5530;margin-bottom:1.5rem;">One-time payment · Lifetime access</div>
          <button id="pay-confirm-btn" class="btn btn-primary" style="width:100%;padding:1rem;">
            Pay Now — ₹500
          </button>
          <p style="font-size:0.65rem;color:#b0906a;margin-top:1rem;letter-spacing:0.05em;">
            Secured by invite.studio · Demo mode
          </p>
        </div>
        <div class="pay-success">
          <div class="pay-icon">✅</div>
          <div class="pay-title" style="color:#1a7a30;">Payment Successful!</div>
          <div class="pay-sub">Your template is now unlocked. Redirecting you to customize it…</div>
          <div class="pay-tid" style="font-size:0.72rem;color:#7a5530;letter-spacing:0.05em;"></div>
        </div>
        <button onclick="window.InvitePayment.closeModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#c9942a;line-height:1;">✕</button>
      </div>`;
    document.body.appendChild(div);

    // Close on backdrop click
    div.addEventListener('click', (e) => {
      if (e.target === div) window.InvitePayment.closeModal();
    });

    return div;
  }

  // ── Auto-init buy buttons ────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-buy]').forEach(btn => {
      const templateId   = btn.dataset.buy;
      const templateName = btn.dataset.name || templateId;
      const customizeUrl = btn.dataset.customize || '#';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.InvitePayment.showModal(templateId, templateName, customizeUrl);
      });
    });
  });

})();
