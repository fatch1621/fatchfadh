/* ============================================================
   MODAL ENTRY — Bottom sheet input pemasukan / pengeluaran
   ============================================================ */

import { Store } from '../store.js';
import { createNumpad } from './numpad.js';
import { formatRupiah, todayISO, escapeHtml } from '../utils.js';
import { closeOverlay, flash } from '../ui.js';

let entryType = 'expense';
let selectedCategoryId = null;
let numpad = null;
let initialized = false;

/* ============================================================
   INIT
   ============================================================ */
export function initModalEntry() {
  if (initialized) return;
  initialized = true;

  const overlay = document.getElementById('entryOverlay');
  if (!overlay) return;

  /* Numpad */
  const numpadEl = document.getElementById('entryNumpad');
  const displayEl = document.getElementById('entryAmountDisplay');
  numpad = createNumpad(numpadEl, displayEl);

  /* Tab switch */
  document.querySelectorAll('[data-action="switch-entry"]').forEach((btn) => {
    btn.addEventListener('click', () => switchEntryType(btn.dataset.value));
  });

  /* Submit */
  document
    .querySelector('[data-action="entry-submit"]')
    ?.addEventListener('click', submitEntry);

  /* Reset form tiap modal dibuka */
  document.addEventListener('overlay:open', (e) => {
    if (e.detail.id === 'entryOverlay') resetModal();
  });

  /* Search kategori */
  const searchInput = document.querySelector('#entryOverlay .search-box input');
  searchInput?.addEventListener('input', (e) => {
    filterCategories(e.target.value.toLowerCase());
  });
}

/* ---------- Filter grid kategori ---------- */
function filterCategories(q) {
  const grid = document.getElementById('entryCatGrid');
  if (!grid) return;
  grid.querySelectorAll('.cat-item').forEach((item) => {
    /* Jangan sembunyikan tombol "+ Baru" */
    if (item.classList.contains('add')) return;
    const name = item.querySelector('.cat-name')?.textContent.toLowerCase() || '';
    item.style.display = name.includes(q) ? '' : 'none';
  });
}

/* ============================================================
   RENDER
   ============================================================ */
function renderCategories() {
  const grid = document.getElementById('entryCatGrid');
  if (!grid) return;

  const cats = Store.getCategories(entryType);
  selectedCategoryId = cats[0]?.id || null;

  if (cats.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--muted);font-size:12px;">
        Belum ada kategori.
        <a style="color:var(--blue);font-weight:700;cursor:pointer" data-action="goto-category">Tambah</a>
      </div>`;
    return;
  }

  grid.innerHTML =
    cats
      .map(
        (c) => `
    <button class="cat-item ${c.id === selectedCategoryId ? 'active' : ''}" data-cat-id="${c.id}">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-name">${escapeHtml(c.name)}</div>
    </button>`
      )
      .join('') +
    `<button class="cat-item add" data-action="goto-category">
       <div class="cat-icon">＋</div>
       <div class="cat-name">Baru</div>
     </button>`;

  grid.querySelectorAll('[data-cat-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('[data-cat-id]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategoryId = btn.dataset.catId;
    });
  });
}

function updateUI() {
  document.querySelectorAll('.entry-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.type === entryType);
  });

  const label = document.getElementById('entryLabelKegunaan');
  const input = document.getElementById('entryKegunaan');
  if (label) {
    label.innerHTML =
      entryType === 'expense'
        ? 'Kegunaan <span class="req">*</span>'
        : 'Sumber Pemasukan <span class="req">*</span>';
  }
  if (input) {
    input.placeholder =
      entryType === 'expense' ? 'cth: Beli Sembako' : 'cth: Gaji Bulanan';
  }

  const amtEl = document.getElementById('entryAmountDisplay');
  if (amtEl) amtEl.className = 'val ' + (entryType === 'expense' ? 'expense' : 'income');

  const btn = document.getElementById('entrySubmitBtn');
  if (btn) {
    btn.className = 'entry-submit ' + entryType;
    btn.textContent =
      entryType === 'expense' ? 'Simpan Pengeluaran' : 'Simpan Pemasukan';
  }
}

function resetModal() {
  entryType = 'expense';
  selectedCategoryId = null;
  updateUI();
  renderCategories();

  const dateEl = document.getElementById('entryDate');
  if (dateEl) dateEl.value = todayISO();
  const kegEl = document.getElementById('entryKegunaan');
  if (kegEl) kegEl.value = '';
  const descEl = document.getElementById('entryDesc');
  if (descEl) descEl.value = '';

  /* Clear search input */
  const searchInput = document.querySelector('#entryOverlay .search-box input');
  if (searchInput) searchInput.value = '';

  if (numpad) numpad.reset();
}

function switchEntryType(type) {
  entryType = type;
  selectedCategoryId = null;
  updateUI();
  renderCategories();
}

/* ============================================================
   SUBMIT
   ============================================================ */
function submitEntry() {
  const date = document.getElementById('entryDate').value;
  const kegunaan = document.getElementById('entryKegunaan').value.trim();
  const desc = document.getElementById('entryDesc').value.trim();
  const amount = numpad ? numpad.get() : 0;

  if (!date) return flash('Tanggal wajib diisi', 'error');
  if (!kegunaan) return flash('Kegunaan / Sumber wajib diisi', 'error');
  if (!selectedCategoryId) return flash('Pilih kategori', 'error');
  if (!amount || amount <= 0) return flash('Jumlah harus lebih dari 0', 'error');

  if (entryType === 'expense') {
    Store.add('expense', {
      kegunaan,
      categoryId: selectedCategoryId,
      note: desc,
      amount,
      date,
    });
  } else {
    Store.add('income', {
      sumber: kegunaan,
      categoryId: selectedCategoryId,
      budgetId: null,
      note: desc,
      amount,
      date,
    });
  }

  closeOverlay('entryOverlay');
  flash(entryType === 'expense' ? 'Pengeluaran disimpan ✓' : 'Pemasukan disimpan ✓');
}