#!/usr/bin/env python3
"""Valida l'integrità del Catalogo di Esercizi (`data/catalogo/` e `assets/catalogo-pdf/`).

Controlli eseguiti:
1. Validità JSON di tutti i registri e dei file in `data/catalogo/sources/`.
2. Ogni quesito rispetta i campi obbligatori, ID univoco, competitionId valido,
   sourceType valido, levels in levels.json, primaryTopic e secondaryTopics in topics.json.
3. Ogni PDF locale dichiarato (`questionsPdfLocal`, `solutionsPdfLocal`) esiste su disco
   dentro `assets/catalogo-pdf/`, ha intestazione valida `%PDF-` e rispetta le dimensioni consigliate.
4. Nessun riferimento a `private/` o percorsi assoluti incompatibili con GitHub Pages.
5. Verifica che `catalog-index.json` sia allineato con `sources/*.json`.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CATALOG_DIR = ROOT_DIR / "data" / "catalogo"
SOURCES_DIR = CATALOG_DIR / "sources"
INDEX_PATH = CATALOG_DIR / "catalog-index.json"

VALID_VISUALS = {"grafico", "figura", "tabella", "circuito", "codice", "schema", "nessuno"}
VALID_FORMATS = {"scelta_multipla", "numerica", "aperta", "dimostrazione", "vero_falso", "progetto_sfida", "mista"}
ID_RE = re.compile(r"^[a-z0-9-]+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

REQUIRED_ITEM_FIELDS = [
    "id",
    "competitionId",
    "edition",
    "year",
    "phase",
    "sourceType",
    "sourceSite",
    "originalQuestionsUrl",
    "levels",
    "originalLevelLabel",
    "questionNumber",
    "primaryTopic",
    "summary",
]


def load_json(path: Path, errors: list[str]) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"JSON non valido in {path.relative_to(ROOT_DIR)}: {exc}")
        return None


def check_pdf_local(rel_path: str, field_name: str, item_id: str, max_mb: float, errors: list[str], warnings: list[str]) -> None:
    if not rel_path:
        return
    if rel_path.startswith("/") or "private/" in rel_path.lower() or ".." in rel_path:
        errors.append(f"[{item_id}] {field_name} non valido o non relativo/pubblico: {rel_path}")
        return
    if not rel_path.startswith("assets/catalogo-pdf/"):
        warnings.append(f"[{item_id}] {field_name} fuori da assets/catalogo-pdf/: {rel_path}")

    full_path = ROOT_DIR / rel_path
    if not full_path.exists():
        errors.append(f"[{item_id}] PDF locale mancante ({field_name}): {rel_path}")
        return

    size_bytes = full_path.stat().st_size
    if size_bytes < 100:
        errors.append(f"[{item_id}] PDF locale troppo piccolo o corrotto ({size_bytes} byte): {rel_path}")
        return

    with full_path.open("rb") as fh:
        magic = fh.read(5)
    if magic != b"%PDF-":
        errors.append(f"[{item_id}] Il file {rel_path} non ha intestazione PDF valida (%PDF-).")

    size_mb = size_bytes / (1024 * 1024)
    if size_mb > max_mb:
        warnings.append(f"[{item_id}] PDF locale grande ({size_mb:.1f} MB > {max_mb} MB): {rel_path}")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    comp_data = load_json(CATALOG_DIR / "competitions.json", errors)
    levels_data = load_json(CATALOG_DIR / "levels.json", errors)
    topics_data = load_json(CATALOG_DIR / "topics.json", errors)

    if not (comp_data and levels_data and topics_data):
        for e in errors:
            print(f"  [ERR] {e}")
        return 1

    max_mb = float(comp_data.get("settings", {}).get("maxRecommendedPdfSizeMb", 20))
    valid_competitions = {c["id"] for c in comp_data.get("competitions", [])}
    valid_source_types = set(comp_data.get("sourceTypeMeta", {}).keys())
    valid_levels = {lv["id"] for lv in levels_data.get("levels", [])}
    valid_macro_areas = {m["id"] for m in topics_data.get("macroAreas", [])}
    valid_topics = set()

    for topic in topics_data.get("topics", []):
        tid = topic.get("id")
        if tid in valid_topics:
            errors.append(f"Topic duplicato in topics.json: {tid}")
        valid_topics.add(tid)
        if topic.get("macroArea") not in valid_macro_areas:
            errors.append(f"Topic '{tid}' ha macroArea sconosciuta: {topic.get('macroArea')}")

    seen_ids: set[str] = set()
    total_source_items = 0

    for src_path in sorted(SOURCES_DIR.glob("*.json")):
        src = load_json(src_path, errors)
        if src is None:
            continue
        rel_src = src_path.relative_to(ROOT_DIR)
        file_comp_id = src.get("competitionId")
        if file_comp_id not in valid_competitions:
            errors.append(f"{rel_src}: competitionId sconosciuto '{file_comp_id}'")

        items = src.get("items", [])
        if not isinstance(items, list):
            errors.append(f"{rel_src}: 'items' deve essere una lista")
            continue

        for item in items:
            total_source_items += 1
            iid = str(item.get("id", "<senza-id>"))

            for req in REQUIRED_ITEM_FIELDS:
                if req not in item or item[req] in (None, "", []):
                    errors.append(f"{rel_src} [{iid}]: campo obbligatorio mancante '{req}'")

            if not ID_RE.fullmatch(iid):
                errors.append(f"{rel_src} [{iid}]: ID deve usare solo minuscole, numeri e trattini")
            elif iid in seen_ids:
                errors.append(f"{rel_src} [{iid}]: ID duplicato nel catalogo")
            seen_ids.add(iid)

            if item.get("competitionId") != file_comp_id:
                errors.append(f"{rel_src} [{iid}]: competitionId '{item.get('competitionId')}' diverso dal file '{file_comp_id}'")

            year = item.get("year")
            if not isinstance(year, int) or year < 1980 or year > 2100:
                errors.append(f"{rel_src} [{iid}]: anno non valido ({year})")

            if item.get("sourceType") not in valid_source_types:
                errors.append(f"{rel_src} [{iid}]: sourceType non valido '{item.get('sourceType')}'")

            for lv in item.get("levels", []):
                if lv not in valid_levels:
                    errors.append(f"{rel_src} [{iid}]: livello non valido '{lv}'")

            pt = item.get("primaryTopic")
            if pt not in valid_topics:
                errors.append(f"{rel_src} [{iid}]: primaryTopic sconosciuto '{pt}' (non presente in topics.json)")

            sec = item.get("secondaryTopics", [])
            if not isinstance(sec, list):
                errors.append(f"{rel_src} [{iid}]: secondaryTopics deve essere una lista")
            else:
                if len(sec) > 4:
                    warnings.append(f"{rel_src} [{iid}]: molti secondaryTopics ({len(sec)}); mantieni classificazione mirata")
                for st in sec:
                    if st not in valid_topics:
                        errors.append(f"{rel_src} [{iid}]: secondaryTopic sconosciuto '{st}'")

            for vis in item.get("visuals", []):
                if vis not in VALID_VISUALS:
                    errors.append(f"{rel_src} [{iid}]: visual non valido '{vis}'")

            rf = item.get("responseFormat", "scelta_multipla")
            if rf not in VALID_FORMATS:
                errors.append(f"{rel_src} [{iid}]: responseFormat non valido '{rf}'")

            va = item.get("verifiedAt")
            if va and not DATE_RE.fullmatch(str(va)):
                errors.append(f"{rel_src} [{iid}]: verifiedAt non nel formato YYYY-MM-DD ({va})")

            check_pdf_local(item.get("questionsPdfLocal", ""), "questionsPdfLocal", iid, max_mb, errors, warnings)
            check_pdf_local(item.get("solutionsPdfLocal", ""), "solutionsPdfLocal", iid, max_mb, errors, warnings)

    # Verifica allineamento catalog-index.json
    if not INDEX_PATH.exists():
        errors.append("Indice compilato mancante: data/catalogo/catalog-index.json (esegui python tools/build_catalog.py)")
    else:
        idx = load_json(INDEX_PATH, errors)
        if idx is not None:
            idx_count = len(idx.get("items", []))
            if idx_count != total_source_items:
                errors.append(
                    f"data/catalogo/catalog-index.json non aggiornato ({idx_count} voci vs {total_source_items} nei sorgenti). "
                    "Esegui python tools/build_catalog.py"
                )

    print("=== Validazione Catalogo Esercizi ===")
    print(f"Competizioni registrate: {len(valid_competitions)} | Argomenti tassonomia: {len(valid_topics)} | Quesiti catalogati: {total_source_items}")

    if warnings:
        print(f"\nAvvisi ({len(warnings)}):")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"\nErrori ({len(errors)}):")
        for e in errors:
            print(f"  [ERR]  {e}")
        return 1

    print("\nOK: Catalogo valido e allineato.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
