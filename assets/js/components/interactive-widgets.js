/**
 * interactive-widgets.js — Widget interattivi riutilizzabili per le UDA e le lezioni.
 *
 * Widget registrati:
 * - [data-widget="cube-calendar"] : Simulatore interattivo del Calendario Perpetuo con 2 cubi (giorni 01–31)
 * - [data-widget="number-forms"]  : Il Camerino dei Numeri (frazione ridotta, fattori primi, decimale, %, retta)
 */

function gcd(a, b) {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function primeFactors(n) {
  const factors = [];
  let v = Math.abs(Math.trunc(n));
  if (v < 2) return factors;
  for (let d = 2; d * d <= v; d += 1) {
    let count = 0;
    while (v % d === 0) {
      v = Math.trunc(v / d);
      count += 1;
    }
    if (count > 0) factors.push({ prime: d, exp: count });
  }
  if (v > 1) factors.push({ prime: v, exp: 1 });
  return factors;
}

function formatFactorization(n) {
  if (n === 0) return "0";
  if (n === 1) return "1";
  const f = primeFactors(n);
  return f
    .map(({ prime, exp }) => (exp > 1 ? `${prime}<sup>${exp}</sup>` : String(prime)))
    .join(" × ");
}

function isTerminatingDenominator(den) {
  let d = den;
  while (d % 2 === 0) d = Math.trunc(d / 2);
  while (d % 5 === 0) d = Math.trunc(d / 5);
  return d === 1;
}

function formatDecimalExact(num, den) {
  if (num === 0) return { text: "0", periodic: false };
  const intPart = Math.trunc(num / den);
  let rem = num % den;
  if (rem === 0) return { text: String(intPart), periodic: false };

  const seen = new Map();
  const digits = [];
  while (rem !== 0 && !seen.has(rem)) {
    seen.set(rem, digits.length);
    rem *= 10;
    digits.push(Math.trunc(rem / den));
    rem %= den;
  }

  if (rem === 0) {
    return { text: `${intPart},${digits.join("")}`, periodic: false };
  }

  const repeatStart = seen.get(rem);
  const nonRep = digits.slice(0, repeatStart).join("");
  const rep = digits.slice(repeatStart).join("");
  return {
    text: `${intPart},${nonRep}<span class="math-overline">${rep}</span>`,
    approx: (num / den).toFixed(4).replace(".", ","),
    periodic: true
  };
}

/* ==========================================================================
   1. SIMULATORE CALENDARIO PERPETUO CON 2 CUBI (01..31)
   Cubo A: 0, 1, 2, 3, 4, 5
   Cubo B: 0, 1, 2, 6(9), 7, 8
   ========================================================================== */
function mountCubeCalendar(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const CUBE_A = [0, 1, 2, 3, 4, 5];
  const CUBE_B = [0, 1, 2, 6, 7, 8];

  function solveDay(day) {
    const tens = Math.floor(day / 10);
    const units = day % 10;
    const matchB = (d) => CUBE_B.includes(d) || d === 9;
    const matchA = (d) => CUBE_A.includes(d);

    // Preferisci Cubo A a sinistra quando possibile, altrimenti scambia i cubi
    if (matchA(tens) && matchB(units)) {
      return {
        leftCube: "Cubo A",
        rightCube: "Cubo B",
        leftDigit: tens,
        rightDigit: units,
        leftFlipped: false,
        rightFlipped: units === 9,
        swapped: false
      };
    }
    return {
      leftCube: "Cubo B",
      rightCube: "Cubo A",
      leftDigit: tens,
      rightDigit: units,
      leftFlipped: tens === 9,
      rightFlipped: false,
      swapped: true
    };
  }

  let currentDay = new Date().getDate();
  if (currentDay < 1 || currentDay > 31) currentDay = 9;

  container.innerHTML = `
    <div class="cube-cal-interactive no-print">
      <div class="cube-cal-header">
        <div>
          <strong>🎲 Simulatore dei due cubi</strong>
          <p class="muted" style="margin:0.2rem 0 0; font-size:0.9rem;">
            Scegli qualsiasi giorno del mese (da 01 a 31) per vedere come orientare i due cubi — attenzione al trucco del 6/9!
          </p>
        </div>
        <div class="cube-cal-nav">
          <button type="button" class="btn" data-cal-prev aria-label="Giorno precedente">− 1</button>
          <span class="badge badge-exp" data-cal-day-badge>Giorno 01</span>
          <button type="button" class="btn" data-cal-next aria-label="Giorno successivo">+ 1</button>
        </div>
      </div>

      <div class="slider-group">
        <div class="slider-control">
          <label for="cube-cal-range">Seleziona il giorno:</label>
          <input id="cube-cal-range" type="range" min="1" max="31" value="${currentDay}" data-cal-range />
        </div>
      </div>

      <div class="cube-cal-stage" data-cal-stage></div>
      <div class="cube-cal-explain" data-cal-explain></div>
    </div>
  `;

  const rangeEl = container.querySelector("[data-cal-range]");
  const badgeEl = container.querySelector("[data-cal-day-badge]");
  const stageEl = container.querySelector("[data-cal-stage]");
  const explainEl = container.querySelector("[data-cal-explain]");

  function render() {
    const dayStr = String(currentDay).padStart(2, "0");
    rangeEl.value = String(currentDay);
    badgeEl.textContent = `Giorno ${dayStr}`;

    const sol = solveDay(currentDay);
    const renderCube = (cubeName, digit, flipped) => `
      <div class="cube-block ${cubeName === "Cubo A" ? "is-cube-a" : "is-cube-b"} ${flipped ? "is-flipped" : ""}">
        <div class="cube-block-tag">${cubeName}</div>
        <div class="cube-face-box">
          <span class="cube-face-digit">${digit}</span>
        </div>
        <div class="cube-block-foot">
          ${flipped ? "🔄 Faccia «6» ruotata di 180°!" : `Faccia «${digit}»`}
        </div>
      </div>
    `;

    stageEl.innerHTML = `
      ${renderCube(sol.leftCube, sol.leftDigit, sol.leftFlipped)}
      ${renderCube(sol.rightCube, sol.rightDigit, sol.rightFlipped)}
    `;

    const notes = [];
    if (sol.swapped) {
      notes.push("Qui hai <strong>scambiato l'ordine dei due cubi</strong> (Cubo B a sinistra, Cubo A a destra)!");
    } else {
      notes.push("Qui basta tenere il <strong>Cubo A a sinistra</strong> e il <strong>Cubo B a destra</strong>.");
    }
    if (sol.rightFlipped || sol.leftFlipped) {
      notes.push("Il trucco geniale entra in azione: la faccia <strong>6</strong> viene capovolta di 180° per mostrare il <strong>9</strong>!");
    }
    if (currentDay === 11 || currentDay === 22) {
      notes.push(`Per mostrare <strong>${dayStr}</strong> serve la stessa cifra su entrambi i cubi!`);
    }
    explainEl.innerHTML = notes.join(" ");
  }

  rangeEl.addEventListener("input", () => {
    currentDay = Number(rangeEl.value);
    render();
  });
  container.querySelector("[data-cal-prev]").addEventListener("click", () => {
    currentDay = currentDay <= 1 ? 31 : currentDay - 1;
    render();
  });
  container.querySelector("[data-cal-next]").addEventListener("click", () => {
    currentDay = currentDay >= 31 ? 1 : currentDay + 1;
    render();
  });

  render();
}

/* ==========================================================================
   2. IL CAMERINO DEI NUMERI (Frazione · Decimale · Percentuale · Fattori · Retta)
   ========================================================================== */
function mountNumberForms(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  let num = 3;
  let den = 4;

  const presets = [
    { label: "1/2", n: 1, d: 2 },
    { label: "3/4", n: 3, d: 4 },
    { label: "2/5", n: 2, d: 5 },
    { label: "1/3", n: 1, d: 3 },
    { label: "5/8", n: 5, d: 8 },
    { label: "12/16", n: 12, d: 16 },
    { label: "7/4", n: 7, d: 4 }
  ];

  container.innerHTML = `
    <div class="nf-widget no-print">
      <div class="nf-presets">
        <span class="muted" style="font-size:0.86rem; font-weight:600;">Prova i classici:</span>
        ${presets
          .map(
            (p) =>
              `<button type="button" class="btn btn-ghost nf-preset-btn" data-nf-n="${p.n}" data-nf-d="${p.d}">${p.label}</button>`
          )
          .join("")}
      </div>

      <div class="slider-group">
        <div class="slider-control">
          <label for="nf-num">Numeratore: <strong data-nf-num-val>3</strong></label>
          <input id="nf-num" type="range" min="0" max="24" value="${num}" data-nf-num />
        </div>
        <div class="slider-control">
          <label for="nf-den">Denominatore: <strong data-nf-den-val>4</strong></label>
          <input id="nf-den" type="range" min="1" max="20" value="${den}" data-nf-den />
        </div>
      </div>

      <div class="nf-cards-grid" data-nf-cards></div>
      <div class="nf-line-box" data-nf-line></div>
    </div>
  `;

  const numInput = container.querySelector("[data-nf-num]");
  const denInput = container.querySelector("[data-nf-den]");
  const numValEl = container.querySelector("[data-nf-num-val]");
  const denValEl = container.querySelector("[data-nf-den-val]");
  const cardsEl = container.querySelector("[data-nf-cards]");
  const lineEl = container.querySelector("[data-nf-line]");

  function render() {
    numValEl.textContent = String(num);
    denValEl.textContent = String(den);

    const g = gcd(num, den);
    const rNum = Math.trunc(num / g);
    const rDen = Math.trunc(den / g);
    const val = num / den;
    const decInfo = formatDecimalExact(rNum, rDen);
    const pctVal = (val * 100);
    const pctStr = Number.isInteger(pctVal)
      ? `${pctVal}%`
      : `${pctVal.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}%`;
    const isFiniteDec = isTerminatingDenominator(rDen);

    const origFracHtml = `<span class="math-frac nf-frac-orig"><span>${num}</span><span>${den}</span></span>`;
    const simpFracHtml =
      rDen === 1
        ? `<span class="nf-frac-simp">${rNum}</span>`
        : `<span class="math-frac nf-frac-simp"><span>${rNum}</span><span>${rDen}</span></span>`;
    const fracDisplayHtml = `${origFracHtml}<span class="nf-arrow" aria-hidden="true">→</span>${simpFracHtml}`;

    const simplifiedNote =
      num === 0
        ? "Zero diviso qualsiasi denominatore (≠ 0) vale sempre 0"
        : g > 1
          ? `Semplificata dividendo numeratore e denominatore per <strong>MCD = ${g}</strong>`
          : "Già ridotta ai minimi termini (MCD = 1)";

    const decHint = decInfo.periodic
      ? `Decimale <strong>periodico</strong> (≈ ${decInfo.approx}): il denominatore ridotto (${rDen}) contiene fattori primi diversi da 2 e 5!`
      : `Decimale <strong>finito</strong>: il denominatore ridotto (${rDen}) usa solo potenze di 2 e/o 5!`;

    cardsEl.innerHTML = `
      <div class="nf-card is-frac">
        <div class="nf-card-label">1. Vestito Frazione</div>
        <div class="nf-card-value">${fracDisplayHtml}</div>
        <div class="nf-card-sub">${simplifiedNote}</div>
      </div>

      <div class="nf-card is-dec">
        <div class="nf-card-label">2. Vestito Decimale</div>
        <div class="nf-card-value">${decInfo.text}</div>
        <div class="nf-card-sub">${decHint}</div>
      </div>

      <div class="nf-card is-pct">
        <div class="nf-card-label">3. Vestito Percentuale</div>
        <div class="nf-card-value">${pctStr}</div>
        <div class="nf-card-sub">
          <div class="nf-bar-track" aria-hidden="true">
            <div class="nf-bar-fill" style="width:${Math.min(100, Math.max(0, pctVal))}%;"></div>
          </div>
          ${pctVal > 100 ? "Supera il 100% (più di un intero!)" : `Equivale a ${pctStr} dell'intero`}
        </div>
      </div>

      <div class="nf-card is-prime">
        <div class="nf-card-label">4. Mattoncini Primi (ridotta)</div>
        <div class="nf-card-value nf-factor-val">${formatFactorization(rNum)} / ${formatFactorization(rDen)}</div>
        <div class="nf-card-sub">
          ${isFiniteDec ? "✅ Solo fattori 2 e 5 al denominatore → decimale finito" : "♾ Altri fattori primi al denominatore → decimale periodico"}
        </div>
      </div>
    `;

    // Retta numerica SVG dinamica
    const maxScale = Math.max(2, Math.ceil(val + 0.25));
    const width = 660;
    const pad = 34;
    const span = width - pad * 2;
    const xPos = pad + (val / maxScale) * span;

    let ticks = "";
    for (let t = 0; t <= maxScale; t += 1) {
      const tx = pad + (t / maxScale) * span;
      ticks += `
        <line x1="${tx}" y1="26" x2="${tx}" y2="44" class="nf-axis-tick" />
        <text x="${tx}" y="62" text-anchor="middle" class="nf-axis-text">${t}</text>
      `;
      if (t < maxScale) {
        const halfX = pad + ((t + 0.5) / maxScale) * span;
        ticks += `<line x1="${halfX}" y1="30" x2="${halfX}" y2="40" class="nf-axis-subtick" />`;
      }
    }

    lineEl.innerHTML = `
      <div class="nf-line-title">📍 Sulla retta numerica: tutti i «vestiti» puntano esattamente allo stesso punto!</div>
      <svg viewBox="0 0 ${width} 74" class="nf-axis-svg" role="img" aria-label="Posizione di ${rNum}/${rDen} sulla retta numerica">
        <line x1="${pad}" y1="35" x2="${width - pad}" y2="35" class="nf-axis-main" />
        ${ticks}
        <circle cx="${xPos.toFixed(1)}" cy="35" r="7" class="nf-axis-dot" />
        <text x="${xPos.toFixed(1)}" y="18" text-anchor="middle" class="nf-axis-val">${rDen === 1 ? rNum : `${rNum}/${rDen}`}</text>
      </svg>
    `;
  }

  numInput.addEventListener("input", () => {
    num = Number(numInput.value);
    render();
  });
  denInput.addEventListener("input", () => {
    den = Number(denInput.value);
    render();
  });
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-nf-n]");
    if (!btn) return;
    num = Number(btn.dataset.nfN);
    den = Number(btn.dataset.nfD);
    numInput.value = String(num);
    denInput.value = String(den);
    render();
  });

  render();
}

/* ==========================================================================
   3. RETTA DEI NUMERI INTERATTIVA (ℕ → ℤ → ℚ con Zoom fluido su √2 → ℝ)
   ========================================================================== */
function mountNumberLineSets(container) {
  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const SQRT2 = Math.SQRT2;
  const PI = Math.PI;

  // stage: 0 = retta vuota, 1 = ℕ, 2 = ℤ, 3 = ℚ, 4 = ℝ
  let stage = 0;
  // zoomExp continuo in [0, 3] => ingrandimento 10^zoomExp (da 1x a 1000x)
  let zoomExp = 0;
  let animRaf = 0;

  container.innerHTML = `
    <div class="nl-widget no-print">
      <div class="nl-buttons" role="group" aria-label="Scegli gli insiemi numerici da aggiungere sulla retta">
        <button type="button" class="btn nl-set-btn" data-nl-stage="1">1. Numeri naturali (ℕ)</button>
        <button type="button" class="btn nl-set-btn" data-nl-stage="2">2. Numeri relativi / interi (ℤ)</button>
        <button type="button" class="btn nl-set-btn" data-nl-stage="3">3. Numeri razionali (ℚ)</button>
        <button type="button" class="btn nl-set-btn" data-nl-stage="4">4. Numeri reali (ℝ)</button>
        <button type="button" class="btn btn-ghost nl-reset-btn" data-nl-stage="0" title="Torna alla retta vuota">↺ Reset</button>
      </div>

      <div class="nl-zoom-bar" data-nl-zoom-bar hidden>
        <div class="nl-zoom-info">
          <strong>🔍 Zoom verso √2:</strong>
          <span class="badge badge-exp" data-nl-zoom-label>1×</span>
        </div>
        <div class="nl-zoom-controls">
          <button type="button" class="btn btn-ghost" data-nl-zoom-out>− Allontana</button>
          <input type="range" min="0" max="300" step="1" value="0" aria-label="Livello di zoom sulla retta" data-nl-zoom-range />
          <button type="button" class="btn" data-nl-zoom-in>+ Avvicina (Zoom)</button>
        </div>
      </div>

      <div class="nl-svg-wrap" data-nl-svg-wrap></div>
      <div class="nl-legend" data-nl-legend></div>
      <div class="nl-caption" data-nl-caption></div>
    </div>
  `;

  const btns = Array.from(container.querySelectorAll("[data-nl-stage]"));
  const zoomBar = container.querySelector("[data-nl-zoom-bar]");
  const zoomLabel = container.querySelector("[data-nl-zoom-label]");
  const zoomRange = container.querySelector("[data-nl-zoom-range]");
  const zoomOutBtn = container.querySelector("[data-nl-zoom-out]");
  const zoomInBtn = container.querySelector("[data-nl-zoom-in]");
  const svgWrap = container.querySelector("[data-nl-svg-wrap]");
  const legendEl = container.querySelector("[data-nl-legend]");
  const captionEl = container.querySelector("[data-nl-caption]");

  function fmtTick(val, decimals) {
    if (Math.abs(val) < 1e-11) return "0";
    if (decimals === 0) return String(Math.round(val)).replace("-", "−");
    return val.toFixed(decimals).replace(".", ",").replace("-", "−");
  }

  function getViewport(z) {
    const halfSpan = 5 / Math.pow(10, z);
    // A z = 0 la vista è centrata su 0 ([-5, +5]); da z >= 0.65 in poi √2 resta
    // inchiodato ESATTAMENTE al centro dello schermo mentre tacche e razionali si allargano attorno!
    const u = Math.min(1, Math.max(0, z / 0.65));
    const ease = u * u * (3 - 2 * u);
    const center = SQRT2 * ease;
    const min = center - halfSpan;
    const max = center + halfSpan;
    const spanVal = max - min;

    const rawStep = spanVal / 8;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / pow10;
    const majorStep =
      (norm <= 1.3 ? 1 : norm <= 2.6 ? 2 : norm <= 5.5 ? 5 : 10) * pow10;
    const decimals = Math.max(0, -Math.floor(Math.log10(majorStep) + 1e-9));

    return { min, max, spanVal, halfSpan, center, majorStep, qStep: majorStep / 4, decimals };
  }

  function animateZoomTo(targetZ) {
    if (animRaf) cancelAnimationFrame(animRaf);
    const startZ = zoomExp;
    const clampedTarget = Math.min(3, Math.max(0, targetZ));
    if (Math.abs(clampedTarget - startZ) < 1e-4) {
      zoomExp = clampedTarget;
      render();
      return;
    }

    const duration = 420;
    const startTime = performance.now();
    function step(now) {
      const p = Math.min(1, (now - startTime) / duration);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      zoomExp = startZ + (clampedTarget - startZ) * eased;
      render();
      if (p < 1) {
        animRaf = requestAnimationFrame(step);
      } else {
        zoomExp = clampedTarget;
        animRaf = 0;
        render();
      }
    }
    animRaf = requestAnimationFrame(step);
  }

  function render() {
    btns.forEach((b) => {
      const s = Number(b.dataset.nlStage);
      if (s === 0) return;
      b.classList.toggle("is-active", stage === s);
      b.classList.toggle("is-included", stage > s);
      b.setAttribute("aria-pressed", stage >= s ? "true" : "false");
    });

    const showZoom = stage >= 3;
    zoomBar.hidden = !showZoom;
    if (!showZoom) {
      if (animRaf) {
        cancelAnimationFrame(animRaf);
        animRaf = 0;
      }
      zoomExp = 0;
    }

    const vp = getViewport(zoomExp);
    const mag = Math.round(Math.pow(10, zoomExp));
    zoomRange.value = String(Math.round(zoomExp * 100));
    zoomLabel.textContent = `${mag}× (vista ${fmtTick(vp.min, Math.min(4, vp.decimals + (zoomExp >= 2.8 ? 1 : 0)))} … ${fmtTick(vp.max, Math.min(4, vp.decimals + (zoomExp >= 2.8 ? 1 : 0)))})`;
    zoomOutBtn.disabled = zoomExp <= 0.01;
    zoomInBtn.disabled = zoomExp >= 2.99;

    const width = 720;
    const height = 166;
    const pad = 44;
    const axisY = 86;
    const span = width - pad * 2;
    const mapX = (v) => pad + ((v - vp.min) / vp.spanVal) * span;

    let layers = "";

    // 1. Retta di base (tratteggiata finché non arrivano i Reali ℝ!)
    if (stage === 4) {
      layers += `<line x1="${pad - 16}" y1="${axisY}" x2="${width - pad + 16}" y2="${axisY}" class="nl-axis-real-glow" />`;
      layers += `<line x1="${pad - 16}" y1="${axisY}" x2="${width - pad + 16}" y2="${axisY}" class="nl-axis-real" />`;
    } else {
      layers += `<line x1="${pad - 16}" y1="${axisY}" x2="${width - pad + 16}" y2="${axisY}" class="nl-axis-guide" />`;
    }
    layers += `<polygon points="${width - pad + 22},${axisY} ${width - pad + 11},${axisY - 5} ${width - pad + 11},${axisY + 5}" class="nl-axis-arrow" />`;
    layers += `<polygon points="${pad - 22},${axisY} ${pad - 11},${axisY - 5} ${pad - 11},${axisY + 5}" class="nl-axis-arrow" />`;

    // Riquadro di anteprima zoom centrato su √2 (visibile solo vicino a 1×, con etichetta SOTTO per zero sovrapposizioni!)
    if (stage >= 3 && zoomExp < 0.25) {
      const boxMin = SQRT2 - 0.5;
      const boxMax = SQRT2 + 0.5;
      const bx1 = mapX(boxMin);
      const bx2 = mapX(boxMax);
      layers += `
        <rect x="${bx1.toFixed(1)}" y="${axisY - 22}" width="${(bx2 - bx1).toFixed(1)}" height="44" rx="8" class="nl-zoom-box" />
        <text x="${((bx1 + bx2) / 2).toFixed(1)}" y="${axisY + 54}" text-anchor="middle" class="nl-zoom-box-lbl">🔍 Zona zoom</text>
      `;
    }

    // 2. Tacche di scala dinamiche
    if (stage === 0) {
      const x0 = mapX(0);
      layers += `
        <line x1="${x0.toFixed(1)}" y1="${axisY - 7}" x2="${x0.toFixed(1)}" y2="${axisY + 7}" class="nl-tick" />
        <text x="${x0.toFixed(1)}" y="${axisY + 30}" text-anchor="middle" class="nl-tick-lbl">0</text>
      `;
    } else {
      const firstIdx = Math.ceil((vp.min - 1e-11) / vp.majorStep);
      const lastIdx = Math.floor((vp.max + 1e-11) / vp.majorStep);
      for (let i = firstIdx; i <= lastIdx; i += 1) {
        const v = i * vp.majorStep;
        if (stage === 1 && v < -1e-9) continue;
        const x = mapX(v);
        if (x < pad - 6 || x > width - pad + 6) continue;
        layers += `
          <line x1="${x.toFixed(1)}" y1="${axisY - 7}" x2="${x.toFixed(1)}" y2="${axisY + 7}" class="nl-tick" />
          <text x="${x.toFixed(1)}" y="${axisY + 30}" text-anchor="middle" class="nl-tick-lbl">${fmtTick(v, vp.decimals)}</text>
        `;
      }
    }

    // 3. Strato Numeri Razionali (ℚ)
    if (stage >= 3) {
      const qFirst = Math.ceil((vp.min - 1e-11) / vp.qStep);
      const qLast = Math.floor((vp.max + 1e-11) / vp.qStep);
      for (let i = qFirst; i <= qLast; i += 1) {
        const v = i * vp.qStep;
        const x = mapX(v);
        if (x < pad - 4 || x > width - pad + 4) continue;
        // A zoom basso evita di coprire i punti interi già disegnati sopra
        if (Math.abs(v - Math.round(v)) < 1e-9 && v >= -5 && v <= 5) continue;
        // Lascia respiro attorno al buco di √2 quando siamo in ℚ
        if (stage === 3 && Math.abs(x - mapX(SQRT2)) < 9) continue;
        layers += `<circle cx="${x.toFixed(1)}" cy="${axisY}" r="${zoomExp < 0.3 ? 3.2 : 3.6}" class="nl-dot-q" />`;
      }

      if (zoomExp < 0.15) {
        const qLabels = [
          { v: -2.5, txt: "−5/2" },
          { v: -0.5, txt: "−1/2" },
          { v: 0.5, txt: "1/2" },
          { v: 2.5, txt: "5/2" }
        ];
        qLabels.forEach(({ v, txt }) => {
          const x = mapX(v);
          layers += `<text x="${x.toFixed(1)}" y="${axisY - 14}" text-anchor="middle" class="nl-q-lbl">${txt}</text>`;
        });
      }
    }

    // 4. Strato Numeri Naturali (ℕ) e Relativi negativi (ℤ⁻)
    if (stage >= 1) {
      const intMin = Math.max(-5, Math.ceil(vp.min - 1e-9));
      const intMax = Math.min(5, Math.floor(vp.max + 1e-9));
      for (let v = intMin; v <= intMax; v += 1) {
        if (v < 0 && stage < 2) continue;
        const x = mapX(v);
        const cls = v >= 0 ? "nl-dot-n" : "nl-dot-z";
        layers += `<circle cx="${x.toFixed(1)}" cy="${axisY}" r="6.2" class="${cls}" />`;
      }
    }

    // 5. Buchi in ℚ vs Punti riempiti in ℝ (√2 resta fisso al centro dallo zoom 10× a 1000×!)
    if (stage >= 3) {
      const specials = [
        { v: SQRT2, name: "√2", detail: "√2 ≈ 1,41421…" },
        { v: PI, name: "π", detail: "π ≈ 3,14159…" }
      ];
      specials.forEach((sp) => {
        if (sp.v < vp.min || sp.v > vp.max) return;
        const x = mapX(sp.v);
        if (stage === 3) {
          const tag = zoomExp >= 0.6 ? `buco: ${sp.detail}` : `buco: ${sp.name}`;
          layers += `
            <circle cx="${x.toFixed(1)}" cy="${axisY}" r="${zoomExp >= 0.6 ? 8 : 6.8}" class="nl-hole-ring" />
            <line x1="${x.toFixed(1)}" y1="${axisY - 11}" x2="${x.toFixed(1)}" y2="${axisY - 34}" class="nl-hole-stem" />
            <text x="${x.toFixed(1)}" y="${axisY - 40}" text-anchor="middle" class="nl-hole-lbl">${tag}</text>
          `;
        } else {
          const tag = zoomExp >= 0.6 ? `${sp.detail} ∈ ℝ ✓` : `${sp.name} ∈ ℝ`;
          layers += `
            <circle cx="${x.toFixed(1)}" cy="${axisY}" r="${zoomExp >= 0.6 ? 7.5 : 6.5}" class="nl-dot-r" />
            <line x1="${x.toFixed(1)}" y1="${axisY - 10}" x2="${x.toFixed(1)}" y2="${axisY - 32}" class="nl-real-stem" />
            <text x="${x.toFixed(1)}" y="${axisY - 38}" text-anchor="middle" class="nl-real-lbl">${tag}</text>
          `;
        }
      });
    }

    svgWrap.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="nl-svg" role="img" aria-label="Retta dei numeri interattiva">
        ${layers}
      </svg>
    `;

    // Legenda dinamica
    const legendItems = [];
    if (stage >= 1) legendItems.push(`<span><i class="nl-swatch is-n"></i> Naturali (ℕ)</span>`);
    if (stage >= 2) legendItems.push(`<span><i class="nl-swatch is-z"></i> Interi negativi (ℤ)</span>`);
    if (stage >= 3) legendItems.push(`<span><i class="nl-swatch is-q"></i> Razionali / Frazioni (ℚ)</span>`);
    if (stage === 3) legendItems.push(`<span><i class="nl-swatch is-hole"></i> «Buchi» irrazionali (es. √2, π)</span>`);
    if (stage === 4) legendItems.push(`<span><i class="nl-swatch is-r"></i> Retta continua completa: Reali (ℝ)</span>`);
    legendEl.innerHTML = legendItems.join("");

    // Spiegazione narrativa passo passo
    if (stage === 0) {
      captionEl.innerHTML =
        "Questa è una <strong>retta vuota</strong>. Premi i pulsanti qui sopra in ordine (da 1 a 4) per vedere come, insieme dopo insieme, l'umanità ha riempito la retta dei numeri!";
    } else if (stage === 1) {
      captionEl.innerHTML =
        "<strong>1. Numeri naturali (ℕ):</strong> <code>0, 1, 2, 3, 4, 5…</code> Sono i numeri per contare. Sulla retta sono come pietre ben separate su un sentiero, solo dallo zero verso destra.";
    } else if (stage === 2) {
      captionEl.innerHTML =
        "<strong>2. Numeri relativi / interi (ℤ):</strong> aggiungiamo i numeri negativi <code>−1, −2, −3…</code> a sinistra dello zero! Ora possiamo scendere sotto zero (temperature, debiti, piani interrati), ma tra un intero e l'altro ci sono ancora enormi spazi vuoti.";
    } else if (stage === 3) {
      const zoomMsg =
        zoomExp < 0.5
          ? "Premi <strong>+ Avvicina (Zoom)</strong> o trascina lo slider: la vista si stringerà attorno a <code>√2</code>!"
          : zoomExp < 1.5
            ? "Guarda: <code>√2</code> ora è fermo al centro e attorno compaiono decimi e centesimi sempre più fitti — avvicina ancora!"
            : zoomExp < 2.5
              ? "Puoi sempre trovare un numero razionale vicinissimo a un altro (<code>1,41</code>, <code>1,414</code>, <code>1,415</code>…), ma quel buco al centro resta!"
              : "Anche a <strong>1000×</strong> di zoom spuntano infiniti razionali vicinissimi, eppure il buco in <code>√2 ≈ 1,414213…</code> non si chiude! Premi <strong>4. Numeri reali (ℝ)</strong> per riempirlo.";
      captionEl.innerHTML =
        `<strong>3. Numeri razionali (ℚ):</strong> aggiungiamo tutte le frazioni! Sono <strong>davvero tantissimi</strong>: vicino a qualunque razionale ce n'è sempre un altro, ma restano dei «buchi». <em>${zoomMsg}</em>`;
    } else {
      captionEl.innerHTML =
        "<strong>4. Numeri reali (ℝ):</strong> aggiungendo i numeri irrazionali (come <code>√2</code> e <code>π</code>) <strong>tutti i buchi scompaiono</strong>! Ora la retta è una linea continua e completa. Prova a cliccare avanti e indietro tra <strong>ℚ</strong> e <strong>ℝ</strong> tenendo lo zoom al massimo!";
    }
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextStage = Number(btn.dataset.nlStage);
      stage = nextStage;
      if (stage < 3) zoomExp = 0;
      render();
    });
  });

  zoomRange.addEventListener("input", () => {
    if (animRaf) {
      cancelAnimationFrame(animRaf);
      animRaf = 0;
    }
    zoomExp = Number(zoomRange.value) / 100;
    render();
  });
  zoomOutBtn.addEventListener("click", () => {
    const target = Math.max(0, Math.ceil(zoomExp - 0.05) - 1);
    animateZoomTo(target);
  });
  zoomInBtn.addEventListener("click", () => {
    const target = Math.min(3, Math.floor(zoomExp + 0.05) + 1);
    animateZoomTo(target);
  });

  render();
}

export function initInteractiveWidgets() {
  document.querySelectorAll('[data-widget="cube-calendar"]').forEach(mountCubeCalendar);
  document.querySelectorAll('[data-widget="number-forms"]').forEach(mountNumberForms);
  document.querySelectorAll('[data-widget="number-line-sets"]').forEach(mountNumberLineSets);
}
