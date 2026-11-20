/**
 * interactive-story.js — Motore per la Fiaba Interattiva di ogni UDA
 * Predisposto per immagini dei personaggi/ambientazioni (assets/img/fiaba/)
 * e bivi narrativi collegati agli argomenti matematici/fisici dell'UDA.
 */

import { resolveRootPath } from "../core/gamification.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mountStory(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const cfgScript = container.querySelector("script[data-story-config]");
  if (!cfgScript) return;

  let story;
  try {
    story = JSON.parse(cfgScript.textContent || "{}");
  } catch (err) {
    console.error("[interactive-story] JSON non valido:", err);
    return;
  }

  const scenes = story.scenes || {};
  const startId = story.start || Object.keys(scenes)[0];
  if (!startId || !scenes[startId]) return;

  function renderScene(sceneId) {
    const scene = scenes[sceneId];
    if (!scene) return;

    const imageHtml = scene.image
      ? `<div class="story-media"><img src="${resolveRootPath(scene.image)}" alt="${escapeHtml(scene.imageAlt || scene.title || "Illustrazione fiaba")}" /></div>`
      : "";

    const choices = Array.isArray(scene.choices) ? scene.choices : [];
    const choicesHtml = choices.length
      ? choices
          .map(
            (ch, idx) =>
              `<button type="button" class="btn btn-primary" data-story-next="${escapeHtml(ch.next)}" data-choice-idx="${idx}">${escapeHtml(ch.label)}</button>`
          )
          .join("")
      : `<button type="button" class="btn" data-story-next="${escapeHtml(startId)}">🔄 Ricomincia la fiaba</button>`;

    container.innerHTML = `
      <div class="story-box">
        ${imageHtml}
        <div class="story-body">
          <div class="exercise-header">
            <h3 class="exercise-title">📖 ${escapeHtml(story.title || "Fiaba interattiva")} — ${escapeHtml(scene.title || "")}</h3>
            ${scene.speaker ? `<span class="badge">${escapeHtml(scene.speaker)}</span>` : ""}
          </div>
          <div>${scene.text || ""}</div>
          <div class="story-choices no-print">${choicesHtml}</div>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-story-next]").forEach((btn) => {
      btn.addEventListener("click", () => renderScene(btn.dataset.storyNext));
    });
  }

  renderScene(startId);
}

export function initInteractiveStories() {
  document.querySelectorAll("[data-interactive-story]").forEach(mountStory);
}
