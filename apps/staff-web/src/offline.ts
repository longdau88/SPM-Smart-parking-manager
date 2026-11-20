export type OfflineOperation =
  | { id: string; type: 'ENTRY'; payload: { site_id: string; lane_id: string; clean_plate: string }; createdAt: string }
  | { id: string; type: 'EXIT'; payload: { site_id: string; lane_id: string; clean_plate: string }; createdAt: string }
  | { id: string; type: 'CASH_CONFIRM'; payload: { invoice_id: string; operator_note: string }; createdAt: string }
  | { id: string; type: 'SESSION_CASH'; payload: { session_id: string; operator_note: string }; createdAt: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('spm-cabin', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('offline-outbox')) {
        request.result.createObjectStore('offline-outbox', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOffline(operation: Omit<OfflineOperation, 'id' | 'createdAt'>) {
  const db = await openDb();
  const item = { ...operation, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as OfflineOperation;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('offline-outbox', 'readwrite');
    tx.objectStore('offline-outbox').put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return item;
}

export async function listOffline(): Promise<OfflineOperation[]> {
  const db = await openDb();
  const items = await new Promise<OfflineOperation[]>((resolve, reject) => {
    const tx = db.transaction('offline-outbox', 'readonly');
    const request = tx.objectStore('offline-outbox').getAll();
    request.onsuccess = () => resolve(request.result as OfflineOperation[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return items;
}

export async function removeOffline(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('offline-outbox', 'readwrite');
    tx.objectStore('offline-outbox').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
