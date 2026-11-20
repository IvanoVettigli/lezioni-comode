# Catalogo di Esercizi da Prove Ufficiali e Competizioni

Questo documento definisce l'architettura, le convenzioni e il workflow di aggiornamento del **Catalogo di Esercizi** di **"Le comode lezioni d'Ivano"** (`catalogo.html`), pubblico e consultabile sia dal docente (per progettare lezioni, compiti di realtà e verifiche) sia dagli studenti (per allenarsi su prove autentiche).

---

## 1. Filosofia e Gestione dei File PDF

Per evitare link rotti nel tempo e garantire la fruizione perfetta di grafici, figure geometriche e tabelle complesse:
- I **PDF ufficiali** (domande e soluzioni/griglie) vengono scaricati in locale e ospitati direttamente nel repository dentro:
  ```text
  assets/catalogo-pdf/<competition-id>/<anno>/<nome-file>.pdf
  ```
- Ogni quesito nel catalogo indica:
  - **`questionsPdfLocal`** + **`questionsPage`**: link relativo al PDF locale hostato sul sito, apribile direttamente alla pagina esatta (`#page=N`) e scaricabile con un clic;
  - **`solutionsPdfLocal`** + **`solutionsPage`**: link relativo al PDF locale delle soluzioni/griglie di correzione (se disponibile);
  - **`questionNumber`**: identificativo esatto del quesito nel fascicolo (es. `D14`, `Quesito 7`, `Problema 2`);
  - **`originalQuestionsUrl`** / **`originalSolutionsUrl`** + **`sourceSite`**: URL e nome del sito/ente da cui il documento è stato scaricato, per trasparenza e attribuzione ufficiale;
  - **`summary`**: breve sintesi descrittiva (1–2 righe) dell'argomento del quesito, per capire subito se fa al caso proprio prima di aprire il PDF.

> **Nota tecnica su GitHub Pages**: tenere i PDF snelli (il validatore avvisa se un singolo PDF supera 20 MB). Non duplicare mai lo stesso PDF in cartelle diverse: più quesiti dello stesso fascicolo puntano tutti allo stesso `questionsPdfLocal` con numeri di pagina e di quesito differenti.

---

## 2. Provenienza e Ufficialità (`sourceType`)

Ogni quesito deve dichiarare con chiarezza la provenienza della fonte:

| Valore `sourceType` | Badge UI | Quando usarlo |
| --- | --- | --- |
| `official_exam` | `🏛 Ufficiale` | Prova reale ufficiale pubblicata dall'ente organizzatore (UMI, AIF/Olifis, OII/Olinfo, Bebras, SCI, ANISN, OECD/INVALSI PISA, fascicoli ufficiali INVALSI / Gestinv). |
| `official_sample` | `🏛 Esempio Ufficiale` | Esempio o simulazione ufficiale pubblicata dall'ente (es. simulazioni ufficiali CBT su `invalsiopen.it`). |
| `third_party_archive` | `📚 Archivio Terzi` | Sito terzo affidabile che archivia o commenta prove ufficiali fornendo soluzioni guidate (es. `pianetachimica.it` per SCI, `engheben.it` per INVALSI). |
| `third_party_practice` | `🧪 Allenamento Terzi` | Materiale di allenamento o simulazione creata da terzi/editori (es. Zanichelli, Matematicamente, ecc.). |

---

## 3. Struttura Modulare dei Dati (`data/catalogo/`)

```text
data/catalogo/
├── schema.json                  # Specifica formale di competizioni, documenti e quesiti
├── competitions.json            # Registro competizioni + configurazione defaultMinYear
├── levels.json                  # Livelli scolastici normalizzati
├── topics.json                  # Tassonomia controllata (macro-aree, argomenti, sinonimi)
├── sources/                     # Un file JSON per competizione (facilissimo da aggiornare per step)
│   ├── invalsi.json
│   ├── ocse-pisa.json
│   ├── olimpiadi-matematica.json
│   ├── olimpiadi-fisica.json
│   ├── olimpiadi-informatica.json
│   ├── giochi-chimica.json
│   ├── olimpiadi-scienze-naturali.json
│   └── robotica.json
└── catalog-index.json           # Indice aggregato generato da tools/build_catalog.py
```

---

## 4. Come Aggiungere Nuove Competizioni o Domande

### Aggiungere quesiti a una competizione esistente
1. Scarica il PDF ufficiale (testo e soluzioni) in `assets/catalogo-pdf/<competition-id>/<anno>/` usando nomi file puliti in `kebab-case` (senza spazi o accenti).
2. Ispeziona le pagine esatte del PDF (puoi usare Python con `fitz`/PyMuPDF) per verificare `questionNumber`, `questionsPage`, `solutionsPage`, eventuali `visuals` (`grafico`, `figura`, `tabella`, `circuito`, `codice`) e gli argomenti esatti da `topics.json`.
3. Aggiungi i quesiti nel corrispondente file `data/catalogo/sources/<competition-id>.json`.
4. Ricompila l'indice e valida tutto:
   ```bash
   python tools/build_catalog.py
   python tools/validate_catalog.py
   ```

### Aggiungere una nuova competizione in futuro
1. Aggiungi la nuova competizione in `data/catalogo/competitions.json` (con `id`, `name`, `shortName`, `organizer`, `officialWebsite`, `subjectDomains`, `status`).
2. Crea il file `data/catalogo/sources/<nuovo-id>.json` seguendo `schema.json`.
3. Esegui `python tools/build_catalog.py && python tools/validate_catalog.py`: la nuova competizione comparirà automaticamente nei filtri di `catalogo.html`.

### Escludere in futuro prove troppo vecchie
- Per ora **tutte le annate sono attive** (`defaultMinYear: null` in `data/catalogo/competitions.json`).
- Per filtrare in futuro solo le annate recenti di default, basterà impostare `"defaultMinYear": 2018` (o l'anno desiderato) in `competitions.json`, oppure marcare singoli quesiti obsoleti con `"archived": true` (senza mai cancellare file!).

---

## 5. Regole di Classificazione per Argomento (Alta Qualità)

- Ogni quesito deve avere **esattamente 1 `primaryTopic`** e opzionalmente **da 0 a 3 `secondaryTopics`**, tutti presenti in `data/catalogo/topics.json`.
- Privilegia la precisione didattica: se un quesito di Fisica o INVALSI richiede esplicitamente di convertire unità di misura (es. da $\text{m}^3$ a litri o da $\text{km/h}$ a $\text{m/s}$), includi sempre `equivalenze-unita-misura` tra i topic (primario o secondario).
- Non inventare mai nuovi codici argomento direttamente nei file `sources/*.json`: se manca un argomento importante, aggiungilo prima in `data/catalogo/topics.json` (con macro-area, etichetta e sinonimi) e poi valida con `python tools/validate_catalog.py`.
