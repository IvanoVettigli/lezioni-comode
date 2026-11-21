"""Add CISIA TOLC-I (Ingegneria Aerospaziale Sapienza / Politecnici) to test-ingegneria-scienze-tolc.json
and update competitions.json metadata.
"""
from pathlib import Path
import fitz
import re
import json

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "assets/catalogo-pdf/test-ingegneria-scienze-tolc/2019/cisia-esempio-prova-tolc-i.pdf"
SOURCE_JSON = ROOT / "data/catalogo/sources/test-ingegneria-scienze-tolc.json"
COMPETITIONS_JSON = ROOT / "data/catalogo/competitions.json"

topic_map = {
    1: 'equazioni-disequazioni-lineari',
    2: 'goniometria-trigonometria',
    3: 'goniometria-trigonometria',
    4: 'equazioni-secondo-grado',
    5: 'equazioni-disequazioni-lineari',
    6: 'calcolo-letterale-polinomi',
    7: 'goniometria-trigonometria',
    8: 'calcolo-letterale-polinomi',
    9: 'geometria-euclidea-piana',
    10: 'equazioni-secondo-grado',
    11: 'geometria-analitica',
    12: 'esponenziali-logaritmi',
    13: 'aree-perimetri',
    14: 'geometria-analitica',
    15: 'geometria-analitica',
    16: 'potenze-radici',
    17: 'potenze-radici',
    18: 'aree-perimetri',
    19: 'pitagora-similitudine',
    20: 'frazioni-proporzioni-percentuali',
    21: 'calcolo-combinatorio',
    22: 'logica-proposizionale-booleana',
    23: 'calcolo-combinatorio',
    24: 'teoria-numeri-divisibilita',
    25: 'logica-proposizionale-booleana',
    26: 'logica-proposizionale-booleana',
    27: 'esponenziali-logaritmi',
    28: 'frazioni-proporzioni-percentuali',
    29: 'logica-proposizionale-booleana',
    30: 'logica-proposizionale-booleana',
    31: 'fluidi-pressione',
    32: 'cinematica',
    33: 'fluidi-pressione',
    34: 'termologia-termodinamica',
    35: 'struttura-atomica-periodica',
    36: 'onde-suono-ottica',
    37: 'termologia-termodinamica',
    38: 'elettrostatica-circuiti',
    39: 'vettori-trasformazioni',
    40: 'cinematica'
}

phase_map = {
    range(1, 21): 'Matematica',
    range(21, 31): 'Logica',
    range(31, 41): 'Scienze (Fisica e Chimica)'
}

def main():
    doc = fitz.open(PDF_PATH)
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    existing_ids = {item["id"] for item in data["items"]}
    new_items = []

    for q in range(1, 41):
        item_id = f"cisia-tolc-i-2019-q{q:02d}"
        if item_id in existing_ids:
            print(f"Skipping existing item: {item_id}")
            continue

        phase = next(ph for r, ph in phase_map.items() if q in r)
        q_page = None
        q_text = ""
        for p in range(3, 36):
            t = doc[p - 1].get_text("text")
            t = "".join(chr(ord(c) - 0xeb80) if 0xebe1 <= ord(c) <= 0xebfa else c for c in t)
            m = re.search(r"(?:^|\n)\s*" + str(q) + r"\.\s+(.+?)(?=\n[A-E]\.|\Z)", t, re.S)
            if m:
                q_page = p
                q_text = " ".join(m.group(1).split())
                break

        vis = ["tabella"] if q == 29 else (["figura"] if q == 33 else ["nessuno"])
        sol_page = 49 if q <= 28 else 50

        clean_snippet = q_text[:110]
        if len(q_text) > 110:
            clean_snippet += "..."

        item = {
            "id": item_id,
            "competitionId": "test-ingegneria-scienze-tolc",
            "edition": "CISIA TOLC-I (Ingegneria Aerospaziale e Ingegnerie — Es. Sapienza Roma, PoliMi, PoliTo)",
            "year": 2019,
            "phase": phase,
            "sourceType": "official_sample",
            "sourceSite": "cisiaonline.it",
            "originalQuestionsUrl": "https://www.cisiaonline.it/area-tematica-tolc-ingegneria/esempio-di-prova-tolc-i/",
            "originalSolutionsUrl": "https://www.cisiaonline.it/area-tematica-tolc-ingegneria/esempio-di-prova-tolc-i/",
            "questionsPdfLocal": "assets/catalogo-pdf/test-ingegneria-scienze-tolc/2019/cisia-esempio-prova-tolc-i.pdf",
            "questionsPage": q_page,
            "solutionsPdfLocal": "assets/catalogo-pdf/test-ingegneria-scienze-tolc/2019/cisia-esempio-prova-tolc-i.pdf",
            "solutionsPage": sol_page,
            "levels": ["ingresso_universita", "triennio", "anno_5"],
            "originalLevelLabel": "CISIA TOLC-I — Ingegneria Aerospaziale / Industriale",
            "questionNumber": f"Q{q:02d}",
            "primaryTopic": topic_map[q],
            "secondaryTopics": [],
            "visuals": vis,
            "responseFormat": "scelta_multipla",
            "language": "it",
            "summary": f"TOLC-I · {phase}: {clean_snippet}",
            "keywords": [
                "cisia",
                "tolc-i",
                "ingegneria aerospaziale",
                "sapienza",
                "roma",
                "politecnico",
                "ammissione ingegneria",
                "stem"
            ],
            "notes": "Prova ufficiale CISIA TOLC-I adottata per l'ammissione a numero programmato ai corsi di Ingegneria Aerospaziale (es. Sapienza Università di Roma, Classe L-9) e ingegnerie a livello nazionale.",
            "archived": False,
            "verifiedAt": "2026-11-21"
        }
        new_items.append(item)

    doc.close()

    if new_items:
        data["items"].extend(new_items)
        with open(SOURCE_JSON, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Added {len(new_items)} new TOLC-I items. Total items now: {len(data['items'])}")

    # Update competitions.json
    with open(COMPETITIONS_JSON, "r", encoding="utf-8") as f:
        comp_data = json.load(f)

    for c in comp_data.get("competitions", []):
        if c["id"] == "test-ingegneria-scienze-tolc":
            c["name"] = "Ingegneria, Scienze & Economia (TOLC-I, PoliMi TOL, POLItest & TOLC-E)"
            c["organizer"] = "CISIA (TOLC-I Ingegneria Aerospaziale / Industriale), Politecnico di Milano (TOL / POLItest) & Università Ca' Foscari Venezia (TOLC-E)"
            c["notes"] = "Test ufficiali CISIA TOLC-I (adottato ad es. a Roma Sapienza per Ingegneria Aerospaziale e Politecnici), Autovalutazione Ingegneria PoliMi (N. 1 e N. 2), volumi POLItest Matematica e Fisica del Politecnico di Milano e simulazione TOLC-E Matematica Ca' Foscari Venezia."
            break

    with open(COMPETITIONS_JSON, "w", encoding="utf-8") as f:
        json.dump(comp_data, f, indent=2, ensure_ascii=False)
    print("Updated competitions.json successfully!")

if __name__ == "__main__":
    main()
