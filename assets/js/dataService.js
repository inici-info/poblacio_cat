/**
 * DataService.js
 * Mòdul A: Gestor de dades, càrrega paral·lela, parser CSV amb PapaParse, conversió TopoJSON a GeoJSON i unió en memòria O(1).
 */

class DataService {
  constructor() {
    this.municipalityMap = new Map(); // O(1) Map per codi_ine (5 dígits)
    this.municipalitiesList = [];     // Llista completa ordenada per nom
    this.geoJSON = null;              // GeoJSON convertit en memòria
    this.topoJSON = null;             // TopoJSON original
    this.isLoaded = false;
  }

  /**
   * Càrrega asíncrona en paral·lel dels 3 fitxers de dades
   */
  async loadAll() {
    try {
      const [idescatText, histText, topoData] = await Promise.all([
        fetch('data/idescat_estadistiques.csv').then(res => {
          if (!res.ok) throw new Error(`Error en carregar idescat_estadistiques.csv: ${res.statusText}`);
          return res.text();
        }),
        fetch('data/poblacio_historica_municipis.csv').then(res => {
          if (!res.ok) throw new Error(`Error en carregar poblacio_historica_municipis.csv: ${res.statusText}`);
          return res.text();
        }),
        fetch('data/MUN_CAT.json').then(res => {
          if (!res.ok) throw new Error(`Error en carregar MUN_CAT.json: ${res.statusText}`);
          return res.json();
        })
      ]);

      this.topoJSON = topoData;

      // 1. Convertir TopoJSON a GeoJSON en memòria mitjançant topojson-client
      const objectKey = Object.keys(topoData.objects)[0] || 'MUN_CAT';
      this.geoJSON = topojson.feature(topoData, topoData.objects[objectKey]);

      // Normalitzar codis INE a 5 dígits a les geometries GeoJSON
      if (this.geoJSON && this.geoJSON.features) {
        this.geoJSON.features.forEach(f => {
          const rawIne = f.properties.ine || f.properties.codi_ine || f.id || '';
          const codiIne = String(rawIne).trim().padStart(5, '0');
          f.properties.ine = codiIne;
          f.properties.codi_ine = codiIne;
          f.properties.name = codiIne; // ECharts utilitzarà 'name' per enllaçar dades
          f.id = codiIne;
        });
      }

      // 2. Parsejar fitxers CSV amb PapaParse (delimitador ';' estricte)
      const parseOptions = {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        transformHeader: h => h.replace(/^\ufeff/, '').trim()
      };

      const idescatParsed = Papa.parse(idescatText, parseOptions);
      const histParsed = Papa.parse(histText, parseOptions);

      // Indexar dades històriques per codi_ine
      const histMap = new Map();
      if (histParsed.data) {
        histParsed.data.forEach(row => {
          if (!row.codi_ine) return;
          const codiIne = String(row.codi_ine).trim().padStart(5, '0');
          histMap.set(codiIne, row);
        });
      }

      // 3. Fusionar les dades i construir l'estructura unificada en memòria O(1)
      this.municipalityMap.clear();
      this.municipalitiesList = [];

      idescatParsed.data.forEach(row => {
        if (!row.codi_ine) return;
        const codiIne = String(row.codi_ine).trim().padStart(5, '0');
        const histRow = histMap.get(codiIne) || {};

        // Parseig numèric segur
        const parseNum = (val, fallback = 0) => {
          if (val === undefined || val === null || val === '') return fallback;
          const clean = String(val).replace(',', '.').trim();
          const n = Number(clean);
          return isNaN(n) ? fallback : n;
        };

        const parsedMunicipi = {
          codi_ine: codiIne,
          codi_idescat: row.codi_idescat || '',
          nom: row.nom_municipi ? row.nom_municipi.trim() : '',
          nom_municipi: row.nom_municipi ? row.nom_municipi.trim() : '',
          codi_comarca: String(row.codi_comarca || '').trim().padStart(2, '0'),
          nom_comarca: row.nom_comarca ? row.nom_comarca.trim() : '',
          codi_provincia: String(row.codi_provincia || '').trim().padStart(2, '0'),
          nom_provincia: row.nom_provincia ? row.nom_provincia.trim() : '',

          // Dades territorials
          superficie: parseNum(row.t192_superficie || row.t176_superficie),
          densitat: parseNum(row.t192_densitat),
          altitud: parseNum(row.t176_altitud),
          longitud: parseNum(row.t176_longitud),
          latitud: parseNum(row.t176_latitud),

          // Taula 195: Població per sexe
          t195_homes: parseNum(row.t195_homes),
          t195_dones: parseNum(row.t195_dones),
          t195_total: parseNum(row.t195_total),

          // Taules 31 i 37: Població per edat (homes t31, dones t37)
          t31_0_14: parseNum(row.t31_de_0_a_14_anys),
          t31_15_64: parseNum(row.t31_de_15_a_64_anys),
          t31_65_84: parseNum(row.t31_de_65_a_84_anys),
          t31_85_mes: parseNum(row.t31_de_85_anys_i_mes),
          t31_total: parseNum(row.t31_total),

          t37_0_14: parseNum(row.t37_de_0_a_14_anys),
          t37_15_64: parseNum(row.t37_de_15_a_64_anys),
          t37_65_84: parseNum(row.t37_de_65_a_84_anys),
          t37_85_mes: parseNum(row.t37_de_85_anys_i_mes),
          t37_total: parseNum(row.t37_total),

          // Taules 78 i 81: Població per nacionalitat (homes t78, dones t81)
          t78_espanyola: parseNum(row.t78_espanyola),
          t78_estrangera: parseNum(row.t78_estrangera),
          t78_total: parseNum(row.t78_total),

          t81_espanyola: parseNum(row.t81_espanyola),
          t81_estrangera: parseNum(row.t81_estrangera),
          t81_total: parseNum(row.t81_total),

          // Taula 164: Naixements
          t164_nens: parseNum(row.t164_nens),
          t164_nenes: parseNum(row.t164_nenes),
          t164_total: parseNum(row.t164_total),

          // Taula 165: Defuncions
          t165_homes: parseNum(row.t165_homes),
          t165_dones: parseNum(row.t165_dones),
          t165_total: parseNum(row.t165_total),

          // Taula 183: Afiliacions a la Seguretat Social
          t183_agricultura: parseNum(row.t183_agricultura),
          t183_industria: parseNum(row.t183_industria),
          t183_construccio: parseNum(row.t183_construccio),
          t183_serveis: parseNum(row.t183_serveis),
          t183_total: parseNum(row.t183_total),

          // Sèrie històrica i variacions
          pob_2000: parseNum(histRow.pob_2000, null),
          pob_2005: parseNum(histRow.pob_2005, null),
          pob_2015: parseNum(histRow.pob_2015, null),
          pob_2025: parseNum(histRow.pob_2025, null),
          var_10a_abs: parseNum(histRow.var_10a_abs, null),
          var_10a_pct: parseNum(histRow.var_10a_pct, null),
          var_20a_abs: parseNum(histRow.var_20a_abs, null),
          var_20a_pct: parseNum(histRow.var_20a_pct, null),
          pob_years: (() => {
            const y = {};
            for (let yr = 2000; yr <= 2025; yr++) {
              y[yr] = parseNum(histRow[`pob_${yr}`], null);
            }
            return y;
          })()
        };

        this.municipalityMap.set(codiIne, parsedMunicipi);
        this.municipalitiesList.push(parsedMunicipi);
      });

      // Ordenar alfabèticament per nom per als desplegables
      this.municipalitiesList.sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));

