/**
 * gamification.js — Motore EXP non lineare, Livelli/Titoli (Seme Deku -> ...)
 * e Trofei (Bronzo / Argento / Oro / Completamento Lezione / Platino).
 */

import { loadState, saveState } from "./storage.js";

const FALLBACK_CONFIG = {
  baseExp: {
    difficulty1: 10,
    difficulty2: 25,
    difficulty3: 50,
    realityTask: 80,
    flashcards: 20
  },
  yearMultipliers: {
    "1": 1.0,
    "2": 1.4,
    "3": 2.0,
    "4": 2.8,
    "5": 4.0
  },
  difficultyLabels: {
    "1": { name: "Facile", symbol: "★☆☆", purpose: "Per introdurre il concetto" },
    "2": { name: "Intermedio", symbol: "★★☆", purpose: "Per verificare se hai davvero capito" },
    "3": { name: "Difficile", symbol: "★★★", purpose: "Per mettersi alla prova e mostrare il proprio valore" }
  },
  levels: [
    {
      level: 1,
      minExp: 0,
      title: "Seme Deku",
      description: "Non ha ancora espresso il suo potenziale, ma nessuno può dire quali grandi cose potrà diventare da grande!"
    }
  ],
  platinumTrophy: {
    id: "site-platinum",
    name: "Trofeo di Platino — Completamento Totale",
    specialTitle: "Leggenda Assoluta delle Comode Lezioni",
    description: "Conquistato collezionando TUTTI i trofei del sito!"
  }
};

let cachedConfig = FALLBACK_CONFIG;
let cachedCatalog = { udas: [] };

export function resolveRootPath(relativePath) {
  const root = (document.body?.dataset?.root || ".").replace(/\/+$/, "");
  const clean = relativePath.replace(/^\/+/, "");
  return `${root}/${clean}`;
}

export async function loadGamificationData() {
  try {
    const [cfgRes, catRes] = await Promise.all([
      fetch(resolveRootPath("data/gamification.json")),
      fetch(resolveRootPath("data/uda-catalog.json"))
    ]);
    if (cfgRes.ok) cachedConfig = await cfgRes.json();
    if (catRes.ok) cachedCatalog = await catRes.json();
  } catch (err) {
    console.warn("[gamification] Caricamento JSON non riuscito, uso configurazione di fallback.", err);
  }
  return { config: cachedConfig, catalog: cachedCatalog };
}

export function getGamificationConfig() {
  return cachedConfig;
}

export function getUdaCatalog() {
  return cachedCatalog;
}

export function calculateExerciseExp(difficulty = 1, udaYear = 1, explicitExp = null) {
  if (typeof explicitExp === "number" && Number.isFinite(explicitExp) && explicitExp >= 0) {
    return Math.round(explicitExp);
  }
  const key = `difficulty${difficulty}`;
  const base = cachedConfig.baseExp?.[key] ?? 10;
  const mult = cachedConfig.yearMultipliers?.[String(udaYear)] ?? 1.0;
  return Math.round(base * mult);
}

export function calculateActivityExp(activityKey, udaYear = 1) {
  const base = cachedConfig.baseExp?.[activityKey] ?? 20;
  const mult = cachedConfig.yearMultipliers?.[String(udaYear)] ?? 1.0;
  return Math.round(base * mult);
}

export function getLevelInfo(totalExp) {
  const levels = cachedConfig.levels || FALLBACK_CONFIG.levels;
  let current = levels[0];
  let next = null;

  for (let i = 0; i < levels.length; i += 1) {
    if (totalExp >= levels[i].minExp) {
      current = levels[i];
      next = levels[i + 1] || null;
    } else {
      break;
    }
  }

  const expIntoLevel = totalExp - current.minExp;
  const expNeededForNext = next ? next.minExp - current.minExp : 0;
  const progressPercent = next
    ? Math.min(100, Math.max(0, Math.round((expIntoLevel / expNeededForNext) * 100)))
    : 100;

  return {
    current,
    next,
    totalExp,
    expIntoLevel,
    expNeededForNext,
    progressPercent
  };
}

