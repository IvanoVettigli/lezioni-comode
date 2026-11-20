# Istruzioni di Progetto (Copilot & Altri Agenti)

Prima di modificare o creare qualsiasi file, leggi integralmente [`AGENTS.md`](../AGENTS.md) nella radice del progetto e i documenti specifici in `docs/`.

Regole critiche da rispettare sempre:
- **NON cancellare mai alcun file** senza l'esplicita approvazione dell'utente.
- **NON eseguire mai commit o push su GitHub** senza richiesta o autorizzazione esplicita dell'utente.
- **NON esporre mai** nulla dalla cartella `private/` (verifiche riservate, soluzioni docente, bozze).
- Mantieni tutte le UDA uniformi usando esclusivamente le librerie approvate, il CSS condiviso in `assets/css/`, i moduli JS in `assets/js/` e i modelli in `templates/`.
- Usa sempre **percorsi relativi** (compatibilità GitHub Pages) e verifica le modifiche con `python tools/validate_project.py`.
