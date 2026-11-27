/**
 * home-page.js — Navigazione per periodi (Primo Biennio, Secondo Biennio, Quinto Anno)
 * con 20 slot UDA (U.1.1 .. U.5.4) riempiti automaticamente quando presenti in data/uda-catalog.json.
 */

import { getUdaCatalog, resolveRootPath } from "../core/gamification.js";

const PERIODS = [
  {
    id: "primo-biennio",
    label: "Primo Biennio",
    subtitle: "1° e 2° Anno · 8 UDA",
    years: [1, 2],
  },
  {
    id: "secondo-biennio",
    label: "Secondo Biennio",
    subtitle: "3° e 4° Anno · 8 UDA",
    years: [3, 4],
  },
  {
    id: "quinto-anno",
    label: "Quinto Anno",
    subtitle: "5° Anno · 4 UDA",
    years: [5],
  },
];

const SLOTS_PER_YEAR = 4;

let activePeriodId = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function findPublishedUda(udas, year, num) {
  const code = `U.${year}.${num}`;
  const slugPrefix = `uda-${year}-${num}`;
  return (
    udas.find(
      (u) =>
        u.code === code ||
        (Number(u.year) === year && Number(u.order) === num) ||
        String(u.id || "").startsWith(slugPrefix)
    ) || null
  );
}

function renderSlot(year, num, publishedUda) {
  const code = `U.${year}.${num}`;

  if (publishedUda && publishedUda.entryPath) {
    return `
      <a
        class="uda-slot-card is-ready"
        href="${resolveRootPath(publishedUda.entryPath)}"
        title="${escapeHtml(code)} — ${escapeHtml(publishedUda.title || code)}"
      >
        <span class="uda-slot-code">${escapeHtml(code)}</span>
        <span class="uda-slot-title">${escapeHtml(publishedUda.title || code)}</span>
      </a>
    `;
  }

  return `
    <a
      class="uda-slot-card is-placeholder"
      href="#"
      aria-disabled="true"
      data-uda-placeholder="true"
      title="${escapeHtml(code)} — non ancora disponibile"
    >
      <span class="uda-slot-title">${escapeHtml(code)}</span>
    </a>
  `;
}

function renderPeriodPanel(period, publishedUdas) {
  if (!period) {
    return `
      <p class="uda-period-hint muted">
        Seleziona un periodo qui sopra per visualizzare le relative Unità Didattiche.
      </p>
    `;
  }

  const yearsHtml = period.years
    .map((year) => {
      const slotsHtml = Array.from({ length: SLOTS_PER_YEAR }, (_, idx) => {
        const num = idx + 1;
        const published = findPublishedUda(publishedUdas, year, num);
        return renderSlot(year, num, published);
      }).join("");

      return `
        <div class="uda-year-group">
          <h2 class="uda-year-heading">${year}° Anno</h2>
          <div class="uda-slot-grid">${slotsHtml}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="uda-period-panel" role="region" aria-label="UDA ${escapeHtml(period.label)}">
      ${yearsHtml}
    </div>
  `;
}

function renderCatalog() {
  const mount = document.querySelector("[data-uda-catalog]");
  if (!mount) return;

  const catalog = getUdaCatalog();
  const publishedUdas = (catalog.udas || []).filter((u) => u.status !== "hidden");
  const activePeriod = PERIODS.find((p) => p.id === activePeriodId) || null;

  const buttonsHtml = PERIODS.map((period) => {
    const isActive = period.id === activePeriodId;
    return `
      <button
        type="button"
        class="uda-period-btn ${isActive ? "is-active" : ""}"
        data-period-id="${escapeHtml(period.id)}"
        aria-expanded="${isActive ? "true" : "false"}"
      >
        <span class="uda-period-btn-title">${escapeHtml(period.label)}</span>
        <span class="uda-period-btn-sub">${escapeHtml(period.subtitle)}</span>
      </button>
    `;
  }).join("");

  mount.innerHTML = `
    <div class="uda-period-selector" role="group" aria-label="Scegli il periodo scolastico">
      ${buttonsHtml}
    </div>
    ${renderPeriodPanel(activePeriod, publishedUdas)}
  `;
}

let homeInitialized = false;
function startHomePage() {
  if (homeInitialized) return;
  homeInitialized = true;

  const mount = document.querySelector("[data-uda-catalog]");
  if (mount) {
    mount.addEventListener("click", (event) => {
      const placeholder = event.target.closest("[data-uda-placeholder]");
      if (placeholder) {
        event.preventDefault();
        return;
      }

      const periodBtn = event.target.closest("[data-period-id]");
      if (!periodBtn) return;

      const clickedId = periodBtn.dataset.periodId;
      activePeriodId = activePeriodId === clickedId ? null : clickedId;
      renderCatalog();
    });
  }

  renderCatalog();
}

if (window.__ivanoReady) {
  startHomePage();
} else {
  window.addEventListener("ivano:ready", startHomePage, { once: true });
}
