# AGENTS.md — Istruzioni Generali di Progetto

> **LEGGERE OBBLIGATORIAMENTE PRIMA DI QUALSIASI OPERAZIONE.**
> Questo file è la fonte di verità per tutti gli agenti AI (Antigravity, Claude, Codex, Copilot e altri) e per i collaboratori che lavorano al progetto **"Le comode lezioni d'Ivano — Matematica, con elementi di informatica, e Fisica"**.

---

## 1. Regole di Sicurezza Assolute (NON NEGOZIABILI)

1. **MAI CANCELLARE FILE O CARTELLE** senza esplicita approvazione dell'utente.
   - Non eseguire `rm`, `del`, `Remove-Item`, `git rm`, `unlink` o qualsiasi operazione distruttiva senza aver prima chiesto conferma esplicita indicando esattamente quali file verrebbero rimossi.
2. **MAI ESEGUIRE COMMIT O PUSH SU GIT / GITHUB** senza espressa richiesta o autorizzazione dell'utente.
   - Vietato eseguire `git commit`, `git push`, `git tag`, `git reset --hard` di propria iniziativa.
   - È consentito eseguire comandi di sola lettura come `git status` o `git diff` per verifiche.
3. **MAI ESPORRE CONTENUTI PRIVATI**:
   - La cartella `private/` contiene verifiche scritte di classe, soluzioni riservate al docente e bozze locali. È protetta da `.gitignore` e **non deve mai** essere collegata dalle pagine pubbliche del sito né inclusa in commit.
4. **UNIFORMITÀ E RIUSO**:
   - Tutte le UDA devono condividere le stesse librerie, lo stesso design system CSS (`assets/css/`), gli stessi moduli JS (`assets/js/`) e le stesse convenzioni visive e didattiche.
   - Vietato duplicare CSS/JS comuni dentro singole UDA o introdurre nuove librerie esterne senza approvazione dell'utente.

---

## 2. Visione del Progetto e Metodologia Didattica

- **Destinatari**: Studenti delle scuole superiori.
- **Materie**: Matematica, con elementi di Informatica, e Fisica.
- **Filosofia — Teoria all'osso & Apprendimento per Problemi (PBL)**:
  - Niente lunghi capitoli teorici da libro di testo tradizionale.
  - Ogni lezione contiene una **teoria ridotta all'osso** (introduzione minima, concetti chiave e formule indispensabili), per passare subito a **problemi, esercizi e compiti di realtà**.
  - I concetti si scoprono e si approfondiscono **risolvendo problemi concreti** (es.: notazione scientifica tramite conversioni di unità in contesti reali; grandezze fisiche e volume tramite bolletta di acqua e gas; corrente elettrica tramite bolletta della luce; esponenziali tramite conti deposito e investimenti; probabilità tramite scenari realistici).
- **Stile e Tono**:
  - Coinvolgente, chiaro, ironico e accessibile.
  - Ampio uso di riferimenti **nerd e otaku** (*Il Signore degli Anelli*, *Star Wars*, *One Piece*, *Dragon Ball*, *The Legend of Zelda*, videogiochi, fantascienza, anime/manga).
  - Spazio a **battute e giochi di parole** per alleggerire lo studio mantenendo rigore scientifico.
- **Metodo CLIL**:
  - In **ogni lezione** deve essere presente **almeno un esercizio in lingua inglese** (`data-clil="true"`).

Approfondimento: [docs/PEDAGOGIA_E_STRUTTURA_UDA.md](docs/PEDAGOGIA_E_STRUTTURA_UDA.md).

---

## 3. Struttura di una UDA e delle Lezioni

Il sito è organizzato in **UDA (Unità Didattiche di Apprendimento)**, ciascuna divisa in **lezioni da circa 1 ora**.

### Elementi obbligatori all'inizio di ogni UDA
- **Prerequisiti**: competenze iniziali richieste ("Cosa devi saper fare prima di iniziare").
- **Dipendenze da altre UDA**: evidenza chiara delle eventuali UDA che è importante aver già affrontato prima di questa (dichiarate anche in `data/uda-catalog.json`).

