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

  { id: "fisica", label: "Fisica (tutte le aree)", areas: ["fisica"] },
  {
    id: "fisica:meccanica",
    label: "↳ Meccanica & Gravitazione",
    areas: ["fisica"],
    topics: [
      "cinematica",
      "dinamica-forze",
      "statica-equilibrio",
      "lavoro-energia-potenza",
      "quantita-moto-urti",
      "gravitazione-astronomia-fisica"
    ]
  },
  {
    id: "fisica:fluidi",
    label: "↳ Fluidi & Pressione",
    areas: ["fisica"],
    topics: ["fluidi-pressione"]
  },
  {
    id: "fisica:termodinamica",
    label: "↳ Termologia & Termodinamica",
    areas: ["fisica"],
    topics: ["termologia-termodinamica"]
  },
  {
    id: "fisica:onde-ottica",
    label: "↳ Onde, Suono & Ottica",
    areas: ["fisica"],
    topics: ["onde-suono-ottica"]
  },
  {
    id: "fisica:elettromagnetismo",
    label: "↳ Elettromagnetismo & Circuiti",
    areas: ["fisica"],
    topics: ["elettrostatica-circuiti", "magnetismo-elettromagnetismo"]
  },
  {
    id: "fisica:moderna",
    label: "↳ Fisica Moderna (Relatività, Quantistica, Nucleare)",
    areas: ["fisica"],
    topics: ["fisica-moderna"]
  },

  { id: "logica-informatica", label: "Logica & Informatica (tutte le aree)", areas: ["logica-informatica"] },
  {
    id: "info:logica",
    label: "↳ Logica deduttiva, Insiemi & Algebra booleana",
    areas: ["logica-informatica"],
    topics: ["logica-proposizionale-booleana"]
  },
  {
    id: "info:algoritmi-grafi",
    label: "↳ Algoritmi, Grafi & Pensiero computazionale",
    areas: ["logica-informatica"],
    topics: ["algoritmi-pensiero-computazionale", "grafi-strutture-dati"]
  },
  {
    id: "info:programmazione",
    label: "↳ Programmazione & Lettura codice",
    areas: ["logica-informatica"],
    topics: ["lettura-codice-programmazione"]
  },
  {
    id: "info:codifica-sicurezza",
    label: "↳ Codifica, Basi numeriche & Crittografia",
    areas: ["logica-informatica"],
    topics: ["codifica-sistemi-numerazione", "crittografia-sicurezza"]
  },

  { id: "chimica", label: "Chimica (tutte le aree)", areas: ["chimica"] },
  {
    id: "chimica:atomo-legami",
    label: "↳ Struttura atomica, Legami & Nomenclatura",
    areas: ["chimica"],
    topics: ["struttura-atomica-periodica", "legami-nomenclatura"]
  },
  {
    id: "chimica:stechiometria-ph",
    label: "↳ Stechiometria, Soluzioni & Acidi-Basi (pH)",
    areas: ["chimica"],
    topics: ["stechiometria-moli", "soluzioni-concentrazioni", "acidi-basi-ph"]
  },
  {
    id: "chimica:equilibrio-redox",
    label: "↳ Termochimica, Cinetica, Equilibrio & Redox",
    areas: ["chimica"],
    topics: ["termochimica-cinetica-equilibrio", "redox-elettrochimica"]
  },
  {
    id: "chimica:organica",
    label: "↳ Chimica Organica & Biochimica",
    areas: ["chimica"],
    topics: ["chimica-organica-biochimica"]
  },

  { id: "scienze-naturali", label: "Scienze Naturali (tutte le aree)", areas: ["scienze-naturali"] },
  {
    id: "scienze:biologia",
    label: "↳ Biologia cellulare, Genetica & Anatomia",
    areas: ["scienze-naturali"],
    topics: ["biologia-cellulare-metabolismo", "genetica-evoluzione", "anatomia-fisiologia"]
  },
  {
    id: "scienze:ecologia",
    label: "↳ Ecologia & Ecosistemi",
    areas: ["scienze-naturali"],
    topics: ["ecologia-ecosistemi"]
  },
  {
    id: "scienze:terra-astronomia",
    label: "↳ Scienze della Terra (Geologia, Clima & Astronomia)",
    areas: ["scienze-naturali"],
    topics: ["minerali-rocce-geologia", "atmosfera-clima-idrosfera", "scienze-astronomia-terra"]
  },

  { id: "robotica-controllo", label: "Robotica & Controllo (tutte le aree)", areas: ["robotica-controllo"] },
  {
    id: "robotica:sensori-cinematica",
    label: "↳ Sensori, Attuatori & Cinematica robotica",
    areas: ["robotica-controllo"],
    topics: ["sensori-attuatori", "cinematica-robotica-ingranaggi"]
  },
  {
    id: "robotica:controllo-navigazione",
    label: "↳ Controllo, Automazione & Navigazione autonoma",
    areas: ["robotica-controllo"],
    topics: ["controllo-automazione", "navigazione-path-planning"]
  },
  {
    id: "robotica:sfide",
    label: "↳ Sfide progettuali & Regolamenti di gara",
    areas: ["robotica-controllo"],
    topics: ["sfida-progettuale-robotica"]
  }
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

const PAGE_SIZE = 5;

const SOURCE_TYPE_FILTER_OPTIONS = [
  { value: "official_all", label: "Solo fonti ufficiali (prove + esempi)" },
  { value: "official_exam", label: "Solo prove ufficiali reali" },
  { value: "official_sample", label: "Solo esempi ufficiali (es. INVALSIopen)" },
  { value: "third_party_all", label: "Solo archivi / allenamento terzi" }
];

const VISUALS_FILTER_OPTIONS = [
  { value: "with_visuals", label: "Solo con grafici / figure / tabelle" },
  { value: "no_visuals", label: "Solo testo (senza figure)" }
];

