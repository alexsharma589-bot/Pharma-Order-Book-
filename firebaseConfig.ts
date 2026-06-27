// Fill in your Firebase project config (Firebase Console > Project Settings > General).
// This file is intentionally left as a template — the app builds and runs fully offline
// without it. Cloud sync and Firebase Authentication only activate once this is filled in
// and the .env / config values are real.

import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';
