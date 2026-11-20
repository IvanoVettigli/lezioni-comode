/**
 * site-shell.js — Header, navigazione, HUD Gamification e Footer condivisi
 * Risolve automaticamente tutti i percorsi rispetto a data-root sul <body>.
 */

import { loadState } from "./storage.js";
import { getLevelInfo, resolveRootPath } from "./gamification.js";

function renderHudContent() {
  const state = loadState();
  const levelInfo = getLevelInfo(state.totalExp);
  const trophyCount = Object.keys(state.unlockedTrophies || {}).length;
  const hasPlatinum = Boolean(state.unlockedTrophies?.["site-platinum"]);
  const displayTitle = hasPlatinum
    ? state.unlockedTrophies["site-platinum"].specialTitle || levelInfo.current.title
    : levelInfo.current.title;

  document.querySelectorAll("[data-hud-summary]").forEach((el) => {
    el.innerHTML = `
      <span>Lv.${levelInfo.current.level} · ${escapeHtml(displayTitle)}</span>
      <span class="hud-exp">${state.totalExp} EXP</span>
      <span title="Trofei conquistati">🏆 ${trophyCount}</span>
    `;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function initSiteShell() {
  const headerMount = document.querySelector("[data-site-header]");
  const footerMount = document.querySelector("[data-site-footer]");
  const currentPage = document.body?.dataset?.page || "";

  if (headerMount) {
    headerMount.innerHTML = `
      <header class="site-header no-print">
        <div class="container site-header-inner">
          <a class="site-brand" href="${resolveRootPath("index.html")}">
            <span class="site-brand-title">Le comode lezioni d'Ivano</span>
            <span class="site-brand-sub">Matematica, con elementi di Informatica, e Fisica</span>
          </a>

          <nav class="site-nav" aria-label="Navigazione principale">
            <a href="${resolveRootPath("index.html")}" ${currentPage === "home" ? 'aria-current="page"' : ""}>Home &amp; UDA</a>
            <a href="${resolveRootPath("catalogo.html")}" ${currentPage === "catalogo" ? 'aria-current="page"' : ""}>Catalogo Esercizi</a>
            <a href="${resolveRootPath("profilo.html")}" ${currentPage === "profilo" ? 'aria-current="page"' : ""}>Profilo &amp; Trofei</a>
            <a href="${resolveRootPath("ringraziamenti.html")}" ${currentPage === "ringraziamenti" ? 'aria-current="page"' : ""}>Ringraziamenti</a>
          </nav>

          <div class="site-header-controls">
            <a class="hud-pill" href="${resolveRootPath("profilo.html")}" data-hud-summary title="Apri il tuo profilo studente">
              Caricamento profilo...
            </a>
            <button type="button" class="btn btn-ghost" data-theme-toggle aria-pressed="false">
              ☀ Tema chiaro
            </button>
          </div>
        </div>
      </header>
    `;
  }

  if (footerMount) {
    footerMount.innerHTML = `
      <footer class="site-footer no-print">
        <div class="container site-footer-inner">
          <div>
            <strong>Le comode lezioni d'Ivano</strong> — Matematica, Informatica e Fisica per le scuole superiori.
            <br />
            <small>Progressi salvati in locale su questo dispositivo.</small>
          </div>
          <div class="site-footer-links">
            <a href="${resolveRootPath("index.html")}">Indice UDA</a>
            <a href="${resolveRootPath("catalogo.html")}">Catalogo Esercizi</a>
            <a href="${resolveRootPath("profilo.html")}">Profilo &amp; Trofei</a>
            <a href="${resolveRootPath("ringraziamenti.html")}">Ringraziamenti</a>
          </div>
        </div>
      </footer>
    `;
  }

  renderHudContent();
  window.addEventListener("ivano:progress-change", renderHudContent);
}