export function showToast(message, variant = "default") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container no-print";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${variant === "trophy" ? "toast-trophy" : ""}`.trim();
  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4600);
}

function notifyProgressChange(state) {
  window.dispatchEvent(new CustomEvent("ivano:progress-change", { detail: { state } }));
}

function unlockTrophyIfNew(state, trophy) {
  if (!trophy || !trophy.id || state.unlockedTrophies[trophy.id]) return false;
  state.unlockedTrophies[trophy.id] = {
    ...trophy,
    unlockedAt: new Date().toISOString()
  };
  showToast(`🏆 Nuovo Trofeo (${trophy.tier.toUpperCase()}): ${trophy.name}`, "trophy");
  return true;
}

/**
 * Verifica se la pagina corrente (o il catalogo globale) ha sbloccato nuovi trofei.
 */
export function evaluateTrophiesForCurrentLesson(state) {
  const lessonId = document.body?.dataset?.lessonId;
  const lessonTitle = document.body?.dataset?.lessonTitle || lessonId || "Lezione";
  const udaTitle = document.body?.dataset?.udaTitle || "";

  let changed = false;

  if (lessonId) {
    const exerciseNodes = Array.from(document.querySelectorAll("[data-exercise]"));
    const byDifficulty = { 1: [], 2: [], 3: [] };

    exerciseNodes.forEach((el) => {
      if (el.dataset.realityTaskId) return;
      const id = el.dataset.exerciseId;
      const diff = Number(el.dataset.difficulty || 1);
      if (id && byDifficulty[diff]) {
        byDifficulty[diff].push(id);
      }
    });

    const allSolvedWithExp = (ids) =>
      ids.length > 0 && ids.every((id) => state.completedExercises[id]?.expAwarded > 0);

    const tierMeta = [
      { diff: 1, tier: "bronze", label: "Bronzo" },
      { diff: 2, tier: "silver", label: "Argento" },
      { diff: 3, tier: "gold", label: "Oro" }
    ];

    tierMeta.forEach(({ diff, tier, label }) => {
      if (allSolvedWithExp(byDifficulty[diff])) {
        const customName = document.body?.dataset?.[`trophy${label}Name`];
        const unlocked = unlockTrophyIfNew(state, {
          id: `${lessonId}-${tier}`,
          tier,
          lessonId,
          name: customName || `${lessonTitle} — ${label}`,
          description: `Completati tutti gli esercizi di livello ${diff} in "${lessonTitle}".`
        });
        if (unlocked) changed = true;
      }
    });

    // Trofeo di completamento integrale della lezione (tutti gli esercizi + compito realtà + flashcard se presenti)
    const allExerciseIds = [...byDifficulty[1], ...byDifficulty[2], ...byDifficulty[3]];
    const flashcardIds = Array.from(document.querySelectorAll("[data-flashcard-deck]"))
      .map((el) => el.dataset.deckId)
      .filter(Boolean);
    const realityIds = Array.from(document.querySelectorAll("[data-reality-task-id]"))
      .map((el) => el.dataset.realityTaskId)
      .filter(Boolean);

    const exercisesOk = allExerciseIds.length > 0 && allSolvedWithExp(allExerciseIds);
    const flashcardsOk = flashcardIds.every((id) => Boolean(state.completedFlashcards[id]));
    const realityOk = realityIds.every((id) => Boolean(state.completedRealityTasks[id]));

    if (exercisesOk && flashcardsOk && realityOk) {
      const customCompleteName = document.body?.dataset?.trophyCompleteName;
      const unlocked = unlockTrophyIfNew(state, {
        id: `${lessonId}-complete`,
        tier: "completion",
        lessonId,
        name: customCompleteName || `Completamento: ${lessonTitle}`,
        description: `Completata l'intera lezione${udaTitle ? ` (${udaTitle})` : ""}, inclusi compito di realtà e flashcard!`
      });
      if (unlocked) changed = true;
    }
  }

  // Controllo Trofeo di Platino (quando tutte le UDA nel catalogo hanno tutti i trofei conquistati)
  const expectedTrophyIds = collectExpectedSiteTrophyIds();
  if (
    expectedTrophyIds.length > 0 &&
    expectedTrophyIds.every((id) => Boolean(state.unlockedTrophies[id]))
  ) {
    const plat = cachedConfig.platinumTrophy || FALLBACK_CONFIG.platinumTrophy;
    const unlocked = unlockTrophyIfNew(state, {
      id: plat.id,
      tier: "platinum",
      name: plat.name,
      specialTitle: plat.specialTitle,
      description: plat.description
    });
    if (unlocked) changed = true;
  }

  return changed;
}

