/* ============================================================
   STORE — Data layer (localStorage)
   Nanti tinggal ganti isi file ini untuk migrasi ke Firestore.
   ============================================================ */

import { generateId } from './utils.js';

const KEY = 'fatchfadh_data_v1';

const EMPTY = {
  income: [],
  expense: [],
  categories: [],
  budget: [],
};

let cache = null;

/* Deep clone via JSON — aman di semua browser (structuredClone tidak selalu ada) */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ---------- Internal ---------- */
function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : clone(EMPTY);
  } catch (err) {
    console.error('[Store] Load failed:', err);
    cache = clone(EMPTY);
  }
  return cache;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('[Store] Save failed:', err);
  }
  document.dispatchEvent(new CustomEvent('store:change'));
}

/* ============================================================
   PUBLIC API
   ============================================================ */
export const Store = {
  getAll(type) {
    return [...load()[type]];
  },

  getById(type, id) {
    return load()[type].find((x) => x.id === id);
  },

  add(type, item) {
    const data = load();
    const newItem = {
      id: generateId(),
      createdAt: Date.now(),
      ...item,
    };
    data[type].unshift(newItem);
    save();
    return newItem;
  },

  remove(type, id) {
    const data = load();
    data[type] = data[type].filter((x) => x.id !== id);
    save();
  },
  update(type, id, patch) {
    const data = load();
    const idx = data[type].findIndex((x) => x.id === id);
    if (idx === -1) {
      console.warn(`[Store] Update failed: ${type}/${id} not found`);
      return null;
    }
    data[type][idx] = { ...data[type][idx], ...patch, updatedAt: Date.now() };
    save();
    return data[type][idx];
  },
  clear(type) {
    load()[type] = [];
    save();
  },

  /* ---------- Shortcut getters ---------- */
  getIncome()  { return this.getAll('income'); },
  getExpense() { return this.getAll('expense'); },
  getBudgets() { return this.getAll('budget'); },

  getCategories(type) {
    const all = this.getAll('categories');
    return type ? all.filter((c) => c.type === type) : all;
  },

  /* ---------- Totals ---------- */
  getTotals() {
    const income = this.getIncome().reduce((s, x) => s + (x.amount || 0), 0);
    const expense = this.getExpense().reduce((s, x) => s + (x.amount || 0), 0);
    return {
      income,
      expense,
      balance: income - expense,
    };
  },

  /* Budget usage = total pemasukan yang di-plotkan ke budget ini */
  getBudgetUsage(budgetId) {
    return this.getIncome()
      .filter((x) => x.budgetId === budgetId)
      .reduce((s, x) => s + (x.amount || 0), 0);
  },

  /* ---------- Seed / Reset ---------- */
  initDummy(dummy) {
    const data = load();
    const isEmpty =
      data.categories.length === 0 &&
      data.income.length === 0 &&
      data.expense.length === 0;

    if (isEmpty) {
      cache = clone(dummy);
      save();
      console.log('[Store] Dummy data seeded');
    } else {
      console.log('[Store] Data loaded from localStorage');
    }
  },

  loadDummy(dummy) {
    cache = clone(dummy);
    save();
  },

  reset() {
    cache = clone(EMPTY);
    save();
  },
};