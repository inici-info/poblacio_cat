# Prompt de Construcció per a Antigravity: Dashboard Demogràfic de Catalunya

Actua com a Equip d'Enginyeria de Software d'Alt Rendiment especialitzat en Visualització de Geodades, Sistemes d'Informació Geogràfica (SIG) i Desenvolupament Web amb Apache ECharts.
El teu objectiu és construir de principi a fi el projecte complet del Dashboard interactiu **"Distribució de la població a Catalunya"**, prenent com a marc normatiu obligatori les directrius de `@Agents.md` i utilitzant exclusivament els fitxers de dades presents a la carpeta `data/`[cite: 5].

---

## 1. Estat Inicial de l'Espai de Treball i Restriccions d'Entorn

A l'arrel i estructura del projecte només hi ha els següents elements:
- **Arrel (`/`)**:
  - `Prompt_inicio.md`: Aquestes instruccions de generació.
  - `Agents.md`: Regles persistents d'arquitectura, disseny, estils i tokens de color[cite: 5].
- **Carpeta de dades (`data/`)**:
  - `data/idescat_estadistiques.csv`: Dataset net separat per punt i coma (`;`) amb les 14 taules estadístiques d'EMEX (superfície, densitat, edats, nacionalitats, naixements, defuncions, llars i seguretat social) amb el camp `codi_ine` en format text de 5 caràcters (`08001`, `08003`, etc.)[cite: 1, 5, 6].
  - `data/poblacio_historica_municipis.csv`: Dataset net separat per punt i coma (`;`) amb les xifres oficials anuals del Padró (INE) del 2000 al 2025 (`pob_2000` a `pob_2025`) i les columnes de variació calculades (`var_10a_abs`, `var_10a_pct`, `var_20a_abs`, `var_20a_pct`).
  - `data/MUN_CAT.json`: Capa geogràfica oficial de Catalunya en format **TopoJSON** que conté els polígons municipals[cite: 5].

### Restriccions Tècniques Fonamentals
1. **Zero-Server-Install en Producció**: L'aplicació ha de funcionar com un conjunt de fitxers estàtics purs (HTML5, CSS3, Vanilla JS ES6 modular). No s'ha de requerir cap procés de servidor de fons (backend) en funcionament ni base de dades[cite: 1].
2. **Motor Cartogràfic Únic**: El mapa es renderitza directament amb **Apache ECharts** mitjançant `echarts.registerMap('catalunya', geoJson)` des d'un convertidor en memòria client de TopoJSON a GeoJSON[cite: 1, 5].
3. **Unió en Memòria O(1)**: La geometria és independent de les dades[cite: 1]. L'enllaç entre `MUN_CAT.json` i els dos fitxers CSV es realitza en el client web mitjançant un índex hash sobre el `codi_ine` de 5 dígits[cite: 1].

---

## 2. Arquitectura Multiagent: Protocol Constructor ⇆ Crític

El desenvolupament no s'ha de generar com un bloc monolític[cite: 5]. El procés s'ha de segmentar en components atòmics on cada **Subagent Constructor** treballa en un bucle tancat amb un **Subagent Crític Independent** que valida el resultat real en un context net abans de donar la peça per aprovada[cite: 5]:

