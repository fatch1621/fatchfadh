/* ============================================================
   STORE — Data layer hybrid: cache lokal + Firestore
   Baca: dari cache lokal (instant)
   Tulis: cache lokal dulu, lalu background sync ke cloud
   ============================================================ */

import { generateId } from './utils.js';
import { cloudSet, cloudDelete, getUserId } from './sync.js';

const KEY = 'fatchfadh_data_v1';

const EMPTY = {
  income: [],
  expense: [],
  categories: [],
  budget: [],
};

let cache = null;

/* Deep clone via JSON */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ============================================================
   INTERNAL: Cache lokal
   ============================================================ */
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

function saveLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('[Store] Save failed:', err);
  }
  document.dispatchEvent(new CustomEvent('store:change'));
}

/* Update cache DARI cloud (dipakai listener 12C) — no cloud write-back */
function setFromCloud(type, items) {
  const data = load();
  data[type] = items;
  saveLocal();
  console.log(`[Store] Synced ${type} from cloud (${items.length} items)`);
}

/* ============================================================
   PUBLIC API
   ============================================================ */
export const Store = {
  /* ---------- Read (dari cache) ---------- */
  getAll(type) {
    return [...load()[type]];
  },

  getById(type, id) {
    return load()[type].find((x) => x.id === id);
  },

  /* ---------- Write ---------- */
  add(type, item) {
    const data = load();
    const newItem = {
      id: generateId(),
      createdAt: Date.now(),
      ...item,
    };
    data[type].unshift(newItem);
    saveLocal();

    /* Background: tulis ke cloud (fire & forget) */
    if (getUserId()) {
      cloudSet(type, newItem.id, newItem);
    }

    return newItem;
  },

  update(type, id, patch) {
    const data = load();
    const idx = data[type].findIndex((x) => x.id === id);
    if (idx === -1) {
      console.warn(`[Store] Update failed: ${type}/${id} not found`);
      return null;
    }
    data[type][idx] = { ...data[type][idx], ...patch, updatedAt: Date.now() };
    saveLocal();

    /* Background: tulis ke cloud */
    if (getUserId()) {
      cloudSet(type, id, data[type][idx]);
    }

    return data[type][idx];
  },

  remove(type, id) {
    const data = load();
    const item = data[type].find((x) => x.id === id);
    if (!item) return;

    data[type] = data[type].filter((x) => x.id !== id);
    saveLocal();

    /* Background: hapus dari cloud */
    if (getUserId()) {
      cloudDelete(type, id);
    }
  },

  clear(type) {
    const data = load();
    const ids = data[type].map((x) => x.id);
    data[type] = [];
    saveLocal();

    /* Background: hapus semua dari cloud */
    if (getUserId()) {
      ids.forEach((id) => cloudDelete(type, id));
      console.log(`[Store] Clearing ${ids.length} items from ${type} (cloud)`);
    }
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
      saveLocal();
      console.log('[Store] Dummy data seeded');
    } else {
      console.log('[Store] Data loaded from localStorage');
    }
  },

  loadDummy(dummy) {
    cache = clone(dummy);
    saveLocal();
  },

  reset() {
    cache = clone(EMPTY);
    saveLocal();
  },

  /* ---------- Dipakai oleh sync listener (12C) ---------- */
  _setFromCloud: setFromCloud,

  /* ---------- Debugging ---------- */
  _dump() {
    return clone(load());
  },
};