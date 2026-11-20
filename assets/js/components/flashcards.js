/**
 * flashcards.js — Motore condiviso per le Flashcard di ripasso
 * Include una vista stampabile tabellare automatica (visibile in @media print).
 */

import { loadState } from "../core/storage.js";
import { recordFlashcardsCompleted } from "../core/gamification.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mountDeck(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const deckId = container.dataset.deckId || "deck-default";
  const udaYear = Number(container.dataset.udaYear || document.body?.dataset?.udaYear || 1);
  const cfgScript = container.querySelector("script[data-flashcards-config]");
  if (!cfgScript) return;

  let cards = [];
  try {
    cards = JSON.parse(cfgScript.textContent || "[]");
  } catch (err) {
    console.error(`[flashcards] JSON non valido nel deck ${deckId}:`, err);
    return;
  }
  if (!cards.length) return;

  let index = 0;
  let flipped = false;
  const mastered = new Set();

  const state = loadState();
  const alreadyDone = Boolean(state.completedFlashcards?.[deckId]);

  const printRows = cards
    .map(
      (c) => `
      <tr>
        <td><strong>${c.front}</strong></td>
        <td>${c.back}</td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="flashcard-deck">
      <div class="exercise-header">
        <h3 class="exercise-title">🃏 Flashcard di ripasso rapido</h3>
        <span class="badge" data-fc-counter>1 / ${cards.length}</span>
      </div>

      <div class="flashcard-stage no-print" tabindex="0" role="button" aria-label="Clicca o premi spazio per girare la flashcard" data-fc-stage>
        <div class="flashcard-label" data-fc-side>Domanda / Concetto (clicca per girare)</div>
        <div class="flashcard-content" data-fc-content></div>
      </div>

      <div class="flashcard-controls no-print">
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="btn" data-fc-prev>← Precedente</button>
          <button type="button" class="btn" data-fc-flip>🔄 Gira carta</button>
          <button type="button" class="btn" data-fc-next>Successiva →</button>
        </div>
        <button type="button" class="btn btn-success" data-fc-master>✔ Ho capito questa carta</button>
      </div>

      <p class="muted no-print" style="margin-top:0.75rem; margin-bottom:0;" data-fc-status>
        ${alreadyDone ? "✅ Mazzo di flashcard già completato su questo dispositivo!" : `Ripassate: 0 / ${cards.length}`}
      </p>

      <div class="flashcard-print-list print-only">
        <table class="flashcard-print-table">
          <thead>
            <tr>
              <th>Concetto / Domanda</th>
              <th>Risposta / Formula</th>
            </tr>
          </thead>
          <tbody>${printRows}</tbody>
        </table>
      </div>
    </div>
  `;

  const stage = container.querySelector("[data-fc-stage]");
  const sideEl = container.querySelector("[data-fc-side]");
  const contentEl = container.querySelector("[data-fc-content]");
  const counterEl = container.querySelector("[data-fc-counter]");
  const statusEl = container.querySelector("[data-fc-status]");

  function render() {
    const card = cards[index];
    counterEl.textContent = `${index + 1} / ${cards.length}`;
    sideEl.textContent = flipped
      ? "Risposta / Spiegazione (clicca per tornare al fronte)"
      : "Domanda / Concetto (clicca per girare)";
    contentEl.innerHTML = flipped ? card.back : card.front;
  }

  function flip() {
    flipped = !flipped;
    render();
  }

  stage.addEventListener("click", flip);
  stage.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flip();
    }
  });

  container.querySelector("[data-fc-flip]").addEventListener("click", flip);
  container.querySelector("[data-fc-prev]").addEventListener("click", () => {
    index = (index - 1 + cards.length) % cards.length;
    flipped = false;
    render();
  });
  container.querySelector("[data-fc-next]").addEventListener("click", () => {
    index = (index + 1) % cards.length;
    flipped = false;
    render();
  });

  container.querySelector("[data-fc-master]").addEventListener("click", () => {
    mastered.add(index);
    if (mastered.size >= cards.length) {
      const res = recordFlashcardsCompleted(deckId, udaYear);
      statusEl.textContent = res.alreadyCompleted
        ? "✅ Hai ripassato tutte le flashcard!"
        : `✅ Tutte le flashcard completate! +${res.expAwarded} EXP`;
    } else {
      statusEl.textContent = `Ripassate: ${mastered.size} / ${cards.length}`;
      index = (index + 1) % cards.length;
      flipped = false;
      render();
    }
  });

  render();
}

export function initFlashcards() {
  document.querySelectorAll("[data-flashcard-deck]").forEach(mountDeck);
}
