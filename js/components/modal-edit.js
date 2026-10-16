/* ============================================================
   MODAL EDIT — Reusable edit modal untuk 4 tipe data
   Tipe: 'budget' | 'category' | 'income' | 'expense'
   ============================================================ */

import { Store } from '../store.js';
import { escapeHtml, formatRupiah, todayISO, parseNumber } from '../utils.js';
import { closeOverlay, flash } from '../ui.js';

const ICONS = [
  '🛍','🍽','🏠','🎯','✏','🛵','☕','✈','💳','📦','🎓','💼','💻','🏆',
  '📈','🚗','🛒','📄','❤️','🎬','💰','📊','🎁','🔔',
];
const COLORS = [
  '#3B82F6','#F59E0B','#10B981','#8B5CF6',
  '#EC4899','#EF4444','#14B8A6','#64748B',
];

let currentType = null;
let currentId = null;
let draft = null;
let initialized = false;
/* Mapping tipe UI → key di Store */
function storeKey(type) {
  return type === 'category' ? 'categories' : type;
}

/* ============================================================
   INIT
   ============================================================ */
export function initModalEdit() {
  if (initialized) return;
  initialized = true;

  /* Submit */
  document
    .querySelector('[data-action="edit-submit"]')
    ?.addEventListener('click', submitEdit);
}

/* ============================================================
   OPEN
   ============================================================ */
export function openEditModal(type, id) {
  const item = Store.getById(storeKey(type), id);
  if (!item) {
    flash('Data tidak ditemukan', 'error');
    return;
  }

  currentType = type;
  currentId = id;
  draft = { ...item };

  const titleEl = document.getElementById('editTitle');
  if (titleEl) titleEl.textContent = 'Edit ' + capitalize(labelOf(type));

  renderForm();
  document.getElementById('editOverlay')?.classList.add('show');
}

