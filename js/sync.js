/* ============================================================
   SYNC — Orkestrasi sinkronisasi dengan Firestore
   Status: 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
   ============================================================ */

import { db } from './firebase.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* Koleksi yang disinkronkan */
export const COLLECTIONS = ['categories', 'budget', 'income', 'expense'];

let currentUserId = null;
let status = 'idle';
let listeners = [];
const statusListeners = [];

/* ============================================================
   STATUS
   ============================================================ */
export function getSyncStatus() {
  return status;
}

export function onSyncStatus(cb) {
  statusListeners.push(cb);
  cb(status); /* Panggil langsung dengan status awal */
  return () => {
    const idx = statusListeners.indexOf(cb);
    if (idx > -1) statusListeners.splice(idx, 1);
  };
}

function setStatus(newStatus) {
  if (status === newStatus) return;
  const old = status;
  status = newStatus;
  console.log(`[Sync] Status: ${old} → ${newStatus}`);
  statusListeners.forEach((fn) => {
    try {
      fn(newStatus);
    } catch (err) {
      console.error('[Sync] Status listener error:', err);
    }
  });
  document.dispatchEvent(new CustomEvent('sync:status', { detail: { status: newStatus, old } }));
}

/* ============================================================
   INIT
   ============================================================ */
export function initSync(userId) {
  if (!userId) {
    console.warn('[Sync] No userId, skip init');
    return;
  }
  if (currentUserId === userId) {
    console.log('[Sync] Already initialized for this user');
    return;
  }

  currentUserId = userId;
  console.log('[Sync] Initialized for user:', userId);

  /* Monitor koneksi browser */
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  setStatus(navigator.onLine ? 'synced' : 'offline');
}

export function stopSync() {
  listeners.forEach((unsub) => {
    try {
      unsub();
    } catch (err) {
      console.error('[Sync] Unsub error:', err);
    }
  });
  listeners = [];
  currentUserId = null;
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  setStatus('idle');
}

function handleOnline() {
  console.log('[Sync] Back online');
  setStatus('syncing');
  /* Firestore auto-sync offline queue */
  setTimeout(() => setStatus('synced'), 1000);
}

function handleOffline() {
  console.log('[Sync] Offline');
  setStatus('offline');
}

/* ============================================================
   CLOUD OPERATIONS (dipakai Store saat write)
   ============================================================ */
export function cloudSet(collectionName, id, data) {
  if (!currentUserId) return Promise.resolve();
  const ref = doc(db, 'users', currentUserId, collectionName, id);
  return setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch((err) => {
    console.error(`[Sync] cloudSet ${collectionName}/${id} failed:`, err);
    setStatus('error');
  });
}

export function cloudDelete(collectionName, id) {
  if (!currentUserId) return Promise.resolve();
  const ref = doc(db, 'users', currentUserId, collectionName, id);
  return deleteDoc(ref).catch((err) => {
    console.error(`[Sync] cloudDelete ${collectionName}/${id} failed:`, err);
    setStatus('error');
  });
}

export function cloudClearCollection(collectionName) {
  if (!currentUserId) return Promise.resolve();
  /* Placeholder — implementasi di 12B */
  console.warn('[Sync] cloudClearCollection not implemented yet');
  return Promise.resolve();
}

/* ============================================================
   REALTIME LISTENERS (placeholder — aktifkan di 12C)
   ============================================================ */
export function startListeners(onData, onError) {
  if (!currentUserId) return;

  /* Bersihkan listener lama dulu */
  listeners.forEach((unsub) => {
    try { unsub(); } catch {}
  });
  listeners = [];

  console.log('[Sync] Starting realtime listeners...');

  COLLECTIONS.forEach((col) => {
    const colRef = collection(db, 'users', currentUserId, col);

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          /* Buang field Firestore-specific biar konsisten dengan struktur lokal */
          const { updatedAt, migratedAt, ...clean } = data;
          return { id: d.id, ...clean };
        });

        console.log(`[Sync] Realtime update: ${col} (${docs.length} docs)`);
        setStatus('synced');

        try {
          onData(col, docs);
        } catch (err) {
          console.error(`[Sync] onData error for ${col}:`, err);
        }
      },
      (err) => {
        console.error(`[Sync] Listener error on ${col}:`, err);
        setStatus('error');
        if (onError) onError(col, err);
      }
    );

    listeners.push(unsub);
  });
}

/* ============================================================
   PULL FROM CLOUD (placeholder — dipakai 12B/12C)
   ============================================================ */
export async function pullFromCloud() {
  if (!currentUserId) return {};

  console.log('[Sync] Pulling from cloud...');
  setStatus('syncing');

  const result = {};

  try {
    for (const col of COLLECTIONS) {
      const colRef = collection(db, 'users', currentUserId, col);
      const snap = await getDocs(colRef);
      result[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    setStatus('synced');
    console.log('[Sync] Pull complete:', Object.keys(result).map(k => `${k}: ${result[k].length}`).join(', '));
    return result;
  } catch (err) {
    console.error('[Sync] Pull failed:', err);
    setStatus('error');
    return {};
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
export function getUserId() {
  return currentUserId;
}

export function isOnline() {
  return navigator.onLine;
}