### Elementi obbligatori in ogni Lezione (~1 ora)
1. **Teoria all'osso** (breve introduzione essenziale).
2. **Attività interattive** (es. grafici/simulazioni modificabili con slider, visualizzazioni dinamiche).
3. **Esercizi interattivi graduati su 3 livelli di difficoltà** (con simbolo/badge ben visibile accanto al testo):
   - **Livello 1 — Facile (`★☆☆`)**: per introdurre il concetto.
   - **Livello 2 — Intermedio (`★★☆`)**: per verificare se si è davvero capito.
   - **Livello 3 — Difficile (`★★★`)**: per mettersi alla prova e mostrare il proprio valore.
4. **Almeno 1 esercizio CLIL in inglese** per lezione.
5. **Tipologie di risposta supportate**:
   - Risposta digitata (numerica o testuale).
   - Scelta multipla.
   - Vero / Falso.
   - Attività su quaderno/tablet (es. disegno o svolgimento grafico) con auto-conferma data per buona.
   - Verifica immediata della correttezza.
6. **Sistema di aiuti progressivi su ogni esercizio**:
   - Bottone iniziale: **`Suggerimento`**.
   - Se l'esercizio ha più livelli di aiuto, dopo il clic diventa **`Aiutami ancora`** (ripetibile finché restano suggerimenti).
   - All'ultimo passaggio diventa **`Mi arrendo!`** e mostra la soluzione completa.
   - **Regola EXP**: se si clicca su **`Mi arrendo!`**, l'esercizio **NON assegna punti EXP** e mostra un avviso chiaro: per ottenere gli EXP bisogna ricaricare la pagina e risolverlo nuovamente in autonomia.
7. **Flashcard di ripasso** (presenti per lezione/UDA per fissare rapidamente i concetti).

### Elementi obbligatori alla fine di ogni UDA
1. **Mappa concettuale interattiva** (`concept-map.js`).
2. **Flashcard di riepilogo** (`flashcards.js`).
3. **Simulazione di verifica scritta pubblica** (simile alle verifiche proposte in classe; le altre verifiche di classe restano riservate in `private/verifiche/`).
4. **Due compiti di realtà**:
   - **Compito di realtà interattivo (guidato)**: da svolgere sul sito con aiuti passo dopo passo.
   - **Compito di realtà "gemello" (autonomo)**: stessa strategia risolutiva, da svolgere in autonomia dagli studenti e consegnare al docente.
5. **Esperimento / Laboratorio pratico a casa**:
   - Previsto sistematicamente nelle UDA di **Fisica** (es. fluidi → costruire un barometro).
   - Previsto anche in **Matematica** quando possibile (es. numeri → costruire un calendario perpetuo con due cubi/dadi di carta a 6 facce).
6. **Canzone / Jingle dell'UDA**: testo breve e divertente (con battute sugli argomenti trattati) + supporto player audio.
7. **Fiaba interattiva dell'UDA**: storia interattiva basata sul setting e sui protagonisti forniti dall'autore (immagini in `assets/img/fiaba/`).
8. **Versione PDF stampabile dell'UDA**:
   - Intestazione iniziale compilabile (**Nome, Cognome, Anno, Classe**).
   - Impaginazione pulita per seguire in classe dalla LIM o svolgere compiti a casa.
   - Grafici/disegni presenti anche su carta; controlli interattivi/slider nascosti.
   - Perfettamente leggibile **sia a colori sia in bianco e nero**.

---

## 4. Sistema di Gamification (Locale su Dispositivo)

- **Persistenza attuale**: `localStorage` tramite `assets/js/core/storage.js` (architettura a facciata predisposta per futura migrazione a server/login).
- **EXP non lineari**:
  - Esercizi più difficili nella stessa lezione danno più EXP (Liv. 1 < Liv. 2 < Liv. 3).
  - UDA di anni/livelli più avanzati hanno un moltiplicatore EXP crescente (progressione stile RPG).
  - Nessun EXP se si usa `"Mi arrendo!"`.
- **Livelli e Titoli**:
  - Definiti in `data/gamification.json`.
  - Livello 1 (da 0 EXP): **Seme Deku** (*"Non ha ancora espresso il suo potenziale, ma nessuno può dire quali grandi cose potrà diventare da grande!"*). Gli altri titoli verranno definiti progressivamente con l'utente.
- **Trofei**:
  - **Per lezione**:
    - Tutti gli esercizi Facili (Liv. 1) → **Bronzo**
    - Tutti gli esercizi Intermedi (Liv. 2) → **Argento**
    - Tutti gli esercizi Difficili (Liv. 3) → **Oro**
    - Completamento integrale della lezione (esercizi + compito di realtà interattivo + flashcard) → **Trofeo tematico di completamento** (nome legato all'argomento dell'UDA).
  - **Trofeo di Platino + Titolo Speciale**: sbloccato ottenendo **tutti** i trofei previsti nel sito.

