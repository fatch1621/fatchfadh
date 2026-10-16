/* ============================================================
   PAGE: DASHBOARD
   ============================================================ */

import { Store } from '../store.js';
import { formatRupiah, formatRupiahShort, formatDate, monthLabel, percent, escapeHtml } from '../utils.js';

export function renderDashboard() {
  const totals = Store.getTotals();
  const income = Store.getIncome();
  const expense = Store.getExpense();
  const budgets = Store.getBudgets();

  renderStats(totals, budgets, income, expense);
  renderDonut(totals);
  renderBudgetProgress(budgets);
  renderRecent(income, expense);
}

/* ---------- 4 Stat Cards ---------- */
function renderStats(t, budgets, income, expense) {
  const el = document.getElementById('dashStats');
  if (!el) return;

  const txCount = income.length + expense.length;

  el.innerHTML = `
    <div class="stat">
      <div class="stat-icon green">↗</div>
      <div class="stat-label">Pemasukan</div>
      <div class="stat-value green">${formatRupiahShort(t.income)}</div>
    </div>
    <div class="stat">
      <div class="stat-icon red">↘</div>
      <div class="stat-label">Pengeluaran</div>
      <div class="stat-value red">${formatRupiahShort(t.expense)}</div>
    </div>
    <div class="stat">
      <div class="stat-icon blue">🎯</div>
      <div class="stat-label">Budget Aktif</div>
      <div class="stat-value">${budgets.length}</div>
    </div>
    <div class="stat">
      <div class="stat-icon purple">📊</div>
      <div class="stat-label">Transaksi</div>
      <div class="stat-value">${txCount}</div>
    </div>
  `;
}

/* ---------- Donut Chart (CSS conic-gradient) ---------- */
function renderDonut(t) {
  const donutEl = document.getElementById('donutChart');
  const legendEl = document.getElementById('donutLegend');
  const monthEl = document.getElementById('currentMonth');
  if (!donutEl || !legendEl) return;

  const total = t.income + t.expense;
  const incPct = total ? Math.round((t.income / total) * 100) : 50;
  const expPct = 100 - incPct;

  donutEl.style.background = `conic-gradient(var(--green) 0% ${incPct}%, var(--red) ${incPct}% 100%)`;

  legendEl.innerHTML = `
    <div class="legend-item">
      <div class="legend-dot" style="background:var(--green)"></div>
      <span>Pemasukan</span><b>${incPct}%</b>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:var(--red)"></div>
      <span>Pengeluaran</span><b>${expPct}%</b>
    </div>
  `;

  if (monthEl) monthEl.textContent = monthLabel();
}

/* ---------- Budget Progress (top 3) ---------- */
function renderBudgetProgress(budgets) {
  const el = document.getElementById('budgetProgress');
  if (!el) return;

  if (budgets.length === 0) {
    el.innerHTML = `<div style="font-size:12px;color:var(--muted);text-align:center;padding:20px 0;">Belum ada budget</div>`;
    return;
  }

  /* Hitung usage tiap budget, ambil top 3 */
  const withUsage = budgets.map((b) => {
    const used = Store.getBudgetUsage(b.id);
    const pct = b.target ? Math.min(100, Math.round((used / b.target) * 100)) : 0;
    return { ...b, used, pct };
  });
  const top3 = withUsage.sort((a, b) => b.pct - a.pct).slice(0, 3);

  el.innerHTML = top3.map((b) => {
    const color = b.pct >= 90 ? 'red' : b.pct >= 70 ? 'orange' : 'green';
    return `
      <div class="progress-item">
        <div class="progress-head">
          <b>${b.icon || '🎯'} ${escapeHtml(b.name)}</b>
          <span>${formatRupiahShort(b.used)} / ${formatRupiahShort(b.target)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${color}" style="width:${b.pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* ---------- Recent Transactions (5 terakhir) ---------- */
function renderRecent(income, expense) {
  const el = document.getElementById('recentTransactions');
  if (!el) return;

  const all = [
    ...income.map((x) => ({ ...x, kind: 'income', title: x.sumber })),
    ...expense.map((x) => ({ ...x, kind: 'expense', title: x.kegunaan })),
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt - a.createdAt))
    .slice(0, 5);

  if (all.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-ico">📋</div><div class="empty-txt">Belum ada transaksi</div></div>`;
    return;
  }

  el.innerHTML = all.map((t) => {
    const cat = Store.getById('categories', t.categoryId);
    const icon = cat?.icon || (t.kind === 'income' ? '↗' : '↘');
    const amount = t.kind === 'income' ? `+${formatRupiahShort(t.amount)}` : `-${formatRupiahShort(t.amount)}`;
    const label = t.kind === 'income' ? 'Pemasukan' : 'Pengeluaran';
    return `
      <div class="list-item">
        <div class="list-avatar ${t.kind === 'income' ? 'green' : 'red'}">${icon}</div>
        <div class="list-body">
          <div class="list-title">${escapeHtml(t.title)}</div>
          <div class="list-sub">${label} · ${formatDate(t.date)}</div>
        </div>
        <div class="list-amount ${t.kind === 'income' ? 'green' : 'red'}">${amount}</div>
      </div>
    `;
  }).join('');
}