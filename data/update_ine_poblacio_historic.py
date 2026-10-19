#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETL: Sèrie Històrica Oficial de Població Municipal (2000 - 2025)
Font Oficial: API REST de l'INE (Instituto Nacional de Estadística)
Extracció directa des de 'MetaData' de cada sèrie.
Sortida: 'poblacio_historica_municipis.csv' separat per ';'
"""

import csv
import json
import ssl
import sys
import time
import urllib.request
from pathlib import Path

# Configuració de la codificació per a la consola de Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Taules INE corregides per a Catalunya
INE_TABLES = {
    "08": {"nom": "Barcelona", "tabla_id": "2861"},
    "17": {"nom": "Girona",    "tabla_id": "2870"},
    "25": {"nom": "Lleida",    "tabla_id": "2878"},
    "43": {"nom": "Tarragona", "tabla_id": "2900"}  # 2900 és la taula oficial de Tarragona a l'INE
}

YEARS = list(range(2000, 2026))
SSL_CTX = ssl._create_unverified_context()


def fetch_json(url: str, retries: int = 3) -> list:
    """Descàrrega JSON des de l'API de l'INE."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) INE-DataExtract/3.0",
        "Accept": "application/json"
    }
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=35, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data if isinstance(data, list) else []
        except Exception as e:
            if attempt == retries - 1:
                print(f"    [Error] No s'ha pogut descarregar {url}: {e}")
                return []
            time.sleep(1.0 * (attempt + 1))
    return []


def processar_provincia_ine(codi_prov: str, info_prov: dict) -> list:
    """
    Extreu les dades llegint directament l'estructura 'MetaData' retornada per l'INE.
    """
    tabla_id = info_prov["tabla_id"]
    nom_prov = info_prov["nom"]
    url = f"https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/{tabla_id}?tip=AM"

    print(f"  -> Descarregant {nom_prov} (Taula INE {tabla_id})...")
    raw_series = fetch_json(url)

    municipis = {}

    for s in raw_series:
        metadata = s.get("MetaData", [])
        
        # Extreure variables des de MetaData
        codi_ine = None
        nom_municipi = None
        es_total_sexe = False

        for meta in metadata:
            var_nom = meta.get("T3_Variable", "")
            if var_nom == "Municipios":
                codi_ine = str(meta.get("Codigo", "")).strip().zfill(5)
                nom_municipi = meta.get("Nombre", "").strip()
            elif var_nom == "Sexo":
                if meta.get("Nombre") == "Total" or meta.get("Codigo") == "0":
                    es_total_sexe = True

        # Filtrar només la sèrie de població Total del municipi
        if not (codi_ine and es_total_sexe):
            continue

        # Evitar totals provincials que acaben en 000 (ex: 08000)
        if codi_ine.endswith("000"):
            continue

        if codi_ine not in municipis:
            municipis[codi_ine] = {
                "codi_ine": codi_ine,
                "nom_municipi": nom_municipi,
                "codi_provincia": codi_prov,
                "nom_provincia": nom_prov,
                "anys": {}
            }

        # Extreure dades anuals de l'array Data
        for d in s.get("Data", []):
            any_num = d.get("Anyo")
            valor = d.get("Valor")
            if any_num in YEARS and valor is not None:
                municipis[codi_ine]["anys"][any_num] = int(round(float(valor)))

    print(f"     ✅ {nom_prov}: {len(municipis)} municipis extrets.")
    if municipis:
        primer = next(iter(municipis.values()))
        print(f"        (Exemple: [{primer['codi_ine']}] {primer['nom_municipi']} -> 2000={primer['anys'].get(2000, 0)}, 2024={primer['anys'].get(2024, 0)})")

    return list(municipis.values())


def main():
    script_dir = Path(__file__).resolve().parent
    output_csv = script_dir / "poblacio_historica_municipis.csv"

    print("🚀 1/3 Descarregant dades oficials de població des de l'API de l'INE...")
    start_time = time.time()
    tots_municipis = []

    for codi_prov, info in INE_TABLES.items():
        muns_prov = processar_provincia_ine(codi_prov, info)
        tots_municipis.extend(muns_prov)

    tots_municipis.sort(key=lambda x: x["codi_ine"])
    print(f"    -> Total municipis recuperats: {len(tots_municipis)} de 947 previstos.")

    print("⚙️  2/3 Calculant taxes d'evolució a 10 i 20 anys...")
    results = []

    for m in tots_municipis:
        row = {
            "codi_ine": m["codi_ine"],
            "nom_municipi": m["nom_municipi"],
            "codi_provincia": m["codi_provincia"],
            "nom_provincia": m["nom_provincia"]
        }

        for y in YEARS:
            row[f"pob_{y}"] = m["anys"].get(y, 0)

        # Si l'any 2025 encara no està tancat al padró de l'INE, prenem l'últim conegut (2024)
        if row.get("pob_2025", 0) == 0:
            for fallback_y in [2024, 2023]:
                if row.get(f"pob_{fallback_y}", 0) > 0:
                    row["pob_2025"] = row[f"pob_{fallback_y}"]
                    break

        p_2025 = row.get("pob_2025", 0)
        p_2015 = row.get("pob_2015", 0)
        p_2005 = row.get("pob_2005", 0)

        # Evolució 10 anys (2015 - 2025)
        if p_2025 > 0 and p_2015 > 0:
            row["var_10a_abs"] = p_2025 - p_2015
            row["var_10a_pct"] = round(((p_2025 - p_2015) / p_2015) * 100.0, 2)
        else:
            row["var_10a_abs"] = 0
            row["var_10a_pct"] = 0.0

        # Evolució 20 anys (2005 - 2025)
        if p_2025 > 0 and p_2005 > 0:
            row["var_20a_abs"] = p_2025 - p_2005
            row["var_20a_pct"] = round(((p_2025 - p_2005) / p_2005) * 100.0, 2)
        else:
            row["var_20a_abs"] = 0
            row["var_20a_pct"] = 0.0

        results.append(row)

    fieldnames = [
        "codi_ine", "nom_municipi", "codi_provincia", "nom_provincia"
    ] + [f"pob_{y}" for y in YEARS] + [
        "var_10a_abs", "var_10a_pct", "var_20a_abs", "var_20a_pct"
    ]

    print(f"💾 3/3 Escrivint 'poblacio_historica_municipis.csv' separat per ';'...")
    with open(output_csv, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";", extrasaction="ignore")
        writer.writeheader()
        for r in results:
            clean_row = {col: r.get(col, 0) for col in fieldnames}
            writer.writerow(clean_row)

    print(f"\n🎉 Sèrie històrica generada amb èxit en {time.time() - start_time:.1f}s a:\n   {output_csv}\n")


if __name__ == "__main__":
    main()