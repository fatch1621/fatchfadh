/* ============================================================
   UI — Shared UI helpers
   Overlay control, toast notification, header totals update.
   Dipisahkan dari main.js untuk hindari circular dependency.
   ============================================================ */

import { Store } from './store.js';
import { formatRupiah, formatRupiahShort } from './utils.js';

/* ============================================================
   OVERLAY
   ============================================================ */
export function openOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  document.dispatchEvent(new CustomEvent('overlay:open', { detail: { id } }));
}

export function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

export function closeAllOverlays() {
  document.querySelectorAll('.overlay.show').forEach((o) => o.classList.remove('show'));
}

/* ============================================================
   HEADER TOTALS
   ============================================================ */
export function updateHeaderTotals() {
  const t = Store.getTotals();
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setText('sidebarTotal',   formatRupiah(t.balance));
  setText('sidebarIncome',  formatRupiahShort(t.income));
  setText('sidebarExpense', formatRupiahShort(t.expense));
  setText('mobileTotal',    formatRupiah(t.balance));
  setText('mobileIncome',   formatRupiah(t.income));
  setText('mobileExpense',  formatRupiah(t.expense));
  setText('topbarTotal',    formatRupiah(t.balance));
}

/* ============================================================
   TOAST
   ============================================================ */
export function flash(msg, type = 'success') {
  const colors = {
    success: '#10B981',
    error: '#DC2626',
    info: '#2563EB',
    danger: '#EF4444',
  };
  const bg = colors[type] || colors.success;
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:${bg};color:#fff;padding:12px 22px;border-radius:12px;
    font-size:13px;font-weight:700;z-index:9999;
    box-shadow:0 8px 24px rgba(0,0,0,.35);
    pointer-events:none;max-width:90vw;text-align:center;
    animation:fadeIn .2s ease;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
/* ============================================================
   CONFIRM DIALOG — Custom modal (ganti confirm() browser)
   Usage:
     const ok = await confirmDialog({
       title: 'Hapus data?',
       message: 'Data akan dihapus permanen.',
       okText: 'Ya, Hapus',
       variant: 'danger' // 'danger' | 'confirm' | 'info'
     });
     if (ok) { ... }
   ============================================================ */
export function confirmDialog({
  title = 'Konfirmasi',
  message = 'Apakah kamu yakin?',
  okText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmOverlay');
    if (!overlay) {
      /* Fallback ke native confirm kalau modal belum ada */
      resolve(window.confirm(message));
      return;
    }

    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const iconEl = document.getElementById('confirmIcon');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;

    /* Variant icon & button */
    iconEl.className = 'confirm-icon';
    okBtn.className = 'confirm-btn ' + (variant === 'confirm' ? 'confirm' : 'danger');
    if (variant === 'warn') {
      iconEl.classList.add('warn');
      iconEl.textContent = '⚠';
    } else if (variant === 'info') {
      iconEl.classList.add('info');
      iconEl.textContent = 'ℹ';
    } else {
      iconEl.textContent = '🗑';
    }

    /* Handlers */
    const cleanup = () => {
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onEsc);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onBackdrop = (e) => { if (e.target === overlay) onCancel(); };
    const onEsc = (e) => { if (e.key === 'Escape') onCancel(); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onEsc);

    overlay.classList.add('show');
  });
}

/* ============================================================
   LOADING STATE untuk tombol
   Usage:
     await withLoading(btn, async () => { ... });
   ============================================================ */
export async function withLoading(btn, fn) {
  if (!btn || btn.classList.contains('btn-loading')) return;
  btn.classList.add('btn-loading');
  try {
    await fn();
  } catch (err) {
    console.error('[withLoading] error:', err);
  } finally {
    btn.classList.remove('btn-loading');
  }
}