/**
 * jingle-player.js — Componente per la Canzone / Jingle di fine UDA
 */

import { resolveRootPath } from "../core/gamification.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mountJingle(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const cfgScript = container.querySelector("script[data-jingle-config]");
  if (!cfgScript) return;

  let jingle;
  try {
    jingle = JSON.parse(cfgScript.textContent || "{}");
  } catch (err) {
    console.error("[jingle-player] JSON non valido:", err);
    return;
  }

  const audioHtml = jingle.audioSrc
    ? `
      <div class="no-print" style="margin-bottom: 1rem;">
        <audio controls preload="none" style="width:100%;">
          <source src="${resolveRootPath(jingle.audioSrc)}" />
          Il tuo browser non supporta la riproduzione audio.
        </audio>
      </div>
    `
    : `<p class="muted no-print"><small>🎵 Traccia audio in arrivo — intanto puoi cantarlo a tempo leggendo il testo qui sotto!</small></p>`;

  container.innerHTML = `
    <div class="jingle-box">
      <div class="exercise-header">
        <h3 class="exercise-title">🎵 ${escapeHtml(jingle.title || "Il Jingle dell'UDA")}</h3>
        ${jingle.style ? `<span class="badge">${escapeHtml(jingle.style)}</span>` : ""}
      </div>
      ${audioHtml}
      <div class="jingle-lyrics">${escapeHtml(jingle.lyrics || "")}</div>
    </div>
  `;
}

export function initJinglePlayers() {
  document.querySelectorAll("[data-jingle-player]").forEach(mountJingle);
}
