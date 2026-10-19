# Dashboard de Distribució de la Població a Catalunya

Taulell interactiu d'alt rendiment per a l'exploració, visualització i anàlisi demogràfica i territorial dels 947 municipis que conformen Catalunya.

L'eina integra en un únic entorn visual cartografia interactiva en temps real (mitjançant **Apache ECharts** i **TopoJSON**) i indicadors analítics estructurats (sexe, grans grups d'edat, balanç natural de naixements i defuncions, nacionalitat, afiliacions laborals i evolució històrica anual ininterrompuda des de l'any 2000 fins al 2025).

---

## 🚀 Característiques Principals

* **Cartografia Interactiva i Reactiva**:
  * Renderitzat directe sobre Apache ECharts a partir de geometries municipals TopoJSON (`MUN_CAT.json`).
  * 3 temàtiques cartogràfiques: Població total i evolució demogràfica a 10 anys (2015–2025) i 20 anys (2005–2025) amb paleta divergent.
  * Etiquetes dinàmiques automàtiques a escala 1:50.000 (`zoom >= 13.15`).
  * Panell de llegenda interactiu amb recompte de municipis i habitants ($N$ i $\%$) amb filtratge al clic.
* **Panell d'Indicadors Demogràfics**:
  * Distribució per Sexe.
  * Estructura per Grans Grups d'Edat.
  * Gràfic partit unificat de Naixements i Defuncions amb escala comuna i distintiu de Saldo Natural.
  * Població per Nacionalitat (Espanyola vs. Estrangera i continents).
  * Afiliacions a la Seguretat Social segons residència padronal.
  * Gràfic longitudinal inferior d'Evolució Històrica de la Població (2000–2025) sincronitzat temporalment amb el mapa.
* **Filtratge Territorial en Cascada**:
  * Desplegables jeràrquics per Província ➔ Comarca ➔ Municipi.
  * Enllaç directe a la fitxa oficial Idescat (*El municipi en xifres*) per al municipi seleccionat.
* **Exportació Dinàmica a Excel (CSV)**:
  * Exportació reactiva dels municipis filtrats o de la categoria de llegenda seleccionada.
  * Inclou totes les dades estadístiques d'Idescat i la sèrie històrica completa anual del Padró 2000–2025.
  * Format CSV separat per `;` amb capçalera UTF-8 BOM per a compatibilitat total amb Microsoft Excel.
* **Arquitectura Zero-Server-Install**:
  * Funciona al 100% en el client web com a aplicació estàtica pura (HTML5, CSS3, Vanilla JS ES6 modular).

---

## 📊 Fonts Estadístiques Oficials

* **Idescat (Institut d'Estadística de Catalunya)**:
  * Estadístiques municipals extretes de l'API REST oficial d'*El municipi en xifres* (`https://api.idescat.cat/emex/v1/dades.json`).
* **INE (Instituto Nacional de Estadística)**:
  * Xifres oficials del Padró Continu anual (2000–2025) descarregades de les taules provincials 2861, 2870, 2878 i 2900.
* **Geometries Oficials**:
  * Capa vectorial de polígons municipals de Catalunya en format TopoJSON (`MUN_CAT.json`).

Per a una explicació exhaustiva de la metodologia i correspondència de taules estadístiques, consulteu la guia a [`info/index.html`](info/index.html).

---

## 📁 Estructura del Repositori

```text
├── index.html                   # Pàgina principal del Dashboard
├── README.md                    # Documentació del projecte
├── .gitignore                   # Exclusions per a Git
├── cambios.md                   # Registre històric de versions i canvis (Changelog)
├── Prompts_historial.md         # Historial complet de converses i instruccions
├── assets/
│   ├── css/
│   │   └── dashboard.css        # Full d'estils i sistema de disseny institucional
│   └── js/
│       ├── app.js               # Controlador reactiu global i exportació CSV
│       ├── dataService.js       # Càrrega asíncrona, conversió TopoJSON i join O(1)
│       ├── mapView.js           # Motor cartogràfic Apache ECharts i llegenda interactiva
│       └── chartsView.js        # Gràfics analítics interconnectats
├── data/
│   ├── MUN_CAT.json             # Geometries municipals TopoJSON
│   ├── idescat_estadistiques.csv# Dades municipals de l'Idescat (14 taules)
│   ├── poblacio_historica_municipis.csv # Sèrie històrica Padró INE 2000-2025
│   ├── update_idescat_data.py   # Script ETL d'actualització d'Idescat
│   └── update_ine_poblacio_historic.py # Script ETL d'actualització de l'INE
├── imatges/
│   ├── family.svg               # Logotip corporatiu
│   └── info.svg                 # Icona de la guia informativa
└── info/
    └── index.html               # Portal de documentació i metodologia
```

---

## 🛠️ Com Executar el Projecte

Atès que és una aplicació web estàtica amb càrrega asíncrona de dades (fisshers CSV i JSON mitjançant `fetch`), només cal servir la carpeta amb qualsevol servidor web local.

Exemple amb Python:
```bash
python -m http.server 8000
```
I obriu al navegador: `http://localhost:8000`
