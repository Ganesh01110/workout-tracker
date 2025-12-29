import { db } from './firebase'; // Ensure this path is correct
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LOCAL_SESSIONS_KEY = 'gym_tracker_sessions';
const LOCAL_TEMPLATES_KEY = 'gym_tracker_templates';

// --- Helper for Syncing ---
// --- Helper for Syncing ---
export const fetchUserData = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const cloudSessions = data.sessions || [];
      const cloudTemplates = data.templates || [];

      // Merge strategy: Cloud is source of truth, but we keep local-only items (unsynced work)
      const localSessions = getSessions();
      const localTemplates = getTemplates();

      const cloudSessionIds = new Set(cloudSessions.map(s => s.id));
      const cloudTemplateIds = new Set(cloudTemplates.map(t => t.id));

      const mergedSessions = [...cloudSessions];
      localSessions.forEach(s => {
        if (!cloudSessionIds.has(s.id)) {
          mergedSessions.push(s);
        }
      });

      const mergedTemplates = [...cloudTemplates];
      localTemplates.forEach(t => {
        if (!cloudTemplateIds.has(t.id)) {
          mergedTemplates.push(t);
        }
      });

      // Update Local Storage with merged data
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(mergedSessions));
      localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(mergedTemplates));

      // If we found local items that weren't in cloud, sync back to cloud
      if (mergedSessions.length > cloudSessions.length || mergedTemplates.length > cloudTemplates.length) {
        saveUserData(userId, mergedSessions, mergedTemplates);
      }

      return { sessions: mergedSessions, templates: mergedTemplates };
    }
  } catch (e) {
    console.error("Error fetching cloud data", e);
  }
  return null;
};

export const saveUserData = async (userId, sessions, templates) => {
  try {
    await setDoc(doc(db, "users", userId), {
      sessions,
      templates,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error("Error saving to cloud", e);
  }
};

// --- Sessions ---
export const getSessions = () => {
  try {
    const data = localStorage.getItem(LOCAL_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading sessions", error);
    return [];
  }
};

export const saveSession = (session, userId = null) => {
  try {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === session.id);

    let newSessions;
    if (index >= 0) {
      newSessions = [...sessions];
      newSessions[index] = session;
    } else {
      newSessions = [session, ...sessions];
    }

    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(newSessions));

    // Sync if user is logged in
    if (userId) {
      const templates = getTemplates();
      saveUserData(userId, newSessions, templates);
    }

    return newSessions;
  } catch (error) {
    console.error("Error saving session", error);
    return [];
  }
};

export const deleteSession = (id, userId = null) => {
  try {
    const sessions = getSessions();
    const newSessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(newSessions));

    if (userId) {
      const templates = getTemplates();
      saveUserData(userId, newSessions, templates);
    }

    return newSessions;
  } catch (error) {
    console.error("Error deleting session", error);
    return [];
  }
};

export const createSession = (name, templateExercises = []) => {
  const exercises = templateExercises.map(name => ({
    id: crypto.randomUUID(),
    name: name,
    sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' }],
    isCompleted: false
  }));

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    name: name,
    exercises: exercises
  };
};

// --- Templates ---
export const getTemplates = () => {
  try {
    const data = localStorage.getItem(LOCAL_TEMPLATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading templates", error);
    return [];
  }
};

export const saveTemplate = (name, exerciseNames, userId = null) => {
  try {
    const templates = getTemplates();
    const newTemplate = { id: crypto.randomUUID(), name, exercises: exerciseNames };
    // Remove duplicate names if any
    const filtered = templates.filter(t => t.name !== name);
    const newTemplates = [newTemplate, ...filtered];

    localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(newTemplates));

    if (userId) {
      const sessions = getSessions();
      saveUserData(userId, sessions, newTemplates);
    }

    return newTemplates;
  } catch (error) {
    console.error("Error saving template", error);
    return [];
  }
};

export const deleteTemplate = (id, userId = null) => {
  const templates = getTemplates();
  const newTemplates = templates.filter(t => t.id !== id);
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(newTemplates));

  if (userId) {
    const sessions = getSessions();
    saveUserData(userId, sessions, newTemplates);
  }

  return newTemplates;
};
