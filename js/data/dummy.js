/* ============================================================
   DUMMY DATA — Sample data awal
   ============================================================ */

import { generateId } from '../utils.js';

/* Fixed IDs biar relasi antar data konsisten */
const CAT = {
  gaji:       'cat_gaji',
  freelance:  'cat_freelance',
  bonus:      'cat_bonus',
  investasi:  'cat_investasi',
  makanan:    'cat_makanan',
  transport:  'cat_transport',
  belanja:    'cat_belanja',
  tagihan:    'cat_tagihan',
  hiburan:    'cat_hiburan',
  kesehatan:  'cat_kesehatan',
};

const BUD = {
  pokok:      'bud_pokok',
  tabungan:   'bud_tabungan',
  cicilan:    'bud_cicilan',
  darurat:    'bud_darurat',
  gayaHidup:  'bud_gayahidup',
  transport:  'bud_transport',
};

const today = new Date();
const iso = (dayOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() - dayOffset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const DUMMY_DATA = {
  categories: [
    /* Pemasukan */
    { id: CAT.gaji,      type: 'income',  name: 'Gaji & Upah',              icon: '💼', color: '#10B981', limit: 0 },
    { id: CAT.freelance, type: 'income',  name: 'Side Hustle & Freelance', icon: '💻', color: '#3B82F6', limit: 0 },
    { id: CAT.bonus,     type: 'income',  name: 'Bonus & Insentif',        icon: '🏆', color: '#F59E0B', limit: 0 },
    { id: CAT.investasi, type: 'income',  name: 'Dividen & Bunga',         icon: '📈', color: '#8B5CF6', limit: 0 },

    /* Pengeluaran */
    { id: CAT.makanan,   type: 'expense', name: 'Makanan & Minuman',       icon: '🍔', color: '#F59E0B', limit: 2000000 },
    { id: CAT.transport, type: 'expense', name: 'Transportasi & Bensin',   icon: '🚗', color: '#3B82F6', limit: 1500000 },
    { id: CAT.belanja,   type: 'expense', name: 'Belanja Bulanan',         icon: '🛒', color: '#8B5CF6', limit: 1500000 },
    { id: CAT.tagihan,   type: 'expense', name: 'Tagihan & Cicilan',       icon: '📄', color: '#EF4444', limit: 5000000 },
    { id: CAT.hiburan,   type: 'expense', name: 'Hiburan & Hobi',          icon: '🎬', color: '#14B8A6', limit: 500000 },
    { id: CAT.kesehatan, type: 'expense', name: 'Kesehatan',               icon: '❤️', color: '#EC4899', limit: 500000 },
  ],

  budget: [
    { id: BUD.pokok,     name: 'Kebutuhan Pokok',       target: 8000000,   icon: '🛒', createdAt: Date.now() },
    { id: BUD.tabungan,  name: 'Tabungan & Investasi',  target: 7500000,   icon: '📈', createdAt: Date.now() },
    { id: BUD.cicilan,   name: 'Cicilan & Utang',       target: 4000000,   icon: '💳', createdAt: Date.now() },
    { id: BUD.darurat,   name: 'Dana Darurat',          target: 2500000,   icon: '🛡', createdAt: Date.now() },
    { id: BUD.gayaHidup, name: 'Gaya Hidup & Hiburan',  target: 2000000,   icon: '☕', createdAt: Date.now() },
    { id: BUD.transport, name: 'Transportasi',          target: 1500000,   icon: '🚗', createdAt: Date.now() },
  ],

  income: [
    { id: generateId(), sumber: 'Gaji Bulanan',         categoryId: CAT.gaji,      budgetId: BUD.tabungan, amount: 10000000, note: 'Gaji bulan ini',           date: iso(12), createdAt: Date.now() },
    { id: generateId(), sumber: 'Proyek Website',       categoryId: CAT.freelance, budgetId: null,         amount: 5000000,  note: 'Klien dari Singapura',     date: iso(10), createdAt: Date.now() },
    { id: generateId(), sumber: 'Dividen Saham BBCA',   categoryId: CAT.investasi, budgetId: null,         amount: 700000,   note: '',                          date: iso(8),  createdAt: Date.now() },
    { id: generateId(), sumber: 'Bonus Kuartal Q3',     categoryId: CAT.bonus,     budgetId: BUD.darurat,  amount: 3000000,  note: 'Bonus performance',         date: iso(5),  createdAt: Date.now() },
    { id: generateId(), sumber: 'Desain Logo UMKM',     categoryId: CAT.freelance, budgetId: null,         amount: 1500000,  note: 'Proyek sampingan',          date: iso(2),  createdAt: Date.now() },
  ],

  expense: [
    { id: generateId(), kegunaan: 'Free Dining Heritage Lounge', categoryId: CAT.makanan,   amount: 1850000, note: 'Anniversary dinner',      date: iso(7),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Belanja Bulanan Supermarket', categoryId: CAT.belanja,   amount: 1450000, note: 'Groceries 2 minggu',      date: iso(6),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Tagihan Listrik & Internet',  categoryId: CAT.tagihan,   amount: 1100000, note: 'PLN + Indihome',          date: iso(5),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Cicilan Pokok KPR',           categoryId: CAT.tagihan,   amount: 4000000, note: 'Auto-debit',              date: iso(4),  createdAt: Date.now() },
    { id: generateId(), kegungan: 'Bensin Shell V-Power',        kegunaan: 'Bensin Shell V-Power', categoryId: CAT.transport, amount: 420000, note: '',              date: iso(3),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Makan siang Warteg',          categoryId: CAT.makanan,   amount: 45000,   note: '',                        date: iso(2),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Kopi Kenangan',               categoryId: CAT.makanan,   amount: 30000,   note: '',                        date: iso(2),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Netflix Subscription',        categoryId: CAT.hiburan,   amount: 186000,  note: 'Bulanan',                 date: iso(1),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Obat Batuk & Vitamin',        categoryId: CAT.kesehatan, amount: 250000,  note: '',                        date: iso(1),  createdAt: Date.now() },
    { id: generateId(), kegunaan: 'Nonton Bioskop',              categoryId: CAT.hiburan,   amount: 120000,  note: 'Weekend',                 date: iso(0),  createdAt: Date.now() },
  ],
};