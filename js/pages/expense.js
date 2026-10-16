/* ============================================================
   PAGE: PENGELUARAN
   ============================================================ */

import { Store } from '../store.js';
import { createNumpad } from '../components/numpad.js';
import {
  formatRupiah,
  formatRupiahShort,
  escapeHtml,
  todayISO,
  parseNumber,
  percent,
} from '../utils.js';
import { flash, confirmDialog } from '../ui.js';

let numpad = null;
let initialized = false;

/* ============================================================
   INIT
   ============================================================ */
export function initExpense() {
  if (initialized) return;
  initialized = true;

  const numpadEl = document.querySelector('[data-numpad="expense"]');
  const displayEl = document.getElementById('expenseDisplay');
  if (numpadEl && displayEl) numpad = createNumpad(numpadEl, displayEl);

  document.querySelectorAll('[data-quick="expense"]').forEach((btn) => {
    btn.addEventListener('click', () => numpad?.add(parseNumber(btn.dataset.value)));
  });

  document
    .querySelector('[data-submit="expense"]')
    ?.addEventListener('click', submitExpense);

  document
    .querySelector('[data-clearall="expense"]')
    ?.addEventListener('click', async () => {
      if (Store.getExpense().length === 0) return;
      const ok = await confirmDialog({
        title: 'Hapus Semua Pengeluaran?',
        message: 'Semua data pengeluaran akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
        okText: 'Ya, Hapus Semua',
        variant: 'danger',
      });
      if (!ok) return;
      Store.clear('expense');
      flash('Semua pengeluaran dihapus', 'info');
    });
}

/* ============================================================
   RENDER
   ============================================================ */
export function renderExpense() {
  populateCategories();
  renderStats();
  renderList();
  renderWarning();
}

function populateCategories() {
  const sel = document.getElementById('expenseCategory');
  if (!sel) return;
  const cats = Store.getCategories('expense');
  sel.innerHTML =
    `<option value="">Pilih kategori...</option>` +
    cats
      .map((c) => `<option value="${c.id}">${c.icon} ${escapeHtml(c.name)}</option>`)
      .join('');
}

function renderStats() {
  const el = document.getElementById('expenseStats');
  if (!el) return;

  const list = Store.getExpense();
  const total = list.reduce((s, x) => s + x.amount, 0);
  const days = uniqueDays(list);
  const avg = list.length ? Math.round(total / Math.max(1, days)) : 0;

  const byCat = {};
  list.forEach((x) => {
    const cat = Store.getById('categories', x.categoryId);
    const key = cat?.name || 'Lainnya';
    if (!byCat[key]) byCat[key] = { name: key, total: 0, icon: cat?.icon || '📦' };
    byCat[key].total += x.amount;
  });
  const top = Object.values(byCat).sort((a, b) => b.total - a.total)[0];
  const topPct = top && total ? percent(top.total, total) : 0;

  el.innerHTML = `
    <div class="mini-stat">
      <div>
        <div class="label">Total Pengeluaran</div>
        <div class="value red">${formatRupiah(total)}</div>
        <div class="sub">${list.length} transaksi</div>
      </div>
      <div class="stat-ico">💸</div>
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
        <div class="label">Beban Terbesar</div>
        <div class="value" style="font-size:14px;">${top ? `${top.icon} ${escapeHtml(top.name)}` : '—'}</div>
        <div class="sub">${top ? `${formatRupiah(top.total)} · <b class="red">${topPct}%</b> dari total` : 'Belum ada'}</div>
      </div>
      <div class="stat-ico">🏆</div>
    </div>
  `;
}

function uniqueDays(list) {
  return new Set(list.map((x) => x.date)).size || 1;
}

function renderList() {
  const el = document.getElementById('expenseList');
  const countEl = document.getElementById('expenseCount');
  const totalEl = document.getElementById('expenseTotal');
  if (!el) return;

  const list = Store.getExpense();
  const total = list.reduce((s, x) => s + x.amount, 0);

  if (countEl) countEl.textContent = `Menampilkan ${list.length} transaksi`;
  if (totalEl) totalEl.textContent = formatRupiah(total);

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-ico">📭</div><div class="empty-txt">Belum ada pengeluaran</div></div>`;
    return;
  }

  el.innerHTML = list
    .map((x) => {
      const cat = Store.getById('categories', x.categoryId);
      const d = new Date(x.date);
      const month = d.toLocaleDateString('id-ID', { month: 'short' });
      return `
      <div class="trx-item" data-id="${x.id}">
        <div class="trx-date"><b>${d.getDate()}</b>${month}</div>
        <div class="trx-body">
          <div class="trx-title">${escapeHtml(x.kegunaan)}</div>
          <div class="trx-meta">
            ${cat ? `<span class="pill">${cat.icon} ${escapeHtml(cat.name)}</span>` : ''}
          </div>
        </div>
        <div class="trx-amount red">−${formatRupiahShort(x.amount)}</div>
               <div style="display:flex;gap:4px;flex-shrink:0;">
          <button class="kat-act-btn" data-edit-type="expense" data-edit-id="${x.id}" title="Edit">✏</button>
          <button class="list-del" data-del-expense="${x.id}">✕</button>
        </div>
      </div>
    `;
    })
    .join('');

  el.querySelectorAll('[data-del-expense]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = Store.getById('expense', btn.dataset.delExpense);
      if (!item) return;
      const ok = await confirmDialog({
        title: 'Hapus Pengeluaran?',
        message: `"${item.kegunaan}" akan dihapus permanen.`,
        okText: 'Ya, Hapus',
        variant: 'danger',
      });
      if (!ok) return;
      Store.remove('expense', btn.dataset.delExpense);
      flash('Pengeluaran dihapus', 'info');
    });
  });
}

function renderWarning() {
  const el = document.getElementById('warningText');
  if (!el) return;

  const budgets = Store.getBudgets();
  const warning = budgets
    .map((b) => {
      const used = Store.getBudgetUsage(b.id);
      const pct = b.target ? Math.round((used / b.target) * 100) : 0;
      return { ...b, pct };
    })
    .filter((b) => b.pct >= 80)
    .sort((a, b) => b.pct - a.pct)[0];

  if (warning) {
    el.textContent = `Pos ${warning.name} telah terpakai ${warning.pct}% dari kuota.`;
  } else {
    el.textContent = 'Semua pos dalam batas aman.';
  }
}

/* ============================================================
   SUBMIT
   ============================================================ */
function submitExpense() {
  const kegunaan = document.getElementById('expenseSource').value.trim();
  const categoryId = document.getElementById('expenseCategory').value;
  const note = document.getElementById('expenseNote').value.trim();
  const amount = numpad ? numpad.get() : 0;

  if (!kegunaan) return flash('Kegunaan wajib diisi', 'error');
  if (!categoryId) return flash('Pilih kategori', 'error');
  if (!amount || amount <= 0) return flash('Jumlah harus lebih dari 0', 'error');

  Store.add('expense', {
    kegunaan,
    categoryId,
    note,
    amount,
    date: todayISO(),
  });

  document.getElementById('expenseSource').value = '';
  document.getElementById('expenseNote').value = '';
  document.getElementById('expenseCategory').value = '';
  numpad?.reset();

  flash('Pengeluaran disimpan ✓');
}