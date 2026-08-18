import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  Firestore,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { FirebaseConfig, WorksheetData } from '../types';

const STORAGE_KEY_FIREBASE_CONFIG = 'webstat_firebase_config';
const LOCAL_PROJECTS_KEY = 'webstat_local_projects';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    // Reset instance so it re-initializes
    appInstance = null;
    dbInstance = null;
    return true;
  } catch (e) {
    return false;
  }
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  appInstance = null;
  dbInstance = null;
}

export function getFirestoreDB(): Firestore | null {
  if (dbInstance) return dbInstance;

  const config = getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    dbInstance = getFirestore(appInstance);
    return dbInstance;
  } catch (err) {
    console.error('Error initializing Firebase Firestore:', err);
    return null;
  }
}

// Save Worksheet: Uses Firestore if configured, otherwise persists to Local Projects storage seamlessly
export async function saveWorksheetCloud(worksheet: WorksheetData): Promise<{ success: boolean; mode: 'firestore' | 'local'; message: string }> {
  const db = getFirestoreDB();

  // Save to local storage cache in all cases for redundancy
  saveLocalProject(worksheet);

  if (db) {
    try {
      const docRef = doc(db, 'worksheets', worksheet.id);
      // Ensure we stay within Spark plan constraints by saving clean JSON
      await setDoc(docRef, {
        ...worksheet,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return {
        success: true,
        mode: 'firestore',
        message: 'Hoja de trabajo sincronizada exitosamente con Firebase Firestore (Plan Spark).'
      };
    } catch (err: any) {
      console.warn('Firestore write failed, falling back to local database:', err);
      return {
        success: true,
        mode: 'local',
        message: `Guardado en almacenamiento local (Error Firestore: ${err?.message || 'Permisos'}).`
      };
    }
  }

  return {
    success: true,
    mode: 'local',
    message: 'Proyecto guardado localmente en su navegador (Configure Firebase para respaldo en la nube).'
  };
}

// Load Worksheets
export async function listWorksheetsCloud(): Promise<{ worksheets: WorksheetData[]; source: 'firestore' | 'local' }> {
  const db = getFirestoreDB();

  if (db) {
    try {
      const q = query(collection(db, 'worksheets'), orderBy('updatedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const list: WorksheetData[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as WorksheetData);
      });

      if (list.length > 0) {
        return { worksheets: list, source: 'firestore' };
      }
    } catch (err) {
      console.warn('Could not read from Firestore, falling back to local:', err);
    }
  }

  return { worksheets: getLocalProjects(), source: 'local' };
}

// Delete Worksheet
export async function deleteWorksheetCloud(id: string): Promise<boolean> {
  deleteLocalProject(id);
  const db = getFirestoreDB();
  if (db) {
    try {
      await deleteDoc(doc(db, 'worksheets', id));
      return true;
    } catch (err) {
      console.error('Error deleting from Firestore:', err);
    }
  }
  return true;
}

// Local Storage helpers
export function getLocalProjects(): WorksheetData[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalProject(ws: WorksheetData): void {
  try {
    const existing = getLocalProjects();
    const filtered = existing.filter(p => p.id !== ws.id);
    filtered.unshift(ws);
    // Keep top 30
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch (e) {
    console.error('Local save error:', e);
  }
}

export function deleteLocalProject(id: string): void {
  try {
    const existing = getLocalProjects();
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Local delete error:', e);
  }
}
