/* ============================================================
   MAIN — Entry Point Aplikasi
   ============================================================ */

import { initRouter, navigateTo, onPageChange, getCurrentPage } from './router.js';
import { todayISO } from './utils.js';
import { Store } from './store.js';
import { DUMMY_DATA } from './data/dummy.js';
import { initModalEntry } from './components/modal-entry.js';
import { initModalEdit, openEditModal } from './components/modal-edit.js';
import { exportData } from './export.js';
import {
  openOverlay,
  closeOverlay,
  closeAllOverlays,
  updateHeaderTotals,
} from './ui.js';

/* Pages */
import { initIncome, renderIncome } from './pages/income.js';
import { initExpense, renderExpense } from './pages/expense.js';
import { initCategory, renderCategory } from './pages/category.js';
import { initBudget, renderBudget } from './pages/budget.js';
import { renderDashboard } from './pages/dashboard.js';

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[FatchFadh] Booting...');

  try {
    Store.initDummy(DUMMY_DATA);
  } catch (err) {
    console.error('[Init] Store seed failed:', err);
  }

  initDateDisplay();

  safeInit('modal-entry', initModalEntry);
  safeInit('modal-edit',  initModalEdit);
  safeInit('income',      initIncome);
  safeInit('expense',     initExpense);
  safeInit('category',    initCategory);
  safeInit('budget',      initBudget);

  initActionHandlers();
  initOverlayHandlers();
  initPageChangeHooks();
  initStoreListener();

  initRouter();
  updateHeaderTotals();

  console.log('[FatchFadh] Ready ✨');
});

function safeInit(name, fn) {
  try { fn(); }
  catch (err) { console.error(`[Init] ${name} failed:`, err); }
}

/* ---------- Refresh halaman aktif ---------- */
function refreshPage(page) {
  try {
    switch (page) {
      case 'dashboard': renderDashboard(); break;
      case 'income':    renderIncome();    break;
      case 'expense':   renderExpense();   break;
      case 'category':  renderCategory();  break;
      case 'budget':    renderBudget();    break;
    }
  } catch (err) {
    console.error(`[Page] render "${page}" failed:`, err);
  }
}

/* ---------- Tanggal ---------- */
function initDateDisplay() {
  const el = document.getElementById('todayDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
  const dateInput = document.getElementById('entryDate');
  if (dateInput) dateInput.value = todayISO();
}

/* ---------- Handler data-action ---------- */
function initActionHandlers() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'open-entry':  openOverlay('entryOverlay'); break;
      case 'close-entry': closeOverlay('entryOverlay'); break;
      case 'open-menu':   openOverlay('menuOverlay'); break;

      case 'close-edit':  closeOverlay('editOverlay'); break;

      case 'goto-menu': {
        const page = btn.dataset.page;
        if (page) navigateTo(page);
        closeOverlay('menuOverlay');
        break;
      }
      case 'goto-category':
        navigateTo('category');
        closeOverlay('entryOverlay');
        break;

      case 'export-excel': handleExport('excel'); break;
      case 'export-csv':   handleExport('csv');   break;
    }
  });

  /* Tombol Edit — data-edit-type & data-edit-id */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-type]');
    if (!btn) return;
    openEditModal(btn.dataset.editType, btn.dataset.editId);
  });
}

/* ---------- Overlay handlers ---------- */
function initOverlayHandlers() {
  document.querySelectorAll('.overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllOverlays();
  });

  /* Auto-focus input pertama saat modal terbuka */
  document.addEventListener('overlay:open', (e) => {
    const overlay = document.getElementById(e.detail.id);
    if (!overlay) return;
    /* Delay sedikit supaya render selesai dulu */
    setTimeout(() => {
      const input = overlay.querySelector('input[type="text"], input[type="number"], textarea');
      if (input && window.innerWidth > 900) input.focus();
    }, 100);
  });
}

/* ---------- Page hooks ---------- */
function initPageChangeHooks() {
  onPageChange((page) => {
    refreshPage(page);
    document.dispatchEvent(new CustomEvent('page:change', { detail: { page } }));
  });
}

function initStoreListener() {
  document.addEventListener('store:change', () => {
    updateHeaderTotals();
    refreshPage(getCurrentPage());
  });
}

/* ---------- Export placeholder ---------- */
function handleExport(type) {
  exportData(type);
}