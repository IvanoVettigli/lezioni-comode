/**
 * catalog-page.js — Motore di ricerca, filtro ed estrazione del Catalogo di Esercizi
 * Legge `data/catalogo/catalog-index.json` generato da `tools/build_catalog.py`.
 */

import { resolveRootPath, showToast } from "../core/gamification.js";

const VISUAL_BADGES = {
  grafico: "📊 Grafico",
  figura: "📐 Figura",
  tabella: "📋 Tabella",
  circuito: "⚡ Circuito",
  codice: "💻 Codice",
  schema: "🧩 Schema"
};

const FORMAT_LABELS = {
  scelta_multipla: "Scelta multipla",
  numerica: "Risposta numerica",
  aperta: "Risposta aperta",
  dimostrazione: "Dimostrazione / Problema",
  vero_falso: "Vero / Falso",
  progetto_sfida: "Sfida progettuale",
  mista: "Formato misto"
};

const LANGUAGE_LABELS = {
  it: "Italiano",
  en: "Inglese · CLIL"
};

const COMPETITION_CATEGORIES = [
  { id: "scuola_competizioni", label: "🏫 Prove Nazionali & Competizioni Scolastiche" },
  { id: "ingresso_universita", label: "🎓 Test d'Ingresso Universitari & Semestre Filtro" }
];

const DISCIPLINE_OPTIONS = [
  {
    id: "matematica",
    label: "Matematica (tutte le aree)",
    areas: ["misure-numeri", "algebra-funzioni", "geometria", "dati-statistica-probabilita"]
  },
  { id: "area:misure-numeri", label: "↳ Misure, Numeri & Proporzioni", areas: ["misure-numeri"] },
  { id: "area:algebra-funzioni", label: "↳ Algebra, Funzioni & Analisi", areas: ["algebra-funzioni"] },
  { id: "area:geometria", label: "↳ Geometria", areas: ["geometria"] },
  {
    id: "area:dati-statistica-probabilita",
    label: "↳ Dati, Statistica & Probabilità",
    areas: ["dati-statistica-probabilita"]
  },
  { id: "fisica", label: "Fisica (tutte le sottosezioni)", areas: ["fisica"] },
  { id: "logica-informatica", label: "Logica & Informatica", areas: ["logica-informatica"] },
  { id: "chimica", label: "Chimica", areas: ["chimica"] },
  { id: "scienze-naturali", label: "Scienze Naturali (Biologia & Terra)", areas: ["scienze-naturali"] },
  { id: "robotica-controllo", label: "Robotica & Controllo", areas: ["robotica-controllo"] }
];

const MACRO_AREA_ALIASES = {
  "misure-numeri": ["matematica", "aritmetica"],
  "algebra-funzioni": ["matematica", "algebra", "funzioni", "analisi"],
  geometria: ["matematica", "geometria"],
  "dati-statistica-probabilita": ["matematica", "statistica", "probabilita", "dati"],
  "logica-informatica": ["informatica", "logica", "coding", "programmazione"],
  fisica: ["fisica"],
  chimica: ["chimica"],
  "scienze-naturali": ["scienze", "scienze naturali"],
  "robotica-controllo": ["robotica", "automazione", "controllo"]
};

const IT_STOPWORDS = new Set([
  "il", "lo", "la", "le", "gli", "un", "uno", "una",
  "di", "del", "dello", "della", "dei", "degli", "delle",
  "da", "dal", "dallo", "dalla", "dai", "dagli", "dalle",
  "in", "nel", "nello", "nella", "nei", "negli", "nelle",
  "su", "sul", "sullo", "sulla", "sui", "sugli", "sulle",
  "con", "per", "tra", "fra", "al", "allo", "alla", "ai", "agli", "alle", "ed"
]);

const PAGE_SIZE = 40;

