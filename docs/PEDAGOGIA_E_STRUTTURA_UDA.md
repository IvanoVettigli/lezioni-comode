# Pedagogia e Struttura delle UDA

Questo documento definisce lo standard didattico di **"Le comode lezioni d'Ivano — Matematica, con elementi di Informatica, e Fisica"** per garantire coerenza pedagogica tra tutte le UDA e tra i diversi agenti AI.

---

## 1. Principio Guida: Teoria all'Osso & Apprendimento per Problemi

A differenza dei libri di testo tradizionali, ogni argomento segue questo ritmo:

1. **Aggancio + Teoria all'osso (5–10 minuti)**:
   - Un'introduzione brevissima che chiarisce *di cosa stiamo parlando*, le definizioni minime e le formule indispensabili.
   - Nessuna trattazione enciclopedica: l'approfondimento avviene **facendo**.
2. **Esplorazione interattiva**:
   - Grafici, slider, simulazioni o visualizzazioni che permettono di vedere immediatamente cosa succede variando i parametri (es. spostare il coefficiente angolare, cambiare il tasso d'interesse, modificare pressione/volume).
3. **Problemi, esercizi graduati e compiti di realtà**:
   - I concetti vengono consolidati e approfonditi attraverso problemi concreti.
   - Esempi di collegamento al mondo reale:
     - *Notazione esponenziale e scientifica* → proprietà degli esponenti in breve, poi conversioni di unità di misura e stime reali.
     - *Grandezze fisiche e volume* → lettura della bolletta dell'acqua e del gas.
     - *Corrente elettrica ed energia* → lettura della bolletta della luce.
     - *Funzioni esponenziali* → conti deposito e investimenti in fondi economici.
     - *Probabilità e statistica* → formule essenziali subito seguite da calcoli di probabilità in scenari concreti.
     - *Elementi di informatica* → algoritmi, fogli di calcolo, pseudo-codice / Python per verificare o automatizzare i calcoli di matematica e fisica.

---

## 2. Tono di Voce, Nerd/Otaku & CLIL

- **Cultura Nerd & Otaku**: gli esercizi prendono spesso spunto da opere e universi amatissimi dagli studenti (*Il Signore degli Anelli*, *Star Wars*, *One Piece*, *Dragon Ball*, *The Legend of Zelda*, giochi di ruolo, sci-fi, anime/manga).
- **Ironia e giochi di parole**: benvenute battute leggere, freddure a tema matematico/fisico e commenti simpatici nei feedback e nei jingle, senza mai sacrificare la precisione matematica o fisica dei dati e delle unità di misura.
- **CLIL obbligatorio**: ogni lezione da 1 ora deve contenere **almeno un esercizio in lingua inglese** contrassegnato con `data-clil="true"` (badge `CLIL · EN`), scritto in inglese chiaro e appropriato per studenti delle superiori, con eventuale piccolo glossario tecnico se necessario.

---

## 3. Anatomia Completa di una UDA

Ogni UDA vive nella propria cartella `uda/<materia>/<codice-slug>/` (es. `uda/matematica/m01-numeri-e-notazione/`).

### A. Pagina Principale dell'UDA (`index.html`)
1. **Intestazione UDA**: materia, anno consigliato, durata stimata, badge PDF stampabile.
2. **Box Prerequisiti (OBBLIGATORIO all'inizio)**:
   - **Cosa devi saper fare prima di iniziare** (elenco puntato concreto).
   - **UDA consigliate prima di questa** (link diretti alle UDA propedeutiche con indicazione se sono *indispensabili* o *consigliate*).
3. **Indice delle Lezioni (~1 ora ciascuna)** con avanzamento e trofei Bronzo / Argento / Oro / Completamento.
4. **Sezioni di Chiusura dell'UDA**:
   - **Mappa concettuale interattiva** (riepilogo visivo cliccabile).
   - **Flashcard di ripasso** (ripasso rapido di definizioni, formule e trappole tipiche).
   - **Simulazione di verifica scritta** (versione pubblica di allenamento, strutturata come una vera verifica in classe).
   - **Doppio Compito di Realtà**:
     1. *Compito di realtà interattivo (guidato)*: svolto sul sito con aiuti passo dopo passo, vale per il completamento/EXP.
     2. *Compito di realtà "gemello" (autonomo)*: ricalca la stessa strategia risolutiva ma va svolto in autonomia dagli studenti e consegnato al docente.
   - **Esperimento / Attività pratica a casa**:
     - Sempre presente nelle UDA di **Fisica** (es. fluidi → costruire un barometro casalingo).
     - Presente anche in **Matematica** quando l'argomento si presta (es. numeri → costruire un calendario perpetuo con due cubi/dadi a 6 facce di carta).
   - **Canzone / Jingle dell'UDA**: strofe brevi, orecchiabili e piene di battute per fissare i concetti chiave (+ player audio se disponibile).
   - **Fiaba interattiva dell'UDA**: episodio ambientato nel mondo e con i protagonisti preparati dall'autore (in attesa del lore/immagini ufficiali, predisporre sempre la sezione dedicata).
   - **Versione PDF stampabile**: pulsante per stampare/salvare in PDF e link al PDF pronto in `stampa/`.

### B. Anatomia di una Singola Lezione (~1 ora)
1. Intestazione lezione + durata (~60 min) + progress bar trofei di lezione (Bronzo / Argento / Oro).
2. **Teoria all'osso**: 1–2 schede sintetiche (box formule, esempi lampo).
3. **Laboratorio interattivo**: grafico o widget con slider/controlli per sperimentare.
4. **Batteria di esercizi**:
   - Almeno 1–2 esercizi **Livello 1 — Facile (`★☆☆`)** *(per introdurre)*.
   - Almeno 1–2 esercizi **Livello 2 — Intermedio (`★★☆`)** *(per verificare se abbiamo davvero capito)*.
   - Almeno 1–2 esercizi **Livello 3 — Difficile (`★★★`)** *(per mettersi alla prova e mostrare il proprio valore)*.
   - Di questi, **almeno 1 esercizio CLIL in inglese**.
   - Varietà di formati: risposta digitata, scelta multipla, Vero/Falso, attività su quaderno/tablet (data per buona con auto-conferma).
   - **Ogni esercizio** deve avere i suggerimenti progressivi (`Suggerimento` → `Aiutami ancora` → `Mi arrendo!`) e la soluzione spiegata.
5. **Mini-compito di realtà o collegamento al compito di realtà interattivo** e **Flashcard di lezione**.

---

## 4. Verifiche Pubbliche vs Verifiche Riservate

- **Pubblica (sul sito)**: ogni UDA include **una simulazione di verifica scritta** accessibile agli studenti per esercitarsi (con eventuale griglia di autovalutazione).
- **Riservate (solo in locale)**: tutte le altre verifiche reali, file A/B, recuperi e chiavi di correzione del docente vanno salvati **esclusivamente** in `private/verifiche/` (cartella esclusa da Git).
