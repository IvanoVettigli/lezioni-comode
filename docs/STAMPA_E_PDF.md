# Linee Guida Stampa e Versione PDF delle UDA

Ogni UDA deve avere una **versione PDF stampabile** di qualità editoriale, pensata affinché gli studenti possano:
- stamparla e portarla in classe per seguire mentre il docente proietta il sito sulla **LIM**;
- scriverci direttamente sopra per svolgere gli esercizi in classe o portare a casa i compiti svolti.

---

## 1. Requisiti Obbligatori della Versione Stampabile

1. **Intestazione studente all'inizio dell'UDA**:
   Ogni pagina UDA/lezione include un blocco `.print-header` (visibile solo in stampa) con campi chiari e spaziosi da compilare a penna:
   - **Nome**
   - **Cognome**
   - **Anno scolastico**
   - **Classe**
   - *(opzionale)* Data
2. **Leggibilità a colori E in bianco e nero (B/N)**:
   - In `@media print` lo sfondo diventa **bianco puro (`#ffffff`)** e il testo **nero pieno (`#000000`)** — anche se l'utente stava usando il tema scuro sullo schermo!
   - Non affidarsi mai al solo colore per distinguere informazioni:
     - Difficoltà espressa sempre con **stelle + testo** (`★☆☆ Facile`, `★★☆ Intermedio`, `★★★ Difficile`).
     - Badge CLIL espresso con bordo e testo esplicito (`[CLIL · EN]`).
     - Serie multiple nei grafici distinte anche tramite **tratteggi diversi** (linea continua, tratteggiata, punteggiata) e **simboli/etichette dirette**, così restano leggibili anche su una fotocopia in scala di grigi.
3. **Elementi interattivi vs Stampa**:
   - **Nascosti in stampa** (`.no-print`): navbar, toggle tema, barra gamification/EXP, pulsanti `Verifica`, pulsanti `Suggerimento` / `Mi arrendo!`, soluzioni rivelabili, slider HTML, controlli audio.
   - **Mostrati in stampa** (`.print-only`):
     - Intestazione studente.
     - Riquadri a righe o a quadretti (`.print-answer-box`) sotto gli esercizi aperti/su quaderno, per lasciare spazio reale alla scrittura a mano.
     - Eventuali tabelle/immagini statiche di fallback (`.print-figure-fallback`) al posto di simulazioni o slider che non possono muoversi su carta.
   - **Grafici e disegni**:
     - Gli SVG inline vengono stampati automaticamente in altissima risoluzione vettoriale.
     - I `<canvas>` (es. Chart.js) devono mantenere assi e testi ad alto contrasto o offrire una variante statica chiara in stampa.
   - **Flashcard**: in stampa si espandono in una tabella/elenco ordinato `Concetto | Spiegazione` utile per il ripasso cartaceo.
   - **Mappa concettuale**: essendo in SVG, resta visibile e leggibile su carta.
4. **Impaginazione pulita**:
   - Usare `break-inside: avoid` su card esercizi, box teoria e figure, così un esercizio non viene spezzato male tra una pagina e l'altra.
   - Margini A4 confortevoli (`14mm 14mm 16mm 14mm`) per eventuale rilegatura o raccoglitore ad anelli.

---

## 2. Come Generare e Archiviare il PDF Ufficiale dell'UDA

Ogni UDA ha la sottocartella dedicata:

```text
uda/<materia>/<slug-uda>/stampa/
└── <slug-uda>-stampabile.pdf
```

Modalità supportate:
1. **Stampa diretta dal browser**: ogni UDA ha un pulsante **"Stampa / Salva PDF"** che attiva `window.print()` usando `assets/css/print.css`.
2. **Esportazione automatizzata (opzionale)**: è possibile generare il PDF ufficiale della UDA tramite browser headless (es. Playwright/Chromium con `@media print`) salvandolo nella cartella `stampa/` dell'UDA, in modo che il pulsante **"Scarica PDF"** su GitHub Pages fornisca subito il file pronto.
