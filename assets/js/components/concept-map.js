/**
 * concept-map.js — Mappa concettuale interattiva in SVG
 * Vettoriale: nitida sullo schermo, cliccabile sui nodi e leggibile anche in stampa PDF / B&N.
 */

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mountConceptMap(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const cfgScript = container.querySelector("script[data-concept-map-config]");
  if (!cfgScript) return;

  let data;
  try {
    data = JSON.parse(cfgScript.textContent || "{}");
  } catch (err) {
    console.error("[concept-map] JSON non valido:", err);
    return;
  }

  const width = data.width || 800;
  const height = data.height || 360;
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const edgesSvg = edges
    .map((edge) => {
      const from = nodeById[edge.from];
      const to = nodeById[edge.to];
      if (!from || !to) return "";
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      return `
        <line class="concept-map-edge" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />
        ${
          edge.label
            ? `<text x="${mx}" y="${my - 6}" text-anchor="middle" font-size="11" fill="currentColor">${escapeHtml(edge.label)}</text>`
            : ""
        }
      `;
    })
    .join("");

  const nodesSvg = nodes
    .map((node) => {
      const w = node.w || 160;
      const h = node.h || 48;
      return `
        <g class="concept-map-node" data-node-id="${escapeHtml(node.id)}" tabindex="0" role="button" aria-label="${escapeHtml(node.label)}">
          <rect x="${node.x - w / 2}" y="${node.y - h / 2}" width="${w}" height="${h}" />
          <text x="${node.x}" y="${node.y + 4}" text-anchor="middle">${escapeHtml(node.label)}</text>
        </g>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="concept-map-box">
      <div class="exercise-header">
        <h3 class="exercise-title">🗺 Mappa concettuale interattiva</h3>
        <span class="muted no-print">Clicca su un nodo per leggere il riepilogo</span>
      </div>
      <svg class="concept-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(data.title || "Mappa concettuale")}">
        ${edgesSvg}
        ${nodesSvg}
      </svg>
      <div class="concept-map-detail no-print" data-cm-detail>
        Seleziona un nodo della mappa per visualizzare definizione, formula o esempio rapido.
      </div>
    </div>
  `;

  const detailEl = container.querySelector("[data-cm-detail]");
  const nodeEls = container.querySelectorAll("[data-node-id]");

  function selectNode(nodeId) {
    const node = nodeById[nodeId];
    if (!node) return;
    nodeEls.forEach((el) => el.classList.toggle("is-active", el.dataset.nodeId === nodeId));
    detailEl.innerHTML = `<strong>${escapeHtml(node.label)}:</strong> ${node.detail || "Nessun dettaglio aggiuntivo."}`;
  }

  nodeEls.forEach((el) => {
    el.addEventListener("click", () => selectNode(el.dataset.nodeId));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectNode(el.dataset.nodeId);
      }
    });
  });

  if (nodes[0]) {
    selectNode(nodes[0].id);
  }
}

export function initConceptMaps() {
  document.querySelectorAll("[data-concept-map]").forEach(mountConceptMap);
}