### Mòdul A: Gestor de Dades i Join en Memòria (`assets/js/dataService.js`)
* **Constructor**:
  - Implementa la classe `DataService`.
  - Executa en paral·lel (`Promise.all`) la descàrrega de `data/idescat_estadistiques.csv`, `data/poblacio_historica_municipis.csv` i `data/MUN_CAT.json`[cite: 1, 5].
  - Utilitza `PapaParse` amb configuració de delimitador `;` estricte[cite: 5].
  - Garanteix la integritat del `codi_ine` com a text de 5 dígits (afegint zeros a l'esquerra si fos necessari)[cite: 6].
  - Converteix el TopoJSON en memòria a estructura GeoJSON emprant la llibreria `topojson-client`[cite: 1].
  - Construeix una estructura `Map<string, Object>` indexada per `codi_ine` que fusiona les 14 taules estadístiques, la sèrie històrica 2000–2025 i les geometries[cite: 1].
* **Revisió de l'Agent Crític A**:
  - Inspeccionar que cap codi INE hagi perdut el dígit `0` inicial (ex: `08001` per Abrera, no `8001`)[cite: 6].
  - Comprovar que el delimitador de lectura sigui `;` i que no hi hagi columnes desplaçades[cite: 5].
  - Verificar que la funció de cerca per municipi respongui en temps $O(1)$[cite: 1].

### Mòdul B: Motor Cartogràfic ECharts (`assets/js/mapView.js`)
* **Constructor**:
  - Registra el mapa oficial amb `echarts.registerMap('catalunya', geoJsonData)` utilitzant la geometria provinent de `MUN_CAT.json`[cite: 5].
  - Implementa el selector dinàmic per a **3 temàtiques**:
    1. **Temàtica 1 (Població)**: 3 rangs verds segons població total:
       - Menys de 20.000 hab. $\rightarrow$ Verd fluix (`#648662`)[cite: 1, 2].
       - Entre 20.000 i 50.000 hab. $\rightarrow$ Verd mig (`#2B5738`)[cite: 1, 2].
       - Més de 50.000 hab. $\rightarrow$ Verd fosc (`#1A3E26`)[cite: 1, 2].
    2. **Temàtica 2 (Evolució de la població en 10 anys: 2015–2025)**: Escala divergent de 6 classes basada en `var_10a_pct`:
       - Creixement (3 verds): Fluix (`#648662`), Mig (`#2B5738`), Fosc (`#1A3E26`)[cite: 1, 2].
       - Decreixement (3 vermells): Fluix (`#E84A4F`), Mig (`#D3262D`), Fosc (`#8B1C24`)[cite: 1, 2, 5].
    3. **Temàtica 3 (Evolució de la població en 20 anys: 2005–2025)**: Mateixa escala divergent de 6 rangs emprant `var_20a_pct`[cite: 1].
  - **Etiquetatge dinàmic a escala 1:50.000**: Detecta l'esdeveniment de zoom (`roam`). En superar l'escala equivalent a 1:50.000 (`zoom >= 13.15`), activa automàticament les etiquetes (`label: { show: true }`) mostrant el **nom del municipi** i el **valor exacte de la temàtica activa**[cite: 1].
  - **Llegenda interactiva amb recompte**: Component HTML/JS que renderitza per a cada classe: mostra de color, interval de valors, nombre absolut de municipis ($N$) i percentatge ($\%$) sobre l'àmbit actiu[cite: 1]. Clicar a una classe filtra el mapa destacant només aquells municipis i propaga el filtre als 6 gràfics[cite: 1].
* **Revisió de l'Agent Crític B**:
  - Validar que no s'ha utilitzat cap llibreria aliena (com Leaflet o Mapbox) i que tot corre sobre Apache ECharts[cite: 1, 5].
  - Comprovar que el canvi de temàtica no recrea la instància d'ECharts sinó que utilitza `setOption()` de manera reactiva[cite: 1].
  - Verificar que el filtre per clic a la llegenda actualitza correctament el mapa i notifica el canvi d'estat global[cite: 1].

### Mòdul C: Panell de 6 Gràfics Interactius ECharts (`assets/js/chartsView.js`)
* **Constructor**:
  - Inicialitza i gestiona 6 instàncies d'Apache ECharts responsives:
    1. **Gràfic 1 — Població per Sexe (`pie-borderRadius`, Taula `t195`)**:
       - Sectors: Homes (Blau mig `#5D939F`) i Dones (Vermell mig `#D3262D`)[cite: 1, 5].
       - Interacció mestra: En clicar sobre un sector, commuta el filtre global `selectedSex` (Tots / Homes / Dones) i actualitza automàticament els Gràfics 2, 3, 4 i 5[cite: 1].
    2. **Gràfic 2 — Població per Grups d'Edat (`bar-y-category-stack`, Taules `t31` i `t37`)**:
       - Eix Y: `De 0 a 14 anys`, `De 15 a 64 anys`, `De 65 a 84 anys`, `De 85 anys i més`[cite: 1].
       - Sèries apilades amb els mateixos colors de sexe: Homes (`#5D939F`) i Dones (`#D3262D`)[cite: 1, 5]. Si el Gràfic 1 té un sexe filtrat, només es renderitza la sèrie coincident[cite: 1].
    3. **Gràfic 3 — Població per Nacionalitat (`pie-borderRadius`, Taules `t78` i `t81`)**:
       - Sectors: Espanyola (Verd mig `#2B5738`) i Estrangera (Marró mig `#D4B581`)[cite: 1, 2, 5].
       - Respon al filtre de sexe: mostra `t78 + t81` (total), només `t78` (homes) o només `t81` (dones)[cite: 1].
    4. **Gràfic 4 — Naixements per Sexe (`pie-borderRadius`, Taula `t164`)**:
       - Sectors: Nens (Blau mig `#5D939F`) i Nenes (Vermell mig `#D3262D`)[cite: 1, 5]. Respon al filtre de sexe de G1[cite: 1].
    5. **Gràfic 5 — Defuncions per Sexe (`pie-borderRadius`, Taula `t165`)**:
       - Sectors: Homes (Blau mig `#5D939F`) i Dones (Vermell mig `#D3262D`)[cite: 1, 5]. Respon al filtre de sexe de G1[cite: 1].
    6. **Gràfic 6 — Afiliacions a la Seguretat Social per Sectors (`bar-y-category-stack`, Taula `t183`)**:
       - Eix Y: `Agricultura`, `Indústria`, `Construcció`, `Serveis`[cite: 1].
       - Totes les barres en Marró mig (`#D4B581`)[cite: 1, 5]. Etiqueta visible a la barra que mostra tant el **valor absolut com el percentatge (%)** calculat sobre el total d'afiliacions[cite: 1].
* **Revisió de l'Agent Crític C**:
  - Verificar que fer clic a "Dones" a G1 filtra efectivament les sèries de G2, G3, G4 i G5[cite: 1].
  - Comprovar que tots els `tooltip` estan configurats amb format de milers català (punts com a separadors de milers).
  - Comprovar que cada gràfic té vinculat el seu gestor de redimensionament (`window.addEventListener('resize')`)[cite: 1].

### Mòdul D: UI/UX, Disseny Responsive i Enrutament URL (`index.html`, `assets/css/dashboard.css`, `assets/js/app.js`)
* **Constructor**:
  - **Barra Superior**:
    - Esquerra: Títol institucional **"Distribució de la població a Catalunya"**[cite: 1].
    - Dreta: Desplegables jeràrquics en cascada per a **Província**, **Comarca** i **Municipi**, acompanyats del botó "Restablir filtres" i botó "Descarregar dades CSV"[cite: 1].
  - **Enrutament URL (`?m=`)**:
    - Suport natiu del paràmetre `?m=XXXXX` mitjançant `URLSearchParams`[cite: 1]. Si la URL conté per exemple `?m=08003`, el sistema selecciona automàticament la Província (Barcelona), Comarca (Maresme) i Municipi (Alella), centra el mapa i filtra els 6 gràfics[cite: 1].
    - Modificar els filtres manuals actualitza la URL en temps real mitjançant `window.history.replaceState()`[cite: 1].
  - **Regles Estrictes de Disseny**:
    - **Cantonades**: Tots els contenidors, targetes, taules i botons han de tenir exactament `border-radius: 5px !important;`[cite: 5].
    - **Absència d'Ombres**: Queda terminantment prohibit l'ús d'ombres de caixa. S'ha d'aplicar `box-shadow: none !important;` a tots els elements[cite: 5].
    - Estètica neta i institucional: Fons general `#F3F4F6`, superfícies de targetes en blanc pur `#FFFFFF` i vores discretes `1px solid #D1D5DB`.
  - **Adaptabilitat Total (Responsive)**:
    - Escriptori ($\ge 1200\text{px}$): Pantalla completa a 100vh d'alçada, amb mapa a l'esquerra ocupant aproximadament el 50% de l'amplada i graella de 6 gràfics a la dreta[cite: 1].
    - Tauleta ($768\text{px} - 1199\text{px}$): Graella de dues columnes amb mapa superior i gràfics agrupats en parelles.
    - Mòbil ($< 768\text{px}$): Distribució vertical fluida amb barres d'eines col·lapsables i panells apilats d'accés ràpid.
* **Revisió de l'Agent Crític D**:
  - Inspeccionar exhaustivament el fitxer `dashboard.css` per garantir que no hi ha cap propietat `box-shadow` activa i que tots els selectors contenidors mantenen `border-radius: 5px`[cite: 5].
  - Provar l'enllaç amb paràmetre URL `?m=08003` i verificar que carrega directament el municipi seleccionat[cite: 1].
  - Comprovar que no es genera scroll horitzontal no desitjat en cap resolució.

---

## 3. Especificació dels Tokens de Color

Els subagents han d'aplicar de manera uniforme els següents valors hexadecimals en totes les instàncies CSS i opcions d'Apache ECharts:

- **GAMMA DE VERMELLS**:
  - Fosc: `#8B1C24` (Decreixement demogràfic sever)[cite: 1, 2]
  - Mig: `#D3262D` (Dones, defuncions dones, decreixement demogràfic moderat)[cite: 1, 2, 5]
  - Fluix: `#E84A4F` (Decreixement demogràfic lleu)[cite: 1, 2]
- **GAMMA DE BLAUS**:
  - Fosc: `#3A6B7E`[cite: 2]
  - Mig: `#5D939F` (Homes, naixements nens, sèrie masculina)[cite: 1, 2, 5]
  - Fluix: `#8EBDC4`[cite: 2]
- **GAMMA DE MARRONS**:
  - Fosc: `#B5956A`[cite: 2]
  - Mig: `#D4B581` (Nacionalitat estrangera, barres d'afiliacions a la Seguretat Social `t183`)[cite: 1, 5]
  - Fluix: `#EAD5AC`[cite: 2]
- **GAMMA DE VERDS**:
  - Fosc: `#1A3E26` (Població $> 50.000$ hab., creixement demogràfic alt)[cite: 1, 2]
  - Mig: `#2B5738` (Població $20.000 - 50.000$ hab., nacionalitat espanyola, creixement demogràfic moderat)[cite: 1, 2]
  - Fluix: `#648662` (Població $< 20.000$ hab., creixement demogràfic lleu)[cite: 1, 2]

---

## 4. Estructura Final de Fitxers que Cal Construir

L'agent ha de generar els fitxers següents mantenint intactes els fitxers preexistents de la carpeta `data/`:

```text
/
├── Prompt_inicio.md              (Fitxer d'instruccions mestre)
├── Agents.md                     (Regles generals del projecte)
├── index.html                    (Estructura DOM del dashboard i barra superior)
├── assets/
│   ├── css/
│   │   └── dashboard.css         (Estils responsive, border-radius: 5px, box-shadow: none)
│   ├── js/
│   │   ├── app.js                (Orquestrador d'estat global, gestió d'esdeveniments i URL ?m=)
│   │   ├── dataService.js        (Carregador O(1), parser CSV ';' i conversor TopoJSON)
│   │   ├── mapView.js            (Controlador cartogràfic ECharts, 3 temàtiques i zoom 1:50k)
│   │   └── chartsView.js         (Gestor dels 6 gràfics ECharts i filtre creuat per sexe)
│   └── vendor/
│       ├── echarts.min.js        (Llibreria oficial Apache ECharts v5)
│       ├── papaparse.min.js      (Motor de parseig de CSV ràpid)
│       └── topojson-client.min.js(Convertidor de TopoJSON a GeoJSON en memòria)
└── data/
    ├── idescat_estadistiques.csv (Existent: 14 taules estadístiques separades per ';')
    ├── poblacio_historica_municipis.csv (Existent: sèrie 2000-2025 i variacions)
    └── MUN_CAT.json              (Existent: capa oficial en TopoJSON)