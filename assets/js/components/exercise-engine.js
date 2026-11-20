/**
 * exercise-engine.js — Motore condiviso per tutti gli esercizi interattivi
 *
 * Supporta:
 * - Tipi: "number", "text", "multiple-choice", "true-false", "notebook" (quaderno/tablet)
 * - Difficoltà 1 (Facile ★☆☆), 2 (Intermedio ★★☆), 3 (Difficile ★★★)
 * - Badge CLIL in lingua inglese (data-clil="true")
 * - Aiuti progressivi: "Suggerimento" -> "Aiutami ancora" -> "Mi arrendo!"
 * - Blocco EXP su "Mi arrendo!" con avviso di ricaricare la pagina per riprovare
 */

import { loadState } from "../core/storage.js";
import {
  calculateActivityExp,
  calculateExerciseExp,
  getGamificationConfig,
  recordExerciseSuccess,
  recordRealityTaskCompleted
} from "../core/gamification.js";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseNumeric(value) {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[×x]\s*10\^/i, "e");
  if (!cleaned) return Number.NaN;
  return Number(cleaned);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function checkAnswer(type, userValue, config) {
  if (type === "notebook") {
    return true;
  }

  if (type === "number") {
    const parsedUser = parseNumeric(userValue);
    if (!Number.isFinite(parsedUser)) return false;
    const tolerance = typeof config.tolerance === "number" ? config.tolerance : 1e-6;
    const targets = Array.isArray(config.acceptedAnswers)
      ? config.acceptedAnswers
      : [config.answer];
    return targets.some((t) => {
      const targetNum = parseNumeric(t);
      return Number.isFinite(targetNum) && Math.abs(parsedUser - targetNum) <= tolerance;
    });
  }

  const normalizedUser = normalizeText(userValue);
  if (!normalizedUser) return false;

  const targets = Array.isArray(config.acceptedAnswers)
    ? config.acceptedAnswers
    : [config.answer];

  return targets.some((t) => normalizeText(t) === normalizedUser);
}

