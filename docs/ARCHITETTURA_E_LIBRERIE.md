# Architettura Software e Librerie Condivise

Questo documento stabilisce le regole tecniche per mantenere il progetto **scalabile, manutenibile, coerente e compatibile al 100% con GitHub Pages**.

---

## 1. Principi di Software Design

1. **Zero duplicazione tra UDA**:
   - Stili, componenti interattivi, logica EXP/trofei, gestione tema e shell di navigazione risiedono esclusivamente in `assets/css/` e `assets/js/`.
   - Una singola UDA contiene solo il proprio markup semantico, i propri contenuti/dati didattici ed eventuali asset esclusivi (es. `uda/.../assets/`).
   - Se durante la creazione di una UDA emerge un nuovo componente riutilizzabile (es. un simulatore di circuito o un grafico parametrico), lo si implementa in `assets/js/components/` così tutte le UDA successive possono riusarlo.
2. **Sito statico puro (Zero-Build)**:
   - HTML5 semantico + CSS3 con Custom Properties (`tokens.css`) + Vanilla JavaScript ES Modules (`type="module"`).
   - Compatibile nativamente con **GitHub Pages** senza dipendere da bundler complessi.
3. **Percorsi sempre relativi (GitHub Pages Safe)**:
   - Su GitHub Pages i siti di progetto vivono spesso su `https://<utente>.github.io/<nome-repo>/`.
   - **Non usare mai** percorsi assoluti come `/assets/css/base.css` o `/index.html`.
   - Usare sempre percorsi relativi (`../../assets/css/base.css`) e dichiarare l'attributo `data-root="..."` sul tag `<body>` (es. `.` nella root, `../../..` dentro `uda/matematica/m01-esempio/`, `../../../..` dentro `uda/matematica/m01-esempio/lezioni/`).
   - Il modulo `site-shell.js` usa `document.body.dataset.root` per risolvere automaticamente tutti i link di navigazione e il caricamento dei file in `data/`.

---

## 2. Stack di Librerie Approvato (UNIFORME PER TUTTE LE UDA)

Per garantire coerenza visiva e tecnica, tutte le UDA usano **solo** questo stack standard:

| Funzione | Libreria / Modulo | Versione / Provenienza | Note |
| --- | --- | --- | --- |
| Formule matematiche e fisiche | **KaTeX** | `0.16.11` (CDN jsDelivr o locale in `assets/vendor/katex/`) | Veloce, leggero, perfetto in stampa PDF e B/N |
| Grafici dati, statistica, funzioni | **Chart.js** | `4.4.7` (CDN jsDelivr o locale in `assets/vendor/chartjs/`) | Configurare sempre colori leggendo le CSS variables del tema corrente |
| Diagrammi geometrici/fisici & Mappe | **SVG nativo** + moduli `assets/js/components/` | Interno | Vettoriale, nitido a qualsiasi zoom e in stampa |
| Esercizi, Hint, Flashcard, Fiaba, Jingle | Moduli interni `assets/js/components/*.js` | Interno | Unico motore per tutto il sito |
| Gamification, Tema, Storage | Moduli interni `assets/js/core/*.js` | Interno | Unica fonte di verità |

> **Divieto di frammentazione**: non mescolare MathJax con KaTeX, non introdurre Bootstrap/Tailwind in una singola UDA, non usare librerie di grafici diverse tra un'UDA e l'altra senza approvazione dell'utente.

---

## 3. Struttura dei Moduli Condivisi

### CSS (`assets/css/`) — Ordine di inclusione fisso
1. `tokens.css` — Palette tema scuro (default `[data-theme="dark"]`) e tema chiaro (`[data-theme="light"]`), tipografia, raggi, ombre, colori semantici e badge difficoltà/trofei.
2. `base.css` — Reset, tipografia di base, griglie responsive, header, footer, accessibilità (`focus-visible`, `sr-only`).
3. `components.css` — Stili di card UDA, prerequisiti, box teoria all'osso, esercizi, hint progressivi, flashcard, mappa concettuale, fiaba interattiva, jingle, barra EXP/livello/trofei.
4. `print.css` — Regole `@media print` caricate in tutte le pagine per garantire PDF impeccabili a colori e in B/N.

### JavaScript (`assets/js/`)
- `core/storage.js` — Facciata `localStorage` con namespace versionato, export/import JSON e predisposizione futura per backend.
- `core/theme.js` — Tema scuro default + toggle tema chiaro + notifica cambio tema (utile per ridisegnare grafici Chart.js).
- `core/gamification.js` — Calcolo EXP non lineare, progressione livelli/titoli, sblocco trofei Bronzo/Argento/Oro/Completamento/Platino, toast di notifica.
- `core/site-shell.js` — Renderizza header condiviso, selettore tema, badge livello/EXP live, breadcrumb e footer (con link a Ringraziamenti e Profilo).
- `components/exercise-engine.js` — Gestisce esercizi `text`, `number`, `multiple-choice`, `true-false`, `notebook` (quaderno/tablet), `step-by-step`, badge difficoltà, badge CLIL, suggerimenti progressivi e blocco EXP su `"Mi arrendo!"`.
- `components/flashcards.js` — Deck flashcard interattive con stato "ripassata" e completamento.
- `components/concept-map.js` — Mappa concettuale SVG interattiva con pannello dettagli sui nodi.
- `components/interactive-story.js` — Motore a scene/scelte per la fiaba interattiva dell'UDA.
- `components/jingle-player.js` — Scheda canzone/jingle con testo formattato e player audio opzionale.
- `main.js` — Entry point unico che inizializza automaticamente tutti i moduli presenti nella pagina.

---

## 4. Convenzione per gli ID Univoci

Per evitare collisioni nei salvataggi `localStorage`:
- **UDA ID**: `<materia-prefix><numero>-<slug>` (es. `mat-01-notazione-scientifica`, `fis-01-grandezze-misura`).
- **Lezione ID**: `<uda-id>-l<numero>` (es. `mat-01-notazione-scientifica-l01`).
- **Esercizio ID**: `<lezione-id>-ex<numero>` (es. `mat-01-notazione-scientifica-l01-ex01`).
- **Flashcard Deck ID**: `<lezione-id>-fc` oppure `<uda-id>-fc`.
- **Compito di realtà interattivo ID**: `<uda-id>-cr-guidato`.
- **Trofeo ID**: `<lezione-id>-bronze`, `<lezione-id>-silver`, `<lezione-id>-gold`, `<lezione-id>-complete`, `site-platinum`.

---

## 5. Strumenti Python Condivisi (`tools/`)

Tutti gli script di supporto vivono in `tools/`:
- `serve_local.py`: server locale per anteprima con ES Modules.
- `validate_project.py`: verifica struttura JSON, catalogo UDA, collegamenti relativi, conformità didattica (prerequisiti, CLIL, livelli di difficoltà) e assenza di riferimenti a `private/`.
- `new_uda.py`: genera una nuova UDA partendo dai template in `templates/` garantendo uniformità.
- Futuri script (es. `export_pdf.py` per generare automaticamente i PDF stampabili in `uda/.../stampa/`) andranno aggiunti nella stessa cartella `tools/` e documentati in `tools/README.md`.