      this.isLoaded = true;
      return true;
    } catch (err) {
      console.error('Error crític inicialitzant DataService:', err);
      throw err;
    }
  }

  /**
   * Cerca en O(1) per codi_ine
   */
  getMunicipality(codiIne) {
    if (!codiIne) return null;
    const cleanIne = String(codiIne).trim().padStart(5, '0');
    return this.municipalityMap.get(cleanIne) || null;
  }

  /**
   * Retorna tota la llista de municipis
   */
  getAllMunicipalities() {
    return this.municipalitiesList;
  }

  /**
   * Retorna el GeoJSON convertit
   */
  getGeoJSON() {
    return this.geoJSON;
  }

  /**
   * Llista única de Províncies
   */
  getProvinces() {
    const provMap = new Map();
    this.municipalitiesList.forEach(m => {
      if (m.codi_provincia && !provMap.has(m.codi_provincia)) {
        provMap.set(m.codi_provincia, {
          codi: m.codi_provincia,
          nom: m.nom_provincia
        });
      }
    });
    return Array.from(provMap.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
  }

  /**
   * Llista de Comarques (opcionalment filtrades per província)
   */
  getComarques(codiProvincia = null) {
    const comMap = new Map();
    this.municipalitiesList.forEach(m => {
      if (codiProvincia && m.codi_provincia !== codiProvincia) return;
      if (m.codi_comarca && !comMap.has(m.codi_comarca)) {
        comMap.set(m.codi_comarca, {
          codi: m.codi_comarca,
          nom: m.nom_comarca,
          codi_provincia: m.codi_provincia
        });
      }
    });
    return Array.from(comMap.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
  }

  /**
   * Llista de Municipis (opcionalment filtrats per comarca o província)
   */
  getMunicipis(codiProvincia = null, codiComarca = null) {
    return this.municipalitiesList.filter(m => {
      if (codiProvincia && m.codi_provincia !== codiProvincia) return false;
      if (codiComarca && m.codi_comarca !== codiComarca) return false;
      return true;
    });
  }

  /**
   * Agregació de dades per al conjunt filtrat (província, comarca o Catalunya sencera)
   */
  aggregateStats(items) {
    const agg = {
      count: items.length,
      t195_homes: 0,
      t195_dones: 0,
      t195_total: 0,

      // Edat
      t31_0_14: 0,
      t31_15_64: 0,
      t31_65_84: 0,
      t31_85_mes: 0,

      t37_0_14: 0,
      t37_15_64: 0,
      t37_65_84: 0,
      t37_85_mes: 0,

      // Nacionalitat
      t78_espanyola: 0,
      t78_estrangera: 0,

      t81_espanyola: 0,
      t81_estrangera: 0,

      // Naixements
      t164_nens: 0,
      t164_nenes: 0,
      t164_total: 0,

      // Defuncions
      t165_homes: 0,
      t165_dones: 0,
      t165_total: 0,

      // Seguretat Social
      t183_agricultura: 0,
      t183_industria: 0,
      t183_construccio: 0,
      t183_serveis: 0,
      t183_total: 0,

      // Sèrie històrica 2000-2025 agregada
      historical: (() => {
        const h = {};
        for (let yr = 2000; yr <= 2025; yr++) h[yr] = 0;
        return h;
      })()
    };

    items.forEach(m => {
      agg.t195_homes += m.t195_homes || 0;
      agg.t195_dones += m.t195_dones || 0;
      agg.t195_total += m.t195_total || 0;

      agg.t31_0_14 += m.t31_0_14 || 0;
      agg.t31_15_64 += m.t31_15_64 || 0;
      agg.t31_65_84 += m.t31_65_84 || 0;
      agg.t31_85_mes += m.t31_85_mes || 0;

      agg.t37_0_14 += m.t37_0_14 || 0;
      agg.t37_15_64 += m.t37_15_64 || 0;
      agg.t37_65_84 += m.t37_65_84 || 0;
      agg.t37_85_mes += m.t37_85_mes || 0;

      agg.t78_espanyola += m.t78_espanyola || 0;
      agg.t78_estrangera += m.t78_estrangera || 0;

      agg.t81_espanyola += m.t81_espanyola || 0;
      agg.t81_estrangera += m.t81_estrangera || 0;

      agg.t164_nens += m.t164_nens || 0;
      agg.t164_nenes += m.t164_nenes || 0;
      agg.t164_total += m.t164_total || 0;

      agg.t165_homes += m.t165_homes || 0;
      agg.t165_dones += m.t165_dones || 0;
      agg.t165_total += m.t165_total || 0;

      agg.t183_agricultura += m.t183_agricultura || 0;
      agg.t183_industria += m.t183_industria || 0;
      agg.t183_construccio += m.t183_construccio || 0;
      agg.t183_serveis += m.t183_serveis || 0;
      agg.t183_total += m.t183_total || 0;

      if (m.pob_years) {
        for (let yr = 2000; yr <= 2025; yr++) {
          if (m.pob_years[yr] !== null && m.pob_years[yr] !== undefined) {
            agg.historical[yr] += m.pob_years[yr];
          }
        }
      }
    });

    return agg;
  }
}

// Exportar globalment
window.DataService = DataService;
