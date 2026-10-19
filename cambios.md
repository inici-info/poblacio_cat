# Registre de Canvis del Projecte (Changelog)

Aquest document manté el registre històric detallat de versions, funcionalitats afegides, canvis de disseny i correccions tècniques del **Dashboard Demogràfic de Catalunya**.

---

## [Versió 1.18] - 2026-10-19
### Neteja d'Etiquetes al Gràfic de Població per Sexe i Desglossament Complet a la Llegenda
* **Retirada de les Etiquetes Interiors del Gràfic**:
  * S'han suprimit les etiquetes percentuals interiors (`label.show: false` i `emphasis.label.show: false`) que es col·lapsaven sobre els sectors del dònut de *Població per Sexe*.
* **Desglossament Integrat a la Llegenda Inferior**:
  * La llegenda situada a sota del gràfic mostra ara tant el volum absolut d'habitants com el percentatge de dones i homes en format complet (p. ex.: `Homes: 3.992.835 hab. (49.3%)` i `Dones: 4.131.291 hab. (50.7%)`).
  * S'ha habilitat la interacció reactiva (`selectedMode: false` i detecció de clic a la llegenda) de manera que fer clic tant a un sector del dònut com a la llegenda aplica el filtratge per sexe a la resta del panell sense amagar el sector.
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.18` i indicador visual de versió `v1.18`.

---

## [Versió 1.17] - 2026-10-19
### Unificació Tipogràfica a 13px i Punt Mig Separador a l'Indicador d'Àmbit
* **Format Net sense Parèntesis**:
  * S'eliminen els parèntesis `(` i `)` que envoltaven les dades demogràfiques de municipis i habitants, presentant el text de manera neta i directa (p. ex.: `221 municipis — 830.429 hab.`).
* **Punt Mig Separador (`·`)**:
  * S'afegeix un caràcter de punt volat (`·`) amb la classe `.scope-sep` entre el nom de l'àmbit territorial i el recompte d'habitants i municipis (p. ex.: `Província: Girona · 221 municipis — 830.429 hab.` o `Catalunya · 947 municipis — 8.124.126 hab.`).
* **Homogeneïtzació de la Mida de Lletra a 13px**:
  * S'iguala la mida de font de `.scope-count` amb la del títol `.scope-title` a **`13px`** (`font-weight: 700`), conservant el color vermell fosc corporatiu `#8B1C24`.
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.17` i indicador visual de versió `v1.17`.

---

## [Versió 1.16] - 2026-10-19
### Correcció del Col·lapse d'Etiquetes en Canvi de Temàtica Cartogràfica
* **Sincronització de Zoom i Persistència d'Enquadrament**:
  * Es resol el problema pel qual, en canviar de mapa (per exemple de *Població* a *Evolució*), el mapa es reiniciava a escala 1.05 però mantenia actiu l'estat intern de zoom previ (`currentZoom >= 13.15`), provocant que tots els 947 municipis mostressin les seves etiquetes simultàniament col·lapsant-se sobre el mapa.
  * S'incorpora el paràmetre `shouldResetZoom` a `MapView.update()` i es connecta amb `refreshViews(shouldCenterMap)`.
  * En canvis de temàtica (`pop`, `evol10`, `evol20`), el mapa conserva exactament el nivell de zoom i centre territorial actius (`currentCenter`), actualitzant només la simbologia cromàtica i les dades sense salts visuals ni superposicions.
  * En restabliment (`resetView()`, botó de caseta o canvi de filtre), el zoom es reinicia a 1.05 i les etiquetes s'apaguen de forma garantida (`show: false`).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.16` i indicador visual de versió `v1.16`.

---

## [Versió 1.15] - 2026-10-19
### Exportació Integral de l'Historial de Prompts en Castellà
* **Generació del Document de Traçabilitat (`Prompts_historial.md`)**:
  * S'ha creat a l'arrel del projecte el fitxer `Prompts_historial.md` que conté la totalitat de converses, requeriments d'usuari i respostes tècniques de la IA des de la gènesi del projecte (15-10-2026) fins a l'actualitat.
  * Traducció unificada i completa al **castellà**, amb incorporació de data i hora per a cada interacció i enllaços clicables als fitxers modificats.

---

## [Versió 1.14] - 2026-10-19
### Icona d'Informació Sense Marc i Ajust Textual a la Guia
* **Icona d'Informació Neta sense Marc**:
  * S'ha suprimit la vora i el requadre de fons del botó de la icona informativa (`.footer-info-btn` a `dashboard.css`), mostrant exclusivament la icona `info.svg` integrada de manera fluida i neta al costat de `Font: ...`.
