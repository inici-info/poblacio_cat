# AGENTS.md — Regles i Estàndards per a Dashboards ECharts a Antigravity

## 1. Restriccions d'Entorn i Servidor
- **Zero Daemon Backend**: El servidor disposa de PHP 8.3 i Python 3 per a tasques d'ETL/scripts, però l'aplicació en producció funciona com una aplicació web estàtica d'alt rendiment (HTML5, Vanilla JS ES6, CSS3, CSV i TopoJSON).
- **Separació Geometria / Dades**: La capa geogràfica és `data/geo/municipis_catalunya.topojson` i conté exclusivament els límits i el camp `codi_ine` (5 dígits). Les dades viuen a `data/idescat_municipis.csv` (delimitat per punt i coma `;`). La unió (join) es fa en memòria del client en O(1) mitjançant un `Map<string, Object>`.
- **Motor Cartogràfic**: Tot el mapa es renderitza directament amb **Apache ECharts** mitjançant `echarts.registerMap()`.

## 2. Sistema de Disseny Obligatori (Design Tokens)
- **Contenidors i Targetes**:
  - `border-radius: 5px !important;`
  - `box-shadow: none !important;` (prohibit afegir ombres)
  - Vora: `1px solid #D1D5DB`
  - Fons d'aplicació: `#F3F4F6` | Fons de targetes: `#FFFFFF`
  - Tipografia: `'Inter', system-ui, -apple-system, sans-serif`

- **Paleta Cromàtica Oficial (Imatge Colors.jpg)**:
  - **VERMELLS**:
    - Fosc: `#8B1C24`
    - Mig: `#D3262D` (Dones, defuncions dones, decreixement fort)
    - Fluix: `#E84A4F` (Decreixement lleu)
  - **BLAUS**:
    - Fosc: `#3A6B7E`
    - Mig: `#5D939F` (Homes, naixements nens, sèrie masculina)
    - Fluix: `#8EBDC4`
  - **MARRONS**:
    - Fosc: `#B5956A`
    - Mig: `#D4B581` (Estrangers a nacionalitat, barres de sectors SS t183)
    - Fluix: `#EAD5AC`
  - **VERDS**:
    - Fosc: `#1A3E26` (Població > 50k, creixement fort)
    - Mig: `#2B5738` (Població 20k-50k, espanyols a nacionalitat, creixement mig)
    - Fluix: `#648662` (Població < 20k, creixement lleu)

## 3. Comportament Reactiu i URL
- Suport natiu del paràmetre `?m=XXXXX` (Ex: `?m=08003`). En carregar, selecciona la província, comarca i municipi, centra el mapa i filtra els 6 gràfics. En canviar els filtres, actualitza la URL amb `history.replaceState()`.
- En zoom d'escala 1:50.000 (`zoom >= 13.15` d'ECharts), activar etiquetes amb nom de municipi i valor actiu.
- Clic a la llegenda del mapa filtra els municipis d'aquella categoria i actualitza els 6 gràfics.
- Clic al Gràfic 1 (Sexe) filtra els gràfics 2, 3, 4 i 5.

## 4. Protocol del Bucle Multiagent
- Cap component es dona per finalitzat sense la revisió independent de l'Agent Crític.
- L'Agent Crític valida que el CSS no tingui ombres, que els radis siguin de 5px, que els 6 gràfics responguin als filtres i que el CSV utilitzi `;`.