const COMPETITION_LEVEL_FACETS = {
  invalsi: {
    label: "🎯 Grado INVALSI",
    allOption: "Tutti i gradi INVALSI",
    options: [
      { value: "sub:g10", label: "Grado 10 (2ª Superiore)", match: (it) => (it.levels || []).includes("anno_2") },
      { value: "sub:g13", label: "Grado 13 (5ª Superiore)", match: (it) => (it.levels || []).includes("anno_5") }
    ]
  },
  "ocse-pisa": {
    label: "🎯 Ambito PISA (Quindicenni)",
    allOption: "Tutti gli ambiti PISA",
    options: [
      { value: "sub:mat", label: "Matematica", match: (it) => it._lowLabelPhase.includes("matematic") || it._lowLabelPhase.includes("mathematic") },
      { value: "sub:sci", label: "Scienze", match: (it) => it._lowLabelPhase.includes("scienz") || it._lowLabelPhase.includes("science") },
      { value: "sub:ps", label: "Problem Solving", match: (it) => it._lowLabelPhase.includes("problem solving") },
      { value: "sub:fin", label: "Financial Literacy", match: (it) => it._lowLabelPhase.includes("financial") },
      { value: "sub:crea", label: "Pensiero Creativo STEM", match: (it) => it._lowLabelPhase.includes("creativ") }
    ]
  },
  "olimpiadi-matematica": {
    label: "🎯 Fase / Categoria UMI",
    allOption: "Tutte le fasi e categorie",
    options: [
      { value: "sub:arch-biennio", label: "Giochi di Archimede — Biennio", match: (it) => it._lowPhase.includes("biennio") },
      { value: "sub:arch-triennio", label: "Giochi di Archimede — Triennio", match: (it) => it._lowPhase.includes("triennio") },
      { value: "sub:febbraio", label: "Gara di Febbraio (Provinciale)", match: (it) => it._lowPhase.includes("febbraio") }
    ]
  },
  "olimpiadi-fisica": {
    label: "🎯 Livello / Fase OliFis",
    allOption: "Tutti i livelli OliFis",
    options: [
      { value: "sub:liv1", label: "Gara di 1° Livello (Istituto)", match: (it) => it._lowPhase.includes("primo livello") },
      { value: "sub:liv2", label: "Gara di 2° Livello (Locale)", match: (it) => it._lowPhase.includes("secondo livello") }
    ]
  },
  "giochi-anacleto": {
    label: "🎯 Prova Anacleto",
    allOption: "Tutte le prove Anacleto",
    options: [
      { value: "sub:dr", label: "Domande & Risposte", match: (it) => it._lowPhase.includes("domande") },
      { value: "sub:inlab", label: "Anacleto In Lab (Laboratorio)", match: (it) => it._lowPhase.includes("in lab") }
    ]
  },
  "olimpiadi-informatica": {
    label: "🎯 Gara / Fascia Informatica",
    allOption: "Tutte le gare e fasce",
    options: [
      { value: "sub:oii", label: "OII — Selezioni Scolastiche (Unico)", match: (it) => it._lowPhase.includes("selezione scolastica") },
      { value: "sub:bebras-biennio", label: "Bebras / Castoro — Biennio (Anni 9–10)", match: (it) => it._lowPhase.includes("bebras") && (it.levels || []).includes("biennio") },
      { value: "sub:bebras-triennio", label: "Bebras / Castoro — Triennio (Anni 11–13)", match: (it) => it._lowPhase.includes("bebras") && (it.levels || []).includes("triennio") }
    ]
  },
  "giochi-chimica": {
    label: "🎯 Classe di concorso SCI",
    allOption: "Tutte le classi (A, B, C)",
    options: [
      { value: "sub:cls-a", label: "Classe A (Biennio)", match: (it) => it._lowLabelPhase.includes("classe a") },
      { value: "sub:cls-b", label: "Classe B (Triennio non chimico)", match: (it) => it._lowLabelPhase.includes("classe b") || it._lowLabelPhase.includes("classi b") || it._lowLabelPhase.includes("comuni b") },
      { value: "sub:cls-c", label: "Classe C (Triennio chimico)", match: (it) => it._lowLabelPhase.includes("classe c") || it._lowLabelPhase.includes("b e c") }
    ]
  },
  "olimpiadi-scienze-naturali": {
    label: "🎯 Sezione Scienze Naturali",
    allOption: "Tutte le sezioni",
    options: [
      { value: "sub:terra", label: "Scienze della Terra (USESO / IESO)", match: (it) => it._lowLabelPhase.includes("terra") || it._lowLabelPhase.includes("useso") },
      { value: "sub:bio", label: "Biologia (IBO)", match: (it) => it._lowLabelPhase.includes("biologia") || it._lowLabelPhase.includes("ibo") }
    ]
  },
  robotica: {
    label: "🎯 Categoria Robotica",
    allOption: "Tutte le categorie",
    options: [
      { value: "sub:rescue-line", label: "Rescue Line", match: (it) => it._lowLabelPhase.includes("rescue line") },
      { value: "sub:rescue-maze", label: "Rescue Maze", match: (it) => it._lowLabelPhase.includes("rescue maze") },
      { value: "sub:soccer", label: "Soccer", match: (it) => it._lowLabelPhase.includes("soccer") },
      { value: "sub:onstage", label: "OnStage / First Steps", match: (it) => it._lowLabelPhase.includes("first steps") || it._lowEdition.includes("onstage") },
      { value: "sub:campionati", label: "Campionati Italiani / Bandi", match: (it) => it._lowPhase.includes("mim") || it._lowPhase.includes("bando") }
    ]
  },
  "semestre-filtro-medicina": {
    label: "🎯 Insegnamento (6 CFU)",
    allOption: "Tutti gli insegnamenti",
    options: [
      { value: "sub:bio", label: "Biologia (6 CFU)", match: (it) => it._lowLabel.includes("biologia") },
      { value: "sub:chim", label: "Chimica e Propedeutica Biochimica (6 CFU)", match: (it) => it._lowLabel.includes("chimica") },
      { value: "sub:fis", label: "Fisica (6 CFU)", match: (it) => it._lowLabel.includes("fisica") }
    ]
  },
  "test-medicina": {
    label: "🎯 Sezione prova MUR",
    allOption: "Tutte le sezioni",
    options: [
      { value: "sub:bio", label: "Biologia", match: (it) => it._lowPhase.includes("biologia") },
      { value: "sub:chim", label: "Chimica", match: (it) => it._lowPhase.includes("chimica") },
      { value: "sub:fm", label: "Fisica e Matematica", match: (it) => it._lowPhase.includes("fisica") || it._lowPhase.includes("matematica") },
      { value: "sub:log", label: "Ragionamento logico e problemi", match: (it) => it._lowPhase.includes("logico") }
    ]
  },
  "test-professioni-sanitarie": {
    label: "🎯 Ateneo / Consorzio",
    allOption: "Tutti gli atenei",
    options: [
      { value: "sub:unibo", label: "CINECA — Università di Bologna (UniBo)", match: (it) => it._lowLabel.includes("unibo") },
      { value: "sub:unito", label: "Università di Torino (UniTo)", match: (it) => it._lowLabel.includes("unito") }
    ]
  },
  "test-imat": {
    label: "🎯 IMAT Section",
    allOption: "All IMAT sections",
    options: [
      { value: "sub:bio", label: "Biology", match: (it) => it._lowPhase.includes("biology") },
      { value: "sub:chem", label: "Chemistry", match: (it) => it._lowPhase.includes("chemistry") },
      { value: "sub:pm", label: "Physics and Mathematics", match: (it) => it._lowPhase.includes("physics") || it._lowPhase.includes("mathematics") },
      { value: "sub:log", label: "Logical reasoning & problem-solving", match: (it) => it._lowPhase.includes("logical") }
    ]
  },
  "test-veterinaria": {
    label: "🎯 Sezione prova MUR",
    allOption: "Tutte le sezioni",
    options: [
      { value: "sub:bio", label: "Biologia", match: (it) => it._lowPhase.includes("biologia") },
      { value: "sub:chim", label: "Chimica", match: (it) => it._lowPhase.includes("chimica") },
      { value: "sub:fm", label: "Fisica e Matematica", match: (it) => it._lowPhase.includes("fisica") || it._lowPhase.includes("matematica") },
      { value: "sub:log", label: "Ragionamento logico e problemi", match: (it) => it._lowPhase.includes("logico") }
    ]
  },
  "test-architettura": {
    label: "🎯 Sezione prova Architettura",
    allOption: "Tutte le sezioni",
    options: [
      { value: "sub:dis", label: "Disegno e Rappresentazione", match: (it) => it._lowPhase.includes("disegno") },
      { value: "sub:fm", label: "Fisica e Matematica", match: (it) => it._lowPhase.includes("fisica") || it._lowPhase.includes("matematica") },
      { value: "sub:log", label: "Ragionamento Logico", match: (it) => it._lowPhase.includes("logico") }
    ]
  },
  "test-ingegneria-scienze-tolc": {
    label: "🎯 Tipologia test",
    allOption: "Tutte le tipologie (TOLC / PoliMi)",
    options: [
      { value: "sub:tolc-i", label: "CISIA TOLC-I (Ingegneria)", match: (it) => it._lowLabel.includes("tolc-i") },
      { value: "sub:tolc-e", label: "CISIA TOLC-E (Economia)", match: (it) => it._lowLabel.includes("tolc-e") },
      { value: "sub:polimi-tol", label: "Politecnico di Milano — TOL", match: (it) => it._lowLabel.includes("tol ingegneria") },
      { value: "sub:politest", label: "Politecnico di Milano — POLItest", match: (it) => it._lowLabel.includes("politest") }
    ]
  },
  "scuole-eccellenza": {
    label: "🎯 Scuola Universitaria",
    allOption: "Tutte le scuole",
    options: [
      { value: "sub:sns", label: "Scuola Normale Superiore (SNS)", match: (it) => it._lowLabel.includes("sns") || it._lowEdition.includes("sns") },
      { value: "sub:santanna", label: "Scuola Superiore Sant'Anna", match: (it) => it._lowLabel.includes("sant'anna") || it._lowEdition.includes("sant'anna") }
    ]
  },
  "test-psicologia": {
    label: "🎯 Ateneo / Corso",
    allOption: "Tutti gli atenei / corsi",
    options: [
      { value: "sub:unisob-l24", label: "UNISOB Napoli — Psicologia Cognitiva (L-24)", match: (it) => it._lowLabel.includes("unisob") && it._lowLabel.includes("l-24") },
      { value: "sub:unisob-lm51", label: "UNISOB Napoli — Psicologia Magistrale (LM-51)", match: (it) => it._lowLabel.includes("unisob") && it._lowLabel.includes("lm-51") },
      { value: "sub:univda", label: "Università della Valle d'Aosta (L-24)", match: (it) => !it._lowLabel.includes("unisob") }
    ]
  },
  "test-scienze-formazione": {
    label: "🎯 Ateneo (Formazione Primaria)",
    allOption: "Tutti gli atenei",
    options: [
      { value: "sub:vanvitelli", label: "Vanvitelli (ex SUN)", match: (it) => it._lowLabel.includes("vanvitelli") },
      { value: "sub:unisob", label: "UNISOB Napoli (Demo)", match: (it) => it._lowLabel.includes("unisob") },
      { value: "sub:unipi", label: "Università di Pisa (UniPi)", match: (it) => it._lowLabel.includes("unipi") },
      { value: "sub:unica", label: "Università di Cagliari (UniCa)", match: (it) => it._lowLabel.includes("unica") },
      { value: "sub:unibas", label: "Università della Basilicata (UniBas)", match: (it) => it._lowLabel.includes("unibas") },
      { value: "sub:univda", label: "Università della Valle d'Aosta (UniVdA)", match: (it) => it._lowLabel.includes("univda") }
    ]
  }
};

