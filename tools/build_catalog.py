#!/usr/bin/env python3
"""Compila l'indice aggregato `data/catalogo/catalog-index.json` a partire dai file modulari.

Legge:
- data/catalogo/competitions.json
- data/catalogo/levels.json
- data/catalogo/topics.json
- data/catalogo/sources/*.json

Produce:
- data/catalogo/catalog-index.json (usato dalla pagina web pubblica `catalogo.html`)
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CATALOG_DIR = ROOT_DIR / "data" / "catalogo"
SOURCES_DIR = CATALOG_DIR / "sources"
OUTPUT_PATH = CATALOG_DIR / "catalog-index.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    competitions_data = load_json(CATALOG_DIR / "competitions.json")
    levels_data = load_json(CATALOG_DIR / "levels.json")
    topics_data = load_json(CATALOG_DIR / "topics.json")

    all_items: list[dict] = []
    per_competition_counts: Counter[str] = Counter()
    per_competition_years: dict[str, set[int]] = {}
    per_topic_counts: Counter[str] = Counter()
    per_level_counts: Counter[str] = Counter()
    per_source_type_counts: Counter[str] = Counter()
    per_language_counts: Counter[str] = Counter()
    per_format_counts: Counter[str] = Counter()

    for src_path in sorted(SOURCES_DIR.glob("*.json")):
        src = load_json(src_path)
        items = src.get("items", [])
        for item in items:
            normalized = dict(item)
            normalized.setdefault("secondaryTopics", [])
            normalized.setdefault("visuals", ["nessuno"])
            normalized.setdefault("keywords", [])
            normalized.setdefault("archived", False)
            normalized.setdefault("language", "it")
            normalized.setdefault("responseFormat", "scelta_multipla")

            # Calcola array combinato dei topic (primario + secondari senza duplicati)
            all_topics: list[str] = []
            for t in [normalized.get("primaryTopic"), *normalized["secondaryTopics"]]:
                if t and t not in all_topics:
                    all_topics.append(t)
            normalized["allTopics"] = all_topics

            all_items.append(normalized)

            cid = normalized.get("competitionId", "")
            per_competition_counts[cid] += 1
            if isinstance(normalized.get("year"), int):
                per_competition_years.setdefault(cid, set()).add(normalized["year"])
            for t in all_topics:
                per_topic_counts[t] += 1
            for lv in normalized.get("levels", []):
                per_level_counts[lv] += 1
            st = normalized.get("sourceType", "")
            if st:
                per_source_type_counts[st] += 1
            lang = normalized.get("language", "it")
            if lang:
                per_language_counts[lang] += 1
            rf = normalized.get("responseFormat", "scelta_multipla")
            if rf:
                per_format_counts[rf] += 1

    # Ordina per anno decrescente, poi competizione, poi ID
    all_items.sort(key=lambda x: (-int(x.get("year", 0)), str(x.get("competitionId", "")), str(x.get("id", ""))))

    # Arricchisci le competizioni con statistiche live
    enriched_competitions = []
    for comp in competitions_data.get("competitions", []):
        c = dict(comp)
        cid = c["id"]
        years = sorted(per_competition_years.get(cid, set()), reverse=True)
        c["questionCount"] = per_competition_counts.get(cid, 0)
        c["coveredYears"] = years
        if c["questionCount"] > 0 and c.get("status") == "planned":
            c["status"] = "active"
        enriched_competitions.append(c)

    years_all = sorted({int(i["year"]) for i in all_items if isinstance(i.get("year"), int)}, reverse=True)

    index_payload = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "settings": competitions_data.get("settings", {}),
        "sourceTypeMeta": competitions_data.get("sourceTypeMeta", {}),
        "competitions": enriched_competitions,
        "levels": levels_data.get("levels", []),
        "macroAreas": topics_data.get("macroAreas", []),
        "topics": topics_data.get("topics", []),
        "stats": {
            "totalQuestions": len(all_items),
            "years": years_all,
            "byCompetition": dict(per_competition_counts),
            "byTopic": dict(per_topic_counts),
            "byLevel": dict(per_level_counts),
            "bySourceType": dict(per_source_type_counts),
            "byLanguage": dict(per_language_counts),
            "byResponseFormat": dict(per_format_counts),
        },
        "items": all_items,
    }

    OUTPUT_PATH.write_text(json.dumps(index_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Catalogo compilato con successo: {OUTPUT_PATH.relative_to(ROOT_DIR)} ({len(all_items)} quesiti totali)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