function mountExercise(card) {
  if (card.dataset.initialized === "true") return;
  card.dataset.initialized = "true";

  const exerciseId = card.dataset.exerciseId;
  const type = card.dataset.type || "text";
  const difficulty = Number(card.dataset.difficulty || 1);
  const udaYear = Number(card.dataset.udaYear || document.body?.dataset?.udaYear || 1);
  const udaId = card.dataset.udaId || document.body?.dataset?.udaId || "";
  const lessonId = card.dataset.lessonId || document.body?.dataset?.lessonId || "";
  const realityTaskId = card.dataset.realityTaskId || "";
  const explicitExp = card.dataset.exp ? Number(card.dataset.exp) : null;
  const isClil = card.dataset.clil === "true";

  const cfgScript = card.querySelector("script[data-exercise-config]");
  let config = { hints: [], solution: "" };
  if (cfgScript) {
    try {
      config = { ...config, ...JSON.parse(cfgScript.textContent || "{}") };
    } catch (err) {
      console.error(`[exercise-engine] JSON non valido in ${exerciseId}:`, err);
    }
  }

  const hints = Array.isArray(config.hints) ? config.hints : [];
  const expValue = realityTaskId
    ? calculateActivityExp("realityTask", udaYear)
    : calculateExerciseExp(difficulty, udaYear, explicitExp);
  const diffMeta = getGamificationConfig().difficultyLabels?.[String(difficulty)] || {
    name: `Livello ${difficulty}`,
    symbol: "★".repeat(Math.min(3, Math.max(1, difficulty)))
  };

  // Inietta badge nell'header se presente un contenitore [data-exercise-badges]
  const badgesContainer = card.querySelector("[data-exercise-badges]");
  if (badgesContainer) {
    const clilHtml = isClil
      ? `<span class="badge badge-clil" title="Esercizio CLIL in lingua inglese">CLIL · EN</span>`
      : "";
    badgesContainer.innerHTML = `
      <span class="badge badge-diff-${difficulty}" title="${escapeHtml(diffMeta.purpose || "")}">
        ${escapeHtml(diffMeta.symbol)} ${escapeHtml(diffMeta.name)}
      </span>
      ${clilHtml}
      <span class="badge badge-exp">+${expValue} EXP</span>
    `;
  }

  // Costruisci area interattiva se non già creata
  const controlsMount = card.querySelector("[data-exercise-controls]");
  if (!controlsMount) return;

  const state = loadState();
  const alreadySolved = realityTaskId
    ? Boolean(state.completedRealityTasks?.[realityTaskId])
    : Boolean(state.completedExercises?.[exerciseId]?.expAwarded > 0);
  if (alreadySolved) {
    card.classList.add("is-solved");
  }

  let inputHtml = "";
  if (type === "text" || type === "number") {
    const placeholder =
      config.placeholder || (type === "number" ? "Inserisci il valore numerico..." : "Scrivi la tua risposta...");
    inputHtml = `
      <div class="exercise-input-row">
        <label class="sr-only" for="input-${escapeHtml(exerciseId)}">Risposta per ${escapeHtml(exerciseId)}</label>
        <input
          id="input-${escapeHtml(exerciseId)}"
          class="exercise-input"
          type="text"
          inputmode="${type === "number" ? "decimal" : "text"}"
          autocomplete="off"
          placeholder="${escapeHtml(placeholder)}"
          data-ex-input
        />
        ${config.unit ? `<span class="muted"><strong>${escapeHtml(config.unit)}</strong></span>` : ""}
      </div>
    `;
  } else if (type === "multiple-choice" && Array.isArray(config.options)) {
    inputHtml = `
      <div class="exercise-options" role="radiogroup">
        ${config.options
          .map(
            (opt, idx) => `
          <label class="exercise-option">
            <input type="radio" name="mc-${escapeHtml(exerciseId)}" value="${escapeHtml(opt.value ?? opt)}" />
            <span>${opt.label ?? escapeHtml(opt)}</span>
          </label>
        `
          )
          .join("")}
      </div>
    `;
  } else if (type === "true-false") {
    const trueLabel = isClil ? "True" : "Vero";
    const falseLabel = isClil ? "False" : "Falso";
    inputHtml = `
      <div class="exercise-options" role="radiogroup">
        <label class="exercise-option">
          <input type="radio" name="tf-${escapeHtml(exerciseId)}" value="true" />
          <span>${trueLabel}</span>
        </label>
        <label class="exercise-option">
          <input type="radio" name="tf-${escapeHtml(exerciseId)}" value="false" />
          <span>${falseLabel}</span>
        </label>
      </div>
    `;
  } else if (type === "notebook") {
    inputHtml = `
      <p class="muted">
        ${isClil
          ? "Complete this drawing or step on your notebook/tablet, then confirm below."
          : "Svolgi o disegna questa parte sul tuo quaderno o tablet, poi conferma quando hai finito."}
      </p>
      <div class="print-only print-answer-box print-answer-box-tall" aria-hidden="true"></div>
    `;
  }

  const initialHintLabel = hints.length > 0 ? "💡 Suggerimento" : "🏳 Mi arrendo!";
  const verifyLabel =
    type === "notebook"
      ? isClil
        ? "✔ Done on notebook/tablet"
        : "✔ Fatto sul quaderno/tablet!"
      : isClil
        ? "✔ Check answer"
        : "✔ Verifica risposta";

  controlsMount.innerHTML = `
    ${inputHtml}
    <div class="exercise-actions no-print">
      <button type="button" class="btn btn-primary" data-ex-verify>${verifyLabel}</button>
      ${
        config.solution || hints.length > 0
          ? `<button type="button" class="btn ${hints.length > 0 ? "" : "btn-warning"}" data-ex-hint>${initialHintLabel}</button>`
          : ""
      }
    </div>
    <div class="exercise-feedback" data-ex-feedback hidden></div>
    <div class="exercise-hints" data-ex-hints hidden></div>
    <div class="exercise-solution" data-ex-solution hidden></div>
  `;

  const verifyBtn = controlsMount.querySelector("[data-ex-verify]");
  const hintBtn = controlsMount.querySelector("[data-ex-hint]");
  const feedbackEl = controlsMount.querySelector("[data-ex-feedback]");
  const hintsEl = controlsMount.querySelector("[data-ex-hints]");
  const solutionEl = controlsMount.querySelector("[data-ex-solution]");

  let shownHints = 0;
  let surrendered = false;

  if (alreadySolved) {
    feedbackEl.hidden = false;
    feedbackEl.className = "exercise-feedback is-correct";
    feedbackEl.textContent = "✅ Esercizio già completato in precedenza su questo dispositivo (EXP già assegnati).";
  }

  function getUserValue() {
    if (type === "notebook") return "done";
    if (type === "text" || type === "number") {
      return controlsMount.querySelector("[data-ex-input]")?.value ?? "";
    }
    const checked = controlsMount.querySelector('input[type="radio"]:checked');
    return checked ? checked.value : "";
  }

  verifyBtn?.addEventListener("click", () => {
    const userVal = getUserValue();
    if (type !== "notebook" && !String(userVal).trim()) {
      feedbackEl.hidden = false;
      feedbackEl.className = "exercise-feedback is-warning";
      feedbackEl.textContent = isClil
        ? "Please enter or select an answer first."
        : "Inserisci o seleziona una risposta prima di verificare.";
      return;
    }

    const isCorrect = checkAnswer(type, userVal, config);
    feedbackEl.hidden = false;

    if (!isCorrect) {
      feedbackEl.className = "exercise-feedback is-wrong";
      feedbackEl.textContent =
        config.wrongMessage ||
        (isClil
          ? "❌ Not quite right yet. Try again or use a hint!"
          : "❌ Non è ancora la risposta giusta. Riprova oppure clicca su Suggerimento!");
      return;
    }

    if (surrendered) {
      feedbackEl.className = "exercise-feedback is-warning";
      feedbackEl.textContent =
        "✔ Risposta corretta! Tuttavia, avendo cliccato su 'Mi arrendo!', in questa sessione non vengono assegnati punti EXP. Ricarica la pagina e risolvi di nuovo l'esercizio in autonomia per guadagnare gli EXP.";
      return;
    }

    card.classList.add("is-solved");
    const result = realityTaskId
      ? recordRealityTaskCompleted(realityTaskId, udaYear)
      : recordExerciseSuccess({
          exerciseId,
          difficulty,
          udaYear,
          udaId,
          lessonId,
          explicitExp
        });

    feedbackEl.className = "exercise-feedback is-correct";
    if (result.alreadyCompleted) {
      feedbackEl.textContent =
        config.correctMessage ||
        "✅ Corretto! (Hai già incassato i punti EXP per questo esercizio in precedenza.)";
    } else {
      feedbackEl.textContent =
        config.correctMessage ||
        `✅ Risposta corretta! Hai guadagnato +${result.expAwarded} EXP!`;
    }
  });

  // Permette Invio da tastiera sugli input testuali/numerici
  const textInput = controlsMount.querySelector("[data-ex-input]");
  textInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      verifyBtn?.click();
    }
  });

  hintBtn?.addEventListener("click", () => {
    // Fase 1..N: mostra suggerimenti progressivi
    if (shownHints < hints.length) {
      hintsEl.hidden = false;
      const hintItem = document.createElement("div");
      hintItem.className = "exercise-hint-item";
      hintItem.innerHTML = `<strong>Suggerimento ${shownHints + 1}:</strong> ${hints[shownHints]}`;
      hintsEl.appendChild(hintItem);
      shownHints += 1;

      if (shownHints < hints.length) {
        hintBtn.textContent = "💡 Aiutami ancora";
      } else {
        hintBtn.textContent = "🏳 Mi arrendo!";
        hintBtn.classList.add("btn-warning");
      }
      return;
    }

    // Fase finale: "Mi arrendo!" -> mostra soluzione, 0 EXP, avviso ricarica pagina
    surrendered = true;
    card.classList.add("is-surrendered");
    solutionEl.hidden = false;
    solutionEl.innerHTML = `
      <strong>Soluzione:</strong>
      <div>${config.solution || escapeHtml(config.answer || "Soluzione non specificata.")}</div>
    `;

    feedbackEl.hidden = false;
    feedbackEl.className = "exercise-feedback is-warning";
    feedbackEl.textContent =
      "⚠ Hai scelto 'Mi arrendo!': per questo esercizio non vengono assegnati punti EXP. Per ottenere gli EXP, ricarica la pagina e prova a risolverlo nuovamente da solo!";

    hintBtn.disabled = true;
    hintBtn.textContent = "🏳 Soluzione mostrata (0 EXP)";
  });
}

export function initExercises() {
  document.querySelectorAll("[data-exercise]").forEach(mountExercise);
}
