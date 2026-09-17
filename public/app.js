/**
 * SnapLink - Client Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const shortenForm = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const customSlugToggle = document.getElementById('customSlugToggle');
  const customSlugContainer = document.getElementById('customSlugContainer');
  const customSlugInput = document.getElementById('customSlugInput');
  const aliasHostPrefix = document.getElementById('aliasHostPrefix');
  const shortenBtn = document.getElementById('shortenBtn');

  const resultContainer = document.getElementById('resultContainer');
  const resultShortLink = document.getElementById('resultShortLink');
  const resultOriginalUrl = document.getElementById('resultOriginalUrl');
  const reductionBadge = document.getElementById('reductionBadge');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const qrResultBtn = document.getElementById('qrResultBtn');

  const linksTableBody = document.getElementById('linksTableBody');
  const emptyState = document.getElementById('emptyState');
  const linksCountBadge = document.getElementById('linksCountBadge');
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');

  const qrModal = document.getElementById('qrModal');
  const closeQrModal = document.getElementById('closeQrModal');
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const qrTargetUrl = document.getElementById('qrTargetUrl');
  const downloadQrBtn = document.getElementById('downloadQrBtn');
  const modalCopyBtn = document.getElementById('modalCopyBtn');

  const themeToggle = document.getElementById('themeToggle');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const toastContainer = document.getElementById('toastContainer');

  // State
  let allLinks = [];
  let currentActiveShortUrl = '';

  // Initialize Host prefix
  aliasHostPrefix.textContent = `${window.location.host}/`;

  // Initialize Theme
  initTheme();

  // Load Initial Links
  fetchLinks();

  // Event Listeners
  customSlugToggle.addEventListener('change', () => {
    if (customSlugToggle.checked) {
      customSlugContainer.classList.add('active');
      customSlugInput.focus();
    } else {
      customSlugContainer.classList.remove('active');
      customSlugInput.value = '';
    }
  });

  themeToggle.addEventListener('click', toggleTheme);

  shortenForm.addEventListener('submit', handleShortenSubmit);

  copyResultBtn.addEventListener('click', () => {
    copyToClipboard(resultShortLink.href, copyResultBtn);
  });

  qrResultBtn.addEventListener('click', () => {
    openQrModal(resultShortLink.href);
  });

  searchInput.addEventListener('input', () => {
    renderLinksTable();
  });

  refreshBtn.addEventListener('click', () => {
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => { refreshBtn.style.transform = 'none'; }, 400);
    fetchLinks();
  });

  // Modal handlers
  closeQrModal.addEventListener('click', closeQr);
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) closeQr();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && qrModal.classList.contains('active')) {
      closeQr();
    }
  });

  downloadQrBtn.addEventListener('click', () => {
    const svgElement = qrCodeContainer.querySelector('svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `snaplink-qr-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
    showToast('QR code downloaded as SVG!', 'success');
  });

  modalCopyBtn.addEventListener('click', () => {
    copyToClipboard(currentActiveShortUrl, modalCopyBtn);
  });

  // --- Handlers & Helpers ---

  async function handleShortenSubmit(e) {
    e.preventDefault();
    const url = urlInput.value.trim();
    const customSlug = customSlugToggle.checked ? customSlugInput.value.trim() : undefined;

    if (!url) {
      showToast('Please enter a URL to reduce', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customSlug: customSlug || undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      // Success
      displayResult(data.link);
      showToast('Link reduced successfully!', 'success');

      // Clear input fields
      urlInput.value = '';
      if (customSlugToggle.checked) {
        customSlugToggle.checked = false;
        customSlugContainer.classList.remove('active');
        customSlugInput.value = '';
      }

      // Refresh list
      fetchLinks();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function displayResult(link) {
    resultContainer.classList.add('active');
    resultShortLink.href = link.shortUrl;
    resultShortLink.querySelector('span').textContent = link.shortUrl;
    resultOriginalUrl.textContent = link.original_url;

    const originalLen = link.original_url.length;
    const shortLen = link.shortUrl.length;
    if (originalLen > shortLen) {
      const percent = Math.round(((originalLen - shortLen) / originalLen) * 100);
      reductionBadge.textContent = `Saved ${percent}% length (${originalLen} → ${shortLen} chars)`;
      reductionBadge.style.display = 'inline-block';
    } else {
      reductionBadge.style.display = 'none';
    }

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function fetchLinks() {
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      if (res.ok && data.success) {
        allLinks = data.links || [];
        renderLinksTable();
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  }

  function renderLinksTable() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = allLinks.filter(l =>
      l.slug.toLowerCase().includes(query) ||
      l.original_url.toLowerCase().includes(query) ||
      l.shortUrl.toLowerCase().includes(query)
    );

    linksCountBadge.textContent = allLinks.length;

    if (filtered.length === 0) {
      linksTableBody.innerHTML = '';
      emptyState.style.display = 'block';
      if (allLinks.length > 0 && query) {
        emptyState.querySelector('h3').textContent = 'No matching links found';
        emptyState.querySelector('p').textContent = 'Try adjusting your search query.';
      } else {
        emptyState.querySelector('h3').textContent = 'No shortened links yet';
        emptyState.querySelector('p').textContent = 'Paste a long URL in the box above to create your first reduced link!';
      }
      return;
    }

    emptyState.style.display = 'none';

    linksTableBody.innerHTML = filtered.map(link => {
      const dateFormatted = formatDate(link.created_at);
      return `
        <tr data-slug="${escapeHtml(link.slug)}">
          <td class="col-short">
            <a href="${escapeHtml(link.shortUrl)}" target="_blank" rel="noopener noreferrer">
              <span>${escapeHtml(link.shortUrl)}</span>
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </td>
          <td class="col-original" title="${escapeHtml(link.original_url)}">
            ${escapeHtml(link.original_url)}
          </td>
          <td>
            <span class="clicks-badge" title="Total clicks / visits">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              ${link.clicks}
            </span>
          </td>
          <td class="col-date">${dateFormatted}</td>
          <td>
            <div class="table-actions" style="justify-content: flex-end;">
              <button class="btn-table-icon" title="Copy Short Link" onclick="window.SnapLinkApp.copy('${escapeHtml(link.shortUrl)}', this)">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="btn-table-icon" title="View QR Code" onclick="window.SnapLinkApp.openQr('${escapeHtml(link.shortUrl)}')">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button class="btn-table-icon delete" title="Delete Link" onclick="window.SnapLinkApp.delete('${escapeHtml(link.slug)}')">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function deleteLink(slug) {
    if (!confirm(`Are you sure you want to delete the shortened link /${slug}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/links/${encodeURIComponent(slug)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Link removed successfully', 'success');
        fetchLinks();
      } else {
        showToast(data.error || 'Could not delete link', 'error');
      }
    } catch (err) {
      showToast('Network error while deleting link', 'error');
    }
  }

  function openQrModal(url) {
    currentActiveShortUrl = url;
    qrTargetUrl.textContent = url;
    if (window.QRCode && window.QRCode.toSVG) {
      qrCodeContainer.innerHTML = window.QRCode.toSVG(url, { size: 210 });
    } else {
      qrCodeContainer.innerHTML = '<p>Unable to generate QR code</p>';
    }
    qrModal.classList.add('active');
  }

  function closeQr() {
    qrModal.classList.remove('active');
  }

  function copyToClipboard(text, btnElement) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => handleCopySuccess(btnElement))
        .catch(() => fallbackCopy(text, btnElement));
    } else {
      fallbackCopy(text, btnElement);
    }
  }

  function fallbackCopy(text, btnElement) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      handleCopySuccess(btnElement);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
    document.body.removeChild(textarea);
  }

  function handleCopySuccess(btnElement) {
    showToast('Copied to clipboard!', 'success');
    if (!btnElement) return;

    const originalContent = btnElement.innerHTML;
    btnElement.classList.add('copied');
    const span = btnElement.querySelector('span');
    if (span) {
      span.textContent = 'Copied!';
    }

    setTimeout(() => {
      btnElement.classList.remove('copied');
      btnElement.innerHTML = originalContent;
    }, 1800);
  }

  function setLoading(isLoading) {
    shortenBtn.disabled = isLoading;
    if (isLoading) {
      shortenBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>Reducing...</span>
      `;
    } else {
      shortenBtn.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <span>Reduce Link</span>
      `;
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') {
      icon = `<svg width="18" height="18" fill="none" stroke="var(--accent-green)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
    } else if (type === 'error') {
      icon = `<svg width="18" height="18" fill="none" stroke="var(--accent-rose)" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function initTheme() {
    const saved = localStorage.getItem('snaplink_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcons(saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('snaplink_theme', next);
    updateThemeIcons(next);
  }

  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    } else {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    }
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Expose global methods for table row action buttons
  window.SnapLinkApp = {
    copy: copyToClipboard,
    openQr: openQrModal,
    delete: deleteLink
  };
});
