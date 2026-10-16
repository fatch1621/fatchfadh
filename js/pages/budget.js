/* ============================================================
   PAGE: BUDGETING
   ============================================================ */

import { Store } from '../store.js';
import {
  formatRupiah,
  formatRupiahShort,
  escapeHtml,
  parseNumber,
  clamp,
} from '../utils.js';
import { flash, confirmDialog } from '../ui.js';

let initialized = false;

export function initBudget() {
  if (initialized) return;
  initialized = true;

  document.querySelector('[data-action="plot-budget"]')?.addEventListener('click', () => {
    flash('Tambahkan pemasukan di halaman Pemasukan & pilih budget di dropdown "Alokasi ke Budget".', 'info');
  });
}

export function renderBudget() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const budgets = Store.getBudgets();
  const totalPlotted = budgets.reduce((s, b) => s + (b.target || 0), 0);
  const incomeTotal = Store.getTotals().income;
  const ratio = incomeTotal ? Math.round((totalPlotted / incomeTotal) * 100) : 0;
  const surplus = Math.max(0, incomeTotal - totalPlotted);

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setText('budgetTotalPlotted', totalPlotted.toLocaleString('id-ID'));
  setText('budgetEstimated', formatRupiah(incomeTotal));
  setText('budgetRatio', ratio + '%');
  setText('budgetLimit', formatRupiah(incomeTotal));
  setText('budgetSurplus', formatRupiah(surplus));
  setText('budgetCount', `${budgets.length} Amplop`);

  const fill = document.getElementById('budgetRatioFill');
  if (fill) fill.style.width = clamp(ratio, 0, 100) + '%';

  const safe = document.getElementById('budgetSafeBadge');
  if (safe) {
    if (ratio <= 90) {
      safe.textContent = `${ratio}% Terencana Aman`;
      safe.style.background = 'var(--green-soft)';
      safe.style.color = '#059669';
    } else if (ratio <= 100) {
      safe.textContent = `${ratio}% Hampir Penuh`;
      safe.style.background = 'var(--orange-soft)';
      safe.style.color = '#D97706';
    } else {
      safe.textContent = `Overbudget ${ratio}%`;
      safe.style.background = 'var(--red-soft)';
      safe.style.color = '#DC2626';
    }
  }
}

function renderList() {
  const el = document.getElementById('budgetList');
  if (!el) return;

  const budgets = Store.getBudgets();

  if (budgets.length === 0) {
    el.innerHTML = `
      <button class="amplop-add" data-add-budget>
        <div class="plus-c">＋</div>
        <h4>Buat Amplop Baru</h4>
        <p>Belum ada amplop anggaran</p>
      </button>
    `;
    el.querySelector('[data-add-budget]')?.addEventListener('click', createBudget);
    return;
  }

  const cards = budgets.map((b) => {
    const used = Store.getBudgetUsage(b.id);
    const target = b.target || 0;
    const pct = target ? Math.round((used / target) * 100) : 0;
    const barPct = clamp(pct, 0, 100);
    const color = pct >= 90 ? 'orange' : pct >= 70 ? 'blue' : 'green';

    let badgeClass = 'blue';
    let badgeText = `${pct}%`;
    let statusText = 'Status Saldo: Terkendali';
    let statusClass = 'ok';

    if (pct >= 100) {
      badgeClass = 'green';
      badgeText = 'Penuh 100%';
      statusText = '✓ Selesai Teralokasi';
    } else if (pct >= 90) {
      badgeClass = 'orange';
      badgeText = `Warning ${pct}%`;
      statusText = '⚠ Menipis';
      statusClass = 'warn';
    }

    return `
      <div class="amplop-card">
        <div class="amplop-head">
          <div class="amplop-icon blue">${b.icon || '🎯'}</div>
          <div class="amplop-info">
            <div class="amplop-name">${escapeHtml(b.name)}</div>
            <div class="amplop-sub">Target alokasi bulanan</div>
          </div>
          <span class="amplop-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="amplop-body">
          <div class="row">
            <span>Terisi</span>
            <b class="green">${formatRupiah(used)}</b>
          </div>
          <div class="amplop-bar">
            <div class="amplop-fill ${color}" style="width:${barPct}%"></div>
          </div>
          <div class="row">
            <span>Target: ${formatRupiahShort(target)}</span>
            <b>${used >= target ? 'Target tercapai' : `Sisa: ${formatRupiahShort(target - used)}`}</b>
          </div>
        </div>
        <div class="amplop-foot">
          <span class="amplop-status ${statusClass}">${statusText}</span>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="amplop-link" data-edit-type="budget" data-edit-id="${b.id}">✏ Edit</button>
            <button class="amplop-link" data-del-budget="${b.id}" style="color:var(--red);">🗑 Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = cards + `
    <button class="amplop-add" data-add-budget>
      <div class="plus-c">＋</div>
      <h4>Buat Amplop Baru</h4>
      <p>Pisahkan pos alokasi pengeluaran spesifik lain</p>
    </button>
  `;

  el.querySelector('[data-add-budget]')?.addEventListener('click', createBudget);
  el.querySelectorAll('[data-del-budget]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const bud = Store.getById('budget', btn.dataset.delBudget);
      if (!bud) return;
      const ok = await confirmDialog({
        title: 'Hapus Amplop?',
        message: `Amplop "${bud.name}" akan dihapus permanen.`,
        okText: 'Ya, Hapus',
        variant: 'danger',
      });
      if (!ok) return;
      Store.remove('budget', btn.dataset.delBudget);
      flash('Amplop dihapus', 'info');
    });
  });
}

function createBudget() {
  const name = prompt('Nama budget / amplop:');
  if (!name) return;
  const targetStr = prompt('Target nominal (angka saja, contoh: 1000000):', '1000000');
  if (!targetStr) return;
  const target = parseNumber(targetStr);
  if (target <= 0) return alert('Nominal harus > 0');

  const icon = prompt('Emoji ikon (opsional):', '🎯') || '🎯';
  Store.add('budget', { name, target, icon });
  flash('Amplop baru ditambahkan ✓');
}