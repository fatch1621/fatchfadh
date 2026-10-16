/* ============================================================
   NUMPAD — Kalkulator reusable
   ============================================================ */

export function createNumpad(containerEl, displayEl) {
  if (!containerEl || !displayEl) {
    console.warn('[Numpad] container/display not found');
    return null;
  }

  const state = { expr: '' };

  function formatNumber(n) {
    if (isNaN(n)) return '0';
    return Number(n).toLocaleString('id-ID');
  }

  function compute() {
    if (!state.expr) return 0;
    try {
      const safe = state.expr.replace(/×/g, '*').replace(/÷/g, '/');
      const r = Function('return ' + safe)();
      return Math.round(Number(r)) || 0;
    } catch {
      return Number(state.expr.replace(/[^0-9]/g, '')) || 0;
    }
  }

  function render() {
    if (!state.expr) {
      displayEl.textContent = '0';
      return;
    }
    displayEl.textContent = formatNumber(compute());
  }

  function input(digit) {
    state.expr += digit;
    render();
  }

  function op(o) {
    if (!state.expr) return;
    if (/[+\-×÷]$/.test(state.expr)) {
      state.expr = state.expr.slice(0, -1);
    }
    state.expr += o;
    render();
  }

  function clear() {
    state.expr = '';
    render();
  }

  function eq() {
    const r = compute();
    state.expr = String(r);
    render();
    return r;
  }

  function add(amount) {
    const base = state.expr ? compute() : 0;
    state.expr = String(base + amount);
    render();
  }

  function set(value) {
    state.expr = value ? String(value) : '';
    render();
  }

  function get() {
    return compute();
  }

  function reset() {
    state.expr = '';
    render();
  }

  /* ---------- Attach events ---------- */
  containerEl.querySelectorAll('[data-num]').forEach((btn) => {
    btn.addEventListener('click', () => input(btn.dataset.num));
  });
  containerEl.querySelectorAll('[data-op]').forEach((btn) => {
    btn.addEventListener('click', () => op(btn.dataset.op));
  });
  containerEl.querySelectorAll('[data-clear]').forEach((btn) => {
    btn.addEventListener('click', clear);
  });
  containerEl.querySelectorAll('[data-eq]').forEach((btn) => {
    btn.addEventListener('click', eq);
  });

  render();

  return { input, op, clear, eq, add, set, get, reset, render };
}