function labelOf(type) {
  return {
    budget: 'Amplop',
    category: 'Kategori',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
  }[type] || 'Data';
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ============================================================
   RENDER FORM (dynamic berdasarkan tipe)
   ============================================================ */
function renderForm() {
  const body = document.getElementById('editBody');
  if (!body) return;

  if (currentType === 'budget')     body.innerHTML = formBudget();
  if (currentType === 'category')   body.innerHTML = formCategory();
  if (currentType === 'income')     body.innerHTML = formIncome();
  if (currentType === 'expense')    body.innerHTML = formExpense();

  attachFormHandlers();
}

/* ---------- Form: Budget ---------- */
function formBudget() {
  return `
    <div class="edit-preview">
      <div class="icon-box" id="previewIcon">${draft.icon || '🎯'}</div>
      <div class="info">
        <h4 id="previewName">${escapeHtml(draft.name)}</h4>
        <p>Target: ${formatRupiah(draft.target || 0)}</p>
      </div>
    </div>

    <div class="entry-field">
      <label>Nama Amplop <span class="req">*</span></label>
      <input type="text" id="fName" value="${escapeHtml(draft.name)}" placeholder="cth: Kebutuhan Pokok">
    </div>

    <div class="entry-field">
      <label>Target Nominal <span class="req">*</span></label>
      <input type="text" id="fTarget" value="${draft.target || 0}" placeholder="0" inputmode="numeric">
    </div>

    <div class="entry-field">
      <label>Ikon Amplop</label>
      <div class="edit-icon-grid" id="iconGrid">
        ${ICONS.map(ic => `
          <button class="ikon-btn ${ic === (draft.icon || '🎯') ? 'active' : ''}" data-icon="${ic}">${ic}</button>
        `).join('')}
      </div>
    </div>
  `;
}

/* ---------- Form: Category ---------- */
function formCategory() {
  const isIncome = draft.type === 'income';
  return `
    <div class="edit-preview">
      <div class="icon-box" id="previewIcon" style="background:${hexSoft(draft.color)};color:${draft.color || '#2563EB'}">
        ${draft.icon || '📦'}
      </div>
      <div class="info">
        <h4 id="previewName">${escapeHtml(draft.name)}</h4>
        <p>${isIncome ? 'Pemasukan' : 'Pengeluaran'}</p>
      </div>
    </div>

    <div class="entry-field">
      <label>Nama Kategori <span class="req">*</span></label>
      <input type="text" id="fName" value="${escapeHtml(draft.name)}" placeholder="cth: Makanan & Minuman">
    </div>

    <div class="entry-field">
      <label>Tipe</label>
      <select id="fType">
        <option value="income"  ${isIncome ? 'selected' : ''}>Pemasukan (Inflow)</option>
        <option value="expense" ${!isIncome ? 'selected' : ''}>Pengeluaran (Outflow)</option>
      </select>
    </div>

    ${!isIncome ? `
    <div class="entry-field">
      <label>Limit Anggaran Bulanan <span class="opt">(opsional)</span></label>
      <input type="text" id="fLimit" value="${draft.limit || 0}" placeholder="0" inputmode="numeric">
    </div>` : ''}

    <div class="entry-field">
      <label>Ikon</label>
      <div class="edit-icon-grid" id="iconGrid">
        ${ICONS.map(ic => `
          <button class="ikon-btn ${ic === (draft.icon || '📦') ? 'active' : ''}" data-icon="${ic}">${ic}</button>
        `).join('')}
      </div>
    </div>

    <div class="entry-field">
      <label>Warna</label>
      <div class="edit-color-grid" id="colorGrid">
        ${COLORS.map(c => `
          <button class="edit-color-btn ${c === (draft.color || '#3B82F6') ? 'active' : ''}"
                  style="background:${c}" data-color="${c}"></button>
        `).join('')}
      </div>
    </div>
  `;
}

/* ---------- Form: Income ---------- */
function formIncome() {
  const cats = Store.getCategories('income');
  const buds = Store.getBudgets();
  return `
    <div class="entry-field">
      <label>Sumber Pemasukan <span class="req">*</span></label>
      <input type="text" id="fSumber" value="${escapeHtml(draft.sumber || '')}" placeholder="cth: Gaji Bulanan">
    </div>

    <div class="entry-field">
      <label>Kategori <span class="req">*</span></label>
      <select id="fCategory">
        ${cats.map(c => `
          <option value="${c.id}" ${c.id === draft.categoryId ? 'selected' : ''}>
            ${c.icon} ${escapeHtml(c.name)}
          </option>
        `).join('')}
      </select>
    </div>

    <div class="entry-field">
      <label>Alokasi Budget <span class="opt">(opsional)</span></label>
      <select id="fBudget">
        <option value="">-- Tanpa Budget --</option>
        ${buds.map(b => `
          <option value="${b.id}" ${b.id === draft.budgetId ? 'selected' : ''}>
            ${b.icon || '🎯'} ${escapeHtml(b.name)}
          </option>
        `).join('')}
      </select>
    </div>

    <div class="entry-field">
      <label>Jumlah <span class="req">*</span></label>
      <input type="text" id="fAmount" value="${draft.amount || 0}" placeholder="0" inputmode="numeric">
    </div>

    <div class="entry-field">
      <label>Tanggal <span class="req">*</span></label>
      <input type="date" id="fDate" value="${draft.date || todayISO()}">
    </div>

    <div class="entry-field">
      <label>Catatan</label>
      <textarea id="fNote" placeholder="Opsional...">${escapeHtml(draft.note || '')}</textarea>
    </div>
  `;
}

/* ---------- Form: Expense ---------- */
function formExpense() {
  const cats = Store.getCategories('expense');
  return `
    <div class="entry-field">
      <label>Kegunaan <span class="req">*</span></label>
      <input type="text" id="fKegunaan" value="${escapeHtml(draft.kegunaan || '')}" placeholder="cth: Beli Sembako">
    </div>

    <div class="entry-field">
      <label>Kategori <span class="req">*</span></label>
      <select id="fCategory">
        ${cats.map(c => `
          <option value="${c.id}" ${c.id === draft.categoryId ? 'selected' : ''}>
            ${c.icon} ${escapeHtml(c.name)}
          </option>
        `).join('')}
      </select>
    </div>

    <div class="entry-field">
      <label>Jumlah <span class="req">*</span></label>
      <input type="text" id="fAmount" value="${draft.amount || 0}" placeholder="0" inputmode="numeric">
    </div>

    <div class="entry-field">
      <label>Tanggal <span class="req">*</span></label>
      <input type="date" id="fDate" value="${draft.date || todayISO()}">
    </div>

    <div class="entry-field">
      <label>Catatan</label>
      <textarea id="fNote" placeholder="Opsional...">${escapeHtml(draft.note || '')}</textarea>
    </div>
  `;
}

/* ============================================================
   ATTACH HANDLERS (icon & color picker)
   ============================================================ */
function attachFormHandlers() {
  /* Icon grid */
  document.querySelectorAll('#iconGrid [data-icon]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#iconGrid [data-icon]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      draft.icon = btn.dataset.icon;
      updatePreview();
    });
  });

  /* Color grid */
  document.querySelectorAll('#colorGrid [data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#colorGrid [data-color]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      draft.color = btn.dataset.color;
      updatePreview();
    });
  });

  /* Live preview nama */
  const nameInput = document.getElementById('fName') || document.getElementById('fSumber');
  nameInput?.addEventListener('input', () => {
    const el = document.getElementById('previewName');
    if (el) el.textContent = nameInput.value || '(kosong)';
  });
}

