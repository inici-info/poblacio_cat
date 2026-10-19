#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETL 1: Extracció de les 14 taules estadístiques actuals d'EMEX (IDESCAT)
Genera 'idescat_estadistiques.csv' separat per ';' a la mateixa carpeta.
"""

import csv
import re
import ssl
import sys
import time
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_EMEX_URL = "https://api.idescat.cat/emex/v1"

TARGET_TABLES = [
    "t176", "t192", "t195", "t31", "t37", "t78", "t81",
    "t164", "t165", "t97", "t108", "t196", "t183", "t184"
]

PROVINCIAS_MAP = {
    "08": "Barcelona",
    "17": "Girona",
    "25": "Lleida",
    "43": "Tarragona"
}

SSL_CTX = ssl._create_unverified_context()


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "_", text.lower()).strip("_")
    return text or "valor"


def fetch_bytes(url: str, retries: int = 3) -> bytes:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityDashboard/2.0"}
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20, context=SSL_CTX) as resp:
                return resp.read()
        except Exception as e:
            if attempt == retries - 1:
                return b""
            time.sleep(1.0 * (attempt + 1))
    return b""


def parse_mun_value(val_str: str):
    if not val_str:
        return 0
    first_val = str(val_str).split(",")[0].strip()
    if first_val in ("_", "", "-", "NA", "null", ".."):
        return 0
    try:
        return float(first_val) if "." in first_val else int(first_val)
    except ValueError:
        return first_val


def extract_nodes() -> list:
    url = f"{BASE_EMEX_URL}/nodes.xml?lang=ca"
    xml_data = fetch_bytes(url)
    root = ET.fromstring(xml_data)

    municipis = []
    for com_el in root.iter("v"):
        if com_el.attrib.get("scheme") == "com":
            comarca_id = str(com_el.attrib.get("id", "")).strip().zfill(2)
            comarca_nom = (com_el.text or "").strip()

            for mun_el in com_el.findall("v"):
                if mun_el.attrib.get("scheme") == "mun":
                    c_idescat = str(mun_el.attrib.get("id", "")).strip().zfill(6)
                    c_ine = c_idescat[:5]
                    c_prov = c_ine[:2]

                    municipis.append({
                        "codi_ine": c_ine,
                        "codi_idescat": c_idescat,
                        "nom_municipi": (mun_el.text or "").strip(),
                        "codi_comarca": comarca_id,
                        "nom_comarca": comarca_nom,
                        "codi_provincia": c_prov,
                        "nom_provincia": PROVINCIAS_MAP.get(c_prov, "Desconeguda")
                    })
    return municipis


def fetch_municipality_emex(mun_info: dict) -> dict:
    codi_idescat = mun_info["codi_idescat"]
    url = f"{BASE_EMEX_URL}/dades.xml?id={codi_idescat}&lang=ca"
    row = dict(mun_info)
    target_set = set(TARGET_TABLES)

    try:
        xml_data = fetch_bytes(url)
        if xml_data:
            root = ET.fromstring(xml_data)
            for t_el in root.iter("t"):
                t_id = t_el.attrib.get("id", "").strip()
                if t_id in target_set:
                    for f_el in t_el.findall(".//f"):
                        f_id = f_el.attrib.get("id", "").strip()
                        label = (f_el.findtext("c") or f_id).strip()
                        val = parse_mun_value(f_el.findtext("v") or "")

                        col_name = f"{t_id}_{slugify(label)}"
                        if col_name in row:
                            col_name = f"{t_id}_{slugify(label)}_{f_id}"
                        row[col_name] = val
    except Exception as e:
        sys.stderr.write(f"\nAvis en mun {codi_idescat}: {e}\n")

    return row


def main():
    script_dir = Path(__file__).resolve().parent
    output_csv = script_dir / "idescat_estadistiques.csv"

    print("🚀 1/3 Obtenint arbre de municipis d'EMEX (nodes.xml)...")
    municipis = extract_nodes()
    total_muns = len(municipis)
    print(f"    -> Detectats {total_muns} municipis a Catalunya.")

    print("📊 2/3 Descarregant les 14 taules estadístiques en paral·lel...")
    resultados = []
    completados = 0
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(fetch_municipality_emex, m): m for m in municipis}
        for future in as_completed(futures):
            resultados.append(future.result())
            completados += 1
            if completados % 100 == 0 or completados == total_muns:
                print(f"    -> Progresso: {completados}/{total_muns} municipis...")

    resultados.sort(key=lambda x: x["codi_ine"])

    base_cols = [
        "codi_ine", "codi_idescat", "nom_municipi",
        "codi_comarca", "nom_comarca", "codi_provincia", "nom_provincia"
    ]
    extra_cols = []
    seen = set(base_cols)

    for t_id in TARGET_TABLES:
        for r in resultados:
            for k in r.keys():
                if k.startswith(f"{t_id}_") and k not in seen:
                    extra_cols.append(k)
                    seen.add(k)

    fieldnames = base_cols + extra_cols

    print(f"💾 3/3 Guardant 'idescat_estadistiques.csv' ({len(fieldnames)} columnes)...")
    with open(output_csv, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";", extrasaction="ignore")
        writer.writeheader()
        for r in resultados:
            clean_row = {col: r.get(col, 0) for col in fieldnames}
            writer.writerow(clean_row)

    print(f"✅ Fitxer estadístic generat amb èxit a:\n   {output_csv}\n")


if __name__ == "__main__":
    main()