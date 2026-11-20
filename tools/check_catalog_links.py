#!/usr/bin/env python3
"""Verifica integrità PDF locali, validità dei numeri di pagina `#page=N` e (opzionalmente)
raggiungibilità degli URL sorgenti del Catalogo di Esercizi.

Uso:
  python tools/check_catalog_links.py
  python tools/check_catalog_links.py --online
  python tools/check_catalog_links.py --online --strict-online
"""

from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CATALOG_DIR = ROOT_DIR / "data" / "catalogo"
INDEX_PATH = CATALOG_DIR / "catalog-index.json"
PDF_ROOT = ROOT_DIR / "assets" / "catalogo-pdf"

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


def inspect_local_pdfs(items: list[dict], max_mb: float) -> tuple[list[str], list[str], dict[str, int]]:
    errors: list[str] = []
    warnings: list[str] = []
    referenced: set[str] = set()
    page_counts: dict[str, int] = {}

    # 1. Raccogli tutti i PDF locali referenziati
    for item in items:
        for field in ("questionsPdfLocal", "solutionsPdfLocal"):
            rel = item.get(field) or ""
            if rel:
                referenced.add(rel)

    # 2. Controlla esistenza, magic header %PDF-, dimensione e numero di pagine
    size_by_comp: dict[str, int] = defaultdict(int)
    for rel in sorted(referenced):
        full = ROOT_DIR / rel
        if not full.exists():
            errors.append(f"PDF mancante su disco: {rel}")
            continue
        size_b = full.stat().st_size
        parts = Path(rel).parts
        comp_bucket = parts[2] if len(parts) > 2 else "altro"
        size_by_comp[comp_bucket] += size_b

        if size_b / (1024 * 1024) > max_mb:
            warnings.append(f"PDF supera la soglia consigliata ({size_b/(1024*1024):.1f} MB > {max_mb} MB): {rel}")

        with full.open("rb") as fh:
            if fh.read(5) != b"%PDF-":
                errors.append(f"Intestazione %PDF- non valida: {rel}")
                continue

        if fitz is not None:
            try:
                with fitz.open(full) as doc:
                    page_counts[rel] = len(doc)
                    if len(doc) == 0:
                        errors.append(f"PDF con 0 pagine: {rel}")
            except Exception as exc:
                errors.append(f"PDF non apribile con PyMuPDF ({rel}): {exc}")

    # 3. Controlla validità di questionsPage e solutionsPage rispetto alle pagine reali del PDF
    if fitz is not None:
        for item in items:
            iid = item.get("id", "?")
            for pdf_field, page_field in (
                ("questionsPdfLocal", "questionsPage"),
                ("solutionsPdfLocal", "solutionsPage"),
            ):
                rel = item.get(pdf_field) or ""
                page = item.get(page_field)
                if rel and page is not None:
                    max_p = page_counts.get(rel)
                    if max_p is not None and (not isinstance(page, int) or page < 1 or page > max_p):
                        errors.append(
                            f"[{iid}] {page_field}={page} fuori intervallo (1..{max_p}) per {rel}"
                        )
    else:
        warnings.append("PyMuPDF (fitz) non installato: controllo intervallo pagine saltato.")

    # 4. Segnala eventuali PDF in assets/catalogo-pdf/ non referenziati da nessun quesito
    if PDF_ROOT.exists():
        for pdf_file in sorted(PDF_ROOT.rglob("*.pdf")):
            rel = pdf_file.relative_to(ROOT_DIR).as_posix()
            if rel not in referenced:
                warnings.append(f"PDF presente su disco ma non collegato ad alcun quesito: {rel}")

    print("=== Verifica PDF locali e pagine #page=N ===")
    print(f"PDF locali referenziati: {len(referenced)} | Quesiti verificati: {len(items)}")
    total_mb = sum(size_by_comp.values()) / (1024 * 1024)
    print(f"Peso totale PDF hostati: {total_mb:.2f} MB")
    for comp, sz in sorted(size_by_comp.items()):
        print(f"  - {comp}: {sz/(1024*1024):.2f} MB")

    return errors, warnings, page_counts


def check_online_urls(items: list[dict], timeout: float) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    urls: set[str] = set()
    for item in items:
        for field in ("originalQuestionsUrl", "originalSolutionsUrl"):
            u = (item.get(field) or "").strip()
            if u.startswith(("http://", "https://")):
                urls.add(u)

    ctx = ssl.create_default_context()
    headers = {"User-Agent": "Mozilla/5.0 (compatible; LezioniComodeCatalogChecker/1.0)"}

    print(f"\n=== Verifica online di {len(urls)} URL sorgenti univoci ===")
    ok_count = 0
    for u in sorted(urls):
        status = None
        err_msg = None
        for method in ("HEAD", "GET"):
            try:
                req = urllib.request.Request(u, headers=headers, method=method)
                if method == "GET":
                    req.add_header("Range", "bytes=0-1023")
                with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                    status = resp.status
                    break
            except urllib.error.HTTPError as exc:
                status = exc.code
                if method == "HEAD" and exc.code in (403, 405, 501):
                    continue
                err_msg = f"HTTP {exc.code}"
                break
            except Exception as exc:
                err_msg = str(exc)
                break

        if status is not None and 200 <= status < 400:
            ok_count += 1
        else:
            msg = f"URL non raggiungibile ({err_msg or status}): {u}"
            warnings.append(msg)
            errors.append(msg)

    print(f"URL sorgenti raggiungibili: {ok_count}/{len(urls)}")
    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Controlla PDF locali, pagine e link sorgenti del catalogo.")
    parser.add_argument("--online", action="store_true", help="Verifica anche gli URL originali online.")
    parser.add_argument("--strict-online", action="store_true", help="Restituisce codice d'errore se qualche URL online fallisce.")
    parser.add_argument("--timeout", type=float, default=12.0, help="Timeout HTTP in secondi (default: 12).")
    args = parser.parse_args()

    if not INDEX_PATH.exists():
        print("ERR: data/catalogo/catalog-index.json mancante. Esegui prima python tools/build_catalog.py")
        return 1

    data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    items = data.get("items", [])
    max_mb = float(data.get("settings", {}).get("maxRecommendedPdfSizeMb", 20))

    errors, warnings, _ = inspect_local_pdfs(items, max_mb)

    online_errors: list[str] = []
    if args.online:
        online_errors, online_warnings = check_online_urls(items, args.timeout)
        warnings.extend(online_warnings)
        if args.strict_online:
            errors.extend(online_errors)

    if warnings:
        print(f"\nAvvisi ({len(warnings)}):")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"\nErrori ({len(errors)}):")
        for e in errors:
            print(f"  [ERR]  {e}")
        return 1

    print("\nOK: Tutti i PDF locali e i riferimenti di pagina risultano validi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