function updatePreview() {
  const iconEl = document.getElementById('previewIcon');
  if (iconEl && draft.icon) iconEl.textContent = draft.icon;
  if (iconEl && draft.color && currentType === 'category') {
    iconEl.style.background = hexSoft(draft.color);
    iconEl.style.color = draft.color;
  }
}

/* ============================================================
   SUBMIT
   ============================================================ */
function submitEdit() {
  if (!currentType || !currentId) return;

  const patch = collectPatch();
  if (!patch) return;

  Store.update(storeKey(currentType), currentId, patch);
  closeOverlay('editOverlay');
  flash('Perubahan disimpan ✓');
  currentType = null;
  currentId = null;
  draft = null;
}

function collectPatch() {
  if (currentType === 'budget') {
    const name = document.getElementById('fName').value.trim();
    const target = parseNumber(document.getElementById('fTarget').value);
    if (!name) { flash('Nama wajib diisi', 'error'); return null; }
    if (target <= 0) { flash('Target harus > 0', 'error'); return null; }
    return { name, target, icon: draft.icon || '🎯' };
  }

  if (currentType === 'category') {
    const name = document.getElementById('fName').value.trim();
    const type = document.getElementById('fType').value;
    const limitEl = document.getElementById('fLimit');
    const limit = limitEl ? parseNumber(limitEl.value) : 0;
    if (!name) { flash('Nama wajib diisi', 'error'); return null; }
    return {
      name,
      type,
      limit: type === 'expense' ? limit : 0,
      icon: draft.icon || '📦',
      color: draft.color || '#3B82F6',
    };
  }

  if (currentType === 'income') {
    const sumber = document.getElementById('fSumber').value.trim();
    const categoryId = document.getElementById('fCategory').value;
    const budgetId = document.getElementById('fBudget').value || null;
    const amount = parseNumber(document.getElementById('fAmount').value);
    const date = document.getElementById('fDate').value;
    const note = document.getElementById('fNote').value.trim();

    if (!sumber) { flash('Sumber wajib diisi', 'error'); return null; }
    if (!categoryId) { flash('Pilih kategori', 'error'); return null; }
    if (amount <= 0) { flash('Jumlah harus > 0', 'error'); return null; }
    if (!date) { flash('Tanggal wajib diisi', 'error'); return null; }

    return { sumber, categoryId, budgetId, amount, date, note };
  }

  if (currentType === 'expense') {
    const kegunaan = document.getElementById('fKegunaan').value.trim();
    const categoryId = document.getElementById('fCategory').value;
    const amount = parseNumber(document.getElementById('fAmount').value);
    const date = document.getElementById('fDate').value;
    const note = document.getElementById('fNote').value.trim();

    if (!kegunaan) { flash('Kegunaan wajib diisi', 'error'); return null; }
    if (!categoryId) { flash('Pilih kategori', 'error'); return null; }
    if (amount <= 0) { flash('Jumlah harus > 0', 'error'); return null; }
    if (!date) { flash('Tanggal wajib diisi', 'error'); return null; }

    return { kegunaan, categoryId, amount, date, note };
  }

  return null;
}

/* ---------- Hex → soft background ---------- */
function hexSoft(hex) {
  if (!hex) return '#DBEAFE';
  const map = {
    '#3B82F6': '#DBEAFE',
    '#F59E0B': '#FEF3C7',
    '#10B981': '#D1FAE5',
    '#8B5CF6': '#EDE9FE',
    '#EC4899': '#FCE7F3',
    '#EF4444': '#FEE2E2',
    '#14B8A6': '#CCFBF1',
    '#64748B': '#E2E8F0',
  };
  return map[hex] || '#E2E8F0';
}