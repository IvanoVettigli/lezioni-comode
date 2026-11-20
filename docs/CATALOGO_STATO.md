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
| **Step 3** | **Prove OCSE PISA** (Matematica e Scienze): *Released Items* ufficiali OECD + rapporti/raccolte ufficiali INVALSI Italia | ✅ Completato (2026-11-20) | **32 quesiti ufficiali OCSE PISA in italiano** (15 Matematica 2022 incluse 2 prove su foglio di calcolo, 7 Financial Literacy 2022, 8 Scienze 2006, 2 Matematica 2006) con **5 PDF ufficiali INVALSI** in `assets/catalogo-pdf/ocse-pisa/` |
| **Step 4** | **Olimpiadi / Giochi della Matematica**: archivio ufficiale UMI (`olimpiadi.dm.unibo.it` — Giochi di Archimede biennio/triennio, Gara di Febbraio; opz. Kangourou / Bocconi) | ✅ Completato (2026-11-20) | **113 quesiti ufficiali UMI** (Giochi di Archimede 2025, 2024 e 2023 completi Biennio + Triennio + Gara di Febbraio 2025 completa) con **10 PDF ufficiali** di testi e soluzioni in `assets/catalogo-pdf/olimpiadi-matematica/` |
| **Step 5** | **Olimpiadi della Fisica**: archivio ufficiale AIF (`olifis.it` — 1° Livello e 2° Livello) | ✅ Completato (2026-11-20) | **122 quesiti e problemi ufficiali AIF** (1° Livello Dicembre 2025 e 2024 completi [80 quesiti] + 2° Livello 2026, 2025 e 2024 completi [30 quesiti + 12 problemi analitici]) con **10 PDF ufficiali** in `assets/catalogo-pdf/olimpiadi-fisica/` |
| **Step 6** | **Olimpiadi / Giochi di Informatica**: OII Selezioni Scolastiche (`olimpiadi-informatica.it` / `training.olinfo.it/scolastiche`) + Bebras (`castoro-informatico.ch` in italiano) | ✅ Completato (2026-11-20) | **85 quesiti ufficiali in italiano** (40 Selezioni Scolastiche OII 2022 e 2021 + 45 quesiti unici Bebras / Castoro Informatico 2025 e 2024 Biennio e Triennio) con **6 PDF ufficiali** completi di soluzioni in `assets/catalogo-pdf/olimpiadi-informatica/` |
| **Step 7** | **Giochi della Chimica (SCI)** (`societachimica.it` + griglie `pianetachimica.it`) e **Olimpiadi Scienze Naturali** (`ibo-info.org` + `useso.org` per IESO; `olimpiadi.anisn.it` offline in timeout) | ✅ Completato (2026-11-20) | **209 quesiti unici ufficiali SCI Chimica** (2026 Istituto + Regionale Classi A/B/C + 2025 Istituto Classi A/B/C, **12 PDF**) + **114 quesiti ufficiali Scienze Naturali CLIL** (64 Scienze della Terra USESO/IESO 2026–2025 + 50 Biologia IBO 2020, **8 PDF**) |
| **Step 8** | **Olimpiadi / Gare di Robotica** (`campionatidirobotica.it`, `robocupjra.it`, `junior.robocup.org`) + script verifica link `tools/check_catalog_links.py` + QA globale | ✅ Completato (2026-11-20) | **24 sfide progettuali e specifiche tecniche ufficiali** 2024–2026 (**6 PDF**) + `tools/check_catalog_links.py` (verifica `%PDF-`, intervallo `#page=N` via PyMuPDF e check HTTP `--online`). |
| **Step 8b** | **Rifiniture UI `catalogo.html` + Blocco Test d'Ingresso Universitari & Semestre Filtro** (nuovo livello `ingresso_universita`, filtri Lingua CLIL / Formato / AND-OR, paginazione progressiva, 8 nuove prove universitarie) | ✅ Completato (2026-11-20) | **+1.273 quesiti universitari** con **29 PDF locali** (`~37 MB`): Semestre Filtro Medicina 2025/26 (186), Medicina MUR pre-riforma 2024/2022 (168), Professioni Sanitarie UniBo CINECA 2025–24 & UniTo 2025 (168), Veterinaria MUR 2024 (112), IMAT MUR 2024–23 EN CLIL (112), Architettura MUR 2019–18 (72), Ingegneria & Economia PoliMi TOL/POLItest & UniVe TOLC-E (301), Scuole di Eccellenza SNS 2026–24 & Sant'Anna Pisa (154). **Totale catalogo: 2.038 quesiti su 16 prove/competizioni attive.** |
| **Step 9+** | **Espansione storica a ritroso**: aggiunta progressiva delle edizioni meno recenti per tutte le competizioni e i test universitari | ⬜ Pianificato | Da attivare quando richiesto dall'utente |

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
