/**
 * main.js — Entry point condiviso per tutte le pagine e tutte le UDA
 */

import { initTheme } from "./core/theme.js";
import { loadGamificationData } from "./core/gamification.js";
import { initSiteShell } from "./core/site-shell.js";
import { initExercises } from "./components/exercise-engine.js";
import { initFlashcards } from "./components/flashcards.js";
import { initConceptMaps } from "./components/concept-map.js";
import { initInteractiveStories } from "./components/interactive-story.js";
import { initJinglePlayers } from "./components/jingle-player.js";

function initPrintButtons() {
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-print-page]");
    if (!btn) return;
    window.print();
  });
}

async function bootstrap() {
  try {
    await loadGamificationData();
  } catch (err) {
    console.warn("[main] Impossibile caricare gamification.json, proseguo con valori predefiniti:", err);
  }
  initSiteShell();
  initTheme();
  initPrintButtons();
  initExercises();
  initFlashcards();
  initConceptMaps();
  initInteractiveStories();
  initJinglePlayers();

  window.__ivanoReady = true;
  window.dispatchEvent(new CustomEvent("ivano:ready"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
