/* ============================================================
   AUTH — Firebase Authentication
   Login, signup, logout, session guard, migrasi data lokal
   ============================================================ */

import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { Store } from './store.js';

let currentUser = null;
const authListeners = [];

/* ============================================================
   INIT
   ============================================================ */
export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    console.log('[Auth]', user ? `Logged in as ${user.email}` : 'Not logged in');

    if (user) {
      await ensureUserDoc(user);
    }

    authListeners.forEach((fn) => {
      try {
        fn(user);
      } catch (err) {
        console.error('[Auth] Listener error:', err);
      }
    });
  });
}

export function onAuthChange(cb) {
  authListeners.push(cb);
}

export function getCurrentUser() {
  return currentUser;
}

/* ============================================================
   SIGNUP
   ============================================================ */
export async function signup(email, password, displayName = '') {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred.user;
}

/* ============================================================
   LOGIN
   ============================================================ */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/* ============================================================
   GOOGLE SIGN-IN
   ============================================================ */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

/* ============================================================
   LOGOUT
   ============================================================ */
export async function logout() {
  await signOut(auth);
  currentUser = null;
}

/* ============================================================
   RESET PASSWORD
   ============================================================ */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/* ============================================================
   USER DOC
   ============================================================ */
async function ensureUserDoc(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      console.log('[Auth] User doc created');
    } else {
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.error('[Auth] ensureUserDoc failed:', err);
  }
}

/* ============================================================
   MIGRASI DATA LOKAL → FIRESTORE
   ============================================================ */
export async function migrateLocalData(userId) {
  if (!userId) return { migrated: false };

  try {
    const metaRef = doc(db, 'users', userId, 'meta', 'main');
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists() && metaSnap.data().migrated) {
      console.log('[Migrate] Already migrated');
      return { migrated: false, reason: 'already-migrated' };
    }

    const localIncome = Store.getIncome();
    const localExpense = Store.getExpense();
    const localCats = Store.getAll('categories');
    const localBudgets = Store.getAll('budget');

    const totalLocal =
      localIncome.length + localExpense.length + localCats.length + localBudgets.length;

    if (totalLocal === 0) {
      console.log('[Migrate] No local data');
      return { migrated: false, reason: 'no-data' };
    }

    const batch = writeBatch(db);

    localCats.forEach((c) => {
      batch.set(doc(db, 'users', userId, 'categories', c.id), {
        ...c,
        migratedAt: serverTimestamp(),
      });
    });

    localBudgets.forEach((b) => {
      batch.set(doc(db, 'users', userId, 'budget', b.id), {
        ...b,
        migratedAt: serverTimestamp(),
      });
    });

    localIncome.forEach((x) => {
      batch.set(doc(db, 'users', userId, 'income', x.id), {
        ...x,
        migratedAt: serverTimestamp(),
      });
    });

    localExpense.forEach((x) => {
      batch.set(doc(db, 'users', userId, 'expense', x.id), {
        ...x,
        migratedAt: serverTimestamp(),
      });
    });

    batch.set(metaRef, {
      migrated: true,
      migratedAt: serverTimestamp(),
      counts: {
        categories: localCats.length,
        budgets: localBudgets.length,
        income: localIncome.length,
        expense: localExpense.length,
      },
    });

    await batch.commit();
    console.log(`[Migrate] Uploaded ${totalLocal} items`);

    return {
      migrated: true,
      counts: {
        categories: localCats.length,
        budgets: localBudgets.length,
        income: localIncome.length,
        expense: localExpense.length,
      },
    };
  } catch (err) {
    console.error('[Migrate] Failed:', err);
    return { migrated: false, reason: 'error', error: err };
  }
}