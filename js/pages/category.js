/* ============================================================
   PAGE: KATEGORI
   ============================================================ */

import { Store } from '../store.js';
import { formatRupiah, escapeHtml, parseNumber } from '../utils.js';
import { flash, confirmDialog } from '../ui.js';

const ICONS = [
  '🛍','🍽','🏠','🎯','✏','🛵','☕','✈','💳','📦','🎓','💼','💻','🏆',
  '📈','🚗','🛒','📄','❤️','🎬',
];
const COLORS = [
  '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6',
  '#EC4899', '#EF4444', '#14B8A6', '#64748B',
];

let selectedType = 'income';
let selectedIcon = '🍽';
let selectedColor = '#3B82F6';
let initialized = false;
let searchQuery = '';
let filterType = 'all'; /* 'all' | 'income' | 'expense' */


export function initCategory() {
  if (initialized) return;
  initialized = true;

  document.querySelectorAll('.alokasi-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.alokasi-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.akun === 'inflow' ? 'income' : 'expense';
    });
  });

  renderPickers();

  document.querySelector('[data-submit="category"]')?.addEventListener('click', submitCategory);
  document.querySelector('[data-reset="category"]')?.addEventListener('click', resetForm);

  document.querySelector('.kat-search input')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    applyCategoryFilter();
  });

  document.querySelector('.kat-filter')?.addEventListener('change', (e) => {
    filterType = e.target.value;
    applyCategoryFilter();
  });
}
/* ============================================================
   FILTER
   ============================================================ */
function applyCategoryFilter() {
  const incSection = document.querySelector('#categoryIncomeList')?.closest('.kat-section-head');
  const expSection = document.querySelector('#categoryExpenseList')?.closest('.kat-section-head');
  const incList = document.getElementById('categoryIncomeList');
  const expList = document.getElementById('categoryExpenseList');

  /* Show/hide section berdasarkan filterType */
  const showIncome  = filterType === 'all' || filterType === 'Pemasukan'  || filterType === 'income';
  const showExpense = filterType === 'all' || filterType === 'Pengeluaran' || filterType === 'expense';

  if (incSection) incSection.style.display = showIncome ? '' : 'none';
  if (incList)    incList.style.display    = showIncome ? '' : 'none';
  if (expSection) expSection.style.display = showExpense ? '' : 'none';
  if (expList)    expList.style.display    = showExpense ? '' : 'none';

  /* Filter per card berdasarkan search query */
  document.querySelectorAll('.kat-card').forEach((card) => {
    const name = card.querySelector('.kat-card-name')?.textContent.toLowerCase() || '';
    const visible = name.includes(searchQuery);
    card.style.display = visible ? '' : 'none';
  });
}
export function renderCategory() {
  renderList();
  applyCategoryFilter();
}

function renderPickers() {
  const iconEl = document.getElementById('iconPicker');
  if (iconEl) {
    iconEl.innerHTML = ICONS.map(
      (ic) => `<button class="ikon-btn ${ic === selectedIcon ? 'active' : ''}" data-icon="${ic}">${ic}</button>`
    ).join('');
    iconEl.querySelectorAll('[data-icon]').forEach((btn) => {
      btn.addEventListener('click', () => {
        iconEl.querySelectorAll('.ikon-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedIcon = btn.dataset.icon;
      });
    });
  }

  const colorEl = document.getElementById('colorPicker');
  if (colorEl) {
    colorEl.innerHTML = COLORS.map(
      (c) => `<button class="warna-btn ${c === selectedColor ? 'active' : ''}" style="background:${c}" data-color="${c}"></button>`
    ).join('');
    colorEl.querySelectorAll('[data-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        colorEl.querySelectorAll('.warna-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });
  }
}

