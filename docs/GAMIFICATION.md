# Sistema di Gamification

Questo documento descrive le regole ufficiali di gamification (EXP, livelli, titoli e trofei), configurate in `data/gamification.json` e gestite dal motore condiviso `assets/js/core/gamification.js`.

---

## 1. Persistenza dei Dati

- **Stato attuale**: tutti i progressi (EXP, esercizi risolti, flashcard completate, compiti di realtà completati, trofei sbloccati, tema scelto) sono salvati in **`localStorage`** sul dispositivo dello studente tramite `assets/js/core/storage.js`.
- **Limitazione nota**: cambiando browser o dispositivo i progressi non si sincronizzano automaticamente; è comunque previsto un pulsante di **Esporta / Importa salvataggio (JSON)** nella pagina `profilo.html`.
- **Evoluzione futura**: `storage.js` è progettato come un adattatore isolato, così in futuro sarà possibile introdurre login utente e salvataggio su server senza riscrivere i motori di gioco o le UDA.

---

## 2. Punti Esperienza (EXP) — Progressione Non Lineare

Il calcolo degli EXP non è lineare, in stile videogioco RPG:

$$\text{EXP}_{\text{esercizio}} = \text{round}(\text{EXP}_{\text{base}}(\text{difficoltà}) \times M_{\text{fascia}}(\text{anno UDA}))$$

### EXP base per difficoltà (configurabili in `data/gamification.json`)

| Difficoltà | Badge | Scopo didattico | EXP Base |
| --- | --- | --- | --- |
| Livello 1 — Facile | `★☆☆` | Introdurre il concetto | `10` |
| Livello 2 — Intermedio | `★★☆` | Verificare se si è davvero capito | `25` |
| Livello 3 — Difficile | `★★★` | Mettersi alla prova e mostrare il proprio valore | `50` |
| Compito di realtà interattivo | `⚡` | Applicare i concetti a uno scenario reale guidato | `80` |
| Set di Flashcard | `🃏` | Ripassare e consolidare tutti i concetti | `20` |

### Moltiplicatore per Fascia / Anno UDA (non lineare)

| Fascia / Anno | Moltiplicatore | Esempio Liv. 1 / 2 / 3 |
| --- | --- | --- |
| Anno 1 (Biennio — Base) | `1.0x` | 10 / 25 / 50 EXP |
| Anno 2 (Biennio — Consolidamento) | `1.4x` | 14 / 35 / 70 EXP |
| Anno 3 (Triennio — Inizio) | `2.0x` | 20 / 50 / 100 EXP |
| Anno 4 (Triennio — Avanzato) | `2.8x` | 28 / 70 / 140 EXP |
| Anno 5 (Maturità / Boss Finale) | `4.0x` | 40 / 100 / 200 EXP |

### Regola Ferrea del Bottone "Mi arrendo!"
- Ogni esercizio offre aiuti progressivi: **`Suggerimento`** → **`Aiutami ancora`** (se ci sono più indizi) → **`Mi arrendo!`**.
- Usare uno o più suggerimenti **non azzera gli EXP**.
- Cliccare su **`Mi arrendo!`** mostra la soluzione completa, ma **assegna 0 EXP** e avvisa lo studente:
  > *"Hai scelto 'Mi arrendo!': non hai ottenuto punti EXP. Per guadagnarli, ricarica la pagina e risolvi di nuovo l'esercizio senza arrenderti!"*
- Nella sessione corrente di quella pagina, l'esercizio marcato come arreso resta bloccato per gli EXP fino al ricaricamento della pagina.

---

## 3. Livelli e Titoli

I livelli salgono con soglie EXP crescenti non linearmente (definite in `data/gamification.json`).

- **Livello 1 (`0 – 149 EXP`) — Seme Deku**:
  > *"Non ha ancora espresso il suo potenziale, ma nessuno può dire quali grandi cose potrà diventare da grande!"*
- **Livelli successivi (2+)**: in `data/gamification.json` sono predisposti dei segnaposto pronti per essere personalizzati progressivamente insieme al docente.

---

## 4. Sistema dei Trofei

Ogni trofeo ha un nome tematico legato agli argomenti della specifica UDA/lezione (definito nei metadati della UDA e registrato in `data/uda-catalog.json`).

### Trofei per Lezione
1. **Trofeo Bronzo (`bronze`)**: sbloccato completando correttamente (con EXP) **tutti gli esercizi di Livello 1 (Facile)** della lezione.
2. **Trofeo Argento (`silver`)**: sbloccato completando correttamente (con EXP) **tutti gli esercizi di Livello 2 (Intermedio)** della lezione.
3. **Trofeo Oro (`gold`)**: sbloccato completando correttamente (con EXP) **tutti gli esercizi di Livello 3 (Difficile)** della lezione.
4. **Trofeo Completamento Lezione (`completion`)**: sbloccato completando l'intera lezione, inclusi tutti gli esercizi, il **compito di realtà interattivo** e le **flashcard**.

### Trofeo di Platino + Titolo Speciale
- **Trofeo di Platino (`platinum`)**: sbloccato automaticamente quando lo studente conquista **tutti i trofei previsti su tutto il sito** (calcolati dinamicamente da `data/uda-catalog.json`).
- Conferisce un **Titolo Speciale** visualizzato nel profilo e nell'HUD di gamification.
