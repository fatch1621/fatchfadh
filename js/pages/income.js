/* ============================================================
   PAGE: PEMASUKAN
   ============================================================ */

import { Store } from '../store.js';
import { createNumpad } from '../components/numpad.js';
import {
  formatRupiah,
  formatRupiahShort,
  escapeHtml,
  todayISO,
  parseNumber,
} from '../utils.js';
import { flash, confirmDialog } from '../ui.js';

let numpad = null;
let initialized = false;

/* ============================================================
   INIT
   ============================================================ */
export function initIncome() {
  if (initialized) return;
  initialized = true;

  const numpadEl = document.querySelector('[data-numpad="income"]');
  const displayEl = document.getElementById('incomeDisplay');
  if (numpadEl && displayEl) {
    numpad = createNumpad(numpadEl, displayEl);
  }

  /* Shortcut +50rb, +100rb, dst */
  document.querySelectorAll('[data-quick="income"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      numpad?.add(parseNumber(btn.dataset.value));
    });
  });

  /* Submit */
  document
    .querySelector('[data-submit="income"]')
    ?.addEventListener('click', submitIncome);

  /* Hapus semua */
  document
    .querySelector('[data-clearall="income"]')
    ?.addEventListener('click', async () => {
      if (Store.getIncome().length === 0) return;
      const ok = await confirmDialog({
        title: 'Hapus Semua Pemasukan?',
        message: 'Semua data pemasukan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
        okText: 'Ya, Hapus Semua',
        variant: 'danger',
      });
      if (!ok) return;
      Store.clear('income');
      flash('Semua pemasukan dihapus', 'info');
    });
}

/* ============================================================
   RENDER
   ============================================================ */
export function renderIncome() {
  populateCategories();
  populateBudgets();
  renderStats();
  renderList();
}

function populateCategories() {
  const sel = document.getElementById('incomeCategory');
  if (!sel) return;
  const cats = Store.getCategories('income');
  sel.innerHTML =
    `<option value="">Pilih kategori...</option>` +
    cats
      .map((c) => `<option value="${c.id}">${c.icon} ${escapeHtml(c.name)}</option>`)
      .join('');
}

function populateBudgets() {
  const sel = document.getElementById('incomeBudget');
  if (!sel) return;
  const budgets = Store.getBudgets();
  sel.innerHTML =
    `<option value="">-- Tanpa Budget --</option>` +
    budgets
      .map((b) => `<option value="${b.id}">${b.icon || '🎯'} ${escapeHtml(b.name)}</option>`)
      .join('');
}

function renderStats() {
  const el = document.getElementById('incomeStats');
  if (!el) return;

  const list = Store.getIncome();
  const total = list.reduce((s, x) => s + x.amount, 0);
  const days = uniqueDays(list);
  const avg = list.length ? Math.round(total / Math.max(1, days)) : 0;

  const bySource = {};
  list.forEach((x) => {
    bySource[x.sumber] = (bySource[x.sumber] || 0) + x.amount;
  });
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

  el.innerHTML = `
    <div class="mini-stat">
      <div>
        <div class="label">Total Pemasukan</div>
        <div class="value green">${formatRupiah(total)}</div>
        <div class="sub">${list.length} transaksi</div>
      </div>
      <div class="stat-ico">💰</div>
    </div>
    <div class="mini-stat">
      <div>
        <div class="label">Rata-rata / Hari Aktif</div>
        <div class="value">${formatRupiah(avg)}</div>
        <div class="sub">Dari ${days} hari</div>
      </div>
      <div class="stat-ico">📅</div>
    </div>
    <div class="mini-stat">
      <div>
        <div class="label">Sumber Terbesar</div>
        <div class="value" style="font-size:14px;">${topSource ? escapeHtml(topSource[0]) : '—'}</div>
        <div class="sub">${topSource ? formatRupiah(topSource[1]) : 'Belum ada'}</div>
      </div>
      <div class="stat-ico">🏆</div>
    </div>
  `;
}

function uniqueDays(list) {
  return new Set(list.map((x) => x.date)).size || 1;
}

function renderList() {
  const el = document.getElementById('incomeList');
  const countEl = document.getElementById('incomeCount');
  const totalEl = document.getElementById('incomeTotal');
  if (!el) return;

  const list = Store.getIncome();
  const total = list.reduce((s, x) => s + x.amount, 0);

  if (countEl) countEl.textContent = `Menampilkan ${list.length} transaksi`;
  if (totalEl) totalEl.textContent = formatRupiah(total);

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-ico">📭</div><div class="empty-txt">Belum ada pemasukan</div></div>`;
    return;
  }

  el.innerHTML = list
    .map((x) => {
      const cat = Store.getById('categories', x.categoryId);
      const bud = x.budgetId ? Store.getById('budget', x.budgetId) : null;
      const d = new Date(x.date);
      const month = d.toLocaleDateString('id-ID', { month: 'short' });
      return `
      <div class="trx-item" data-id="${x.id}">
        <div class="trx-date"><b>${d.getDate()}</b>${month}</div>
        <div class="trx-body">
          <div class="trx-title">${escapeHtml(x.sumber)}</div>
          <div class="trx-meta">
            ${cat ? `<span class="pill">${cat.icon} ${escapeHtml(cat.name)}</span>` : ''}
            ${bud ? `<span class="pill" style="background:var(--green-soft);color:#059669;">${bud.icon || '🎯'} ${escapeHtml(bud.name)}</span>` : ''}
          </div>
        </div>
        <div class="trx-amount green">+${formatRupiahShort(x.amount)}</div>
                <div style="display:flex;gap:4px;flex-shrink:0;">
          <button class="kat-act-btn" data-edit-type="income" data-edit-id="${x.id}" title="Edit">✏</button>
          <button class="list-del" data-del-income="${x.id}">✕</button>
        </div>
      </div>
    `;
    })
    .join('');

  el.querySelectorAll('[data-del-income]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = Store.getById('income', btn.dataset.delIncome);
      if (!item) return;
      const ok = await confirmDialog({
        title: 'Hapus Pemasukan?',
        message: `"${item.sumber}" akan dihapus permanen.`,
        okText: 'Ya, Hapus',
        variant: 'danger',
      });
      if (!ok) return;
      Store.remove('income', btn.dataset.delIncome);
      flash('Pemasukan dihapus', 'info');
    });
  });
}

/* ============================================================
   SUBMIT
   ============================================================ */
function submitIncome() {
  const sumber = document.getElementById('incomeSource').value.trim();
  const categoryId = document.getElementById('incomeCategory').value;
  const budgetId = document.getElementById('incomeBudget').value || null;
  const note = document.getElementById('incomeNote').value.trim();
  const amount = numpad ? numpad.get() : 0;

  if (!sumber) return flash('Sumber pemasukan wajib diisi', 'error');
  if (!categoryId) return flash('Pilih kategori', 'error');
  if (!amount || amount <= 0) return flash('Jumlah harus lebih dari 0', 'error');

  Store.add('income', {
    sumber,
    categoryId,
    budgetId,
    note,
    amount,
    date: todayISO(),
  });

  /* Reset form */
  document.getElementById('incomeSource').value = '';
  document.getElementById('incomeNote').value = '';
  document.getElementById('incomeCategory').value = '';
  document.getElementById('incomeBudget').value = '';
  numpad?.reset();

  flash('Pemasukan disimpan ✓');
}