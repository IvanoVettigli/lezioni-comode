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

let catalog = null;
let selectedTopics = new Set();
let lastDisplayedItems = [];
let randomSeedTick = 0;

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

function getLevelMap() {
  return Object.fromEntries((catalog?.levels || []).map((l) => [l.id, l]));
}

function renderTopStats() {
  const mount = document.querySelector("[data-catalog-stats]");
  if (!mount || !catalog) return;

  const total = catalog.stats?.totalQuestions ?? 0;
  const activeComps = (catalog.competitions || []).filter((c) => (c.questionCount || 0) > 0).length;
  const totalComps = (catalog.competitions || []).length;
  const years = catalog.stats?.years || [];
  const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "In avvio";

  mount.innerHTML = `
    <span class="badge badge-exp">📄 ${total} quesiti catalogati</span>
    <span class="badge">🏅 ${activeComps} / ${totalComps} competizioni con quesiti</span>
    <span class="badge">🏷 ${(catalog.topics || []).length} argomenti in tassonomia</span>
    <span class="badge">📅 Anni coperti: ${escapeHtml(yearRange)}</span>
  `;
}

function populateSelectFilters() {
  const compSelect = document.querySelector("[data-filter-competition]");
  const levelSelect = document.querySelector("[data-filter-level]");

  if (compSelect) {
    const options = (catalog.competitions || [])
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}">${escapeHtml(c.shortName)} (${c.questionCount || 0})</option>`
      )
      .join("");
    compSelect.innerHTML = `<option value="">Tutte le competizioni</option>${options}`;
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

  // Applica eventuale defaultMinYear da configurazione (null = tutti gli anni)
  const defaultMin = catalog.settings?.defaultMinYear;
  const minYearInput = document.querySelector("[data-filter-year-min]");
  if (defaultMin && minYearInput && !minYearInput.value) {
    minYearInput.value = String(defaultMin);
  }
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
  if (!mount || !catalog) return;

  const q = normalizeStr(searchQuery.trim());
  const counts = catalog.stats?.byTopic || {};
  const macroAreas = [...(catalog.macroAreas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const groupsHtml = macroAreas
    .map((area) => {
      const matchingTopics = (catalog.topics || []).filter((t) => {
        if (t.macroArea !== area.id) return false;
        if (!q) return true;
        const haystack = normalizeStr([t.id, t.label, ...(t.synonyms || [])].join(" "));
        return haystack.includes(q);
      });

      if (matchingTopics.length === 0) return "";

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
          <h4>${escapeHtml(area.label)}</h4>
          <div class="catalog-topic-chip-list">${chips}</div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  mount.innerHTML = groupsHtml || `<p class="muted">Nessun argomento corrisponde a "${escapeHtml(searchQuery)}".</p>`;
}

function filterAndExtractItems() {
  const searchVal = normalizeStr(document.querySelector("[data-filter-search]")?.value?.trim() || "");
  const compVal = document.querySelector("[data-filter-competition]")?.value || "";
  const levelVal = document.querySelector("[data-filter-level]")?.value || "";
  const sourceTypeVal = document.querySelector("[data-filter-source-type]")?.value || "";
  const visualsVal = document.querySelector("[data-filter-visuals]")?.value || "";
  const yearMinRaw = document.querySelector("[data-filter-year-min]")?.value;
  const yearMaxRaw = document.querySelector("[data-filter-year-max]")?.value;
  const includeArchived = Boolean(document.querySelector("[data-include-archived]")?.checked);
  const limitRaw = document.querySelector("[data-extract-limit]")?.value || "all";
  const strategy = document.querySelector("[data-extract-strategy]")?.value || "newest";

  const yearMin = yearMinRaw ? Number(yearMinRaw) : null;
  const yearMax = yearMaxRaw ? Number(yearMaxRaw) : null;

  const topicMap = getTopicMap();
  const compMap = getCompetitionMap();
  const sourceMeta = catalog.sourceTypeMeta || {};

  let matched = (catalog.items || []).filter((item) => {
    if (!includeArchived && item.archived) return false;
    if (compVal && item.competitionId !== compVal) return false;
    if (levelVal && !(item.levels || []).includes(levelVal)) return false;
    if (yearMin !== null && Number.isFinite(yearMin) && item.year < yearMin) return false;
    if (yearMax !== null && Number.isFinite(yearMax) && item.year > yearMax) return false;

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
      const itemTopics = item.allTopics || [item.primaryTopic, ...(item.secondaryTopics || [])];
      const matchesTopic = Array.from(selectedTopics).some((tid) => itemTopics.includes(tid));
      if (!matchesTopic) return false;
    }

    if (searchVal) {
      const compName = compMap[item.competitionId]?.name || "";
      const topicTexts = (item.allTopics || [])
        .map((tid) => {
          const t = topicMap[tid];
          return t ? `${t.label} ${(t.synonyms || []).join(" ")}` : tid;
        })
        .join(" ");
      const haystack = normalizeStr(
        [
          item.id,
          compName,
          item.edition,
          item.phase,
          item.year,
          item.questionNumber,
          item.originalLevelLabel,
          item.summary,
          item.sourceSite,
          ...(item.keywords || []),
          topicTexts
        ].join(" ")
      );
      if (!haystack.includes(searchVal)) return false;
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
    // Raggruppa per anno decrescente, mescola all'interno di ciascun anno e preleva dai più recenti!
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

function renderResults() {
  const mount = document.querySelector("[data-catalog-results]");
  const counterEl = document.querySelector("[data-results-counter]");
  if (!mount || !catalog) return;

  const { items, totalMatched } = filterAndExtractItems();
  lastDisplayedItems = items;

  if (counterEl) {
    counterEl.textContent =
      items.length === totalMatched
        ? `${totalMatched} quesiti`
        : `Mostrati ${items.length} di ${totalMatched} quesiti trovati`;
  }

  if (items.length === 0) {
    mount.innerHTML = `
      <div class="card">
        <h3>Nessun quesito trovato con i filtri attuali</h3>
        <p class="muted" style="margin-bottom:0;">
          Prova ad allargare i filtri (es. rimuovere un argomento o includere più anni/competizioni). Ricorda che il
          catalogo viene popolato step dopo step: controlla la tabella di copertura in fondo alla pagina!
        </p>
      </div>
    `;
    return;
  }

  const compMap = getCompetitionMap();
  const topicMap = getTopicMap();
  const levelMap = getLevelMap();
  const sourceMeta = catalog.sourceTypeMeta || {};

  mount.innerHTML = items
    .map((item) => {
      const comp = compMap[item.competitionId];
      const st = sourceMeta[item.sourceType] || { badge: item.sourceType, isOfficial: false };
      const sourceBadgeClass = st.isOfficial ? "badge-source-official" : "badge-source-thirdparty";

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

      return `
        <article class="card catalog-item-card">
          <div class="catalog-item-top">
            <div class="catalog-item-badges">
              <span class="badge badge-exp">${escapeHtml(comp?.shortName || item.competitionId)} · ${item.year}</span>
              <span class="badge ${sourceBadgeClass}" title="${escapeHtml(st.description || "")}">${escapeHtml(st.badge)}</span>
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

function renderCoverageSummary() {
  const mount = document.querySelector("[data-coverage-summary]");
  if (!mount || !catalog) return;

  const statusMeta = {
    active: { label: "✅ Attiva", cls: "badge-source-official" },
    pilot: { label: "🧪 Pilota", cls: "badge-exp" },
    planned: { label: "⏳ In arrivo", cls: "" }
  };

  const rows = (catalog.competitions || [])
    .map((c) => {
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
    })
    .join("");

  mount.innerHTML = `
    <table class="catalog-coverage-table">
      <thead>
        <tr>
          <th>Competizione</th>
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
  const lines = [
    `# Selezione dal Catalogo Esercizi (${items.length} quesiti)`,
    ""
  ];
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

function bindEvents() {
  const rerenderSelectors = [
    "[data-filter-search]",
    "[data-filter-competition]",
    "[data-filter-level]",
    "[data-filter-source-type]",
    "[data-filter-visuals]",
    "[data-filter-year-min]",
    "[data-filter-year-max]",
    "[data-include-archived]",
    "[data-extract-limit]",
    "[data-extract-strategy]"
  ];

  rerenderSelectors.forEach((sel) => {
    const el = document.querySelector(sel);
    el?.addEventListener("input", renderResults);
    el?.addEventListener("change", renderResults);
  });

  document.querySelector("[data-topic-search]")?.addEventListener("input", (e) => {
    renderTopicGroups(e.target.value);
  });

  document.addEventListener("click", (event) => {
    const quickCompBtn = event.target.closest("[data-quick-comp]");
    if (quickCompBtn) {
      const cid = quickCompBtn.dataset.quickComp || "";
      const yr = quickCompBtn.dataset.quickYear || "";
      const compEl = document.querySelector("[data-filter-competition]");
      const minEl = document.querySelector("[data-filter-year-min]");
      const maxEl = document.querySelector("[data-filter-year-max]");
      if (compEl) compEl.value = cid;
      if (minEl) minEl.value = yr;
      if (maxEl) maxEl.value = yr;
      renderResults();
      document.querySelector("#risultati-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      if (preset === "all") {
        if (minEl) minEl.value = "";
        if (maxEl) maxEl.value = "";
      } else {
        const span = Number(preset);
        if (minEl) minEl.value = String(currentYear - span);
        if (maxEl) maxEl.value = "";
      }
      renderResults();
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
    ["[data-filter-search]", "[data-filter-year-min]", "[data-filter-year-max]", "[data-topic-search]"].forEach((s) => {
      const el = document.querySelector(s);
      if (el) el.value = "";
    });
    ["[data-filter-competition]", "[data-filter-level]", "[data-filter-source-type]", "[data-filter-visuals]"].forEach((s) => {
      const el = document.querySelector(s);
      if (el) el.value = "";
    });
    const lim = document.querySelector("[data-extract-limit]");
    if (lim) lim.value = "all";
    const strat = document.querySelector("[data-extract-strategy]");
    if (strat) strat.value = "newest";
    const arch = document.querySelector("[data-include-archived]");
    if (arch) arch.checked = false;

    renderSelectedTopicChips();
    renderTopicGroups("");
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

  renderTopStats();
  renderCoverageSummary();
  populateSelectFilters();
  renderSelectedTopicChips();
  renderTopicGroups("");
  renderCompetitionsOverview();
  bindEvents();
  renderResults();
}

window.addEventListener("ivano:ready", initCatalogPage);
