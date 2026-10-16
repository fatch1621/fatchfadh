/* ============================================================
   EXPORT — Generate file CSV & Excel (.xls)
   Tanpa library eksternal, native Blob + HTML table
   ============================================================ */

import { Store } from './store.js';
import { flash, withLoading } from './ui.js';

/* ============================================================
   PUBLIC API
   ============================================================ */
export function exportData(type) {
  /* Cari tombol yang diklik untuk loading state */
  const selector = type === 'csv' ? '[data-action="export-csv"]' : '[data-action="export-excel"]';
  const btn = document.querySelector(selector);

  withLoading(btn, async () => {
    /* Delay kecil biar loading kelihatan */
    await new Promise((r) => setTimeout(r, 300));

    const rows = buildRows();
    if (rows.length === 0) {
      flash('Belum ada data untuk di-export', 'error');
      return;
    }

    if (type === 'csv') {
      downloadCSV(rows);
    } else if (type === 'excel') {
      downloadExcel(rows);
    }
  });
}

/* ============================================================
   BUILD DATA
   ============================================================ */
function buildRows() {
  const rows = [];

  /* Pemasukan */
  Store.getIncome().forEach((x) => {
    const cat = Store.getById('categories', x.categoryId);
    rows.push({
      source: x.sumber || '-',
      kind: 'Pemasukan',
      amount: x.amount || 0,
      category: cat?.name || '-',
      note: x.note || '',
      date: x.date || '',
    });
  });

  /* Pengeluaran */
  Store.getExpense().forEach((x) => {
    const cat = Store.getById('categories', x.categoryId);
    rows.push({
      source: x.kegunaan || '-',
      kind: 'Pengeluaran',
      amount: -(x.amount || 0), // tanda minus biar jelas
      category: cat?.name || '-',
      note: x.note || '',
      date: x.date || '',
    });
  });

  /* Urutkan by tanggal (terbaru dulu) */
  rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return rows;
}

/* ============================================================
   CSV
   ============================================================ */
function downloadCSV(rows) {
  const headers = ['Tanggal', 'Kegunaan/Sumber', 'Pemasukan/Pengeluaran', 'Jumlah', 'Kategori', 'Deskripsi'];

  const lines = [headers.join(',')];

  rows.forEach((r) => {
    const line = [
      r.date,
      escapeCSV(r.source),
      r.kind,
      r.amount,
      escapeCSV(r.category),
      escapeCSV(r.note),
    ].join(',');
    lines.push(line);
  });

  /* Tambah BOM supaya Excel baca UTF-8 dengan benar */
  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `fatchfadh-laporan-${stamp()}.csv`);
  flash('File CSV berhasil diunduh ✓');
}

function escapeCSV(val) {
  if (val == null) return '';
  const str = String(val);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/* ============================================================
   EXCEL (.xls — HTML table dengan MIME Excel)
   Bisa dibuka di Excel, Google Sheets, LibreOffice
   ============================================================ */
function downloadExcel(rows) {
  const html = buildExcelHTML(rows);
  /* Content-Type application/vnd.ms-excel bikin Excel recognize */
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, `fatchfadh-laporan-${stamp()}.xls`);
  flash('File Excel berhasil diunduh ✓');
}

function buildExcelHTML(rows) {
  /* Summary */
  const totals = Store.getTotals();
  const incCount = Store.getIncome().length;
  const expCount = Store.getExpense().length;

  const summaryRows = `
    <tr><td colspan="6" style="font-weight:800;font-size:14pt;padding:8px 0;">Laporan Keuangan FatchFadh</td></tr>
    <tr><td colspan="6" style="font-size:10pt;color:#666;">Dibuat: ${new Date().toLocaleString('id-ID')}</td></tr>
    <tr><td colspan="6"></td></tr>
    <tr><td style="font-weight:700;">Total Pemasukan</td><td colspan="5" style="color:#059669;font-weight:700;">Rp ${totals.income.toLocaleString('id-ID')} (${incCount} transaksi)</td></tr>
    <tr><td style="font-weight:700;">Total Pengeluaran</td><td colspan="5" style="color:#DC2626;font-weight:700;">Rp ${totals.expense.toLocaleString('id-ID')} (${expCount} transaksi)</td></tr>
    <tr><td style="font-weight:700;">Saldo Akhir</td><td colspan="5" style="font-weight:700;">Rp ${totals.balance.toLocaleString('id-ID')}</td></tr>
    <tr><td colspan="6"></td></tr>
  `;

  /* Header tabel */
  const headerRow = `
    <tr style="background:#0F172A;color:#fff;font-weight:700;">
      <th style="padding:8px;text-align:left;border:1px solid #ccc;">Tanggal</th>
      <th style="padding:8px;text-align:left;border:1px solid #ccc;">Kegunaan / Sumber</th>
      <th style="padding:8px;text-align:left;border:1px solid #ccc;">Pemasukan / Pengeluaran</th>
      <th style="padding:8px;text-align:right;border:1px solid #ccc;">Jumlah</th>
      <th style="padding:8px;text-align:left;border:1px solid #ccc;">Kategori</th>
      <th style="padding:8px;text-align:left;border:1px solid #ccc;">Deskripsi</th>
    </tr>
  `;

  /* Data rows */
  const dataRows = rows.map((r) => {
    const color = r.amount >= 0 ? '#059669' : '#DC2626';
    return `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.date)}</td>
        <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.source)}</td>
        <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.kind)}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right;color:${color};font-weight:600;">
          ${r.amount.toLocaleString('id-ID')}
        </td>
        <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.category)}</td>
        <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.note)}</td>
      </tr>
    `;
  }).join('');

  return `
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
        th, td { vertical-align: middle; }
      </style>
    </head>
    <body>
      <table>
        ${summaryRows}
        ${headerRow}
        ${dataRows}
      </table>
    </body>
    </html>
  `;
}

/* ============================================================
   HELPERS
   ============================================================ */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}