let catalog = null;
let examIndex = [];
let examMap = new Map();
let selectedTopics = new Set();
let selectedExamKey = "";
let lastDisplayedItems = [];
let visibleLimit = PAGE_SIZE;
let randomSeedTick = 0;
let searchDebounceTimer = null;
let examSearchDebounceTimer = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeStr(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeForSearch(str) {
  const base = normalizeStr(str)
    .replace(/['’".,:;!?()[\]{}—–/\\|·]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base.includes("-")) return base;
  // Mantiene sia i token con trattino (es. "tolc-i") sia la versione separata ("tolc i")
  return `${base} ${base.replaceAll("-", " ")}`;
}

function buildSearchIndexText(str) {
  const text = normalizeForSearch(str);
  const words = new Set(text.split(/\s+/).filter(Boolean));
  return { text, words };
}

function tokenizeQuery(str, { dropStopwords = true } = {}) {
  const cleaned = normalizeStr(str)
    .replace(/['’".,:;!?()[\]{}—–/\\|·]+/g, " ")
    .trim();
  if (!cleaned) return [];
  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  if (!dropStopwords) return rawTokens;
  const filtered = rawTokens.filter((tok) => !IT_STOPWORDS.has(tok));
  return filtered.length ? filtered : rawTokens;
}

function matchesAllTokens(searchIdx, tokens) {
  if (!tokens.length) return true;
  const text = typeof searchIdx === "string" ? searchIdx : searchIdx.text;
  const words = typeof searchIdx === "string" ? null : searchIdx.words;
  return tokens.every((tok) => {
    // Per token molto corti (es. "i" in "tolc i", "a" in "classe a") o anni a 4 cifre usa match su parola intera
    if (words && (tok.length <= 2 || /^\d{4}$/.test(tok))) {
      return words.has(tok);
    }
    return text.includes(tok);
  });
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildPdfHref(localPath, page) {
  if (!localPath) return "";
  const resolved = resolveRootPath(localPath);
  return page ? `${resolved}#page=${encodeURIComponent(page)}` : resolved;
}

function getCompetitionMap() {
  return Object.fromEntries((catalog?.competitions || []).map((c) => [c.id, c]));
}

function getTopicMap() {
  return Object.fromEntries((catalog?.topics || []).map((t) => [t.id, t]));
}

function getMacroAreaMap() {
  return Object.fromEntries((catalog?.macroAreas || []).map((a) => [a.id, a]));
}

function getLevelMap() {
  return Object.fromEntries((catalog?.levels || []).map((l) => [l.id, l]));
}

function getDisciplineAllowedAreas(disciplineVal) {
  if (!disciplineVal) return null;
  const found = DISCIPLINE_OPTIONS.find((opt) => opt.id === disciplineVal);
  return found ? new Set(found.areas) : null;
}

function getExamKey(item) {
  return `${item.competitionId}::${item.year}::${item.questionsPdfLocal || item.edition}`;
}

function computeCommonPrefix(strings) {
  if (!strings.length) return "";
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i += 1) {
    while (prefix && !strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
    if (!prefix) break;
  }
  return prefix;
}

function buildExamTitle(editions) {
  if (editions.length <= 1) return editions[0] || "Prova";
  const prefix = computeCommonPrefix(editions);
  const suffixes = editions.map((e) => e.slice(prefix.length).trim()).filter(Boolean);
  if (prefix.length >= 12) {
    if (suffixes.length <= 3 && !prefix.includes("(")) {
      return `${prefix.trim()} ${suffixes.join(" e ")}`;
    }
    const cleanPrefix = prefix
      .replace(/\s*\([^)]*$/, "")
      .replace(/[\s—–-]+$/, "")
      .trim();
    if (cleanPrefix) {
      return `${cleanPrefix} (${editions.length} prove/test)`;
    }
  }
  return `${editions[0]} (+${editions.length - 1})`;
}

function buildExamSubtitle(title, phases) {
  const unique = phases.filter((p) => p && p !== title);
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length <= 4) return unique.join(" · ");
  // Se le fasi sono tantissime (es. 20 test numerati), compatta in modo leggibile
  if (unique.length > 8) {
    return `${unique.slice(0, 3).join(" · ")} · … (${unique.length} sezioni)`;
  }
  return `${unique.slice(0, 4).join(" · ")} (+${unique.length - 4} sezioni)`;
}

function buildExamIndex() {
  const compMap = getCompetitionMap();
  const groups = new Map();

  (catalog?.items || []).forEach((item) => {
    if (item.archived) return;
    const key = getExamKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });

  const exams = [];
  groups.forEach((items, key) => {
    const first = items[0];
    const comp = compMap[first.competitionId];
    const editions = Array.from(new Set(items.map((it) => it.edition).filter(Boolean))).sort();
    const phases = Array.from(new Set(items.map((it) => it.phase).filter(Boolean))).sort();
    const origLabels = Array.from(new Set(items.map((it) => it.originalLevelLabel).filter(Boolean)));
    const languages = Array.from(new Set(items.map((it) => it.language || "it")));
    const keywords = Array.from(new Set(items.flatMap((it) => it.keywords || [])));

    const title = buildExamTitle(editions);
    const subtitle = buildExamSubtitle(title, phases);

    const questionsPdfLocal = first.questionsPdfLocal || "";
    const solutionsItem = items.find((it) => it.solutionsPdfLocal);
    const solutionsPdfLocal = solutionsItem?.solutionsPdfLocal || "";
    const samePdfSolutions = Boolean(solutionsPdfLocal && solutionsPdfLocal === questionsPdfLocal);
    const solutionPages = items
      .filter((it) => it.solutionsPdfLocal === solutionsPdfLocal && Number.isFinite(Number(it.solutionsPage)))
      .map((it) => Number(it.solutionsPage));
    const minSolutionPage = solutionPages.length ? Math.min(...solutionPages) : null;

    const pdfFilename = questionsPdfLocal ? questionsPdfLocal.split("/").pop().replace(/\.pdf$/i, "") : "";
    const year = Number(first.year) || 0;

    // Indicizza solo metadati specifici di questa prova (evita falsi positivi tra prove diverse della stessa competizione)
    const searchIndex = buildSearchIndexText(
      [
        "prova prove esame esami test fascicolo pdf",
        comp?.shortName || "",
        title,
        ...editions,
        ...phases,
        ...origLabels,
        year ? String(year) : "",
        first.sourceSite || "",
        pdfFilename,
        ...keywords
      ].join(" ")
    );
    const titleSearchText = normalizeForSearch(`${comp?.shortName || ""} ${title} ${year}`);

    exams.push({
      key,
      competitionId: first.competitionId,
      compShortName: comp?.shortName || first.competitionId,
      compName: comp?.name || first.competitionId,
      year,
      title,
      subtitle,
      editions,
      phases,
      questionCount: items.length,
      sourceType: first.sourceType,
      hasEn: languages.includes("en"),
      questionsPdfLocal,
      originalQuestionsUrl: first.originalQuestionsUrl || "",
      solutionsPdfLocal,
      samePdfSolutions,
      minSolutionPage,
      originalSolutionsUrl: solutionsItem?.originalSolutionsUrl || first.originalSolutionsUrl || "",
      searchIndex,
      titleSearchText
    });
  });

  exams.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const cCmp = a.compShortName.localeCompare(b.compShortName, "it");
    if (cCmp !== 0) return cCmp;
    return a.title.localeCompare(b.title, "it");
  });

  examIndex = exams;
  examMap = new Map(exams.map((ex) => [ex.key, ex]));
}

function renderTopStats() {
  const mount = document.querySelector("[data-catalog-stats]");
  if (!mount || !catalog) return;

  const total = catalog.stats?.totalQuestions ?? 0;
  const activeComps = (catalog.competitions || []).filter((c) => (c.questionCount || 0) > 0).length;
  const totalComps = (catalog.competitions || []).length;
  const years = catalog.stats?.years || [];
  const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "In avvio";
  const enCount = catalog.stats?.byLanguage?.en ?? 0;

  mount.innerHTML = `
    <span class="badge badge-exp">📄 ${total} quesiti catalogati</span>
    <span class="badge">📑 ${examIndex.length} prove / fascicoli PDF</span>
    <span class="badge">🏅 ${activeComps} / ${totalComps} competizioni attive</span>
    <span class="badge">🏷 ${(catalog.topics || []).length} argomenti</span>
    <span class="badge">📅 Anni: ${escapeHtml(yearRange)}</span>
    ${enCount > 0 ? `<span class="badge badge-clil">🇬🇧 ${enCount} CLIL (EN)</span>` : ""}
  `;
}

function buildCompetitionOptionsHtml() {
  const comps = catalog.competitions || [];
  const hasCategories = comps.some((c) => c.category);
  if (hasCategories) {
    const groupsHtml = COMPETITION_CATEGORIES.map((cat) => {
      const groupComps = comps.filter((c) => (c.category || "scuola_competizioni") === cat.id);
      if (!groupComps.length) return "";
      const opts = groupComps
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.shortName)} (${c.questionCount || 0})</option>`)
        .join("");
      return `<optgroup label="${escapeHtml(cat.label)}">${opts}</optgroup>`;
    }).join("");
    return `<option value="">Tutte le prove e competizioni</option>${groupsHtml}`;
  }
  const options = comps
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.shortName)} (${c.questionCount || 0})</option>`)
    .join("");
  return `<option value="">Tutte le prove e competizioni</option>${options}`;
}

function computeDisciplineCounts() {
  const topicMap = getTopicMap();
  const counts = {};
  DISCIPLINE_OPTIONS.forEach((opt) => {
    const allowed = new Set(opt.areas);
    counts[opt.id] = 0;
    (catalog.items || []).forEach((item) => {
      if (item.archived) return;
      const topics = item.allTopics || [item.primaryTopic, ...(item.secondaryTopics || [])];
      if (topics.some((tid) => allowed.has(topicMap[tid]?.macroArea))) {
        counts[opt.id] += 1;
      }
    });
  });
  return counts;
}

function populateExamYearOptions(compId = "") {
  const yearSelect = document.querySelector("[data-exam-year]");
  if (!yearSelect) return;
  const prevVal = yearSelect.value;
  const filteredExams = compId ? examIndex.filter((ex) => ex.competitionId === compId) : examIndex;
  const years = Array.from(new Set(filteredExams.map((ex) => ex.year).filter(Boolean))).sort((a, b) => b - a);
  const options = years.map((y) => `<option value="${y}">${y}</option>`).join("");
  yearSelect.innerHTML = `<option value="">Tutti gli anni</option>${options}`;
  if (prevVal && years.includes(Number(prevVal))) {
    yearSelect.value = prevVal;
  }
}

function populateSelectFilters() {
  const compSelect = document.querySelector("[data-filter-competition]");
  const examCompSelect = document.querySelector("[data-exam-competition]");
  const disciplineSelect = document.querySelector("[data-filter-discipline]");
  const levelSelect = document.querySelector("[data-filter-level]");
  const langSelect = document.querySelector("[data-filter-language]");
  const formatSelect = document.querySelector("[data-filter-format]");

  const compOptionsHtml = buildCompetitionOptionsHtml();
  if (compSelect) compSelect.innerHTML = compOptionsHtml;
  if (examCompSelect) examCompSelect.innerHTML = compOptionsHtml;
  populateExamYearOptions("");

  if (disciplineSelect) {
    const discCounts = computeDisciplineCounts();
    const options = DISCIPLINE_OPTIONS.map(
      (opt) => `<option value="${escapeHtml(opt.id)}">${escapeHtml(opt.label)} (${discCounts[opt.id] || 0})</option>`
    ).join("");
    disciplineSelect.innerHTML = `<option value="">Tutte le discipline</option>${options}`;
  }

  if (levelSelect) {
    const options = (catalog.levels || [])
      .map(
        (lv) =>
          `<option value="${escapeHtml(lv.id)}">${escapeHtml(lv.label)} (${catalog.stats?.byLevel?.[lv.id] || 0})</option>`
      )
      .join("");
    levelSelect.innerHTML = `<option value="">Tutti i livelli</option>${options}`;
  }

  if (langSelect) {
    const byLang = catalog.stats?.byLanguage || {};
    const langs = Object.keys(byLang).sort((a, b) => (a === "it" ? -1 : b === "it" ? 1 : a.localeCompare(b)));
    const options = langs
      .map((code) => `<option value="${escapeHtml(code)}">${escapeHtml(LANGUAGE_LABELS[code] || code.toUpperCase())} (${byLang[code]})</option>`)
      .join("");
    langSelect.innerHTML = `<option value="">Tutte le lingue</option>${options}`;
  }

  if (formatSelect) {
    const byFmt = catalog.stats?.byResponseFormat || {};
    const fmts = Object.keys(FORMAT_LABELS).filter((k) => (byFmt[k] || 0) > 0);
    const options = fmts
      .map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(FORMAT_LABELS[k])} (${byFmt[k]})</option>`)
      .join("");
    formatSelect.innerHTML = `<option value="">Tutti i formati</option>${options}`;
  }

  const defaultMin = catalog.settings?.defaultMinYear;
  const minYearInput = document.querySelector("[data-filter-year-min]");
  if (defaultMin && minYearInput && !minYearInput.value) {
    minYearInput.value = String(defaultMin);
  }
}

function renderExamCardHtml(exam) {
  const sourceMeta = catalog?.sourceTypeMeta || {};
  const st = sourceMeta[exam.sourceType] || { badge: exam.sourceType || "", isOfficial: false };
  const sourceBadgeClass = st.isOfficial ? "badge-source-official" : "badge-source-thirdparty";
  const isActive = selectedExamKey === exam.key;

  const qHref = buildPdfHref(exam.questionsPdfLocal, null);
  const sHref = exam.solutionsPdfLocal
    ? buildPdfHref(exam.solutionsPdfLocal, exam.samePdfSolutions ? exam.minSolutionPage : null)
    : "";

  const pdfBtn = qHref
    ? `
      <a class="btn btn-primary btn-xs" href="${escapeHtml(qHref)}" target="_blank" rel="noopener">📄 Apri PDF prova</a>
      <a class="btn btn-ghost btn-xs" href="${escapeHtml(qHref)}" download>⬇ Scarica</a>
    `
    : exam.originalQuestionsUrl
      ? `<a class="btn btn-primary btn-xs" href="${escapeHtml(exam.originalQuestionsUrl)}" target="_blank" rel="noopener">🌐 Apri prova</a>`
      : "";

  const solBtn = sHref
    ? `
      <a class="btn btn-success btn-xs" href="${escapeHtml(sHref)}" target="_blank" rel="noopener">
        ✅ Soluzioni${exam.samePdfSolutions && exam.minSolutionPage ? ` (p. ${exam.minSolutionPage})` : ""}
      </a>
    `
    : exam.originalSolutionsUrl && exam.originalSolutionsUrl !== exam.originalQuestionsUrl
      ? `<a class="btn btn-success btn-xs" href="${escapeHtml(exam.originalSolutionsUrl)}" target="_blank" rel="noopener">✅ Soluzioni</a>`
      : "";

  return `
    <article class="catalog-exam-card ${isActive ? "is-active-exam" : ""}">
      <div class="catalog-item-badges">
        <span class="badge badge-exp">${escapeHtml(exam.compShortName)} · ${exam.year}</span>
        ${st.badge ? `<span class="badge ${sourceBadgeClass}">${escapeHtml(st.badge)}</span>` : ""}
        <span class="badge">${exam.questionCount} quesiti</span>
        ${exam.hasEn ? `<span class="badge badge-clil">🇬🇧 EN</span>` : ""}
      </div>
      <h3 class="catalog-exam-card-title">${escapeHtml(exam.title)}</h3>
      ${exam.subtitle ? `<p class="catalog-exam-card-sub">${escapeHtml(exam.subtitle)}</p>` : ""}
      <div class="catalog-exam-card-actions">
        ${pdfBtn}
        ${solBtn}
        <button type="button" class="btn btn-xs ${isActive ? "btn-primary" : ""}" data-select-exam="${escapeHtml(exam.key)}">
          ${isActive ? "✓ Prova selezionata" : `🔍 Vedi i ${exam.questionCount} quesiti`}
        </button>
      </div>
    </article>
  `;
}

function renderExamFinderResults() {
  const mount = document.querySelector("[data-exam-results]");
  const resetBtn = document.querySelector("[data-exam-reset]");
  if (!mount || !catalog) return;

  const queryRaw = document.querySelector("[data-exam-search]")?.value?.trim() || "";
  const compVal = document.querySelector("[data-exam-competition]")?.value || "";
  const yearVal = document.querySelector("[data-exam-year]")?.value || "";
  const hasFilter = Boolean(queryRaw || compVal || yearVal);

  if (resetBtn) {
    resetBtn.style.display = hasFilter ? "" : "none";
  }

  if (!hasFilter) {
    const allCardsHtml = examIndex.map(renderExamCardHtml).join("");
    mount.innerHTML = `
      <details class="catalog-exam-all-accordion">
        <summary>Mostra l'elenco completo di tutte le ${examIndex.length} prove a catalogo</summary>
        <div class="catalog-exam-grid">${allCardsHtml}</div>
      </details>
    `;
    return;
  }

  const tokens = tokenizeQuery(queryRaw);
  const yearNum = yearVal ? Number(yearVal) : null;

  const matchedExams = examIndex
    .filter((ex) => {
      if (compVal && ex.competitionId !== compVal) return false;
      if (yearNum && ex.year !== yearNum) return false;
      if (tokens.length && !matchesAllTokens(ex.searchIndex, tokens)) return false;
      return true;
    })
    .sort((a, b) => {
      if (tokens.length) {
        const aTitleHits = tokens.filter((t) => a.titleSearchText.includes(t)).length;
        const bTitleHits = tokens.filter((t) => b.titleSearchText.includes(t)).length;
        if (bTitleHits !== aTitleHits) return bTitleHits - aTitleHits;
      }
      if (b.year !== a.year) return b.year - a.year;
      return a.title.localeCompare(b.title, "it");
    });

  if (!matchedExams.length) {
    mount.innerHTML = `
      <div class="muted" style="font-size:0.9rem;">
        Nessuna prova trovata${queryRaw ? ` per <strong>"${escapeHtml(queryRaw)}"</strong>` : ""}.
        Prova con parole chiave più brevi (es. <em>INVALSI 2021</em>, <em>semestre filtro 2025</em>, <em>TOLC-I</em>) oppure usa i menu <strong>Competizione</strong> e <strong>Anno</strong>.
      </div>
    `;
    return;
  }

  const labelCount = matchedExams.length === 1 ? "1 prova trovata" : `${matchedExams.length} prove trovate`;
  mount.innerHTML = `
    <div class="catalog-exam-results-head">
      <span><strong>${labelCount}</strong>${queryRaw ? ` per "${escapeHtml(queryRaw)}"` : ""}</span>
      <span class="muted"><small>Apri direttamente il PDF o clicca «Vedi i quesiti» per filtrare sotto</small></span>
    </div>
    <div class="catalog-exam-grid">
      ${matchedExams.map(renderExamCardHtml).join("")}
    </div>
  `;
}

function renderActiveExamBanner() {
  const mount = document.querySelector("[data-active-exam-banner]");
  if (!mount) return;
  if (!selectedExamKey || !examMap.has(selectedExamKey)) {
    mount.innerHTML = "";
    return;
  }

  const exam = examMap.get(selectedExamKey);
  const qHref = buildPdfHref(exam.questionsPdfLocal, null);
  const sHref = exam.solutionsPdfLocal
    ? buildPdfHref(exam.solutionsPdfLocal, exam.samePdfSolutions ? exam.minSolutionPage : null)
    : "";

  mount.innerHTML = `
    <div class="catalog-active-exam-banner no-print">
      <div class="catalog-active-exam-info">
        <strong>📑 Prova selezionata: ${escapeHtml(exam.title)} (${exam.year})</strong>
        ${exam.subtitle ? `<span class="muted"><small>${escapeHtml(exam.subtitle)}</small></span>` : ""}
      </div>
      <div class="catalog-active-exam-actions">
        ${qHref ? `<a class="btn btn-primary btn-xs" href="${escapeHtml(qHref)}" target="_blank" rel="noopener">📄 Apri PDF completo</a>` : ""}
        ${sHref ? `<a class="btn btn-success btn-xs" href="${escapeHtml(sHref)}" target="_blank" rel="noopener">✅ Soluzioni</a>` : ""}
        <button type="button" class="btn btn-ghost btn-xs" data-clear-exam>✕ Rimuovi filtro prova</button>
      </div>
    </div>
  `;
}

function renderSelectedTopicChips() {
  const mount = document.querySelector("[data-selected-topics]");
  if (!mount) return;
  const topicMap = getTopicMap();

  if (selectedTopics.size === 0) {
    mount.innerHTML = `<span class="muted"><small>Nessun argomento selezionato (mostra tutti gli argomenti).</small></span>`;
    return;
  }

  mount.innerHTML = Array.from(selectedTopics)
    .map((tid) => {
      const label = topicMap[tid]?.label || tid;
      return `
        <button type="button" class="topic-chip is-selected" data-toggle-topic="${escapeHtml(tid)}" title="Rimuovi argomento dal filtro">
          ${escapeHtml(label)} ✕
        </button>
      `;
    })
    .join("");
}

function renderTopicGroups(searchQuery = "") {
  const mount = document.querySelector("[data-topic-groups]");
  const summaryEl = document.querySelector("[data-topic-accordion-summary]");
  if (!mount || !catalog) return;

  const tokens = tokenizeQuery(searchQuery.trim());
  const disciplineVal = document.querySelector("[data-filter-discipline]")?.value || "";
  const allowedAreas = getDisciplineAllowedAreas(disciplineVal);
  const counts = catalog.stats?.byTopic || {};
  const macroAreas = [...(catalog.macroAreas || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter((area) => !allowedAreas || allowedAreas.has(area.id));

  let visibleTopicCount = 0;
  let visibleAreaCount = 0;

  const groupsHtml = macroAreas
    .map((area) => {
      const areaAliases = MACRO_AREA_ALIASES[area.id] || [];
      const areaSearchText = [area.id, area.label, ...areaAliases].join(" ");

      const matchingTopics = (catalog.topics || []).filter((t) => {
        if (t.macroArea !== area.id) return false;
        if (!tokens.length) return true;
        // Include disciplina / macro-area e suoi sinonimi, così cercando "Fisica" compaiono TUTTE le sottosezioni di Fisica!
        const fullIdx = buildSearchIndexText(
          [areaSearchText, t.id, t.label, ...(t.synonyms || [])].join(" ")
        );
        return matchesAllTokens(fullIdx, tokens);
      });

      if (matchingTopics.length === 0) return "";

      visibleAreaCount += 1;
      visibleTopicCount += matchingTopics.length;

      const allSelected = matchingTopics.every((t) => selectedTopics.has(t.id));
      const topicIdsAttr = matchingTopics.map((t) => t.id).join(",");

      const chips = matchingTopics
        .map((t) => {
          const isSel = selectedTopics.has(t.id);
          const cnt = counts[t.id] || 0;
          return `
            <button
              type="button"
              class="topic-chip ${isSel ? "is-selected" : ""} ${cnt === 0 ? "is-empty" : ""}"
              data-toggle-topic="${escapeHtml(t.id)}"
              title="${escapeHtml((t.synonyms || []).join(", "))}"
            >
              <span>${escapeHtml(t.label)}</span>
              <span class="topic-chip-count">${cnt}</span>
            </button>
          `;
        })
        .join("");

      return `
        <div class="catalog-topic-group">
          <div class="catalog-topic-group-head">
            <h4>${escapeHtml(area.label)} (${matchingTopics.length})</h4>
            <button
              type="button"
              class="catalog-topic-area-toggle ${allSelected ? "is-all-selected" : ""}"
              data-toggle-area-topics="${escapeHtml(topicIdsAttr)}"
              title="${allSelected ? "Deseleziona tutti gli argomenti mostrati in questa area" : "Seleziona tutti gli argomenti mostrati in questa area"}"
            >
              ${allSelected ? "✕ Deseleziona area" : `✓ Seleziona tutti (${matchingTopics.length})`}
            </button>
          </div>
          <div class="catalog-topic-chip-list">${chips}</div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  if (summaryEl) {
    const totalTopics = (catalog.topics || []).length;
    const totalAreas = (catalog.macroAreas || []).length;
    if (tokens.length || allowedAreas) {
      summaryEl.textContent = `Mostra / nascondi elenco argomenti per disciplina (${visibleTopicCount} argomenti filtrati in ${visibleAreaCount} ${visibleAreaCount === 1 ? "area" : "aree"})`;
    } else {
      summaryEl.textContent = `Mostra / nascondi elenco argomenti per disciplina (${totalTopics} argomenti in ${totalAreas} aree)`;
    }
  }

  mount.innerHTML =
    groupsHtml ||
    `<p class="muted">Nessun argomento corrisponde a "${escapeHtml(searchQuery)}"${allowedAreas ? " nella disciplina selezionata" : ""}.</p>`;
}

function filterAndExtractItems() {
  const searchRaw = document.querySelector("[data-filter-search]")?.value?.trim() || "";
  const searchTokens = tokenizeQuery(searchRaw);
  const disciplineVal = document.querySelector("[data-filter-discipline]")?.value || "";
  const allowedAreas = getDisciplineAllowedAreas(disciplineVal);
  const compVal = document.querySelector("[data-filter-competition]")?.value || "";
  const levelVal = document.querySelector("[data-filter-level]")?.value || "";
  const langVal = document.querySelector("[data-filter-language]")?.value || "";
  const formatVal = document.querySelector("[data-filter-format]")?.value || "";
  const sourceTypeVal = document.querySelector("[data-filter-source-type]")?.value || "";
  const visualsVal = document.querySelector("[data-filter-visuals]")?.value || "";
  const topicMatchMode = document.querySelector("[data-topic-match-mode]")?.value || "or";
  const yearMinRaw = document.querySelector("[data-filter-year-min]")?.value;
  const yearMaxRaw = document.querySelector("[data-filter-year-max]")?.value;
  const includeArchived = Boolean(document.querySelector("[data-include-archived]")?.checked);
  const limitRaw = document.querySelector("[data-extract-limit]")?.value || "all";
  const strategy = document.querySelector("[data-extract-strategy]")?.value || "newest";

  const yearMin = yearMinRaw ? Number(yearMinRaw) : null;
  const yearMax = yearMaxRaw ? Number(yearMaxRaw) : null;

  const topicMap = getTopicMap();
  const macroAreaMap = getMacroAreaMap();
  const compMap = getCompetitionMap();
  const sourceMeta = catalog.sourceTypeMeta || {};

  let matched = (catalog.items || []).filter((item) => {
    if (!includeArchived && item.archived) return false;
    if (selectedExamKey && getExamKey(item) !== selectedExamKey) return false;
    if (compVal && item.competitionId !== compVal) return false;
    if (levelVal && !(item.levels || []).includes(levelVal)) return false;
    if (langVal && (item.language || "it") !== langVal) return false;
    if (formatVal && (item.responseFormat || "scelta_multipla") !== formatVal) return false;
    if (yearMin !== null && Number.isFinite(yearMin) && item.year < yearMin) return false;
    if (yearMax !== null && Number.isFinite(yearMax) && item.year > yearMax) return false;

    const itemTopics = item.allTopics || [item.primaryTopic, ...(item.secondaryTopics || [])];

    if (allowedAreas) {
      const inDiscipline = itemTopics.some((tid) => allowedAreas.has(topicMap[tid]?.macroArea));
      if (!inDiscipline) return false;
    }

    if (sourceTypeVal) {
      const isOff = Boolean(sourceMeta[item.sourceType]?.isOfficial);
      if (sourceTypeVal === "official_all" && !isOff) return false;
      if (sourceTypeVal === "third_party_all" && isOff) return false;
      if (
        sourceTypeVal !== "official_all" &&
        sourceTypeVal !== "third_party_all" &&
        item.sourceType !== sourceTypeVal
      ) {
        return false;
      }
    }

    if (visualsVal) {
      const visuals = (item.visuals || []).filter((v) => v !== "nessuno");
      if (visualsVal === "with_visuals" && visuals.length === 0) return false;
      if (visualsVal === "no_visuals" && visuals.length > 0) return false;
    }

    if (selectedTopics.size > 0) {
      const selectedArr = Array.from(selectedTopics);
      const matchesTopic =
        topicMatchMode === "and"
          ? selectedArr.every((tid) => itemTopics.includes(tid))
          : selectedArr.some((tid) => itemTopics.includes(tid));
      if (!matchesTopic) return false;
    }

    if (searchTokens.length > 0) {
      const comp = compMap[item.competitionId];
      const topicTexts = itemTopics
        .map((tid) => {
          const t = topicMap[tid];
          if (!t) return tid;
          const area = macroAreaMap[t.macroArea];
          const aliases = MACRO_AREA_ALIASES[t.macroArea] || [];
          return `${t.label} ${(t.synonyms || []).join(" ")} ${area?.label || ""} ${aliases.join(" ")}`;
        })
        .join(" ");
      const pdfName = item.questionsPdfLocal ? item.questionsPdfLocal.split("/").pop() : "";
      const searchIdx = buildSearchIndexText(
        [
          item.id,
          comp?.shortName || "",
          item.edition,
          item.phase,
          item.year,
          item.questionNumber,
          item.originalLevelLabel,
          item.summary,
          item.sourceSite,
          pdfName,
          ...(item.keywords || []),
          topicTexts
        ].join(" ")
      );
      if (!matchesAllTokens(searchIdx, searchTokens)) return false;
    }

    return true;
  });

  const totalMatched = matched.length;
  const limit = limitRaw === "all" ? null : Math.max(1, Number(limitRaw));

  if (strategy === "newest") {
    matched.sort((a, b) => b.year - a.year || a.competitionId.localeCompare(b.competitionId));
    if (limit) matched = matched.slice(0, limit);
  } else if (strategy === "oldest") {
    matched.sort((a, b) => a.year - b.year || a.competitionId.localeCompare(b.competitionId));
    if (limit) matched = matched.slice(0, limit);
  } else if (strategy === "random_all") {
    matched = shuffleArray(matched);
    if (limit) matched = matched.slice(0, limit);
  } else if (strategy === "random_recent") {
    const byYear = new Map();
    matched.forEach((item) => {
      if (!byYear.has(item.year)) byYear.set(item.year, []);
      byYear.get(item.year).push(item);
    });
    const sortedYears = Array.from(byYear.keys()).sort((a, b) => b - a);
    const pool = [];
    sortedYears.forEach((y) => {
      pool.push(...shuffleArray(byYear.get(y)));
    });
    matched = limit ? pool.slice(0, limit) : pool;
  }

  return { items: matched, totalMatched };
}

function renderItemCards(items) {
  const compMap = getCompetitionMap();
  const topicMap = getTopicMap();
  const levelMap = getLevelMap();
  const sourceMeta = catalog.sourceTypeMeta || {};

  return items
    .map((item) => {
      const comp = compMap[item.competitionId];
      const st = sourceMeta[item.sourceType] || { badge: item.sourceType, isOfficial: false };
      const sourceBadgeClass = st.isOfficial ? "badge-source-official" : "badge-source-thirdparty";
      const isEn = (item.language || "it") === "en";

      const visualsHtml = (item.visuals || [])
        .filter((v) => v !== "nessuno" && VISUAL_BADGES[v])
        .map((v) => `<span class="badge">${VISUAL_BADGES[v]}</span>`)
        .join("");

      const levelsHtml = (item.levels || [])
        .map((lv) => `<span class="badge">${escapeHtml(levelMap[lv]?.shortLabel || lv)}</span>`)
        .join("");

      const topicsHtml = (item.allTopics || [])
        .map((tid) => {
          const isPrimary = tid === item.primaryTopic;
          const label = topicMap[tid]?.label || tid;
          return `
            <button
              type="button"
              class="topic-chip ${isPrimary ? "is-primary-topic" : ""} ${selectedTopics.has(tid) ? "is-selected" : ""}"
              data-toggle-topic="${escapeHtml(tid)}"
              title="${isPrimary ? "Argomento primario" : "Argomento secondario"} — clicca per filtrare"
            >
              ${isPrimary ? "★ " : ""}${escapeHtml(label)}
            </button>
          `;
        })
        .join("");

      const qHref = buildPdfHref(item.questionsPdfLocal, item.questionsPage);
      const qDownloadHref = item.questionsPdfLocal ? resolveRootPath(item.questionsPdfLocal) : "";
      const sHref = buildPdfHref(item.solutionsPdfLocal, item.solutionsPage);
      const sDownloadHref = item.solutionsPdfLocal ? resolveRootPath(item.solutionsPdfLocal) : "";

      const questionsButtons = qHref
        ? `
          <a class="btn btn-primary" href="${escapeHtml(qHref)}" target="_blank" rel="noopener">
            📄 Apri PDF domande${item.questionsPage ? ` (p. ${item.questionsPage})` : ""}
          </a>
          <a class="btn btn-ghost" href="${escapeHtml(qDownloadHref)}" download>
            ⬇ Scarica domande
          </a>
        `
        : `<a class="btn btn-primary" href="${escapeHtml(item.originalQuestionsUrl)}" target="_blank" rel="noopener">🌐 Apri domande (sito)</a>`;

      const solutionsButtons = sHref
        ? `
          <a class="btn btn-success" href="${escapeHtml(sHref)}" target="_blank" rel="noopener">
            ✅ Apri PDF soluzioni${item.solutionsPage ? ` (p. ${item.solutionsPage})` : ""}
          </a>
          <a class="btn btn-ghost" href="${escapeHtml(sDownloadHref)}" download>
            ⬇ Scarica soluzioni
          </a>
        `
        : item.originalSolutionsUrl
          ? `<a class="btn btn-success" href="${escapeHtml(item.originalSolutionsUrl)}" target="_blank" rel="noopener">✅ Apri soluzioni (sito)</a>`
          : `<span class="muted"><small>Soluzioni non ancora allegate</small></span>`;

      const noteHtml = item.notes
        ? `<p class="catalog-item-note">📝 ${escapeHtml(item.notes)}</p>`
        : "";

      return `
        <article class="card catalog-item-card">
          <div class="catalog-item-top">
            <div class="catalog-item-badges">
              <span class="badge badge-exp">${escapeHtml(comp?.shortName || item.competitionId)} · ${item.year}</span>
              <span class="badge ${sourceBadgeClass}" title="${escapeHtml(st.description || "")}">${escapeHtml(st.badge)}</span>
              ${isEn ? `<span class="badge badge-clil" title="Quesito in lingua inglese utile per percorsi CLIL">🇬🇧 EN · CLIL</span>` : ""}
              ${levelsHtml}
              ${visualsHtml}
            </div>
            <div class="catalog-item-ref">
              <strong>${escapeHtml(item.questionNumber)}</strong>
              ${item.questionsPage ? `<span class="muted">· pag. ${item.questionsPage}</span>` : ""}
            </div>
          </div>

          <h3 class="catalog-item-title">
            ${escapeHtml(item.edition)} — ${escapeHtml(item.phase)}
            <span class="muted" style="font-weight:500; font-size:0.9rem;">(${escapeHtml(item.originalLevelLabel)})</span>
          </h3>

          <p class="catalog-item-summary">${escapeHtml(item.summary)}</p>

          <div class="catalog-topic-chip-list" style="margin-bottom:0.85rem;">
            ${topicsHtml}
          </div>

          ${noteHtml}

          <div class="catalog-item-actions no-print">
            ${questionsButtons}
            ${solutionsButtons}
          </div>

          <div class="catalog-item-meta">
            <span>Formato: <strong>${escapeHtml(FORMAT_LABELS[item.responseFormat] || item.responseFormat)}</strong></span>
            <span>·</span>
            <span>
              Fonte originale: <strong>${escapeHtml(item.sourceSite)}</strong>
              (<a href="${escapeHtml(item.originalQuestionsUrl)}" target="_blank" rel="noopener">link sorgente</a>)
            </span>
            <span>·</span>
            <span>ID: <code>${escapeHtml(item.id)}</code></span>
          </div>
        </article>
      `;
    })
    .join("");
}

function paintDisplayedResults() {
  const mount = document.querySelector("[data-catalog-results]");
  if (!mount) return;

  const slice = lastDisplayedItems.slice(0, visibleLimit);
  const remaining = lastDisplayedItems.length - slice.length;

  const loadMoreHtml =
    remaining > 0
      ? `
        <div class="catalog-load-more no-print">
          <span class="muted">Visualizzati <strong>${slice.length}</strong> di <strong>${lastDisplayedItems.length}</strong> quesiti estratti.</span>
          <button type="button" class="btn btn-primary" data-load-more="page">
            Mostra altri ${Math.min(PAGE_SIZE, remaining)} quesiti
          </button>
          <button type="button" class="btn btn-ghost" data-load-more="all">
            Mostra tutti (${lastDisplayedItems.length})
          </button>
        </div>
      `
      : "";

  mount.innerHTML = renderItemCards(slice) + loadMoreHtml;
}

function renderResults({ resetPagination = true } = {}) {
  const mount = document.querySelector("[data-catalog-results]");
  const counterEl = document.querySelector("[data-results-counter]");
  if (!mount || !catalog) return;

  renderActiveExamBanner();

  const { items, totalMatched } = filterAndExtractItems();
  lastDisplayedItems = items;
  if (resetPagination) {
    visibleLimit = PAGE_SIZE;
  }

  if (counterEl) {
    counterEl.textContent =
      items.length === totalMatched
        ? `${totalMatched} quesiti`
        : `Estratti ${items.length} di ${totalMatched} quesiti trovati`;
  }

  if (items.length === 0) {
    mount.innerHTML = `
      <div class="card">
        <h3>Nessun quesito trovato con i filtri attuali</h3>
        <p class="muted" style="margin-bottom:0;">
          Prova ad allargare i filtri (es. rimuovere un argomento o il filtro prova, passare a modalità OR oppure includere più anni/competizioni).
        </p>
      </div>
    `;
    return;
  }

  paintDisplayedResults();
}

function renderCoverageSummary() {
  const mount = document.querySelector("[data-coverage-summary]");
  if (!mount || !catalog) return;

  const statusMeta = {
    active: { label: "✅ Attiva", cls: "badge-source-official" },
    pilot: { label: "🧪 Pilota", cls: "badge-exp" },
    planned: { label: "⏳ In arrivo", cls: "" }
  };

  const comps = catalog.competitions || [];
  const hasCategories = comps.some((c) => c.category);

  const renderRow = (c) => {
    const st = statusMeta[c.status] || { label: c.status, cls: "" };
    const count = c.questionCount || 0;
    const years = c.coveredYears || [];
    const yearsHtml = years.length
      ? years
          .map(
            (y) =>
              `<button type="button" class="topic-chip" data-quick-comp="${escapeHtml(c.id)}" data-quick-year="${y}" title="Filtra ${escapeHtml(c.shortName)} (${y})">${y}</button>`
          )
          .join("")
      : `<span class="muted"><small>Nessuna prova ancora caricata</small></span>`;

    return `
      <tr>
        <td>
          <button type="button" class="catalog-comp-link" data-quick-comp="${escapeHtml(c.id)}" title="Mostra tutti i quesiti di ${escapeHtml(c.shortName)}">
            <strong>${escapeHtml(c.shortName)}</strong>
          </button>
        </td>
        <td><span class="badge ${st.cls}">${st.label}</span></td>
        <td style="font-family:var(--font-mono); font-weight:700;">${count}</td>
        <td><div class="catalog-topic-chip-list">${yearsHtml}</div></td>
      </tr>
    `;
  };

  let rows = "";
  if (hasCategories) {
    rows = COMPETITION_CATEGORIES.map((cat) => {
      const groupComps = comps.filter((c) => (c.category || "scuola_competizioni") === cat.id);
      if (!groupComps.length) return "";
      const groupHeader = `
        <tr class="catalog-coverage-group-row">
          <td colspan="4"><strong>${escapeHtml(cat.label)}</strong></td>
        </tr>
      `;
      return groupHeader + groupComps.map(renderRow).join("");
    }).join("");
  } else {
    rows = comps.map(renderRow).join("");
  }

  mount.innerHTML = `
    <table class="catalog-coverage-table">
      <thead>
        <tr>
          <th>Competizione / Test</th>
          <th>Stato</th>
          <th>Quesiti</th>
          <th>Anni presenti a catalogo</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderCompetitionsOverview() {
  const mount = document.querySelector("[data-competitions-overview]");
  if (!mount || !catalog) return;

  const statusLabels = {
    active: "✅ Attiva",
    pilot: "🧪 Pilota",
    planned: "⏳ In coda negli step successivi"
  };

  mount.innerHTML = (catalog.competitions || [])
    .map((c) => {
      const years = (c.coveredYears || []).length ? c.coveredYears.join(", ") : "Nessuna edizione ancora inserita";
      const links = (c.officialWebsites || [])
        .map((url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url.replace(/^https?:\/\//, ""))}</a>`)
        .join(" · ");
      return `
        <article class="card">
          <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
            <strong>${escapeHtml(c.name)}</strong>
            <span class="badge">${statusLabels[c.status] || escapeHtml(c.status)}</span>
          </div>
          <p class="muted" style="font-size:0.88rem; margin-bottom:0.5rem;">${escapeHtml(c.organizer)}</p>
          <p style="font-size:0.92rem; margin-bottom:0.5rem;">${escapeHtml(c.notes || "")}</p>
          <div style="font-size:0.85rem;" class="muted">
            <strong>Quesiti:</strong> ${c.questionCount || 0} · <strong>Anni:</strong> ${escapeHtml(years)}<br />
            <strong>Siti ufficiali:</strong> ${links}
          </div>
        </article>
      `;
    })
    .join("");
}

