
import { adminDb } from '../lib/firebase/admin';

async function checkCache() {
  const snapshot = await adminDb.collection('shops').get();
  if (snapshot.empty) {
    console.log('No documents in shops collection.');
    return;
  }

  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    const data = doc.data();
    console.log('Keys:', Object.keys(data));
    if (data.shop) console.log('Has shop object');
    if (data.aiGuide) console.log('Has aiGuide object');
  });
}

checkCache().catch(console.error);
