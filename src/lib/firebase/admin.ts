import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
console.log("[DEBUG] Initializing Firebase Admin...");
// We use getApps() to avoid re-initializing if already initialized (hot reload support)
const apps = getApps();

let app;

if (apps.length === 0) {
  // Use Application Default Credentials (ADC)
  // [MODIFIED] Prioritizing NEXT_PUBLIC_FIREBASE_PROJECT_ID for local dev consistency
  const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const cloudProjectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  const projectId = envProjectId || cloudProjectId;
  
  console.log(`[DEBUG] Admin Init. Priority: NEXT_PUBLIC (${envProjectId}) > GOOGLE_CLOUD (${cloudProjectId})`);
  console.log(`[DEBUG] Selected Project ID: ${projectId}`);
  
  if (envProjectId && cloudProjectId && envProjectId !== cloudProjectId) {
    console.warn(`[WARNING] Project ID Mismatch! Using ${envProjectId} but Cloud env says ${cloudProjectId}`);
  }

  app = initializeApp({
    projectId: projectId
  });
  console.log(`[DEBUG] Final Admin App Project ID: ${app.options.projectId}`);
} else {
  app = apps[0];
}

// Export the Admin Firestore instance
// Export the Admin Firestore instance
export const adminDb = getFirestore(app);
