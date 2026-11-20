# Tools Python Condivisi

Questa cartella raccoglie tutti gli script Python di supporto per lo sviluppo, il controllo qualità, la creazione di nuove UDA e (in futuro) la generazione automatica dei PDF.

Tutti gli script di base funzionano con la sola libreria standard di **Python 3.10+** (nessuna dipendenza obbligatoria).

---

## Script disponibili

| Script | Scopo | Comando di esempio |
| --- | --- | --- |
| `serve_local.py` | Avvia un server HTTP locale per l'anteprima del sito (necessario per gli ES Modules JS) | `python tools/serve_local.py --port 8000` |
| `validate_project.py` | Verifica JSON, integrità del catalogo UDA, percorsi relativi (GitHub Pages), assenza di link a `private/`, presenza di CLIL, difficoltà 1–3 e intestazione stampabile nelle lezioni | `python tools/validate_project.py` |
| `new_uda.py` | Genera una nuova UDA uniforme partendo dai modelli in `templates/` | `python tools/new_uda.py --subject matematica --slug m01-notazione-scientifica --title "Notazione scientifica e conversioni" --year 1` |
| `build_catalog.py` | Compila `data/catalogo/catalog-index.json` aggregando tutti i file in `data/catalogo/sources/` | `python tools/build_catalog.py` |
| `validate_catalog.py` | Verifica schema, tassonomia argomenti, livelli, ufficialità e integrità dei PDF locali del catalogo | `python tools/validate_catalog.py` |

---

## Regole per nuovi script in `tools/`

- Inserisci qui ogni script Python riutilizzabile (mai sparpagliare script dentro singole UDA).
- Gli script **non devono mai cancellare file** né eseguire `git commit` / `git push`.
- Aggiorna questa tabella ogni volta che aggiungi un nuovo tool.
