/* ============================================================
   UTILS — Helper functions
   ============================================================ */

/* ---------- Rupiah Formatting ---------- */
export function formatRupiah(n) {
  if (!n || isNaN(n)) return 'Rp 0';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function formatRupiahShort(n) {
  if (!n || isNaN(n)) return 'Rp 0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return sign + 'Rp ' + (abs / 1e9).toFixed(1).replace('.0', '') + 'M';
  if (abs >= 1e6) return sign + 'Rp ' + (abs / 1e6).toFixed(1).replace('.0', '') + 'jt';
  if (abs >= 1e3) return sign + 'Rp ' + Math.round(abs / 1e3) + 'rb';
  return sign + 'Rp ' + Math.round(abs).toLocaleString('id-ID');
}

/* ---------- Date Formatting ---------- */
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONTHS_LONG  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_LONG    = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatDateFull(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateWithDay(iso) {
  const d = new Date(iso);
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthLabel(date = new Date()) {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------- Misc ---------- */
export function generateId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}