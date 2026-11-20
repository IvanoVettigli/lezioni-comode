#!/usr/bin/env python3
"""Crea lo scaffolding standard di una nuova UDA partendo dai template in templates/.

Non sovrascrive né elimina mai file esistenti.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = ROOT_DIR / "templates"

SUBJECTS = {
    "matematica": ("Matematica", "mat"),
    "fisica": ("Fisica", "fis"),
    "informatica": ("Elementi di Informatica", "inf"),
}


def render_template(template_text: str, mapping: dict[str, str]) -> str:
    result = template_text
    for key, value in mapping.items():
        result = result.replace(f"{{{{{key}}}}}", value)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera una nuova UDA uniforme dai template ufficiali")
    parser.add_argument("--subject", required=True, choices=SUBJECTS.keys(), help="Materia della UDA")
    parser.add_argument("--slug", required=True, help="Slug cartella UDA (es. m01-notazione-scientifica)")
    parser.add_argument("--title", required=True, help="Titolo completo della UDA")
    parser.add_argument("--year", type=int, default=1, choices=[1, 2, 3, 4, 5], help="Anno consigliato (1-5)")
    parser.add_argument("--summary", default="Descrizione sintetica orientata ai problemi e compiti di realtà.", help="Breve descrizione")
    parser.add_argument("--register", action="store_true", help="Registra subito la bozza in data/uda-catalog.json")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", args.slug):
        print("Errore: --slug deve contenere solo lettere minuscole, cifre e trattini (es. m01-numeri).")
        return 1

    subject_label, subject_prefix = SUBJECTS[args.subject]
    uda_id = f"{subject_prefix}-{args.slug}" if not args.slug.startswith(f"{subject_prefix}-") else args.slug
    lesson_id = f"{uda_id}-l01"

    target_dir = ROOT_DIR / "uda" / args.subject / args.slug
    if target_dir.exists():
        print(f"Errore: la cartella {target_dir.relative_to(ROOT_DIR)} esiste già. Nessun file modificato.")
        return 1

    mapping = {
        "UDA_ID": uda_id,
        "UDA_SLUG": args.slug,
        "UDA_TITLE": args.title,
        "UDA_SUMMARY": args.summary,
        "UDA_YEAR": str(args.year),
        "SUBJECT_SLUG": args.subject,
        "SUBJECT_LABEL": subject_label,
        "LESSON_ID": lesson_id,
        "LESSON_TITLE": "Lezione 1 — Introduzione operativa",
    }

    (target_dir / "lezioni").mkdir(parents=True, exist_ok=False)
    (target_dir / "stampa").mkdir(parents=True, exist_ok=False)
    (target_dir / "assets").mkdir(parents=True, exist_ok=False)

    index_tpl = (TEMPLATES_DIR / "uda-index.template.html").read_text(encoding="utf-8")
    lesson_tpl = (TEMPLATES_DIR / "lezione.template.html").read_text(encoding="utf-8")
    meta_tpl = (TEMPLATES_DIR / "uda-meta.template.json").read_text(encoding="utf-8")

    (target_dir / "index.html").write_text(render_template(index_tpl, mapping), encoding="utf-8")
    (target_dir / "lezioni" / "lezione-01.html").write_text(render_template(lesson_tpl, mapping), encoding="utf-8")

    meta_obj = json.loads(render_template(meta_tpl, mapping))
    meta_obj["year"] = args.year
    (target_dir / "uda.json").write_text(json.dumps(meta_obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.register:
        catalog_path = ROOT_DIR / "data" / "uda-catalog.json"
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        if not any(u.get("id") == uda_id for u in catalog.get("udas", [])):
            catalog.setdefault("udas", []).append(meta_obj)
            catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"Registrata nel catalogo: data/uda-catalog.json (id: {uda_id})")

    print(f"Nuova UDA creata con successo in: {target_dir.relative_to(ROOT_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
