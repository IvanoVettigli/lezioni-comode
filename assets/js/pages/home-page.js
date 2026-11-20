/**
 * home-page.js — Popola dinamicamente la Home dal catalogo data/uda-catalog.json
 */

import { getUdaCatalog, resolveRootPath } from "../core/gamification.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCatalog() {
  const mount = document.querySelector("[data-uda-catalog]");
  if (!mount) return;

  const catalog = getUdaCatalog();
  const udas = (catalog.udas || []).filter((u) => u.status !== "hidden");

  if (udas.length === 0) {
    mount.innerHTML = `
      <div class="card">
        <h3>🚀 Nessuna UDA ancora pubblicata</h3>
        <p>
          L'infrastruttura del progetto è pronta! Quando creeremo le prime Unità Didattiche di Apprendimento
          (Matematica, Fisica e Informatica) e le registreremo in <code>data/uda-catalog.json</code>, appariranno automaticamente qui con filtri per materia, prerequisiti, durata e link alla versione PDF stampabile.
        </p>
      </div>
    `;
    return;
  }

  mount.innerHTML = `<div class="grid-3">${udas
    .map((uda) => {
      const prereqCount = (uda.prerequisiteUdas || []).length;
      const pdfLink = uda.pdfPath
        ? `<a class="btn btn-ghost" href="${resolveRootPath(uda.pdfPath)}" target="_blank" rel="noopener">🖨 PDF</a>`
        : "";
      return `
        <article class="card">
          <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem;">
            <span class="badge badge-subject-${escapeHtml(uda.subject)}">${escapeHtml(uda.subject)}</span>
            <span class="badge">Anno ${escapeHtml(uda.year)}</span>
          </div>
          <h3>${escapeHtml(uda.title)}</h3>
          <p>${escapeHtml(uda.summary || "")}</p>
          <p class="muted" style="font-size:0.86rem;">
            ${(uda.lessons || []).length} lezioni · ${prereqCount > 0 ? `${prereqCount} UDA consigliate prima` : "Nessuna UDA propedeutica obbligatoria"}
          </p>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <a class="btn btn-primary" href="${resolveRootPath(uda.entryPath)}">Apri UDA →</a>
            ${pdfLink}
          </div>
        </article>
      `;
    })
    .join("")}</div>`;
}

let homeInitialized = false;
function startHomePage() {
  if (homeInitialized) return;
  homeInitialized = true;
  renderCatalog();
}

if (window.__ivanoReady) {
  startHomePage();
} else {
  window.addEventListener("ivano:ready", startHomePage, { once: true });
}