* **Ajust del Text Introductori a la Guia (`info/index.html`)**:
  * S'ha actualitzat la redacció de la secció 1 amb el redactat precís sol·licitat pel client (*"El Dashboard de Distribució de la Població a Catalunya és taulell per a l'exploració, visualització i anàlisi demogràfica territorial dels 947 municipis que conformen Catalunya..."*).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.14` i indicador visual de versió `v1.14`.

---

## [Versió 1.13] - 2026-10-19
### Nova Pàgina d'Ajuda i Metodologia (`/info`) i Icona Informativa al Peu
* **Creació del Portal d'Informació i Metodologia (`info/index.html`)**:
  * Pàgina d'ajuda completa allotjada a la subcarpeta `info/`, fidel al sistema de disseny institucional.
  * Manté la capçalera oficial i incorpora el botó **"← Tornar a consultar les dades"** a la dreta per reprendre la consulta ràpidament.
  * Documentació exhaustiva de les fonts oficials:
    * **Idescat**: Detall de l'API EMEX (`api.idescat.cat/emex/v1`), codis i contingut de les taules emprades (`t176`, `t192`, `t195`, `t31`, `t37`, `t78`, `t81`, `t164`, `t165`, `t183`, `t184`, `t97`, `t108`, `t196`) i fitxa municipal directa *El municipi en xifres*.
    * **INE**: Sèrie històrica anual ininterrompuda del Padró (2000-2025) per a les 4 províncies catalanes (taules 2861, 2870, 2878, 2900).
    * **Exportació dinàmica**: Explicació del filtratge reactiu (àmbit territorial i per llegenda) i format Excel (CSV amb UTF-8 BOM i punt i coma).
    * **Arquitectura i scripts**: Descripció dels scripts ETL en Python (`update_idescat_data.py` i `update_ine_poblacio_historic.py`) i model *Zero Daemon Backend*.
* **Icona Informativa al Peu Inferior (`index.html`)**:
  * Incorporació de la icona oficial `imatges/info.svg` a l'extrem inferior esquerre, immediatament al costat del text de fonts ("Font:..."), que enllaça directament a la pàgina d'informació (`info/`).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.13` i indicador visual de versió `v1.13`.

---

## [Versió 1.12] - 2026-10-19
### Visibilitat del Botó Treure Filtre de Llegenda i Millores Responsive (Mòbil i Tauleta)
* **Visibilitat i Estil del Botó "✕ Treure" a la Llegenda de Població**:
  * S'ha corregit el problema de desbordament a la capçalera de la llegenda de població (`.map-legend-panel` de 193px): el títol (`.legend-title`) ara és flexible (`flex: 1; min-width: 0`) i el botó `.legend-clear-btn` té `white-space: nowrap; flex-shrink: 0`, garantint que **"✕ Treure"** aparegui sempre completament visible en una sola línia i amb estètica d'etiqueta vermella neta (`#FEE2E2` / `#D3262D`).
* **Nou Ordre de Visualització a Pantalles Petites (Tauletes i Mòbils)**:
  * Inversió de l'ordre de les columnes a pantalles inferiors a 1200px: primer es visualitza el bloc del **Mapa** seguit de la targeta d'**Evolució** (`.map-column { order: 1 }`), i a continuació es desplega la **resta de gràfics** (`.charts-column { order: 2 }`).
