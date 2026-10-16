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
import { initPWA } from './pwa.js';
import { initAuth, onAuthChange, logout } from './auth.js';
import { initSync, pullFromCloud, startListeners } from './sync.js';
import {
  openOverlay,
  closeOverlay,
  closeAllOverlays,
  updateHeaderTotals,
  confirmDialog,
  flash,
  initSyncBadge,
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

  /* Init auth dulu — guard akan redirect ke login kalau belum masuk */
  initAuth();

 onAuthChange(async (user) => {
    if (!user) {
      console.log('[Main] Not logged in, redirecting to login...');
      window.location.replace('/login.html');
      return;
    }

    console.log('[Main] Logged in as:', user.email);
    updateUserDisplay(user);
    initSync(user.uid);

    /* ─── Pull data dari cloud sebelum render UI ─── */
    try {
      const cloudData = await pullFromCloud();
      const totalCloud = Object.values(cloudData).reduce(
        (sum, arr) => sum + (arr?.length || 0),
        0
      );

      if (totalCloud > 0) {
        /* Ada data di cloud → timpa cache lokal */
        Object.entries(cloudData).forEach(([col, items]) => {
          Store._setFromCloud(col, items);
        });
        console.log(`[Main] Loaded ${totalCloud} items from cloud`);
      } else {
        console.log('[Main] Cloud empty — pakai cache lokal');
      }
    } catch (err) {
      console.error('[Main] Pull failed, pakai cache lokal:', err);
    }

    /* Init store & app (sekali saja setelah login) */
    if (!window.__appInitialized) {
      window.__appInitialized = true;

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
      safeInit('pwa',         initPWA);

      initActionHandlers();
      initOverlayHandlers();
      initPageChangeHooks();
      initStoreListener();
     initSyncBadge(); 
      initRouter();
      updateHeaderTotals();

   /* ─── Realtime sync: dengarkan perubahan dari cloud ─── */
      startListeners(
        (collectionName, docs) => {
          /* Update cache lokal tanpa trigger cloud write balik (anti-loop) */
          Store._setFromCloud(collectionName, docs);

          /* Refresh halaman aktif biar UI ikut update */
          refreshPage(getCurrentPage());
          updateHeaderTotals();
        },
        (collectionName, err) => {
          console.warn(`[Main] Sync error on ${collectionName}:`, err);
        }
      );

      console.log('[FatchFadh] Ready ✨');
    }
  });
});

function safeInit(name, fn) {
  try { fn(); }
  catch (err) { console.error(`[Init] ${name} failed:`, err); }
}

/* ---------- Update nama user di topbar ---------- */
function updateUserDisplay(user) {
  const name = user.displayName || user.email?.split('@')[0] || 'User';
  const initials = name.slice(0, 2).toUpperCase();

  /* Topbar user pill */
  const nameEl = document.querySelector('.user-pill .name');
  const roleEl = document.querySelector('.user-pill .role');
  const avEl = document.querySelector('.user-pill .av');

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = user.email;
  if (avEl) avEl.textContent = initials;
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
      case 'logout':       handleLogout(); break;
    }
  });

  /* Tombol Edit */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-type]');
    if (!btn) return;
    openEditModal(btn.dataset.editType, btn.dataset.editId);
  });
}

/* ---------- Logout ---------- */
async function handleLogout() {
  const ok = await confirmDialog({
    title: 'Keluar dari Akun?',
    message: 'Anda perlu login ulang untuk mengakses data.',
    okText: 'Ya, Keluar',
    variant: 'danger',
  });
  if (!ok) return;
  try {
    await logout();
    window.location.replace('/login.html');
  } catch (err) {
    console.error('[Logout] Error:', err);
    flash('Gagal logout', 'error');
  }
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

  document.addEventListener('overlay:open', (e) => {
    const overlay = document.getElementById(e.detail.id);
    if (!overlay) return;
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

/* ---------- Export ---------- */
function handleExport(type) {
  exportData(type);
}