function buildMarkdownExport(items) {
  const compMap = getCompetitionMap();
  const topicMap = getTopicMap();
  const lines = [`# Selezione dal Catalogo Esercizi (${items.length} quesiti)`, ""];
  items.forEach((item, idx) => {
    const comp = compMap[item.competitionId]?.shortName || item.competitionId;
    const topics = (item.allTopics || []).map((t) => topicMap[t]?.label || t).join(", ");
    lines.push(
      `${idx + 1}. **${comp} ${item.year} — ${item.phase}** (${item.originalLevelLabel}) · **${item.questionNumber}**` +
        (item.questionsPage ? ` (pag. ${item.questionsPage})` : "")
    );
    lines.push(`   - Sintesi: ${item.summary}`);
    lines.push(`   - Argomenti: ${topics}`);
    if (item.questionsPdfLocal) {
      lines.push(`   - PDF Domande locale: \`${item.questionsPdfLocal}\`${item.questionsPage ? `#page=${item.questionsPage}` : ""}`);
    }
    if (item.solutionsPdfLocal) {
      lines.push(`   - PDF Soluzioni locale: \`${item.solutionsPdfLocal}\`${item.solutionsPage ? `#page=${item.solutionsPage}` : ""}`);
    }
    lines.push(`   - Fonte originale (${item.sourceType}): ${item.sourceSite} — ${item.originalQuestionsUrl}`);
    lines.push("");
  });
  return lines.join("\n");
}

function selectSpecificExam(examKey) {
  const exam = examMap.get(examKey);
  if (!exam) return;

  selectedExamKey = examKey;
  selectedTopics.clear();

  // Allinea i filtri principali alla prova scelta e pulisce eventuali filtri residui che nasconderebbero i quesiti
  [
    "[data-filter-search]",
    "[data-filter-discipline]",
    "[data-filter-level]",
    "[data-filter-language]",
    "[data-filter-format]",
    "[data-filter-source-type]",
    "[data-filter-visuals]",
    "[data-topic-search]"
  ].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });

  const compEl = document.querySelector("[data-filter-competition]");
  const minEl = document.querySelector("[data-filter-year-min]");
  const maxEl = document.querySelector("[data-filter-year-max]");
  const limEl = document.querySelector("[data-extract-limit]");
  if (compEl) compEl.value = exam.competitionId;
  if (minEl) minEl.value = String(exam.year);
  if (maxEl) maxEl.value = String(exam.year);
  if (limEl) limEl.value = "all";

  renderSelectedTopicChips();
  renderTopicGroups("");
  renderExamFinderResults();
  renderResults();
  showToast(`📑 Selezionata prova: ${exam.title} (${exam.questionCount} quesiti)`);
  document.querySelector("#risultati-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindEvents() {
  // --- Cerca una prova specifica ---
  const examSearchInput = document.querySelector("[data-exam-search]");
  examSearchInput?.addEventListener("input", () => {
    window.clearTimeout(examSearchDebounceTimer);
    examSearchDebounceTimer = window.setTimeout(() => renderExamFinderResults(), 120);
  });

  const examCompSelect = document.querySelector("[data-exam-competition]");
  examCompSelect?.addEventListener("change", () => {
    populateExamYearOptions(examCompSelect.value);
    renderExamFinderResults();
  });

  const examYearSelect = document.querySelector("[data-exam-year]");
  examYearSelect?.addEventListener("change", () => {
    renderExamFinderResults();
  });

  document.querySelector("[data-exam-reset]")?.addEventListener("click", () => {
    if (examSearchInput) examSearchInput.value = "";
    if (examCompSelect) examCompSelect.value = "";
    populateExamYearOptions("");
    if (examYearSelect) examYearSelect.value = "";
    renderExamFinderResults();
  });

  // --- Filtri principali quesiti ---
  const searchInput = document.querySelector("[data-filter-search]");
  searchInput?.addEventListener("input", () => {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => renderResults(), 150);
  });

  const disciplineSelect = document.querySelector("[data-filter-discipline]");
  disciplineSelect?.addEventListener("change", () => {
    renderTopicGroups(document.querySelector("[data-topic-search]")?.value || "");
    renderResults();
  });

  const compSelect = document.querySelector("[data-filter-competition]");
  compSelect?.addEventListener("change", () => {
    if (selectedExamKey) {
      const ex = examMap.get(selectedExamKey);
      if (ex && compSelect.value && compSelect.value !== ex.competitionId) {
        selectedExamKey = "";
        renderExamFinderResults();
      }
    }
    renderResults();
  });

  const handleYearFilterChange = () => {
    if (selectedExamKey) {
      const ex = examMap.get(selectedExamKey);
      const minY = Number(document.querySelector("[data-filter-year-min]")?.value || 0);
      const maxY = Number(document.querySelector("[data-filter-year-max]")?.value || 0);
      if (ex && ((minY && ex.year < minY) || (maxY && ex.year > maxY))) {
        selectedExamKey = "";
        renderExamFinderResults();
      }
    }
    renderResults();
  };

  document.querySelector("[data-filter-year-min]")?.addEventListener("input", handleYearFilterChange);
  document.querySelector("[data-filter-year-max]")?.addEventListener("input", handleYearFilterChange);

  const rerenderSelectors = [
    "[data-filter-level]",
    "[data-filter-language]",
    "[data-filter-format]",
    "[data-filter-source-type]",
    "[data-filter-visuals]",
    "[data-topic-match-mode]",
    "[data-include-archived]",
    "[data-extract-limit]",
    "[data-extract-strategy]"
  ];

  rerenderSelectors.forEach((sel) => {
    const el = document.querySelector(sel);
    el?.addEventListener("input", () => renderResults());
    el?.addEventListener("change", () => renderResults());
  });

  document.querySelector("[data-topic-search]")?.addEventListener("input", (e) => {
    const accordion = document.querySelector(".catalog-topic-accordion");
    if (accordion && e.target.value.trim()) {
      accordion.open = true;
    }
    renderTopicGroups(e.target.value);
  });

  document.addEventListener("click", (event) => {
    const examExampleBtn = event.target.closest("[data-exam-example]");
    if (examExampleBtn) {
      const exampleQuery = examExampleBtn.dataset.examExample || "";
      if (examSearchInput) examSearchInput.value = exampleQuery;
      if (examCompSelect) examCompSelect.value = "";
      populateExamYearOptions("");
      if (examYearSelect) examYearSelect.value = "";
      renderExamFinderResults();
      return;
    }

    const selectExamBtn = event.target.closest("[data-select-exam]");
    if (selectExamBtn) {
      selectSpecificExam(selectExamBtn.dataset.selectExam || "");
      return;
    }

    const clearExamBtn = event.target.closest("[data-clear-exam]");
    if (clearExamBtn) {
      selectedExamKey = "";
      renderExamFinderResults();
      renderResults();
      return;
    }

    const loadMoreBtn = event.target.closest("[data-load-more]");
    if (loadMoreBtn) {
      const mode = loadMoreBtn.dataset.loadMore;
      visibleLimit = mode === "all" ? lastDisplayedItems.length : visibleLimit + PAGE_SIZE;
      paintDisplayedResults();
      return;
    }

    const quickCompBtn = event.target.closest("[data-quick-comp]");
    if (quickCompBtn) {
      const cid = quickCompBtn.dataset.quickComp || "";
      const yr = quickCompBtn.dataset.quickYear || "";
      selectedExamKey = "";
      const compEl = document.querySelector("[data-filter-competition]");
      const minEl = document.querySelector("[data-filter-year-min]");
      const maxEl = document.querySelector("[data-filter-year-max]");
      if (compEl) compEl.value = cid;
      if (minEl) minEl.value = yr;
      if (maxEl) maxEl.value = yr;
      renderExamFinderResults();
      renderResults();
      document.querySelector("#risultati-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const areaToggleBtn = event.target.closest("[data-toggle-area-topics]");
    if (areaToggleBtn) {
      const ids = (areaToggleBtn.dataset.toggleAreaTopics || "").split(",").filter(Boolean);
      const allSelected = ids.length > 0 && ids.every((tid) => selectedTopics.has(tid));
      if (allSelected) {
        ids.forEach((tid) => selectedTopics.delete(tid));
      } else {
        ids.forEach((tid) => selectedTopics.add(tid));
      }
      renderSelectedTopicChips();
      renderTopicGroups(document.querySelector("[data-topic-search]")?.value || "");
      renderResults();
      return;
    }

    const topicBtn = event.target.closest("[data-toggle-topic]");
    if (topicBtn) {
      const tid = topicBtn.dataset.toggleTopic;
      if (selectedTopics.has(tid)) {
        selectedTopics.delete(tid);
      } else {
        selectedTopics.add(tid);
      }
      renderSelectedTopicChips();
      renderTopicGroups(document.querySelector("[data-topic-search]")?.value || "");
      renderResults();
      return;
    }

    const presetBtn = event.target.closest("[data-year-preset]");
    if (presetBtn) {
      const preset = presetBtn.dataset.yearPreset;
      const minEl = document.querySelector("[data-filter-year-min]");
      const maxEl = document.querySelector("[data-filter-year-max]");
      const currentYear = new Date().getFullYear();
      selectedExamKey = "";
      if (preset === "all") {
        if (minEl) minEl.value = "";
        if (maxEl) maxEl.value = "";
      } else {
        const span = Number(preset);
        if (minEl) minEl.value = String(currentYear - span);
        if (maxEl) maxEl.value = "";
      }
      renderExamFinderResults();
      renderResults();
    }
  });

  window.addEventListener("beforeprint", () => {
    if (lastDisplayedItems.length > visibleLimit && lastDisplayedItems.length <= 200) {
      visibleLimit = lastDisplayedItems.length;
      paintDisplayedResults();
    }
  });

  document.querySelector("[data-reroll-extract]")?.addEventListener("click", () => {
    randomSeedTick += 1;
    const strat = document.querySelector("[data-extract-strategy]");
    if (strat && strat.value !== "random_recent" && strat.value !== "random_all") {
      strat.value = "random_recent";
    }
    renderResults();
    showToast(`🎲 Selezione riestratta (#${randomSeedTick})!`);
  });

  document.querySelector("[data-copy-markdown]")?.addEventListener("click", async () => {
    if (!lastDisplayedItems.length) {
      showToast("Nessun quesito da copiare.");
      return;
    }
    const md = buildMarkdownExport(lastDisplayedItems);
    try {
      await navigator.clipboard.writeText(md);
      showToast(`📋 Copiati ${lastDisplayedItems.length} quesiti in formato Markdown!`);
    } catch {
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selezione-catalogo-esercizi.md";
      a.click();
      URL.revokeObjectURL(url);
      showToast("⬇ Selezione scaricata come file Markdown.");
    }
  });

  document.querySelector("[data-export-json]")?.addEventListener("click", () => {
    if (!lastDisplayedItems.length) {
      showToast("Nessun quesito da esportare.");
      return;
    }
    const blob = new Blob([JSON.stringify(lastDisplayedItems, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selezione-catalogo-esercizi.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
    selectedTopics.clear();
    selectedExamKey = "";
    ["[data-filter-search]", "[data-filter-year-min]", "[data-filter-year-max]", "[data-topic-search]"].forEach((s) => {
      const el = document.querySelector(s);
      if (el) el.value = "";
    });
    [
      "[data-filter-discipline]",
      "[data-filter-competition]",
      "[data-filter-level]",
      "[data-filter-language]",
      "[data-filter-format]",
      "[data-filter-source-type]",
      "[data-filter-visuals]"
    ].forEach((s) => {
      const el = document.querySelector(s);
      if (el) el.value = "";
    });
    const mode = document.querySelector("[data-topic-match-mode]");
    if (mode) mode.value = "or";
    const lim = document.querySelector("[data-extract-limit]");
    if (lim) lim.value = "all";
    const strat = document.querySelector("[data-extract-strategy]");
    if (strat) strat.value = "newest";
    const arch = document.querySelector("[data-include-archived]");
    if (arch) arch.checked = false;
    const accordion = document.querySelector(".catalog-topic-accordion");
    if (accordion) accordion.open = false;

    renderSelectedTopicChips();
    renderTopicGroups("");
    renderExamFinderResults();
    renderResults();
  });
}

async function initCatalogPage() {
  const resultsMount = document.querySelector("[data-catalog-results]");
  try {
    const res = await fetch(resolveRootPath("data/catalogo/catalog-index.json"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    catalog = await res.json();
  } catch (err) {
    console.error("[catalog-page] Impossibile caricare catalog-index.json:", err);
    if (resultsMount) {
      resultsMount.innerHTML = `
        <div class="card">
          <h3>Errore nel caricamento del catalogo</h3>
          <p class="muted">
            Assicurati di aprire il sito tramite server HTTP (es. <code>python tools/serve_local.py</code>) e di aver
            compilato l'indice con <code>python tools/build_catalog.py</code>.
          </p>
        </div>
      `;
    }
    return;
  }

  buildExamIndex();
  renderTopStats();
  renderCoverageSummary();
  populateSelectFilters();
  renderExamFinderResults();
  renderSelectedTopicChips();
  renderTopicGroups("");
  renderCompetitionsOverview();
  bindEvents();
  renderResults();
}

let catalogInitialized = false;
function startCatalogPage() {
  if (catalogInitialized) return;
  catalogInitialized = true;
  initCatalogPage();
}

if (window.__ivanoReady) {
  startCatalogPage();
} else {
  window.addEventListener("ivano:ready", startCatalogPage, { once: true });
}
