# Le comode lezioni d'Ivano

**Matematica, con elementi di Informatica, e Fisica per le scuole superiori.**

Un progetto didattico interattivo basato sull'apprendimento attraverso i problemi (*Problem-Based Learning*): teoria ridotta all'osso, subito seguita da problemi, compiti di realtà, attività CLIL in inglese, esperimenti a casa, mappe concettuali, flashcard, jingle, fiabe interattive e un sistema di gamification stile RPG (EXP, livelli, titoli e trofei).

---

## Caratteristiche principali

- **Teoria all'osso, tanta pratica**: si impara risolvendo problemi concreti (bollette di luce/acqua/gas, conti deposito, conversioni reali, scenari nerd e otaku).
- **UDA modulari**: ogni Unità Didattica di Apprendimento indica prerequisiti e dipendenze, è divisa in lezioni da ~1 ora e termina con mappa concettuale interattiva, flashcard, verifica simulata, doppio compito di realtà (guidato + gemello autonomo), laboratorio a casa, jingle e fiaba interattiva.
- **CLIL integrato**: almeno un esercizio in inglese in ogni lezione.
- **Aiuti progressivi**: `Suggerimento` → `Aiutami ancora` → `Mi arrendo!` (con blocco EXP se ci si arrende, per incentivare il riprovare in autonomia).
- **Gamification locale**: punti EXP non lineari (crescenti con difficoltà e anno), livelli con titoli (si parte da *Seme Deku*), trofei Bronzo / Argento / Oro per lezione, trofei tematici e Trofeo di Platino finale.
- **Tema scuro di default** con passaggio rapido al tema chiaro.
- **Versione PDF stampabile** per ogni UDA, leggibile sia a colori sia in bianco e nero, con intestazione compilabile (Nome, Cognome, Anno, Classe) per l'uso in classe con la LIM o a casa.
- **Pronto per GitHub Pages**: sito statico puro, scalabile, senza build obbligatorio.

---

## Anteprima in locale

Poiché il sito utilizza ES Modules JavaScript, aprilo tramite il mini-server Python incluso invece di fare doppio clic sui file HTML:

```bash
python tools/serve_local.py
```

Poi apri il browser su `http://localhost:8000`.

---

## Struttura del progetto

| Percorso | Descrizione |
| --- | --- |
| `AGENTS.md` / `CLAUDE.md` | Regole e specifiche lette automaticamente da tutti gli agenti AI |
| `docs/` | Documentazione di riferimento (pedagogia, gamification, architettura, stampa PDF) |
| `data/` | Configurazioni centralizzate (`site-config.json`, `gamification.json`, `uda-catalog.json`) |
| `assets/css/` | Stili condivisi (token tema scuro/chiaro, base, componenti, `print.css`) |
| `assets/js/` | Motori condivisi (storage, tema, gamification, esercizi, flashcard, mappe, fiaba, jingle) |
| `assets/img/`, `assets/audio/` | Risorse grafiche, personaggi della fiaba e tracce jingle condivise |
| `uda/` | Unità Didattiche pubbliche suddivise per materia (`matematica/`, `fisica/`, `informatica/`) |
| `templates/` | Modelli ufficiali per creare nuove UDA e lezioni uniformi |
| `tools/` | Script Python condivisi (anteprima locale, validazione progetto, creazione UDA) |
| `private/` | **Area riservata locale** (verifiche di classe, soluzioni docente, bozze) — ignorata da Git |

---

## Comandi utili

```bash
# Avvia anteprima locale
python tools/serve_local.py

# Valida coerenza del progetto, catalogo UDA e link relativi
python tools/validate_project.py

# Crea lo scaffolding di una nuova UDA partendo dai template ufficiali
python tools/new_uda.py --help
```

---

## Documentazione

- [Pedagogia e Struttura delle UDA](docs/PEDAGOGIA_E_STRUTTURA_UDA.md)
- [Sistema di Gamification](docs/GAMIFICATION.md)
- [Architettura e Librerie Condivise](docs/ARCHITETTURA_E_LIBRERIE.md)
- [Linee Guida Stampa e PDF](docs/STAMPA_E_PDF.md)
