/**
 * theme.js — Gestione Tema Scuro (default) / Tema Chiaro
 */

import { loadState, saveState } from "./storage.js";

const VALID_THEMES = new Set(["dark", "light"]);

export function getCurrentTheme() {
  const state = loadState();
  return VALID_THEMES.has(state.theme) ? state.theme : "dark";
}

export function applyTheme(theme) {
  const resolved = VALID_THEMES.has(theme) ? theme : "dark";
  document.documentElement.setAttribute("data-theme", resolved);

  const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
  toggleButtons.forEach((btn) => {
    const isDark = resolved === "dark";
    btn.setAttribute("aria-pressed", String(!isDark));
    btn.textContent = isDark ? "☀ Tema chiaro" : "🌙 Tema scuro";
    btn.title = isDark ? "Passa al tema chiaro" : "Passa al tema scuro";
  });

  window.dispatchEvent(new CustomEvent("ivano:theme-change", { detail: { theme: resolved } }));
  return resolved;
}

export function toggleTheme() {
  const next = getCurrentTheme() === "dark" ? "light" : "dark";
  const state = loadState();
  state.theme = next;
  saveState(state);
  return applyTheme(next);
}

export function initTheme() {
  applyTheme(getCurrentTheme());
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-theme-toggle]");
    if (!btn) return;
    toggleTheme();
  });
}
