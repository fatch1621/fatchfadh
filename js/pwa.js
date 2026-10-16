/* ============================================================
   PWA — Service Worker registration + install prompt
   ============================================================ */

import { flash } from './ui.js';

let deferredPrompt = null;
let initialized = false;

/* ============================================================
   INIT
   ============================================================ */
export function initPWA() {
  if (initialized) return;
  initialized = true;

  /* Register service worker */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);

          /* Cek update tiap kali load */
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                /* Ada versi baru → tawarkan refresh */
                showUpdateToast();
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] SW registration failed:', err);
        });
    });
  }

  /* Install prompt (Android Chrome) */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
    showInstallBanner();
  });

  /* Deteksi app sudah di-install */
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    hideInstallBanner();
    flash('Aplikasi berhasil di-install ✓');
  });

  /* Cek display mode */
  if (isStandalone()) {
    document.body.classList.add('pwa-standalone');
  }
}

/* ============================================================
   INSTALL PROMPT
   ============================================================ */
export function promptInstall() {
  if (!deferredPrompt) {
    flash('Install tidak tersedia di browser ini', 'info');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choice) => {
    if (choice.outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    }
    deferredPrompt = null;
    hideInstallBanner();
  });
}

function showInstallBanner() {
  if (document.getElementById('pwaInstallBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.innerHTML = `
    <div class="pwa-install-content">
      <div class="pwa-install-icon">💰</div>
      <div class="pwa-install-text">
        <strong>Install FatchFadh</strong>
        <span>Akses cepat dari home screen</span>
      </div>
      <button class="pwa-install-btn" id="pwaInstallBtn">Install</button>
      <button class="pwa-install-close" id="pwaCloseBtn">✕</button>
    </div>
  `;

  /* Style inline biar nggak perlu file CSS baru */
  Object.assign(banner.style, {
    position: 'fixed',
    bottom: '100px',
    left: '16px',
    right: '16px',
    zIndex: '80',
    background: '#fff',
    borderRadius: '16px',
    padding: '14px',
    boxShadow: '0 10px 30px rgba(15,23,42,.15)',
    border: '1px solid rgba(226,232,240,.6)',
    animation: 'fadeIn .3s ease',
  });

  document.body.appendChild(banner);

  const style = document.createElement('style');
  style.textContent = `
    .pwa-install-content { display: flex; align-items: center; gap: 12px; }
    .pwa-install-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #10B981, #059669);
      display: grid; place-items: center; font-size: 22px;
      flex-shrink: 0;
    }
    .pwa-install-text { flex: 1; min-width: 0; }
    .pwa-install-text strong { display: block; font-size: 14px; font-weight: 800; color: #0F172A; }
    .pwa-install-text span { font-size: 12px; color: #64748B; }
    .pwa-install-btn {
      padding: 9px 16px; border-radius: 10px;
      background: linear-gradient(135deg, #10B981, #059669);
      color: #fff; font-weight: 700; font-size: 13px;
      flex-shrink: 0;
    }
    .pwa-install-close {
      width: 28px; height: 28px; border-radius: 50%;
      background: #F1F5F9; color: #64748B;
      display: grid; place-items: center; font-size: 12px;
      flex-shrink: 0;
    }
    @media (min-width: 900px) {
      #pwaInstallBanner { left: auto; right: 24px; bottom: 24px; max-width: 400px; }
    }
  `;
  document.head.appendChild(style);

  document.getElementById('pwaInstallBtn')?.addEventListener('click', promptInstall);
  document.getElementById('pwaCloseBtn')?.addEventListener('click', () => {
    hideInstallBanner();
    /* Jangan munculin lagi selama 7 hari */
    localStorage.setItem('pwa_banner_hidden_until', String(Date.now() + 7 * 86400000));
  });
}

function hideInstallBanner() {
  document.getElementById('pwaInstallBanner')?.remove();
}

/* ============================================================
   UPDATE TOAST
   ============================================================ */
function showUpdateToast() {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <span>Versi baru tersedia</span>
    <button id="pwaReloadBtn" style="
      padding: 4px 10px; border-radius: 8px;
      background: rgba(255,255,255,.2); color: #fff;
      font-weight: 700; font-size: 12px; margin-left: 12px;
    ">Reload</button>
  `;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0F172A',
    color: '#fff',
    padding: '12px 18px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '9999',
    boxShadow: '0 8px 24px rgba(0,0,0,.35)',
    display: 'flex',
    alignItems: 'center',
    maxWidth: '90vw',
  });
  document.body.appendChild(toast);

  document.getElementById('pwaReloadBtn')?.addEventListener('click', () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage('SKIP_WAITING');
      }
      window.location.reload();
    });
  });

  setTimeout(() => toast.remove(), 10000);
}

/* ============================================================
   HELPERS
   ============================================================ */
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}