Approfondimento: [docs/GAMIFICATION.md](docs/GAMIFICATION.md).

---

## 5. Architettura, UI e Librerie Condivise

- **Hosting**: GitHub Pages (sito statico puro HTML5 / CSS3 / Vanilla ES Modules JS, senza build obbligatorio).
- **Path relativi SEMPRE**: mai usare URL che iniziano con `/` (si rompono su GitHub Pages project sites `https://<user>.github.io/<repo>/`). Usare sempre percorsi relativi (`../../assets/...`) e `data-root` sul tag `<body>`.
- **Tema**:
  - **Tema scuro (Dark Mode)** come default.
  - Toggle sempre accessibile per passare al **Tema chiaro (Light Mode)** con salvataggio locale.
- **Sezione Ringraziamenti**: pagina dedicata `ringraziamenti.html` raggiungibile dalla navigazione globale.
- **Catalogo di Esercizi da Prove Ufficiali e Competizioni**:
  - Pagina pubblica `catalogo.html` consultabile da docente e studenti per cercare ed estrarre quesiti da INVALSI, OCSE PISA, Olimpiadi/Giochi di Matematica, Fisica, Informatica, Chimica, Scienze Naturali e Robotica.
  - Dati modulari in `data/catalogo/` e PDF ufficiali ospitati in locale in `assets/catalogo-pdf/` (con chiara distinzione tra fonti ufficiali e materiali di allenamento di siti terzi).
  - Documentazione e stato di avanzamento multi-step: [docs/CATALOGO_ESERCIZI.md](docs/CATALOGO_ESERCIZI.md) e [docs/CATALOGO_STATO.md](docs/CATALOGO_STATO.md).
  - Dopo ogni modifica al catalogo, eseguire `python tools/build_catalog.py` e `python tools/validate_catalog.py`.
- **Stack approvato** (dettagli in [docs/ARCHITETTURA_E_LIBRERIE.md](docs/ARCHITETTURA_E_LIBRERIE.md)):
  - **Formule matematiche/fisiche**: KaTeX (`0.16.x`).
  - **Grafici statistici / funzioni con slider**: Chart.js (`4.x`) + SVG/Canvas tramite moduli condivisi.
  - **Mappe concettuali, Flashcard, Esercizi, Fiaba, Jingle**: moduli proprietari condivisi in `assets/js/components/`.
- **Mappa delle cartelle principali**:
  - `assets/css/` — Design tokens, base, componenti, foglio stampa `print.css`.
  - `assets/js/core/` — Storage, tema, gamification, shell comune.
  - `assets/js/components/` — Motori condivisi (esercizi, flashcard, mappa, fiaba, jingle).
  - `data/` — Configurazioni JSON (`site-config.json`, `gamification.json`, `uda-catalog.json`).
  - `uda/<materia>/<slug-uda>/` — Singole UDA pubbliche (`matematica`, `fisica`, `informatica`).
  - `templates/` — Template ufficiali HTML/JSON per creare nuove UDA e lezioni uniformi.
  - `tools/` — Script Python condivisi (preview locale, validazione progetto, scaffolding UDA, export PDF).
  - `docs/` — Specifiche dettagliate di pedagogia, gamification, architettura e stampa.
  - `private/` — Area riservata locale (verifiche scritte di classe, soluzioni, bozze) ignorata da Git.

---

## 6. Checklist Operativa per gli Agenti

Prima di creare o modificare una UDA/lezione:
1. Leggi `AGENTS.md` e il documento pertinente in `docs/`.
2. Usa `python tools/new_uda.py` oppure parti dai file in `templates/` per garantire uniformità.
3. Aggiorna `data/uda-catalog.json` quando aggiungi una nuova UDA o nuovi trofei.
4. Non inserire CSS/JS inline duplicati: se serve una nuova funzione riutilizzabile, aggiungila nei moduli condivisi in `assets/`.
5. Verifica coerenza e collegamenti eseguendo `python tools/validate_project.py`.
6. Ricorda: **mai eliminare file** e **mai committare/pushare** senza esplicito consenso dell'utente.
