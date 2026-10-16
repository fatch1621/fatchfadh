/* ============================================================
   ROUTER — Navigasi antar halaman (SPA)
   ============================================================ */

const PAGES = ['dashboard', 'income', 'expense', 'category', 'budget'];

const PAGE_META = {
  dashboard: { title: 'Dashboard',                  subtitle: 'Ringkasan keuangan kamu hari ini' },
  income:    { title: 'Input & Kelola Pemasukan',   subtitle: 'Catat dan pantau pemasukan kamu' },
  expense:   { title: 'Input & Kelola Pengeluaran', subtitle: 'Catat dan pantau pengeluaran kamu' },
  category:  { title: 'Manajemen Kategori & Pos',   subtitle: 'Kelola kategori & integrasi budget' },
  budget:    { title: 'Budgeting & Amplop Anggaran', subtitle: 'Atur distribusi dana & alokasi' },
};

/* Halaman yang di mobile diakses lewat tombol "Menu" */
const MENU_ITEMS = ['budget', 'category'];

let currentPage = 'dashboard';
const listeners = [];

/* ---------- Public API ---------- */

export function getCurrentPage() {
  return currentPage;
}

export function onPageChange(cb) {
  listeners.push(cb);
}

export function navigateTo(page) {
  if (!PAGES.includes(page)) {
    console.warn('[Router] Unknown page:', page);
    return;
  }

  /* Toggle page sections */
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (!target) return;
  target.classList.add('active');

  /* Bottom nav (mobile) */
  document.querySelectorAll('.nav-item').forEach((n) => {
    if (n.dataset.page === page) {
      n.classList.add('active');
    } else if (n.dataset.action === 'open-menu' && MENU_ITEMS.includes(page)) {
      n.classList.add('active');
    } else {
      n.classList.remove('active');
    }
  });

  /* Sidebar (desktop) */
  document.querySelectorAll('.side-link').forEach((n) => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  /* Desktop topbar title */
  const meta = PAGE_META[page] || { title: '', subtitle: '' };
  const titleEl = document.getElementById('desktopTitle');
  const subEl = document.getElementById('desktopSubtitle');
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.subtitle;

  /* Update state */
  currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  /* Notify listeners (page renderers dari Batch 4) */
  listeners.forEach((fn) => {
    try {
      fn(page);
    } catch (err) {
      console.error('[Router] Listener error:', err);
    }
  });
}

export function initRouter() {
  /* Attach click pada nav item (bottom nav & sidebar) */
  document
    .querySelectorAll('.nav-item[data-page], .side-link[data-page]')
    .forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

  /* Set halaman awal */
  navigateTo('dashboard');
}