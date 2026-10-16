# FatchFadh — Aplikasi Laporan Keuangan

Aplikasi pencatatan keuangan pribadi berbasis web. Mobile-friendly, tanpa login, data tersimpan lokal di browser.

## Fitur
- 💰 Dashboard ringkasan keuangan
- 📥 Input pemasukan dengan kalkulator
- 📤 Input pengeluaran dengan kalkulator
- 🏷️ Manajemen kategori
- 🎯 Budgeting (amplop anggaran)
- 📊 Export laporan ke CSV & Excel

## Tech Stack
- HTML + Vanilla CSS + Vanilla JS (ES Modules)
- Chart.js (CDN) — untuk grafik
- localStorage — penyimpanan data (migrasi ke Firebase Firestore nanti)
- Firebase Hosting — deployment

## Cara Menjalankan di Lokal
1. Buka folder ini di VSCode
2. Install ekstensi **Live Server** (Ritwick Dey)
3. Klik kanan `index.html` → **Open with Live Server**
4. Browser akan terbuka di `http://127.0.0.1:5500`

## Development Roadmap
- ✅ Fase A: Setup folder & struktur
- ✅ Fase B: Migrasi UI ke multi-file
- ⬜ Fase C: Data layer (localStorage CRUD)
- ⬜ Fase D: Fitur lengkap (form, kalkulasi, hapus)
- ⬜ Fase E: Budgeting & dashboard dinamis
- ⬜ Fase F: Export CSV & Excel
- ⬜ Fase G: Deploy ke GitHub + Firebase
- ⬜ Fase H: Upgrade data ke Firestore

## Git Workflow
- Commit langsung ke `main` untuk perubahan kecil
- Branch per fitur untuk perubahan besar
- Format commit: `feat:`, `fix:`, `style:`, `docs:`