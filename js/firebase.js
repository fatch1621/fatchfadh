/* ============================================================
   FIREBASE — Init App, Auth, Firestore (dengan offline cache)
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

/* Initialize Firebase */
const app = initializeApp(firebaseConfig);

/* Auth */
export const auth = getAuth(app);

/* Firestore dengan offline persistence (IndexedDB)
   - Data tetap bisa dibaca & ditulis saat offline
   - Auto-sync saat kembali online
   - Multi-tab support: 2 tab browser bisa bareng
*/
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;