export function collectExpectedSiteTrophyIds() {
  const ids = [];
  const udas = cachedCatalog?.udas || [];
  udas.forEach((uda) => {
    if (uda.status !== "published") return;
    (uda.trophies || []).forEach((t) => {
      if (t.id) ids.push(t.id);
    });
  });
  return ids;
}

export function recordExerciseSuccess({ exerciseId, difficulty = 1, udaYear = 1, udaId = "", lessonId = "", explicitExp = null }) {
  const state = loadState();
  const prevLevel = getLevelInfo(state.totalExp).current.level;

  if (state.completedExercises[exerciseId]?.expAwarded > 0) {
    return { alreadyCompleted: true, expAwarded: 0, state };
  }

  const expAwarded = calculateExerciseExp(difficulty, udaYear, explicitExp);
  state.totalExp += expAwarded;
  state.completedExercises[exerciseId] = {
    expAwarded,
    difficulty,
    udaId,
    lessonId,
    completedAt: new Date().toISOString()
  };

  showToast(`+${expAwarded} EXP guadagnati!`);

  const nextLevelInfo = getLevelInfo(state.totalExp);
  if (nextLevelInfo.current.level > prevLevel) {
    showToast(`⭐ Level Up! Livello ${nextLevelInfo.current.level}: ${nextLevelInfo.current.title}`, "trophy");
  }

  evaluateTrophiesForCurrentLesson(state);
  const saved = saveState(state);
  notifyProgressChange(saved);

  return { alreadyCompleted: false, expAwarded, state: saved };
}

export function recordFlashcardsCompleted(deckId, udaYear = 1) {
  const state = loadState();
  if (state.completedFlashcards[deckId]) {
    return { alreadyCompleted: true, expAwarded: 0, state };
  }

  const expAwarded = calculateActivityExp("flashcards", udaYear);
  state.totalExp += expAwarded;
  state.completedFlashcards[deckId] = {
    expAwarded,
    completedAt: new Date().toISOString()
  };

  showToast(`🃏 Flashcard completate! +${expAwarded} EXP`);
  evaluateTrophiesForCurrentLesson(state);
  const saved = saveState(state);
  notifyProgressChange(saved);
  return { alreadyCompleted: false, expAwarded, state: saved };
}

export function recordRealityTaskCompleted(taskId, udaYear = 1) {
  const state = loadState();
  if (state.completedRealityTasks[taskId]) {
    return { alreadyCompleted: true, expAwarded: 0, state };
  }

  const expAwarded = calculateActivityExp("realityTask", udaYear);
  state.totalExp += expAwarded;
  state.completedRealityTasks[taskId] = {
    expAwarded,
    completedAt: new Date().toISOString()
  };

  showToast(`⚡ Compito di realtà completato! +${expAwarded} EXP`);
  evaluateTrophiesForCurrentLesson(state);
  const saved = saveState(state);
  notifyProgressChange(saved);
  return { alreadyCompleted: false, expAwarded, state: saved };
}
