# Stato di Avanzamento — Catalogo di Esercizi

> **Nota per tutti gli agenti AI**: consulta questo file prima di iniziare uno step del Catalogo di Esercizi e aggiornalo sempre al termine dello step completato.
> Strategia approvata dall'utente:
> 1. Catalogo **pubblico** (`catalogo.html`) accessibile anche agli studenti.
> 2. **PDF ufficiali scaricati in locale** in `assets/catalogo-pdf/` (per hosting su GitHub Pages e link stabili) + citazione/URL della fonte originale + chiara distinzione ufficiale vs terzi.
> 3. **Prima le edizioni più recenti** per tutte le competizioni (Step 2–8), poi espansione storica a ritroso (Step 9+).

---

## Riepilogo degli Step

| Step | Descrizione | Stato | Note / Annate coperte |
| --- | --- | --- | --- |
| **Step 1** | Infrastruttura dati, tassonomia argomenti, tool Python (`build_catalog.py`, `validate_catalog.py`), pagina web pubblica `catalogo.html` e dataset pilota con PDF reali scaricati | ✅ Completato (2026-11-20) | 9 quesiti reali pilota (5 Archimede 2025 Biennio + 4 OliFis 1° Livello 2025) con 3 PDF ufficiali hostati in `assets/catalogo-pdf/` |
| **Step 2** | **Prove INVALSI** (Matematica Grado 10 e Grado 13): esempi ufficiali CBT `invalsiopen.it`, fascicoli ufficiali storici, riferimenti `gestinv.it` ed eventuale sezione terzi chiaramente distinta | ✅ Completato (2026-11-20) | **66 quesiti ufficiali INVALSI** (19 Grado 10 / 2° anno doc. 2019-20 + 47 Grado 13 / 5° anno esempi 2021 Licei Scientifici, Istituti Tecnici e Licei non Scientifici/Professionali) con **11 PDF ufficiali** di domande e griglie ospitati in `assets/catalogo-pdf/invalsi/` |
| **Step 3** | **Prove OCSE PISA** (Matematica e Scienze): *Released Items* ufficiali OECD + rapporti/raccolte ufficiali INVALSI Italia | ⬜ Da fare | Priorità: edizioni PISA 2022 / 2018 / 2015 |
| **Step 4** | **Olimpiadi / Giochi della Matematica**: archivio ufficiale UMI (`olimpiadi.dm.unibo.it` — Giochi di Archimede biennio/triennio, Gara di Febbraio; opz. Kangourou / Bocconi) | ⬜ Da fare | Priorità: ultime 4–5 edizioni (es. 2021–2025) |
| **Step 5** | **Olimpiadi della Fisica**: archivio ufficiale AIF (`olifis.it` — 1° Livello e 2° Livello) | ⬜ Da fare | Priorità: ultime 4–5 edizioni |
| **Step 6** | **Olimpiadi / Giochi di Informatica**: OII Selezioni Scolastiche (`olimpiadi-informatica.it` / `training.olinfo.it/scolastiche`) + Bebras Italia (`bebras.it`) | ⬜ Da fare | Priorità: ultime 4–5 edizioni |
| **Step 7** | **Giochi della Chimica (SCI)** (`societachimica.it` + eventuale archivio soluzioni `pianetachimica.it` etichettato terzi) e **Olimpiadi Scienze Naturali (ANISN)** (`olimpiadi.anisn.it`) | ⬜ Da fare | Priorità: ultime 4–5 edizioni |
| **Step 8** | **Olimpiadi / Gare di Robotica** (`campionatidirobotica.it`, `robocupjunior.it`) + script verifica link + QA globale del catalogo | ⬜ Da fare | Regolamenti, sfide progettuali e problemi tecnici recenti |
| **Step 9+** | **Espansione storica a ritroso**: aggiunta progressiva delle edizioni meno recenti per tutte le competizioni | ⬜ Pianificato | Da attivare dopo verifica degli Step 1–8 |

---

## Checklist standard da eseguire alla fine di ogni Step

1. Tutti i PDF scaricati si trovano in `assets/catalogo-pdf/<competition-id>/<anno>/` e sono PDF integri.
2. Ogni quesito inserito in `data/catalogo/sources/<competition-id>.json` ha:
   - `sourceType` corretto (`official_exam`, `official_sample`, `third_party_archive` o `third_party_practice`);
   - `levels` coerenti con `data/catalogo/levels.json`;
   - `primaryTopic` e `secondaryTopics` coerenti con `data/catalogo/topics.json`;
   - `questionNumber`, `questionsPage` (e `solutionsPage` se presente) verificati aprendo effettivamente il PDF con `fitz` (PyMuPDF).
3. Eseguiti con esito positivo:
   - `python tools/build_catalog.py`
   - `python tools/validate_catalog.py`
   - `python tools/validate_project.py`
4. Aggiornata la tabella qui sopra con stato, annate coperte e conteggio quesiti.
5. **Nessun file cancellato e nessun commit/push Git eseguito senza richiesta dell'utente.**