let catalog = null;
let cachedCompMap = {};
let cachedTopicMap = {};
let cachedMacroAreaMap = {};
let cachedLevelMap = {};
let liveTopicCounts = {};
let examIndex = [];
let examMap = new Map();
let selectedTopics = new Set();
let selectedExamKey = "";
let activeCoverageCategory = "";
let selectedQuickComp = "";
let selectedQuickYear = "";
let lastDisplayedItems = [];
let visibleLimit = PAGE_SIZE;
let randomSeedTick = 0;
let manualExtractRequested = false;
let pendingLevelVal = null;
let searchDebounceTimer = null;

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
  return cachedCompMap;
}

function getTopicMap() {
  return cachedTopicMap;
}

function getMacroAreaMap() {
  return cachedMacroAreaMap;
}

function getLevelMap() {
  return cachedLevelMap;
}

function prepareCatalogCaches() {
  cachedCompMap = Object.fromEntries((catalog?.competitions || []).map((c) => [c.id, c]));
  cachedTopicMap = Object.fromEntries((catalog?.topics || []).map((t) => [t.id, t]));
  cachedMacroAreaMap = Object.fromEntries((catalog?.macroAreas || []).map((a) => [a.id, a]));
  cachedLevelMap = Object.fromEntries((catalog?.levels || []).map((l) => [l.id, l]));

  const sourceMeta = catalog?.sourceTypeMeta || {};

  (catalog?.items || []).forEach((item) => {
    const itemTopics = item.allTopics || [item.primaryTopic, ...(item.secondaryTopics || [])];
    item._topics = itemTopics;
    item._areas = new Set(itemTopics.map((tid) => cachedTopicMap[tid]?.macroArea).filter(Boolean));
    item._hasVisuals = (item.visuals || []).some((v) => v !== "nessuno");
    item._isOfficial = Boolean(sourceMeta[item.sourceType]?.isOfficial);
    item._lowPhase = String(item.phase || "").toLowerCase();
    item._lowLabel = String(item.originalLevelLabel || "").toLowerCase();
    item._lowEdition = String(item.edition || "").toLowerCase();
    item._lowLabelPhase = `${item._lowLabel} ${item._lowPhase}`;

    const comp = cachedCompMap[item.competitionId];
    const topicTexts = itemTopics
      .map((tid) => {
        const t = cachedTopicMap[tid];
        if (!t) return tid;
        const area = cachedMacroAreaMap[t.macroArea];
        const aliases = MACRO_AREA_ALIASES[t.macroArea] || [];
        return `${t.label} ${(t.synonyms || []).join(" ")} ${area?.label || ""} ${aliases.join(" ")}`;
      })
      .join(" ");
    const pdfName = item.questionsPdfLocal ? item.questionsPdfLocal.split("/").pop() : "";
    item._searchIdx = buildSearchIndexText(
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
  });
}

function getDisciplineFilter(disciplineVal) {
  if (!disciplineVal) return null;
  const found = DISCIPLINE_OPTIONS.find((opt) => opt.id === disciplineVal);
  if (!found) return null;
  return {
    areas: found.areas ? new Set(found.areas) : null,
    topics: found.topics ? new Set(found.topics) : null
  };
}

function itemMatchesDisciplineFilter(item, discFilter) {
  if (!discFilter) return true;
  if (discFilter.topics) {
    return item._topics.some((tid) => discFilter.topics.has(tid));
  }
  if (discFilter.areas) {
    for (const area of item._areas) {
      if (discFilter.areas.has(area)) return true;
    }
    return false;
  }
  return true;
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
  const comps = catalog.competitions || [];
  const schoolComps = comps.filter((c) => (c.category || "scuola_competizioni") === "scuola_competizioni").length;
  const univComps = comps.filter((c) => c.category === "ingresso_universita").length;

  mount.innerHTML = `
    <span class="badge badge-exp">📄 ${total} quesiti catalogati</span>
    <span class="badge">📑 ${examIndex.length} prove / fascicoli PDF</span>
    <span class="badge">🏫 ${schoolComps} competizioni scolastiche e prove nazionali</span>
    <span class="badge">🎓 ${univComps} test di ammissione a facoltà universitarie</span>
  `;
}

function getFilterState() {
  const searchRaw = document.querySelector("[data-filter-search]")?.value?.trim() || "";
  const disciplineVal = document.querySelector("[data-filter-discipline]")?.value || "";
  const compVal = document.querySelector("[data-filter-competition]")?.value || "";
  const levelVal = pendingLevelVal !== null ? pendingLevelVal : (document.querySelector("[data-filter-level]")?.value || "");
  const langVal = document.querySelector("[data-filter-language]")?.value || "";
  const formatVal = document.querySelector("[data-filter-format]")?.value || "";
  const sourceTypeVal = document.querySelector("[data-filter-source-type]")?.value || "";
  const visualsVal = document.querySelector("[data-filter-visuals]")?.value || "";
  const topicMatchMode = document.querySelector("[data-topic-match-mode]")?.value || "or";
  const yearMinRaw = document.querySelector("[data-filter-year-min]")?.value?.trim() || "";
  const yearMaxRaw = document.querySelector("[data-filter-year-max]")?.value?.trim() || "";
  const includeArchived = Boolean(document.querySelector("[data-include-archived]")?.checked);
  const limitRaw = document.querySelector("[data-extract-limit]")?.value || "all";
  const strategy = document.querySelector("[data-extract-strategy]")?.value || "newest";

  return {
    searchRaw,
    searchTokens: tokenizeQuery(searchRaw),
    disciplineVal,
    disciplineFilter: getDisciplineFilter(disciplineVal),
    compVal,
    levelVal,
    langVal,
    formatVal,
    sourceTypeVal,
    visualsVal,
    topicMatchMode,
    yearMinRaw,
    yearMaxRaw,
    yearMin: yearMinRaw ? Number(yearMinRaw) : null,
    yearMax: yearMaxRaw ? Number(yearMaxRaw) : null,
    includeArchived,
    limitRaw,
    strategy
  };
}

function matchesLevelChoice(item, compVal, levelVal) {
  if (!levelVal) return true;
  if (levelVal.startsWith("sub:")) {
    const facet = COMPETITION_LEVEL_FACETS[compVal];
    const opt = facet?.options?.find((o) => o.value === levelVal);
    return opt ? opt.match(item) : true;
  }
  return (item.levels || []).includes(levelVal);
}

function matchesSourceTypeChoice(item, sourceTypeVal) {
  if (!sourceTypeVal) return true;
  if (sourceTypeVal === "official_all") return item._isOfficial;
  if (sourceTypeVal === "third_party_all") return !item._isOfficial;
  return item.sourceType === sourceTypeVal;
}

function matchesItem(item, state, ignoreFacet = null) {
  if (!state.includeArchived && item.archived) return false;
  if (selectedExamKey && getExamKey(item) !== selectedExamKey) return false;

  if (ignoreFacet !== "competition" && state.compVal && item.competitionId !== state.compVal) {
    return false;
  }

  if (
    ignoreFacet !== "level" &&
    !(ignoreFacet === "competition" && state.levelVal.startsWith("sub:")) &&
    state.levelVal &&
    !matchesLevelChoice(item, state.compVal, state.levelVal)
  ) {
    return false;
  }

  if (ignoreFacet !== "language" && state.langVal && (item.language || "it") !== state.langVal) {
    return false;
  }

  if (ignoreFacet !== "format" && state.formatVal && (item.responseFormat || "scelta_multipla") !== state.formatVal) {
    return false;
  }

  if (ignoreFacet !== "years") {
    if (state.yearMin !== null && Number.isFinite(state.yearMin) && item.year < state.yearMin) return false;
    if (state.yearMax !== null && Number.isFinite(state.yearMax) && item.year > state.yearMax) return false;
  }

  if (ignoreFacet !== "discipline" && state.disciplineFilter) {
    if (!itemMatchesDisciplineFilter(item, state.disciplineFilter)) return false;
  }

  if (ignoreFacet !== "sourceType" && state.sourceTypeVal && !matchesSourceTypeChoice(item, state.sourceTypeVal)) {
    return false;
  }

  if (ignoreFacet !== "visuals" && state.visualsVal) {
    if (state.visualsVal === "with_visuals" && !item._hasVisuals) return false;
    if (state.visualsVal === "no_visuals" && item._hasVisuals) return false;
  }

  if (ignoreFacet !== "topics" && selectedTopics.size > 0) {
    const selectedArr = Array.from(selectedTopics);
    const matchesTopic =
      state.topicMatchMode === "and"
        ? selectedArr.every((tid) => item._topics.includes(tid))
        : selectedArr.some((tid) => item._topics.includes(tid));
    if (!matchesTopic) return false;
  }

  if (state.searchTokens.length > 0 && !matchesAllTokens(item._searchIdx, state.searchTokens)) {
    return false;
  }

  return true;
}

function getLevelOptionDisplayLabel(compVal, levelVal) {
  if (!levelVal) return "";
  if (levelVal.startsWith("sub:")) {
    const opt = COMPETITION_LEVEL_FACETS[compVal]?.options?.find((o) => o.value === levelVal);
    return opt?.label || levelVal;
  }
  return cachedLevelMap[levelVal]?.label || levelVal;
}

function syncLevelSelectionForCompetition(compVal) {
  const levelSelect = document.querySelector("[data-filter-level]");
  if (!levelSelect) return;
  const current = pendingLevelVal !== null ? pendingLevelVal : levelSelect.value;
  pendingLevelVal = null;
  if (!current) return;

  const facet = COMPETITION_LEVEL_FACETS[compVal];
  if (facet) {
    if (current.startsWith("sub:") && facet.options.some((o) => o.value === current)) {
      return;
    }
    // Mappatura intelligente quando si sceglie INVALSI dopo aver selezionato 2° o 5° anno
    if (compVal === "invalsi" && (current === "anno_2" || current === "biennio")) {
      pendingLevelVal = "sub:g10";
      return;
    }
    if (compVal === "invalsi" && (current === "anno_5" || current === "triennio")) {
      pendingLevelVal = "sub:g13";
      return;
    }
    levelSelect.value = "";
  } else if (current.startsWith("sub:")) {
    levelSelect.value = "";
  }
}

function renderActiveFilterPills(state) {
  const bar = document.querySelector("[data-active-filters-bar]");
  const mainBadge = document.querySelector("[data-active-filters-count]");
  const extraBadge = document.querySelector("[data-extra-filters-badge]");
  const advBadge = document.querySelector("[data-advanced-filters-badge]");

  const pills = [];
  if (selectedExamKey && examMap.has(selectedExamKey)) {
    pills.push({ key: "exam", label: `Prova: ${examMap.get(selectedExamKey).title}` });
  }
  if (state.searchRaw) {
    pills.push({ key: "search", label: `Testo: "${state.searchRaw}"` });
  }
  if (state.disciplineVal) {
    const discLabel = DISCIPLINE_OPTIONS.find((d) => d.id === state.disciplineVal)?.label?.replace(/^↳\s*/, "") || state.disciplineVal;
    pills.push({ key: "discipline", label: `Disciplina: ${discLabel}` });
  }
  if (state.compVal) {
    pills.push({ key: "competition", label: `Prova: ${cachedCompMap[state.compVal]?.shortName || state.compVal}` });
  }
  if (state.levelVal) {
    const levelPrefix = COMPETITION_LEVEL_FACETS[state.compVal]?.label?.replace(/^🎯\s*/, "") || "Livello";
    pills.push({ key: "level", label: `${levelPrefix}: ${getLevelOptionDisplayLabel(state.compVal, state.levelVal)}` });
  }
  if (state.yearMinRaw || state.yearMaxRaw) {
    const yrLabel =
      state.yearMinRaw && state.yearMaxRaw
        ? state.yearMinRaw === state.yearMaxRaw
          ? state.yearMinRaw
          : `${state.yearMinRaw}–${state.yearMaxRaw}`
        : state.yearMinRaw
          ? `dal ${state.yearMinRaw}`
          : `fino al ${state.yearMaxRaw}`;
    pills.push({ key: "years", label: `Anni: ${yrLabel}` });
  }

  let advancedCount = 0;
  if (state.langVal) {
    advancedCount += 1;
    pills.push({ key: "language", label: `Lingua: ${LANGUAGE_LABELS[state.langVal] || state.langVal}` });
  }
  if (state.formatVal) {
    advancedCount += 1;
    pills.push({ key: "format", label: `Formato: ${FORMAT_LABELS[state.formatVal] || state.formatVal}` });
  }
  if (state.visualsVal) {
    advancedCount += 1;
    const visLabel = VISUALS_FILTER_OPTIONS.find((v) => v.value === state.visualsVal)?.label || state.visualsVal;
    pills.push({ key: "visuals", label: visLabel });
  }
  if (state.sourceTypeVal) {
    advancedCount += 1;
    const srcLabel = SOURCE_TYPE_FILTER_OPTIONS.find((s) => s.value === state.sourceTypeVal)?.label || state.sourceTypeVal;
    pills.push({ key: "sourceType", label: srcLabel });
  }
  if (state.includeArchived) {
    advancedCount += 1;
    pills.push({ key: "archived", label: "Includi archiviati" });
  }

  const totalActiveCount = pills.length + selectedTopics.size;
  const extraActiveCount = selectedTopics.size + advancedCount;

  if (mainBadge) {
    if (totalActiveCount > 0) {
      mainBadge.style.display = "";
      mainBadge.textContent = totalActiveCount === 1 ? "1 filtro attivo" : `${totalActiveCount} filtri attivi`;
    } else {
      mainBadge.style.display = "none";
      mainBadge.textContent = "";
    }
  }

  if (extraBadge) {
    if (extraActiveCount > 0) {
      extraBadge.style.display = "";
      extraBadge.textContent = extraActiveCount === 1 ? "1 attivo" : `${extraActiveCount} attivi`;
    } else {
      extraBadge.style.display = "none";
      extraBadge.textContent = "";
    }
  }

  if (advBadge) {
    if (advancedCount > 0) {
      advBadge.style.display = "";
      advBadge.textContent = advancedCount === 1 ? "1 attivo" : `${advancedCount} attivi`;
    } else {
      advBadge.style.display = "none";
      advBadge.textContent = "";
    }
  }

  if (!bar) return;
  if (pills.length === 0) {
    bar.style.display = "none";
    bar.innerHTML = "";
    return;
  }

  bar.style.display = "";
  bar.innerHTML = `
    <span class="muted"><small><strong>Filtri attivi:</strong></small></span>
    ${pills
      .map(
        (p) => `
          <button type="button" class="catalog-active-filter-pill" data-remove-filter="${escapeHtml(p.key)}" title="Rimuovi questo filtro">
            <span>${escapeHtml(p.label)}</span>
            <span aria-hidden="true">✕</span>
          </button>
        `
      )
      .join("")}
  `;
}

function refreshDynamicFilters() {
  if (!catalog) return;
  const items = catalog.items || [];
  const state = getFilterState();

  // 1. Disciplina / Area (conteggi live rispetto agli altri filtri)
  const disciplineSelect = document.querySelector("[data-filter-discipline]");
  if (disciplineSelect) {
    const discPool = items.filter((it) => matchesItem(it, state, "discipline"));
    const optionsHtml = DISCIPLINE_OPTIONS.map((opt) => {
      const optFilter = {
        areas: opt.areas ? new Set(opt.areas) : null,
        topics: opt.topics ? new Set(opt.topics) : null
      };
      let cnt = 0;
      for (const it of discPool) {
        if (itemMatchesDisciplineFilter(it, optFilter)) {
          cnt += 1;
        }
      }
      if (cnt === 0 && state.disciplineVal !== opt.id) return "";
      return `<option value="${escapeHtml(opt.id)}">${escapeHtml(opt.label)} (${cnt})</option>`;
    })
      .filter(Boolean)
      .join("");
    disciplineSelect.innerHTML = `<option value="">Tutte le discipline (${discPool.length})</option>${optionsHtml}`;
    disciplineSelect.value = state.disciplineVal;
  }

  // 2. Competizione / Test (raggruppati, nasconde quelle con 0 quesiti rispetto agli altri filtri)
  const compSelect = document.querySelector("[data-filter-competition]");
  if (compSelect) {
    const compPool = items.filter((it) => matchesItem(it, state, "competition"));
    const compCounts = {};
    for (const it of compPool) {
      compCounts[it.competitionId] = (compCounts[it.competitionId] || 0) + 1;
    }

    const comps = catalog.competitions || [];
    const groupsHtml = COMPETITION_CATEGORIES.map((cat) => {
      const groupComps = comps.filter((c) => {
        if ((c.category || "scuola_competizioni") !== cat.id) return false;
        const cnt = compCounts[c.id] || 0;
        return cnt > 0 || state.compVal === c.id;
      });
      if (!groupComps.length) return "";
      const opts = groupComps
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.shortName)} (${compCounts[c.id] || 0})</option>`)
        .join("");
      return `<optgroup label="${escapeHtml(cat.label)}">${opts}</optgroup>`;
    })
      .filter(Boolean)
      .join("");

    compSelect.innerHTML = `<option value="">Tutte le prove e competizioni (${compPool.length})</option>${groupsHtml}`;
    compSelect.value = state.compVal;
  }

  // 3. Livello / Fascia DINAMICO (adattato alla competizione selezionata!)
  const levelSelect = document.querySelector("[data-filter-level]");
  const levelLabelEl = document.querySelector("[data-level-label]");
  if (levelSelect) {
    const levelPool = items.filter((it) => matchesItem(it, state, "level"));
    const compFacet = state.compVal ? COMPETITION_LEVEL_FACETS[state.compVal] : null;

    if (compFacet) {
      if (levelLabelEl) levelLabelEl.textContent = compFacet.label;
      const optsHtml = compFacet.options
        .map((opt) => {
          const cnt = levelPool.reduce((acc, it) => acc + (opt.match(it) ? 1 : 0), 0);
          if (cnt === 0 && state.levelVal !== opt.value) return "";
          return `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)} (${cnt})</option>`;
        })
        .filter(Boolean)
        .join("");
      levelSelect.disabled = false;
      levelSelect.innerHTML = `<option value="">${escapeHtml(compFacet.allOption)} (${levelPool.length})</option>${optsHtml}`;
      levelSelect.value = state.levelVal;
      if (levelSelect.value !== state.levelVal) {
        levelSelect.value = "";
      }
    } else if (state.compVal && levelPool.length === 0) {
      if (levelLabelEl) levelLabelEl.textContent = "🎯 Livello / Fascia";
      levelSelect.innerHTML = `<option value="">Nessun quesito catalogato per questa voce</option>`;
      levelSelect.value = "";
      levelSelect.disabled = true;
    } else {
      if (levelLabelEl) levelLabelEl.textContent = "🎯 Livello scolastico / universitario";
      levelSelect.disabled = false;
      const optsHtml = (catalog.levels || [])
        .map((lv) => {
          const cnt = levelPool.reduce((acc, it) => acc + ((it.levels || []).includes(lv.id) ? 1 : 0), 0);
          if (cnt === 0 && state.levelVal !== lv.id) return "";
          return `<option value="${escapeHtml(lv.id)}">${escapeHtml(lv.label)} (${cnt})</option>`;
        })
        .filter(Boolean)
        .join("");
      levelSelect.innerHTML = `<option value="">Tutti i livelli (${levelPool.length})</option>${optsHtml}`;
      levelSelect.value = state.levelVal;
      if (levelSelect.value !== state.levelVal) {
        levelSelect.value = "";
      }
    }
    pendingLevelVal = null;
  }

  // 4. Placeholder intervallo anni adattati all'intervallo reale disponibile
  const minYearInput = document.querySelector("[data-filter-year-min]");
  const maxYearInput = document.querySelector("[data-filter-year-max]");
  if (minYearInput || maxYearInput) {
    const yearPool = items.filter((it) => matchesItem(it, state, "years"));
    let minY = Infinity;
    let maxY = -Infinity;
    for (const it of yearPool) {
      if (Number.isFinite(it.year)) {
        if (it.year < minY) minY = it.year;
        if (it.year > maxY) maxY = it.year;
      }
    }
    if (minYearInput) {
      minYearInput.placeholder = Number.isFinite(minY) ? `Da (${minY})` : "Da";
    }
    if (maxYearInput) {
      maxYearInput.placeholder = Number.isFinite(maxY) ? `A (${maxY})` : "A";
    }
  }

  // 5. Lingua (live)
  const langSelect = document.querySelector("[data-filter-language]");
  if (langSelect) {
    const langPool = items.filter((it) => matchesItem(it, state, "language"));
    const langCounts = {};
    for (const it of langPool) {
      const code = it.language || "it";
      langCounts[code] = (langCounts[code] || 0) + 1;
    }
    const langs = Object.keys(langCounts).sort((a, b) => (a === "it" ? -1 : b === "it" ? 1 : a.localeCompare(b)));
    if (state.langVal && !langs.includes(state.langVal)) langs.push(state.langVal);
    const optsHtml = langs
      .map((code) => `<option value="${escapeHtml(code)}">${escapeHtml(LANGUAGE_LABELS[code] || code.toUpperCase())} (${langCounts[code] || 0})</option>`)
      .join("");
    langSelect.innerHTML = `<option value="">Tutte le lingue (${langPool.length})</option>${optsHtml}`;
    langSelect.value = state.langVal;
  }

  // 6. Formato risposta (live)
  const formatSelect = document.querySelector("[data-filter-format]");
  if (formatSelect) {
    const fmtPool = items.filter((it) => matchesItem(it, state, "format"));
    const fmtCounts = {};
    for (const it of fmtPool) {
      const rf = it.responseFormat || "scelta_multipla";
      fmtCounts[rf] = (fmtCounts[rf] || 0) + 1;
    }
    const fmts = Object.keys(FORMAT_LABELS).filter((k) => (fmtCounts[k] || 0) > 0 || state.formatVal === k);
    const optsHtml = fmts
      .map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(FORMAT_LABELS[k])} (${fmtCounts[k] || 0})</option>`)
      .join("");
    formatSelect.innerHTML = `<option value="">Tutti i formati (${fmtPool.length})</option>${optsHtml}`;
    formatSelect.value = state.formatVal;
  }

  // 7. Grafici / figure (live)
  const visualsSelect = document.querySelector("[data-filter-visuals]");
  if (visualsSelect) {
    const visPool = items.filter((it) => matchesItem(it, state, "visuals"));
    let withVis = 0;
    for (const it of visPool) {
      if (it._hasVisuals) withVis += 1;
    }
    const withoutVis = visPool.length - withVis;
    const visCounts = { with_visuals: withVis, no_visuals: withoutVis };
    const optsHtml = VISUALS_FILTER_OPTIONS.filter((o) => visCounts[o.value] > 0 || state.visualsVal === o.value)
      .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)} (${visCounts[o.value]})</option>`)
      .join("");
    visualsSelect.innerHTML = `<option value="">Tutti i quesiti (${visPool.length})</option>${optsHtml}`;
    visualsSelect.value = state.visualsVal;
  }

  // 8. Ufficialità della fonte (live)
  const sourceSelect = document.querySelector("[data-filter-source-type]");
  if (sourceSelect) {
    const srcPool = items.filter((it) => matchesItem(it, state, "sourceType"));
    const optsHtml = SOURCE_TYPE_FILTER_OPTIONS.map((o) => {
      const cnt = srcPool.reduce((acc, it) => acc + (matchesSourceTypeChoice(it, o.value) ? 1 : 0), 0);
      if (cnt === 0 && state.sourceTypeVal !== o.value) return "";
      return `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)} (${cnt})</option>`;
    })
      .filter(Boolean)
      .join("");
    sourceSelect.innerHTML = `<option value="">Tutte le fonti (${srcPool.length})</option>${optsHtml}`;
    sourceSelect.value = state.sourceTypeVal;
  }

  // 9. Conteggi live degli argomenti + aggiornamento chip/accordion
  const topicPool = items.filter((it) => matchesItem(it, state, "topics"));
  const topicCounts = {};
  for (const it of topicPool) {
    for (const tid of it._topics) {
      topicCounts[tid] = (topicCounts[tid] || 0) + 1;
    }
  }
  liveTopicCounts = topicCounts;
  renderTopicGroups(document.querySelector("[data-topic-search]")?.value || "");

  // 10. Pillole filtri attivi, contatori badge e anteprima quesiti compatibili
  const finalState = getFilterState();
  renderActiveFilterPills(finalState);

  const previewEl = document.querySelector("[data-extract-preview]");
  if (previewEl) {
    const matchedCount = items.reduce((acc, it) => acc + (matchesItem(it, finalState) ? 1 : 0), 0);
    previewEl.textContent = `${matchedCount} ${matchedCount === 1 ? "quesito compatibile" : "quesiti compatibili"} con i filtri attuali`;
  }
}

function populateSelectFilters() {
  const defaultMin = catalog.settings?.defaultMinYear;
  const minYearInput = document.querySelector("[data-filter-year-min]");
  if (defaultMin && minYearInput && !minYearInput.value) {
    minYearInput.value = String(defaultMin);
  }
  refreshDynamicFilters();
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

function renderSelectedCompExams() {
  const mount = document.querySelector("[data-selected-comp-exams]");
  if (!mount || !catalog) return;

  if (!selectedQuickComp) {
    mount.innerHTML = "";
    return;
  }

  const comp = getCompetitionMap()[selectedQuickComp];
  const compLabel = comp?.shortName || selectedQuickComp;
  const yearNum = selectedQuickYear ? Number(selectedQuickYear) : null;

  const matchedExams = examIndex
    .filter((ex) => {
      if (ex.competitionId !== selectedQuickComp) return false;
      if (yearNum && ex.year !== yearNum) return false;
      return true;
    })
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "it"));

  if (!matchedExams.length) {
    mount.innerHTML = "";
    return;
  }

  const labelCount = matchedExams.length === 1 ? "1 prova PDF" : `${matchedExams.length} prove PDF`;
  mount.innerHTML = `
    <div class="catalog-exam-results">
      <div class="catalog-exam-results-head">
        <span>
          <strong>📑 ${labelCount} per ${escapeHtml(compLabel)}${selectedQuickYear ? ` (${escapeHtml(selectedQuickYear)})` : ""}</strong>
          <span class="muted"><small> — apri subito il PDF oppure clicca «Vedi i quesiti»</small></span>
        </span>
        <button type="button" class="btn btn-ghost btn-xs" data-close-selected-exams>✕ Chiudi prove PDF</button>
      </div>
      <div class="catalog-exam-grid">
        ${matchedExams.map(renderExamCardHtml).join("")}
      </div>
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
  const state = getFilterState();
  const discFilter = state.disciplineFilter;
  const hasContextualFilter = Boolean(
    selectedExamKey ||
    state.searchRaw ||
    state.disciplineVal ||
    state.compVal ||
    state.levelVal ||
    state.langVal ||
    state.formatVal ||
    state.sourceTypeVal ||
    state.visualsVal ||
    state.yearMinRaw ||
    state.yearMaxRaw
  );
  const counts = Object.keys(liveTopicCounts).length || hasContextualFilter ? liveTopicCounts : (catalog.stats?.byTopic || {});
  const macroAreas = [...(catalog.macroAreas || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter((area) => !discFilter?.areas || discFilter.areas.has(area.id));

  let visibleTopicCount = 0;
  let visibleAreaCount = 0;

  const groupsHtml = macroAreas
    .map((area) => {
      const areaAliases = MACRO_AREA_ALIASES[area.id] || [];
      const areaSearchText = [area.id, area.label, ...areaAliases].join(" ");

      const matchingTopics = (catalog.topics || []).filter((t) => {
        if (t.macroArea !== area.id) return false;
        if (discFilter?.topics && !discFilter.topics.has(t.id)) return false;
        const cnt = counts[t.id] || 0;
        if (hasContextualFilter && cnt === 0 && !selectedTopics.has(t.id)) return false;
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
    if (tokens.length || hasContextualFilter) {
      summaryEl.textContent = `Mostra / nascondi argomenti disponibili (${visibleTopicCount} argomenti in ${visibleAreaCount} ${visibleAreaCount === 1 ? "area" : "aree"})`;
    } else {
      summaryEl.textContent = `Mostra / nascondi elenco argomenti per disciplina (${totalTopics} argomenti in ${totalAreas} aree)`;
    }
  }

  mount.innerHTML =
    groupsHtml ||
    `<p class="muted">Nessun argomento disponibile${searchQuery ? ` per "${escapeHtml(searchQuery)}"` : ""} con i filtri attualmente selezionati.</p>`;
}

function filterAndExtractItems() {
  const state = getFilterState();
  let matched = (catalog.items || []).filter((item) => matchesItem(item, state));

  const totalMatched = matched.length;
  const limit = state.limitRaw === "all" ? null : Math.max(1, Number(state.limitRaw));

  if (state.strategy === "newest") {
    matched.sort((a, b) => b.year - a.year || a.competitionId.localeCompare(b.competitionId));
    if (limit) matched = matched.slice(0, limit);
  } else if (state.strategy === "oldest") {
    matched.sort((a, b) => a.year - b.year || a.competitionId.localeCompare(b.competitionId));
    if (limit) matched = matched.slice(0, limit);
  } else if (state.strategy === "random_all") {
    matched = shuffleArray(matched);
    if (limit) matched = matched.slice(0, limit);
  } else if (state.strategy === "random_recent") {
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

function hasActiveQuestionSearch() {
  if (manualExtractRequested || selectedExamKey || selectedTopics.size > 0) {
    return true;
  }

  const nonEmptySelectors = [
    "[data-filter-search]",
    "[data-filter-discipline]",
    "[data-filter-competition]",
    "[data-filter-level]",
    "[data-filter-language]",
    "[data-filter-format]",
    "[data-filter-source-type]",
    "[data-filter-visuals]",
    "[data-filter-year-max]"
  ];
  if (nonEmptySelectors.some((sel) => Boolean(document.querySelector(sel)?.value?.trim()))) {
    return true;
  }

  const defaultMin = catalog?.settings?.defaultMinYear ? String(catalog.settings.defaultMinYear) : "";
  const yearMinVal = document.querySelector("[data-filter-year-min]")?.value?.trim() || "";
  if (yearMinVal && yearMinVal !== defaultMin) {
    return true;
  }

  if (document.querySelector("[data-include-archived]")?.checked) {
    return true;
  }

  const limitRaw = document.querySelector("[data-extract-limit]")?.value || "all";
  const strategy = document.querySelector("[data-extract-strategy]")?.value || "newest";
  if (limitRaw !== "all" || strategy !== "newest") {
    return true;
  }

  return false;
}

function renderResults({ resetPagination = true } = {}) {
  const mount = document.querySelector("[data-catalog-results]");
  const counterEl = document.querySelector("[data-results-counter]");
  if (!mount || !catalog) return;

  refreshDynamicFilters();
  renderActiveExamBanner();

  if (!manualExtractRequested && !selectedExamKey) {
    lastDisplayedItems = [];
    visibleLimit = PAGE_SIZE;
    if (counterEl) {
      counterEl.textContent = "In attesa di estrazione";
    }
    mount.innerHTML = `
      <p class="muted" style="margin:0.5rem 0 0;">
        Imposta i filtri desiderati in «Ricerca quesiti per tematiche» e clicca <strong>Estrai</strong> per visualizzare i quesiti.
      </p>
    `;
    return;
  }

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

function formatUrlLabel(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const cleanPath = parsed.pathname.replace(/\/+$/, "");
    if (!cleanPath || cleanPath === "/") return host;
    const shortPath = cleanPath.length > 26 ? `${cleanPath.slice(0, 25)}…` : cleanPath;
    return `${host}${shortPath}`;
  } catch {
    return String(url || "").replace(/^https?:\/\//i, "");
  }
}

function renderCoverageSummary() {
  const mount = document.querySelector("[data-coverage-summary]");
  if (!mount || !catalog) return;

  const comps = catalog.competitions || [];

  const buttonsHtml = COMPETITION_CATEGORIES.map((cat) => {
    const groupComps = comps.filter((c) => (c.category || "scuola_competizioni") === cat.id);
    const groupQuestions = groupComps.reduce((sum, c) => sum + (c.questionCount || 0), 0);
    const isActive = activeCoverageCategory === cat.id;
    const unitLabel = cat.id === "ingresso_universita" ? "percorsi" : "competizioni";

    return `
      <button
        type="button"
        class="catalog-category-btn ${isActive ? "is-active" : ""}"
        data-toggle-coverage-category="${escapeHtml(cat.id)}"
        aria-expanded="${isActive ? "true" : "false"}"
      >
        <span class="catalog-category-btn-title">${escapeHtml(cat.label)}</span>
        <span class="catalog-category-btn-sub">${groupComps.length} ${unitLabel} · ${groupQuestions} quesiti</span>
      </button>
    `;
  }).join("");

  let panelHtml = `
    <p class="muted catalog-category-hint">
      Seleziona uno dei due pulsanti qui sopra per aprire l'elenco delle singole gare o dei test d'ingresso.
    </p>
  `;

  if (activeCoverageCategory) {
    const activeCat = COMPETITION_CATEGORIES.find((cat) => cat.id === activeCoverageCategory);
    const groupComps = comps.filter((c) => (c.category || "scuola_competizioni") === activeCoverageCategory);

    const rowsHtml = groupComps
      .map((c) => {
        const count = c.questionCount || 0;
        const years = c.coveredYears || [];
        const nameCell =
          count > 0
            ? `
              <button type="button" class="catalog-comp-link" data-quick-comp="${escapeHtml(c.id)}" title="Mostra tutti i PDF delle prove di ${escapeHtml(c.shortName)}">
                <strong>${escapeHtml(c.shortName)}</strong>
              </button>
            `
            : `
              <button type="button" class="catalog-comp-link" data-open-overview-item="${escapeHtml(c.id)}" data-open-overview-cat="${escapeHtml(c.category || "scuola_competizioni")}" title="Vai alle regole e ai link ufficiali di ${escapeHtml(c.shortName)}">
                <strong>${escapeHtml(c.shortName)}</strong>
              </button>
            `;

        const yearsHtml = years.length
          ? years
              .map(
                (y) =>
                  `<button type="button" class="topic-chip" data-quick-comp="${escapeHtml(c.id)}" data-quick-year="${y}" title="Mostra i PDF delle prove di ${escapeHtml(c.shortName)} (${y})">${y}</button>`
              )
              .join("")
          : `<button type="button" class="catalog-comp-link" data-open-overview-item="${escapeHtml(c.id)}" data-open-overview-cat="${escapeHtml(c.category || "scuola_competizioni")}"><small>Regole e sito ufficiale ↓</small></button>`;

        return `
          <tr>
            <td>${nameCell}</td>
            <td style="font-family:var(--font-mono); font-weight:700;">${count}</td>
            <td><div class="catalog-topic-chip-list">${yearsHtml}</div></td>
          </tr>
        `;
      })
      .join("");

    panelHtml = `
      <div class="catalog-coverage-panel">
        <div class="catalog-coverage-panel-head">
          <strong>${escapeHtml(activeCat?.label || "")}</strong>
          <button type="button" class="btn btn-ghost btn-xs" data-toggle-coverage-category="${escapeHtml(activeCoverageCategory)}">✕ Chiudi elenco</button>
        </div>
        <div class="catalog-coverage-table-wrap">
          <table class="catalog-coverage-table">
            <thead>
              <tr>
                <th>${activeCoverageCategory === "ingresso_universita" ? "Test / Facoltà" : "Competizione / Prova"}</th>
                <th>Quesiti</th>
                <th>Anni presenti a catalogo</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  mount.innerHTML = `
    <div class="catalog-category-selector" role="group" aria-label="Scegli categoria del catalogo">
      ${buttonsHtml}
    </div>
    ${panelHtml}
  `;
}

function renderCompetitionsOverview() {
  const mount = document.querySelector("[data-competitions-overview]");
  if (!mount || !catalog) return;

  const comps = catalog.competitions || [];
  const categoryDescriptions = {
    scuola_competizioni:
      "Prove nazionali standardizzate, indagini internazionali e olimpiadi/giochi disciplinari per la scuola secondaria di II grado.",
    ingresso_universita:
      "Test di ammissione nazionali, prove d'ateneo, TOLC CISIA, Semestre Filtro e concorsi per le Scuole Universitarie di Eccellenza."
  };

  const renderCard = (c) => {
    const count = c.questionCount || 0;
    const years = (c.coveredYears || []).length ? c.coveredYears.join(", ") : "";
    const linksHtml = (c.officialWebsites || [])
      .map(
        (url) =>
          `<a class="btn btn-ghost btn-xs" href="${escapeHtml(url)}" target="_blank" rel="noopener">🌐 ${escapeHtml(formatUrlLabel(url))}</a>`
      )
      .join("");

    const countBadge =
      count > 0
        ? `<span class="badge">${count} quesiti</span>`
        : `<span class="badge">Scheda informativa</span>`;

    return `
      <article class="card catalog-overview-card" id="copertura-${escapeHtml(c.id)}">
        <div class="catalog-overview-card-head">
          <div>
            <h4 class="catalog-overview-card-title">${escapeHtml(c.name)}</h4>
            <p class="muted catalog-overview-card-org">${escapeHtml(c.organizer)}</p>
          </div>
          ${countBadge}
        </div>

        ${
          c.rules
            ? `
              <div class="catalog-overview-rules">
                <strong>📋 Regole e funzionamento</strong>
                <p>${escapeHtml(c.rules)}</p>
              </div>
            `
            : ""
        }

        <div class="catalog-overview-notes">
          <strong>📚 Nel catalogo${years ? ` (${escapeHtml(years)})` : ""}:</strong>
          <span>${escapeHtml(c.notes || "")}</span>
        </div>

        <div class="catalog-overview-footer">
          <div class="catalog-overview-links">
            <span class="muted"><small><strong>Siti ufficiali:</strong></small></span>
            ${linksHtml}
            ${
              count > 0
                ? `<button type="button" class="btn btn-primary btn-xs no-print" data-quick-comp="${escapeHtml(c.id)}">📑 Vedi prove PDF</button>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  };

  mount.innerHTML = COMPETITION_CATEGORIES.map((cat, idx) => {
    const groupComps = comps.filter((c) => (c.category || "scuola_competizioni") === cat.id);
    if (!groupComps.length) return "";
    const unitLabel = cat.id === "ingresso_universita" ? "percorsi universitari" : "competizioni";

    return `
      <details class="card catalog-collapsible-card catalog-overview-part" data-overview-part="${escapeHtml(cat.id)}">
        <summary class="catalog-collapsible-summary">
          <div>
            <span class="catalog-collapsible-title">Parte ${idx + 1} · ${escapeHtml(cat.label)}</span>
            <p class="muted catalog-collapsible-sub">${escapeHtml(categoryDescriptions[cat.id] || "")}</p>
          </div>
          <div class="catalog-collapsible-meta">
            <span class="badge">${groupComps.length} ${unitLabel}</span>
            <span class="catalog-collapsible-chevron" aria-hidden="true">▾</span>
          </div>
        </summary>
        <div class="catalog-collapsible-body">
          <div class="grid-2">
            ${groupComps.map(renderCard).join("")}
          </div>
        </div>
      </details>
    `;
  }).join("");
}

function buildMarkdownExport(items) {
  const compMap = getCompetitionMap();
  const topicMap = getTopicMap();
  const lines = [`# Selezione da Un comodo catalogo di esercizi (${items.length} quesiti)`, ""];
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

  // Pulisce eventuali filtri tematici residui che nasconderebbero i quesiti della prova selezionata
  [
    "[data-filter-search]",
    "[data-filter-discipline]",
    "[data-filter-competition]",
    "[data-filter-level]",
    "[data-filter-year-min]",
    "[data-filter-year-max]",
    "[data-filter-language]",
    "[data-filter-format]",
    "[data-filter-source-type]",
    "[data-filter-visuals]",
    "[data-topic-search]"
  ].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });

  const limEl = document.querySelector("[data-extract-limit]");
  if (limEl) limEl.value = "all";

  renderSelectedTopicChips();
  renderTopicGroups("");
  renderSelectedCompExams();
  renderResults();
  showToast(`📑 Selezionata prova: ${exam.title} (${exam.questionCount} quesiti)`);
  document.querySelector("#risultati-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindEvents() {
  // --- Filtri principali quesiti (aggiornano solo le opzioni e i conteggi; l'estrazione avviene cliccando "Estrai") ---
  const searchInput = document.querySelector("[data-filter-search]");
  searchInput?.addEventListener("input", () => {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => refreshDynamicFilters(), 150);
  });

  const disciplineSelect = document.querySelector("[data-filter-discipline]");
  disciplineSelect?.addEventListener("change", () => {
    refreshDynamicFilters();
  });

  const compSelect = document.querySelector("[data-filter-competition]");
  compSelect?.addEventListener("change", () => {
    syncLevelSelectionForCompetition(compSelect.value);
    refreshDynamicFilters();
  });

  const handleYearFilterChange = () => {
    refreshDynamicFilters();
  };

  document.querySelector("[data-filter-year-min]")?.addEventListener("input", handleYearFilterChange);
  document.querySelector("[data-filter-year-max]")?.addEventListener("input", handleYearFilterChange);

  const filterRefreshSelectors = [
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

  filterRefreshSelectors.forEach((sel) => {
    const el = document.querySelector(sel);
    el?.addEventListener("input", () => refreshDynamicFilters());
    el?.addEventListener("change", () => refreshDynamicFilters());
  });

  document.querySelector("[data-topic-search]")?.addEventListener("input", (e) => {
    const accordion = document.querySelector(".catalog-topic-accordion");
    if (accordion && e.target.value.trim()) {
      accordion.open = true;
    }
    renderTopicGroups(e.target.value);
  });

  document.addEventListener("click", (event) => {
    const extraToggleBtn = event.target.closest("[data-toggle-extra-filters]");
    if (extraToggleBtn) {
      const panel = document.querySelector("[data-extra-filters-panel]");
      if (panel) {
        const willOpen = panel.hidden;
        panel.hidden = !willOpen;
        extraToggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        extraToggleBtn.classList.toggle("is-open", willOpen);
      }
      return;
    }

    const removeFilterBtn = event.target.closest("[data-remove-filter]");
    if (removeFilterBtn) {
      const key = removeFilterBtn.dataset.removeFilter || "";
      if (key === "exam") {
        selectedExamKey = "";
        manualExtractRequested = false;
        renderSelectedCompExams();
        renderResults();
        return;
      } else if (key === "search") {
        const el = document.querySelector("[data-filter-search]");
        if (el) el.value = "";
      } else if (key === "discipline") {
        const el = document.querySelector("[data-filter-discipline]");
        if (el) el.value = "";
      } else if (key === "competition") {
        const el = document.querySelector("[data-filter-competition]");
        if (el) el.value = "";
        syncLevelSelectionForCompetition("");
      } else if (key === "level") {
        const el = document.querySelector("[data-filter-level]");
        if (el) el.value = "";
      } else if (key === "years") {
        const minEl = document.querySelector("[data-filter-year-min]");
        const maxEl = document.querySelector("[data-filter-year-max]");
        if (minEl) minEl.value = "";
        if (maxEl) maxEl.value = "";
      } else if (key === "language") {
        const el = document.querySelector("[data-filter-language]");
        if (el) el.value = "";
      } else if (key === "format") {
        const el = document.querySelector("[data-filter-format]");
        if (el) el.value = "";
      } else if (key === "visuals") {
        const el = document.querySelector("[data-filter-visuals]");
        if (el) el.value = "";
      } else if (key === "sourceType") {
        const el = document.querySelector("[data-filter-source-type]");
        if (el) el.value = "";
      } else if (key === "archived") {
        const el = document.querySelector("[data-include-archived]");
        if (el) el.checked = false;
      }
      refreshDynamicFilters();
      return;
    }

    const covCatBtn = event.target.closest("[data-toggle-coverage-category]");
    if (covCatBtn) {
      const catId = covCatBtn.dataset.toggleCoverageCategory || "";
      activeCoverageCategory = activeCoverageCategory === catId ? "" : catId;
      renderCoverageSummary();
      return;
    }

    const openOverviewBtn = event.target.closest("[data-open-overview-item]");
    if (openOverviewBtn) {
      const itemId = openOverviewBtn.dataset.openOverviewItem || "";
      const catId = openOverviewBtn.dataset.openOverviewCat || "";
      const partDetails = document.querySelector(`[data-overview-part="${CSS.escape(catId)}"]`);
      if (partDetails) {
        partDetails.open = true;
      }
      document.querySelector(`#copertura-${CSS.escape(itemId)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const closeExamsBtn = event.target.closest("[data-close-selected-exams]");
    if (closeExamsBtn) {
      selectedQuickComp = "";
      selectedQuickYear = "";
      renderSelectedCompExams();
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
      manualExtractRequested = false;
      renderSelectedCompExams();
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
      selectedQuickComp = cid;
      selectedQuickYear = yr;

      const compObj = getCompetitionMap()[cid];
      if (compObj) {
        activeCoverageCategory = compObj.category || "scuola_competizioni";
        renderCoverageSummary();
      }

      // Mostra solo i fascicoli PDF in "Esplora", senza toccare i filtri di "Ricerca quesiti per tematiche" né estrarre quesiti
      renderSelectedCompExams();

      const compLabel = compObj?.shortName || cid;
      const matchingCount = examIndex.filter(
        (ex) => (!cid || ex.competitionId === cid) && (!yr || ex.year === Number(yr))
      ).length;
      showToast(
        `📑 ${matchingCount === 1 ? "1 prova PDF" : `${matchingCount} prove PDF`} per ${compLabel}${yr ? ` (${yr})` : ""}`
      );
      document.querySelector("#esplora-prove-pdf")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      refreshDynamicFilters();
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
      refreshDynamicFilters();
      if (topicBtn.closest("[data-catalog-results]")) {
        showToast("🏷 Filtro argomento aggiornato — clicca «Estrai» per applicarlo ai risultati.");
      }
      return;
    }

    const presetBtn = event.target.closest("[data-year-preset]");
    if (presetBtn) {
      const preset = presetBtn.dataset.yearPreset;
      const minEl = document.querySelector("[data-filter-year-min]");
      const maxEl = document.querySelector("[data-filter-year-max]");
      const currentYear = new Date().getFullYear();
      if (preset === "all") {
        if (minEl) minEl.value = "";
        if (maxEl) maxEl.value = "";
      } else {
        const span = Number(preset);
        if (minEl) minEl.value = String(currentYear - span);
        if (maxEl) maxEl.value = "";
      }
      refreshDynamicFilters();
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
    selectedExamKey = "";
    manualExtractRequested = true;
    renderSelectedCompExams();
    renderResults();
    showToast(
      lastDisplayedItems.length
        ? `✅ Estratti ${lastDisplayedItems.length} ${lastDisplayedItems.length === 1 ? "quesito" : "quesiti"}!`
        : "Nessun quesito trovato con i filtri selezionati."
    );
    document.querySelector("#risultati-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    selectedQuickComp = "";
    selectedQuickYear = "";
    manualExtractRequested = false;
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
    renderSelectedCompExams();
    renderResults();
  });
}

async function initCatalogPage() {
  const resultsMount = document.querySelector("[data-catalog-results]");
  try {
    // Forza la validazione ETag con GitHub Pages (evita che max-age=600 serva il vecchio JSON per 10 minuti dopo un deploy)
    const res = await fetch(resolveRootPath("data/catalogo/catalog-index.json"), { cache: "no-cache" });
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

  prepareCatalogCaches();
  buildExamIndex();
  renderTopStats();
  renderCoverageSummary();
  populateSelectFilters();
  renderSelectedCompExams();
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
