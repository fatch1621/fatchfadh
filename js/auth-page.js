/* ============================================================
   AUTH PAGE — Logic halaman login (login-only)
   Tidak ada signup — akun dibuat manual via Firebase Console
   ============================================================ */

import {
  initAuth,
  login,
  resetPassword,
  migrateLocalData,
} from './auth.js';
import { auth } from './firebase.js';

/* ---------- DOM refs ---------- */
const els = {
  form: document.getElementById('authForm'),
  inputEmail: document.getElementById('inputEmail'),
  inputPassword: document.getElementById('inputPassword'),
  togglePassword: document.getElementById('btnTogglePassword'),
  message: document.getElementById('authMessage'),
  submit: document.getElementById('authSubmit'),
  submitText: document.getElementById('authSubmitText'),
  forgot: document.getElementById('btnForgot'),
};

/* ============================================================
   INIT
   ============================================================ */
initAuth();

/* Kalau sudah login → langsung redirect ke app */
auth.onAuthStateChanged?.((user) => {
  if (user) {
    console.log('[AuthPage] Already logged in, redirecting...');
    window.location.replace('/index.html');
  }
});

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
els.form?.addEventListener('submit', handleSubmit);
els.togglePassword?.addEventListener('click', togglePasswordVisibility);
els.forgot?.addEventListener('click', handleForgot);

/* ============================================================
   LOGIN SUBMIT
   ============================================================ */
async function handleSubmit(e) {
  e.preventDefault();
  clearMessage();

  const email = els.inputEmail.value.trim();
  const password = els.inputPassword.value;

  /* Validasi */
  if (!email) return showMessage('Email wajib diisi', 'error');
  if (!isValidEmail(email)) return showMessage('Format email tidak valid', 'error');
  if (!password) return showMessage('Kata sandi wajib diisi', 'error');

  setLoading(true);

  try {
    const user = await login(email, password);
    showMessage('Login berhasil! Mengalihkan...', 'success');

    /* Migrasi data lokal ke Firestore (kalau belum pernah) */
    try {
      const result = await migrateLocalData(user.uid);
      if (result.migrated) {
        console.log('[AuthPage] Migrasi berhasil:', result.counts);
      }
    } catch (err) {
      console.warn('[AuthPage] Migrasi dilewati:', err);
    }

    setTimeout(() => window.location.replace('/index.html'), 500);
  } catch (err) {
    console.error('[AuthPage] Login error:', err);
    showMessage(friendlyError(err), 'error');
    setLoading(false);
  }
}

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */
async function handleForgot(e) {
  e.preventDefault();
  clearMessage();

  const email = els.inputEmail.value.trim();
  if (!email) return showMessage('Isi email dulu, lalu klik "Lupa Kata Sandi"', 'info');
  if (!isValidEmail(email)) return showMessage('Format email tidak valid', 'error');

  try {
    await resetPassword(email);
    showMessage(`Link reset password dikirim ke ${email}. Cek inbox & spam.`, 'success');
  } catch (err) {
    console.error('[AuthPage] Reset error:', err);
    showMessage(friendlyError(err), 'error');
  }
}

/* ============================================================
   TOGGLE PASSWORD VISIBILITY
   ============================================================ */
function togglePasswordVisibility() {
  const input = els.inputPassword;
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* ============================================================
   HELPERS
   ============================================================ */
function setLoading(on) {
  els.submit.disabled = on;
  els.submit.classList.toggle('loading', on);
}

function showMessage(text, type = 'info') {
  els.message.textContent = text;
  els.message.className = 'auth-message show ' + type;
}

function clearMessage() {
  els.message.textContent = '';
  els.message.className = 'auth-message';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function friendlyError(err) {
  const code = err.code || err.message || '';
  const map = {
    'auth/user-not-found': 'Email belum terdaftar.',
    'auth/wrong-password': 'Kata sandi salah. Coba lagi.',
    'auth/invalid-credential': 'Email atau kata sandi salah.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa menit.',
    'auth/network-request-failed': 'Koneksi bermasalah. Cek internet Anda.',
    'auth/unauthorized-domain': 'Domain ini belum diizinkan. Hubungi admin.',
  };
  return map[code] || 'Terjadi kesalahan. Coba lagi.';
}