* **Llegenda del Mapa 100% Visible en Mòbil**:
  * S'ha eliminat la limitació fixa d'alçada (`180px`) de la llegenda en dispositius mòbils, passant a `height: auto; overflow: visible;`, i el contenidor del mapa (`.map-card` / `.map-body-wrapper`) s'adapta fluidament (`height: auto`), permetent veure tots els intervals i targetes de la llegenda sense cap retall ni solapament.
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.12` i indicador visual de versió `v1.12`.

---

## [Versió 1.11] - 2026-10-19
### Alineació de Gràfics Inferiors, Exportació Enriquida i Enllaç EMEX Municipal
* **Alineació Horitzontal Recta de la Franja Inferior**:
  * S'ha sincronitzat l'alçada del gràfic d'evolució històrica (`.evolution-card`) amb els dos gràfics inferiors de la columna dreta (*Població per Nacionalitat* i *Afiliacions Seguretat Social*, fila 3 de `.charts-grid`). Mitjançant `ResizeObserver` reactiu, ambdues targetes mantenen exactament la mateixa alçada i la línia superior d'ajustament és completament recta.
* **Eliminació de la Numeració dels Gràfics**:
  * S'han retirat els números prefixats dels títols dels 5 gràfics de la graella (*Població per Sexe*, *Grups d'Edat*, *Defuncions i Naixements*, *Població per Nacionalitat*, *Afiliacions Seguretat Social*) per un estil més sobri i institucional.
* **Botó de Descàrrega Excel (CSV) amb Sèrie Històrica Completa**:
  * Text del botó actualitzat a **"Descarregar dades Excel (CSV)"** i el seu text d'ajuda (tooltip) a **"Exporta dades seleccionades a Excel (CSV)"**.
  * S'ha ampliat l'exportació en memòria del client incloent directament tota la sèrie històrica de població anual (`pob_2000` fins a `pob_2025`), a més dels valors absoluts i relatius d'evolució a 10 i 20 anys (`var_10a_abs`, `var_10a_pct`, `var_20a_abs`, `var_20a_pct`) i el codi oficial Idescat (`codi_idescat`).
* **Nou Botó Contextual de Consulta EMEX per Municipi**:
  * En filtrar per un municipi concret, s'activa automàticament a l'esquerra del botó d'exportació un nou botó amb la mateixa estètica (`.btn.btn-gray`): **"Consulta dades completes de [Nom]"**, que enllaça a la fitxa oficial de l'Idescat (*El municipi en xifres*) obrint-se en una nova pestanya (`https://www.idescat.cat/emex/?id=XXXXXX`).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.11` i indicador visual de versió `v1.11`.

---

