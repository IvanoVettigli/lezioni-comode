/**
 * profile-page.js — Bacheca Studente (Livello, Titolo "Seme Deku" -> ..., EXP, Trofei e Backup JSON)
 */

import {
  exportStateJson,
  importStateJson,
  loadState,
  resetState
} from "../core/storage.js";
import {
  getGamificationConfig,
  getLevelInfo,
  getUdaCatalog,
  showToast
} from "../core/gamification.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderProfile() {
  const summaryMount = document.querySelector("[data-profile-summary]");
  const trophiesMount = document.querySelector("[data-profile-trophies]");
  const levelsMount = document.querySelector("[data-profile-levels]");
  if (!summaryMount) return;

  const state = loadState();
  const cfg = getGamificationConfig();
  const catalog = getUdaCatalog();
  const levelInfo = getLevelInfo(state.totalExp);
  const solvedCount = Object.keys(state.completedExercises || {}).length;
  const flashCount = Object.keys(state.completedFlashcards || {}).length;
  const realityCount = Object.keys(state.completedRealityTasks || {}).length;
  const unlockedMap = state.unlockedTrophies || {};

  summaryMount.innerHTML = `
    <div class="card">
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1rem;">
        <div>
          <span class="badge badge-exp">Livello ${levelInfo.current.level}</span>
          <h2 style="margin-top:0.5rem; margin-bottom:0.25rem;">${escapeHtml(levelInfo.current.title)}</h2>
          <p style="margin-bottom:0;">${escapeHtml(levelInfo.current.description)}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:2rem; font-weight:800; font-family:var(--font-mono); color:var(--status-warning);">
            ${state.totalExp} EXP
          </div>
          <small class="muted">
            ${
              levelInfo.next
                ? `Mancano ${levelInfo.next.minExp - state.totalExp} EXP al Livello ${levelInfo.next.level}`
                : "Livello massimo raggiunto!"
            }
          </small>
        </div>
      </div>

      <div class="progress-bar" style="margin-top:1rem;" role="progressbar" aria-valuenow="${levelInfo.progressPercent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar-fill" style="width:${levelInfo.progressPercent}%;"></div>
      </div>

      <div class="grid-3" style="margin-top:1.25rem;">
        <div class="card" style="padding:1rem;">
          <div class="muted">Esercizi risolti (con EXP)</div>
          <strong style="font-size:1.5rem;">${solvedCount}</strong>
        </div>
        <div class="card" style="padding:1rem;">
          <div class="muted">Compiti di realtà completati</div>
          <strong style="font-size:1.5rem;">${realityCount}</strong>
        </div>
        <div class="card" style="padding:1rem;">
          <div class="muted">Mazzi flashcard ripassati</div>
          <strong style="font-size:1.5rem;">${flashCount}</strong>
        </div>
      </div>
    </div>
  `;

  if (trophiesMount) {
    const allCatalogTrophies = [];
    (catalog.udas || []).forEach((uda) => {
      (uda.trophies || []).forEach((t) => allCatalogTrophies.push(t));
    });
    if (cfg.platinumTrophy) {
      allCatalogTrophies.push({ ...cfg.platinumTrophy, tier: "platinum" });
    }

    // Aggiungi eventuali trofei sbloccati non ancora nel catalogo
    Object.values(unlockedMap).forEach((u) => {
      if (!allCatalogTrophies.some((t) => t.id === u.id)) {
        allCatalogTrophies.unshift(u);
      }
    });

    const tierSymbol = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      completion: "⭐",
      platinum: "💎"
    };

    trophiesMount.innerHTML = allCatalogTrophies.length
      ? `<div class="grid-2">${allCatalogTrophies
          .map((t) => {
            const unlocked = Boolean(unlockedMap[t.id]);
            const tier = t.tier || "bronze";
            return `
              <div class="trophy-card ${unlocked ? "" : "is-locked"}">
                <div class="trophy-medal trophy-${escapeHtml(tier)}">${tierSymbol[tier] || "🏆"}</div>
                <div>
                  <strong>${escapeHtml(t.name)}</strong>
                  <p style="margin:0.25rem 0 0; font-size:0.9rem;">${escapeHtml(t.description || "")}</p>
                  <small class="muted">${unlocked ? "✅ Sbloccato" : "🔒 Da conquistare"}</small>
                </div>
              </div>
            `;
          })
          .join("")}</div>`
      : `<p class="muted">I trofei delle singole UDA compariranno qui mano a mano che pubblicheremo le lezioni.</p>`;
  }

  if (levelsMount) {
    const levels = cfg.levels || [];
    levelsMount.innerHTML = `
      <div class="grid-2">
        ${levels
          .map((lv) => {
            const reached = state.totalExp >= lv.minExp;
            return `
              <div class="card" style="padding:1rem; ${reached ? "border-color: var(--status-success);" : ""}">
                <div style="display:flex; justify-content:space-between; gap:0.5rem;">
                  <strong>Lv.${lv.level} · ${escapeHtml(lv.title)}</strong>
                  <span class="badge">${lv.minExp} EXP</span>
                </div>
                <p style="margin:0.4rem 0 0; font-size:0.9rem;">${escapeHtml(lv.description)}</p>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }
}

function bindSaveControls() {
  const exportBtn = document.querySelector("[data-export-save]");
  const importInput = document.querySelector("[data-import-save]");
  const resetBtn = document.querySelector("[data-reset-save]");

  exportBtn?.addEventListener("click", () => {
    const blob = new Blob([exportStateJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salvataggio-lezioni-ivano.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importStateJson(text);
      showToast("✅ Salvataggio importato correttamente!");
      renderProfile();
      window.dispatchEvent(new CustomEvent("ivano:progress-change"));
    } catch (err) {
      showToast(`❌ Errore importazione: ${err.message}`);
    } finally {
      event.target.value = "";
    }
  });

  resetBtn?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Vuoi davvero azzerare tutti i punti EXP e i trofei salvati su questo dispositivo? L'operazione non è reversibile."
    );
    if (!confirmed) return;
    resetState();
    showToast("🔄 Progressi locali azzerati.");
    renderProfile();
    window.dispatchEvent(new CustomEvent("ivano:progress-change"));
  });
}

let profileInitialized = false;
function startProfilePage() {
  if (profileInitialized) return;
  profileInitialized = true;
  renderProfile();
  bindSaveControls();
}

if (window.__ivanoReady) {
  startProfilePage();
} else {
  window.addEventListener("ivano:ready", startProfilePage, { once: true });
}
window.addEventListener("ivano:progress-change", renderProfile);
