import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized');
}
const db = admin.firestore();

console.log("🔥 Firebase Firestore connected successfully!");

export { admin, db };