function renderList() {
  const incomeCats = Store.getCategories('income');
  const expenseCats = Store.getCategories('expense');

  const incEl = document.getElementById('categoryIncomeList');
  const expEl = document.getElementById('categoryExpenseList');
  const incCount = document.getElementById('catIncomeCount');
  const expCount = document.getElementById('catExpenseCount');

  if (incCount) incCount.textContent = `${incomeCats.length} Pos`;
  if (expCount) expCount.textContent = `${expenseCats.length} Pos`;

  if (incEl) {
    incEl.innerHTML = incomeCats.length === 0
      ? `<div class="kat-card-empty">Belum ada kategori pemasukan</div>`
      : incomeCats.map(renderIncomeCard).join('');
  }

  if (expEl) {
    expEl.innerHTML = expenseCats.length === 0
      ? `<div class="kat-card-empty">Belum ada kategori pengeluaran</div>`
      : expenseCats.map(renderExpenseCard).join('');
  }

  /* Delete handlers */
  document.querySelectorAll('[data-del-cat]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.delCat;
      const cat = Store.getById('categories', id);
      if (!cat) return;
      const ok = await confirmDialog({
        title: 'Hapus Kategori?',
        message: `Kategori "${cat.name}" akan dihapus. Transaksi yang memakainya akan kehilangan kategori.`,
        okText: 'Ya, Hapus',
        variant: 'danger',
      });
      if (!ok) return;
      Store.remove('categories', id);
      flash('Kategori dihapus', 'info');
    });
  });
}

function renderIncomeCard(c) {
  const total = Store.getIncome()
    .filter((x) => x.categoryId === c.id)
    .reduce((s, x) => s + x.amount, 0);

  return `
    <div class="kat-card">
      <div class="kat-card-top">
        <div class="kat-card-icon green">${c.icon}</div>
        <div class="kat-card-body">
          <div class="kat-card-name">${escapeHtml(c.name)}</div>
          <div class="kat-card-tags">
            <span class="kat-pill green">Pemasukan</span>
          </div>
        </div>
        <div class="kat-card-actions">
          <button class="kat-act-btn" data-edit-type="category" data-edit-id="${c.id}" title="Edit">✏</button>
          <button class="kat-act-btn del" data-del-cat="${c.id}" title="Hapus">🗑</button>
        </div>
      </div>
      <div class="kat-card-stat">
        <span>Total Masuk:</span><b class="green">${formatRupiah(total)}</b>
      </div>
    </div>
  `;
}

function renderExpenseCard(c) {
  const total = Store.getExpense()
    .filter((x) => x.categoryId === c.id)
    .reduce((s, x) => s + x.amount, 0);

  const limit = c.limit || 0;
  const pct = limit ? Math.min(100, Math.round((total / limit) * 100)) : 0;
  const color = pct >= 90 ? 'red' : pct >= 70 ? 'orange' : 'blue';

  const limitHTML = limit
    ? `
      <div class="kat-card-limit">
        <div class="limit-row">
          <span class="used">Terpakai: <b>${formatRupiah(total)}</b></span>
          <span class="lim">Limit: <b>${formatRupiah(limit)}</b> (${pct}%)</span>
        </div>
        <div class="limit-bar">
          <div class="limit-fill ${color}" style="width:${pct}%"></div>
        </div>
      </div>
    `
    : `<div class="kat-card-stat"><span>Total Keluar:</span><b class="red">${formatRupiah(total)}</b></div>`;

  return `
    <div class="kat-card">
      <div class="kat-card-top">
        <div class="kat-card-icon blue">${c.icon}</div>
        <div class="kat-card-body">
          <div class="kat-card-name">${escapeHtml(c.name)}</div>
          <div class="kat-card-tags">
            <span class="kat-pill blue">Pengeluaran</span>
          </div>
        </div>
        <div class="kat-card-actions">
          <button class="kat-act-btn" data-edit-type="category" data-edit-id="${c.id}" title="Edit">✏</button>
          <button class="kat-act-btn del" data-del-cat="${c.id}" title="Hapus">🗑</button>
        </div>
      </div>
      ${limitHTML}
    </div>
  `;
}

function submitCategory() {
  const name = document.getElementById('categoryName').value.trim();
  const limit = parseNumber(document.getElementById('categoryLimit').value);

  if (!name) return flash('Nama kategori wajib diisi', 'error');

  Store.add('categories', {
    name,
    type: selectedType,
    icon: selectedIcon,
    color: selectedColor,
    limit: selectedType === 'expense' ? limit : 0,
  });

  resetForm();
  flash('Kategori disimpan ✓');
}

function resetForm() {
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryLimit').value = '';
  selectedIcon = '🍽';
  selectedColor = '#3B82F6';
  renderPickers();
}