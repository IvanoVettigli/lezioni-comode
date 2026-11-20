#!/usr/bin/env python3
"""Validatore condiviso per il progetto 'Le comode lezioni d'Ivano'.

Controlla:
1. Presenza dei file strutturali obbligatori e validità sintattica di tutti i JSON.
2. Assenza di riferimenti alla cartella riservata `private/` nei file pubblici.
3. Assenza di percorsi assoluti (`/assets/...`, `/data/...`) incompatibili con GitHub Pages.
4. Coerenza di `data/uda-catalog.json` (entryPath, lezioni, prerequisiti).
5. Conformità didattica delle UDA e delle lezioni in `uda/`:
   - intestazione stampabile `.print-header`
   - JSON validi negli `<script type="application/json">`
   - presenza di almeno 1 esercizio CLIL (`data-clil="true"`) per lezione
   - presenza esercizi di difficoltà 1, 2 e 3 nelle lezioni
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

REQUIRED_PATHS = [
    "AGENTS.md",
    "CLAUDE.md",
    ".gitignore",
    "index.html",
    "catalogo.html",
    "profilo.html",
    "ringraziamenti.html",
    "data/site-config.json",
    "data/gamification.json",
    "data/uda-catalog.json",
    "data/catalogo/competitions.json",
    "data/catalogo/levels.json",
    "data/catalogo/topics.json",
    "data/catalogo/catalog-index.json",
    "assets/css/tokens.css",
    "assets/css/base.css",
    "assets/css/components.css",
    "assets/css/print.css",
    "assets/js/main.js",
    "assets/js/core/storage.js",
    "assets/js/core/theme.js",
    "assets/js/core/gamification.js",
    "assets/js/core/site-shell.js",
    "assets/js/components/exercise-engine.js",
    "assets/js/components/flashcards.js",
    "assets/js/components/concept-map.js",
    "assets/js/components/interactive-story.js",
    "assets/js/components/jingle-player.js",
]

JSON_SCRIPT_RE = re.compile(
    r'<script[^>]*type=["\']application/json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
ROOT_ABS_LINK_RE = re.compile(r'(?:href|src)=["\']/(?:assets|data|uda|index\.html|profilo\.html)', re.IGNORECASE)
PRIVATE_LINK_RE = re.compile(r'(?:href|src)=["\'][^"\']*private/', re.IGNORECASE)


def check_required_files(errors: list[str]) -> None:
    for rel in REQUIRED_PATHS:
        if not (ROOT_DIR / rel).exists():
            errors.append(f"File obbligatorio mancante: {rel}")


def check_json_files(errors: list[str]) -> None:
    for path in sorted(ROOT_DIR.rglob("*.json")):
        if "private" in path.parts or "templates" in path.parts:
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"JSON non valido in {path.relative_to(ROOT_DIR)}: {exc}")


def check_public_html(errors: list[str], warnings: list[str]) -> None:
    public_htmls = [
        p
        for p in sorted(ROOT_DIR.rglob("*.html"))
        if "private" not in p.parts and "templates" not in p.parts
    ]

    for html_path in public_htmls:
        rel = html_path.relative_to(ROOT_DIR)
        text = html_path.read_text(encoding="utf-8")

        if PRIVATE_LINK_RE.search(text):
            errors.append(f"Riferimento vietato a 'private/' trovato in {rel}")

        if ROOT_ABS_LINK_RE.search(text):
            errors.append(f"Percorso assoluto incompatibile con GitHub Pages trovato in {rel}")

        for idx, match in enumerate(JSON_SCRIPT_RE.finditer(text), start=1):
            raw_json = match.group(1).strip()
            try:
                json.loads(raw_json)
            except Exception as exc:
                errors.append(f"Blocco JSON inline #{idx} non valido in {rel}: {exc}")

        # Controlli specifici per pagine UDA e lezioni
        if "uda" in html_path.parts:
            if "print-header" not in text:
                errors.append(f"Intestazione stampabile '.print-header' mancante in {rel}")

            if "lezioni" in html_path.parts:
                if 'data-clil="true"' not in text:
                    warnings.append(f"Nessun esercizio CLIL (data-clil=\"true\") rilevato in {rel}")
                for level in ("1", "2", "3"):
                    if f'data-difficulty="{level}"' not in text:
                        warnings.append(f"Nessun esercizio di difficoltà {level} rilevato in {rel}")
            elif html_path.name == "index.html":
                if "callout-prereq" not in text:
                    warnings.append(f"Sezione prerequisiti (.callout-prereq) non trovata in {rel}")


def check_catalog(errors: list[str], warnings: list[str]) -> None:
    catalog_path = ROOT_DIR / "data" / "uda-catalog.json"
    if not catalog_path.exists():
        return
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except Exception:
        return

    udas = catalog.get("udas", [])
    known_ids = {u.get("id") for u in udas if u.get("id")}

    for uda in udas:
        uid = uda.get("id", "<senza-id>")
        entry = uda.get("entryPath", "")
        if not entry or not (ROOT_DIR / entry).exists():
            errors.append(f"UDA '{uid}': entryPath inesistente ({entry})")

        for prereq in uda.get("prerequisiteUdas", []):
            if prereq not in known_ids:
                warnings.append(f"UDA '{uid}': prerequisito '{prereq}' non presente in uda-catalog.json")

        for lesson in uda.get("lessons", []):
            lpath = lesson.get("path", "")
            if not lpath or not (ROOT_DIR / lpath).exists():
                errors.append(f"UDA '{uid}': lezione inesistente ({lpath})")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    check_required_files(errors)
    check_json_files(errors)
    check_public_html(errors, warnings)
    check_catalog(errors, warnings)

    print("=== Validazione progetto: Le comode lezioni d'Ivano ===")
    if warnings:
        print(f"\nAvvisi ({len(warnings)}):")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"\nErrori ({len(errors)}):")
        for e in errors:
            print(f"  [ERR]  {e}")
        return 1

    print("\nOK: Nessun errore critico rilevato.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
