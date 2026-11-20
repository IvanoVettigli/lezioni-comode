/**
 * storage.js — Facciata per la persistenza locale (localStorage)
 * Progettata per essere facilmente sostituita in futuro da un backend con login.
 */

const STORAGE_KEY = "ivano_lezioni_v1";

const DEFAULT_STATE = {
  schemaVersion: 1,
  theme: "dark",
  totalExp: 0,
  completedExercises: {},
  completedFlashcards: {},
  completedRealityTasks: {},
  unlockedTrophies: {},
  updatedAt: null
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...deepClone(DEFAULT_STATE),
      ...parsed,
      completedExercises: { ...(parsed.completedExercises || {}) },
      completedFlashcards: { ...(parsed.completedFlashcards || {}) },
      completedRealityTasks: { ...(parsed.completedRealityTasks || {}) },
      unlockedTrophies: { ...(parsed.unlockedTrophies || {}) }
    };
  } catch (err) {
    console.warn("[storage] Impossibile leggere localStorage, uso stato iniziale.", err);
    return deepClone(DEFAULT_STATE);
  }
}

export function saveState(nextState) {
  try {
    const payload = {
      ...nextState,
      updatedAt: new Date().toISOString()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch (err) {
    console.warn("[storage] Impossibile salvare in localStorage.", err);
    return nextState;
  }
}

export function resetState() {
  const fresh = deepClone(DEFAULT_STATE);
  return saveState(fresh);
}

export function exportStateJson() {
  return JSON.stringify(loadState(), null, 2);
}

export function importStateJson(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== "object" || typeof parsed.totalExp !== "number") {
    throw new Error("Formato del file di salvataggio non valido.");
  }
  const merged = {
    ...deepClone(DEFAULT_STATE),
    ...parsed
  };
  return saveState(merged);
}