## [Versió 1.10] - 2026-10-19
### Simplificació de l'Etiqueta d'Àmbit Global i Ressaltat del Recompte Demogràfic
* **Simplificació de l'indicador global a "Catalunya"**:
  * Quan no hi ha cap filtre actiu (província, comarca o municipi), l'indicador superior de gràfics (`#scopeTitle`) i el gràfic d'evolució (`#evolutionScopeSubtitle`) mostren de manera neta i directa **"Catalunya"** (eliminant l'afegit `(Total àmbit)`).
* **Ressaltat Cromàtic i Tipogràfic del Recompte de Municipis i Habitants**:
  * La informació de recompte (`.scope-count`, p. ex.: `(947 municipis — 8.124.126 hab.)` o `(231 municipis — 458.226 hab.)`) passa a destacar-se en **negreta (`font-weight: 700`)** i en color **vermell fosc institucional (`#8B1C24`)** de la paleta oficial, augmentant-ne la visibilitat i jerarquia visual.
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.10` i indicador visual de versió `v1.10`.

---

## [Versió 1.9] - 2026-10-19
### Optimització de l'Amplada dels Panells de Llegenda
* **Reducció de l'amplada de la llegenda del mapa de població**:
  * Reducció de 42 px (`235px` a `193px`) per ajustar el marc i eliminar l'excés d'espai en blanc a la dreta del text.
* **Reducció de l'amplada de la llegenda dels dos mapes d'evolució (10 i 20 anys)**:
  * Reducció de 55 px (`320px` a `265px`, `.map-legend-panel.theme-evol`) per un disseny més compacte i integrat.
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.9` i indicador visual de versió `v1.9`.

---

## [Versió 1.8] - 2026-10-17
### Ampliació de la Llegenda d'Evolució i Unificació del Percentatge amb el Valor
* **Ampliació Dinàmica de la Llegenda en Mapes d'Evolució**:
  * Increment automàtic de l'amplada del bloc de la llegenda a `320px` (`.map-legend-panel.theme-evol`) quan s'activa el mapa d'Evolució a 10 anys o a 20 anys.
  * S'assegura que tant el títol de la temàtica (`EVOLUCIÓ 10 ANYS (2015–2025)` / `EVOLUCIÓ 20 ANYS (2005–2025)`) com l'etiqueta més extensa (`Creixement significatiu (+10% a +25%)`) es mostren en una única línia contínua (`white-space: nowrap`).
* **Percentatge Integrat al Costat del Valor a Totes les Llegendes**:
  * Eliminat el desplaçament del percentatge cap a l'extrem dret del requadre.
  * El percentatge passa a mostrar-se immediatament al costat del valor absolut i la unitat en format `877 mun. (92,6%)` i `2.277.021 hab. (28,0%)`.
  * S'aplica de forma homogènia a les categories de tots els mapes (Població total, Evolució 10 anys, Evolució 20 anys i municipis sense dades).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.8` i indicador visual de versió `v1.8`.

---

## [Versió 1.7] - 2026-10-17
### Millora Descriptiva de Llegenda d'Evolució i Sincronització Temporal del Gràfic Històric
* **Llegendes Descriptives dels Mapes d'Evolució**:
  * Substitució dels títols numèrics purs per categories descriptives més entenedores combinades amb els percentatges oficials:
    * **Evolució 10 anys (2015–2025)**:
      * `Descens significatiu (< -10%)`
      * `Descens moderat (-10% a -5%)`
      * `Descens lleuger (<-5%)`
      * `Creixement lleuger (< +5%)`
      * `Creixement significatiu (+5% a +15%)`
      * `Creixement molt intens (> +15%)`
    * **Evolució 20 anys (2005–2025)**:
      * `Descens significatiu (< -15%)`
      * `Descens moderat (-15% a -5%)`
      * `Descens lleuger (<-5%)`
      * `Creixement lleuger (< +10%)`
      * `Creixement significatiu (+10% a +25%)`
      * `Creixement molt intens (> +25%)`
  * Ampliació de l'amplada del bloc de llegenda (`.map-legend-panel`) a `235px` per allotjar el redactat amb perfecta llegibilitat.
* **Sincronització Temporal del Gràfic "Evolució de la Població"**:
  * En seleccionar la temàtica **Evolució 10 anys (2015–2025)**, el gràfic inferior enfoca exclusivament el període **2015–2025**, mostrant la variació acumulada i el percentatge corresponent a aquest decenni tant al subtítol com al tooltip interactiu.
  * En seleccionar la temàtica **Evolució 20 anys (2005–2025)**, el gràfic s'enfoca al període **2005–2025** amb el càlcul de creixement relatiu a l'any 2005.
  * En seleccionar **Població total**, es restableix automàticament l'escala completa **2000–2025**.
  * S'actualitza dinàmicament el títol de la targeta (`Evolució de la Població (2015–2025)`, `(2005–2025)` o `(2000–2025)`).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.7` i indicador visual de versió `v1.7`.

---

## [Versió 1.6] - 2026-10-17
### Unificació de Defuncions i Naixements en Gràfic Partit i Neteja de Filtre de Sexe
* **Eliminació de l'Indicador de Filtre per Sexe**:
  * Eliminat el xip/indicador `Sexe: Tots` de la capçalera de gràfics (`#sexStatus`), simplificant l'espai visual de control.
* **Nou Gràfic Partit de Defuncions i Naixements (`#chart3`)**:
  * Agrupació dels antics gràfics separats de Defuncions i Naixements en una única targeta d'ample complet (`.chart-card-full`), estalviant espai vertical i millorant la correlació demogràfica.
  * Disseny d'estil "Grups d'Edat" amb barres horitzontals codificades per sexe (Homes en blau verdós `#5D939F` i Dones en vermell institucional `#D3262D`).
  * **Gràfic partit (doble quadrícula)**: Defuncions situades a l'esquerra i Naixements a la dreta.
  * **Mateixa escala numèrica compartida a l'eix X**: Els dos costats comparteixen el mateix màxim proporcional per a una comparativa directa i rigorosa dels dos fenòmens vitals.
  * **Etiquetes de valor al costat de cada barra** (`position: 'right'`): Mostren la xifra absoluta i el percentatge corresponent directament a la dreta de la barra.
  * **Distintiu de Saldo Natural**: Càlcul automàtic de la diferència natural (`Naixements - Defuncions`) mostrat al títol de la targeta amb indicació de creixement verd o pèrdua vermella.
* **Renumeració de Gràfics**:
  * Passa de 6 a 5 targetes principals ordenades de l'1 al 5, mantenint el gràfic longitudinal d'evolució al peu.
* **Control de Versions**:
  * Actualització de la referència dels recursos a `?v=1.6` i indicador visual de versió `v1.6`.

---

## [Versió 1.5] - 2026-10-17
### Diferenciació Cromàtica del Mapa de Població
* **Ajust de la Paleta de Població Total (`pop`)**:
  * Primer rang (`< 20.000 hab.`): Assignat el color **Marró fluix** (`#EAD5AC`), garantint un contrast immediat i clar respecte als municipis de major grandària.
  * Segon rang (`20.000 - 50.000 hab.`): Assignat el color **Verd fluix** (`#648662`).
  * Tercer rang (`> 50.000 hab.`): Es manté en **Verd fosc** (`#1A3E26`).
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.5` i indicador de versió visual `v1.5`.

---

## [Versió 1.4] - 2026-10-17
### Reubicació de Fonts Estadístiques, Botó de Descàrrega CSV al Peu i Ampliació de Títol
* **Títol Principal Ampliat**:
  * Increment de la mida de font del títol principal (`.brand-title`) a `21px` (`font-weight: 700`) i icona a `40px` per a un millor impacte visual.
* **Peu de Pàgina Institucional en Línia Única (`bottom-footer`)**:
  * Actualitzat el text exacte de les fonts oficials a l'esquerra:
    `Font: A partir de dades històriques INE i d'estadístiques municipals Idescat (El municipi en xifres)`.
  * Enllaç interactiu sobre `El municipi en xifres` a `https://www.idescat.cat/emex/` en finestra nova (`target="_blank"`).
  * Alineació estricta en una sola línia (`flex-wrap: nowrap`) situant a la dreta el botó en gris "Descarregar dades CSV" (`.btn-gray`) just al costat de l'indicador de versió `(v1.4)`.
* **Optimització de la Capçalera Superior**:
  * La capçalera ara allotja exclusivament la marca i els tres desplegables territorials (Província, Comarca i Municipi) sense desbordaments.
* **Control de Versions**:
  * Actualització dels recursos a `?v=1.4` i indicador de versió visual `v1.4`.

---

## [Versió 1.3] - 2026-10-17
### Integració de la Llegenda en Bloc Lateral i Botó de Restabliment a la Barra d'Eines
* **Llegenda Integrada com a Bloc Lateral Dreta**:
  * Integració visual de `#legendContainer` com a panell lateral dret (`.map-legend-panel`) dins el mateix bloc blanc del mapa (`.map-body-wrapper`), eliminant qualsevol separació grisa i garantint que sempre sigui 100% visible.
  * Capçalera pròpia amb títol de temàtica i botó de desfer filtre actiu (`✕ Treure`) si s'ha clicat una categoria.
  * Valors detallats per categoria: recompte de municipis (`N` i `%`) i població acumulada (`hab.` i `%`).
* **Nou Botó de Restablir Filtres a la Barra d'Eines del Mapa**:
  * Eliminat el text/xip `"Zoom 1:50k activa etiquetes"` de la barra d'eines del mapa.
  * Substituït pel botó d'acció ràpida de restablir filtres (`#btnReset`) en format només icona amb tooltip contextual ("Neteja tots els filtres") en passar-hi per sobre.
  * Alliberament d'espai a la capçalera principal per assegurar que tots els selectors (Província, Comarca, Municipi) i el botó de CSV es mostrin còmodament sense tallar-se.
* **Millores d'Ajust Dinàmic (ResizeObserver)**:
  * Incorporació de `ResizeObserver` al contenidor cartogràfic per adaptar automàticament les dimensions del canvas ECharts a qualsevol canvi de resolució o mida de la finestra.
* **Control de Memòria Cau**:
  * Actualització dels recursos a `?v=1.3` i indicador de versió visual `v1.3`.

---

## [Versió 1.2] - 2026-10-16
### Redisseny i Ampliació de la Llegenda del Mapa & Versionat Visual
* **Format i Ubicació de la Llegenda**:
  * Reubicació de la llegenda a la part inferior dreta del mapa (`bottom: 12px; right: 12px;`) en format **vertical flotant** superposat al mapa.
  * Disseny amb targetes arrodonides institucionals (`border-radius: 5px !important`), fons blanc translúcid (`backdrop-filter`) i sense ombres (`box-shadow: none !important`).
* **Ampliació de la Informació de cada Categoria**:
  * Càlcul i visualització simultània del **nombre de municipis** i el seu **percentatge (%)** respecte al total de municipis de l'àmbit actiu.
  * Càlcul i visualització del **nombre acumulat d'habitants** i el seu **percentatge (%)** respecte a la població total de l'àmbit actiu.
  * Valors oficials per al mapa de població total a Catalunya (947 municipis, 8.124.126 hab.):
    * `< 20.000 hab.`: **877 municipis (92,6%)** · **2.277.021 hab. (28,0%)**
    * `20.000 - 50.000 hab.`: **46 municipis (4,9%)** · **1.447.898 hab. (17,8%)**
    * `> 50.000 hab.`: **24 municipis (2,5%)** · **4.399.207 hab. (54,1%)**
  * Suport dinàmic per a totes les temàtiques cartogràfiques (Població 2025, Evolució 10 anys i Evolució 20 anys).
* **Versionat Visual del Dashboard**:
  * Afegit l'indicador de versió `v1.2` a la cantonada inferior dreta del dashboard en to gris suau (`#9CA3AF`).
  * Inclusió de paràmetres de control de memòria cau (`?v=1.2`) a tots els fitxers CSS i JS per garantir que el navegador sempre carregui la versió més recent.
* **Separació de Capes al DOM**:
  * Separació de `#legendContainer` de l'interior del canvas ECharts per assegurar la màxima estabilitat i visibilitat davant zoom i arrossegaments del mapa.

---

## [Versió 1.1] - 2026-10-16
### Millores Cartogràfiques, Correccions de Dades INE i Reorganització de Gràfics
* **Correcció Descàrrega Dades INE (Tarragona)**:
  * Resolució de l'error 404 en la descàrrega de dades oficials de l'INE: actualització del codi de taula de Tarragona de `2897` (erroni) a `2900` (taula oficial).
  * Recuperació del 100% dels municipis catalans a `poblacio_historica_municipis.csv`: **947 de 947 municipis** (Barcelona: 311, Girona: 221, Lleida: 231, Tarragona: 184).
* **Identitat Visual i Iconografia**:
  * Substitució de la icona superior esquerra pel recurs `imatges/family.svg` amb el color corporatiu `#3A6B7E`.
* **Millores al Mapa**:
  * Afegit el botó de centratge del mapa (icona de caseta / home) tant a la barra d'eines com en botó flotant sobre el mapa per restablir el zoom i l'enquadrament.
  * Filtració geogràfica exclusiva: en filtrar per província, comarca o municipi, el mapa registra i pinta únicament les geometries de l'àmbit seleccionat.
  * Gràfic inferior d'Evolució Històrica de la Població (2000–2025) connectat amb la sèrie històrica municipal.
* **Ajustos als Gràfics**:
  * Intercanvi de posició entre el Gràfic 3 (Defuncions) i el Gràfic 5 (Població per Nacionalitat).
  * Eliminació del nom intern de la taula (ex: Taula 195, Taula 31) dels títols dels gràfics per a un estil més net i accessible.
  * Modificació de la paleta del Gràfic 6 (Afiliacions a la Seguretat Social): canvi del color marró a tons verds institucionals.
* **Compatibilitat de Sistema**:
  * Suport natiu UTF-8 per a consoles Windows (`sys.stdout.reconfigure`) a l'script ETL d'actualització de l'INE.

---

## [Versió 1.0] - 2026-10-15
### Fase Inicial - Dashboard Demogràfic de Catalunya
* **Arquitectura de l'Aplicació**:
  * Desenvolupament modular en Vanilla JavaScript i HTML5/CSS3 sense dependència de servidors pesants.
  * Mòdul de dades (`DataService.js`) amb càrrega asíncrona paral·lela, parsing CSV mitjançant PapaParse i indexació O(1).
  * Mòdul cartogràfic (`MapView.js`) basat exclusivament en Apache ECharts amb conversió TopoJSON a GeoJSON en memòria.
  * Mòdul analític (`ChartsView.js`) amb 6 gràfics interactius interconnectats.
  * Mòdul controlador global (`App.js`) amb enrutament per paràmetres URL (`?m=codi_ine`).
* **Fonts de Dades Integrades**:
  * Estadístiques oficials municipals de l'Idescat (EMEX): dades territorials, població per sexe i edat, naixements, defuncions, nacionalitat i afiliacions laborals.
  * Padró continu municipal oficial de l'INE.
  * Cartografia vectorial municipal oficial de Catalunya (`MUN_CAT.json`).
* **Interactivitat i Filtres**:
  * Desplegables jeràrquics en cascada: Província ➔ Comarca ➔ Municipi.
  * Filtre creuat bidireccional entre el mapa i els gràfics.
  * Botó de reinici global de filtres i descàrrega de dades filtrades en format CSV delimitat per punt i coma (`;`).
* **Disseny Institucional**:
  * Tipografia oficial Inter.
  * Aplicació estricta de `border-radius: 5px !important` i eliminació total d'ombres (`box-shadow: none !important`).
  * Disseny responsive preparat per a escriptori, tauleta i mòbil.
