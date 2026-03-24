// invite.studio — Share UI for customize pages
// =============================================
(function () {
  'use strict';

  // Get template ID from body attribute (set by live-preview.js convention)
  var templateFile = document.body.dataset.previewTemplate || '';
  // Derive template ID: "wedding-1.html" → "wedding-1"
  var templateId = templateFile.replace('.html', '');
  if (!templateId) return;

  // ── Inject styles ──
  var style = document.createElement('style');
  style.textContent =
    '.share-section{margin-top:20px;padding:18px 20px;background:rgba(201,148,42,0.06);' +
    'border:1px solid rgba(201,148,42,0.2);border-radius:6px;}' +
    '.share-section-title{font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;' +
    'color:#c9942a;margin-bottom:12px;}' +
    '.share-link-row{display:flex;gap:8px;margin-bottom:10px;}' +
    '.share-link-input{flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(201,148,42,0.3);' +
    'color:#fdf6e3;padding:8px 12px;font-size:0.8rem;font-family:monospace;border-radius:4px;' +
    'outline:none;min-width:0;}' +
    '.share-link-input:focus{border-color:#c9942a;}' +
    '.share-btn{padding:8px 16px;border:none;border-radius:4px;font-size:0.78rem;' +
    'font-family:inherit;font-weight:600;cursor:pointer;letter-spacing:0.05em;' +
    'transition:transform 0.15s,box-shadow 0.15s;white-space:nowrap;}' +
    '.share-btn:hover{transform:translateY(-1px);}' +
    '.share-btn-generate{background:linear-gradient(135deg,#c9942a,#e8b84b);color:#2a1200;}' +
    '.share-btn-copy{background:rgba(201,148,42,0.15);color:#c9942a;border:1px solid rgba(201,148,42,0.4);}' +
    '.share-btn-copy:hover{background:rgba(201,148,42,0.25);}' +
    '.share-actions{display:flex;gap:8px;flex-wrap:wrap;}' +
    '.share-btn-wa{background:#25D366;color:#fff;}' +
    '.share-btn-wa:hover{box-shadow:0 4px 12px rgba(37,211,102,0.4);}' +
    '.share-hidden{display:none;}';
  document.head.appendChild(style);

  // ── Find insertion point ──
  // Insert after the last button in the form panel
  var formPanel = document.querySelector('.form-panel, .customize-form-panel');
  if (!formPanel) return;

  // ── Build share section HTML ──
  var section = document.createElement('div');
  section.className = 'share-section';
  section.innerHTML =
    '<div class="share-section-title">Share Your Invitation</div>' +
    '<button class="share-btn share-btn-generate" id="share-generate-btn">' +
    'Get Shareable Link</button>' +
    '<div class="share-hidden" id="share-result">' +
    '<div class="share-link-row" style="margin-top:12px;">' +
    '<input class="share-link-input" id="share-invite-url" type="text" readonly />' +
    '<button class="share-btn share-btn-copy" id="share-copy-btn">Copy</button>' +
    '</div>' +
    '<div class="share-actions">' +
    '<button class="share-btn share-btn-wa" id="share-wa-btn">Share on WhatsApp</button>' +
    '</div>' +
    '</div>';

  formPanel.appendChild(section);

  // ── Event handlers ──
  var urlInput = document.getElementById('share-invite-url');
  var resultDiv = document.getElementById('share-result');

  document.getElementById('share-generate-btn').addEventListener('click', function () {
    if (typeof InviteCustomize === 'undefined' || !InviteCustomize.generateInviteUrl) return;
    var url = InviteCustomize.generateInviteUrl(templateId);
    urlInput.value = url;
    resultDiv.classList.remove('share-hidden');
    this.textContent = 'Link Updated!';
    var btn = this;
    setTimeout(function () { btn.textContent = 'Get Shareable Link'; }, 2000);
  });

  document.getElementById('share-copy-btn').addEventListener('click', function () {
    var url = urlInput.value;
    if (!url) return;
    var btn = this;
    navigator.clipboard.writeText(url).then(function () {
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = 'Copy'; }, 2000);
    });
  });

  document.getElementById('share-wa-btn').addEventListener('click', function () {
    var url = urlInput.value;
    if (!url) return;
    window.open('https://wa.me/?text=' + encodeURIComponent('You\'re invited! Open your invitation here: ' + url), '_blank');
  });
})();
