/**
 * App.js
 * Mòdul D: Orquestrador d'estat global, coordinació d'esdeveniments, enrutament URL ?m=,
 * desplegables jeràrquics en cascada i descàrrega de dades en format CSV.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const provSelect = document.getElementById('selectProvincia');
  const comarcaSelect = document.getElementById('selectComarca');
  const munSelect = document.getElementById('selectMunicipi');
  const btnReset = document.getElementById('btnReset');
  const btnDownloadCsv = document.getElementById('btnDownloadCsv');
  const scopeTitle = document.getElementById('scopeTitle');
  const scopeCount = document.getElementById('scopeCount');
  const btnEmexMunicipi = document.getElementById('btnEmexMunicipi');
  const emexMunicipiNom = document.getElementById('emexMunicipiNom');

  const themeBtns = document.querySelectorAll('.theme-btn');

  // Inicialitzar Serveis i Vistes
  const dataService = new DataService();

  let mapView = null;
  let chartsView = null;

  // Estat de l'aplicació
  const state = {
    provincia: null,
    comarca: null,
    municipi: null,       // codi_ine
    theme: 'pop',         // 'pop', 'evol10', 'evol20'
    legendClass: null,    // null o id de la classe de la llegenda
    sex: 'tots'           // 'tots', 'homes', 'dones'
  };

  try {
    // 1. Càrrega asíncrona de dades
    await dataService.loadAll();

    // 2. Inicialitzar Controlador Cartogràfic
    mapView = new MapView(
      'mapContainer',
      'legendContainer',
      dataService,
      (codiIne) => {
        // Callback en clicar sobre un municipi al mapa
        selectMunicipiFromMap(codiIne);
      },
      (legendClassId) => {
        // Callback en clicar a la llegenda interactiva
        state.legendClass = legendClassId;
        refreshViews(false); // No cal recentrar el mapa
      }
    );
    mapView.init();

    // 3. Inicialitzar Panell de Gràfics
    chartsView = new ChartsView(
      {
        g1: 'chart1',
        g2: 'chart2',
        g3: 'chart3',
        g4: 'chart4',
        g5: 'chart5',
        evol: 'chartEvolution'
      },
      (newSex) => {
        // Callback quan es clica al Gràfic 1 per filtrar per sexe
        state.sex = newSex;
      }
    );
    chartsView.init();

    // 4. Poblar desplegables inicials
    populateProvinces();
    populateComarques();
    populateMunicipis();

    // 5. Enrutament URL (?m=XXXXX)
    checkUrlParams();

    // 6. Configurar esdeveniments de la UI
    setupEventListeners();

    // 7. Renderització inicial
    refreshViews(true);
    syncBottomCardsHeight();

    // Amagar indicador de càrrega
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  } catch (err) {
    console.error('Error inicialitzant aplicació:', err);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="background:#FFF; padding:20px; border:1px solid #D1D5DB; border-radius:5px; text-align:center;">
          <h3 style="color:#D3262D; margin-bottom:8px;">Error carregant les dades</h3>
          <p style="font-size:12px; color:#4B5563;">${err.message}</p>
        </div>
      `;
    }
  }

  /**
   * Poblament del desplegable de Províncies
   */
  function populateProvinces() {
    const provinces = dataService.getProvinces();
    provSelect.innerHTML = '<option value="">Totes les províncies</option>';
    provinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.codi;
      opt.textContent = p.nom;
      provSelect.appendChild(opt);
    });
  }

  /**
   * Poblament en cascada de Comarques
   */
  function populateComarques() {
    const comarques = dataService.getComarques(state.provincia);
    comarcaSelect.innerHTML = '<option value="">Totes les comarques</option>';
    comarques.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.codi;
      opt.textContent = c.nom;
      comarcaSelect.appendChild(opt);
    });
    comarcaSelect.value = state.comarca || '';
  }

  /**
   * Poblament en cascada de Municipis
   */
  function populateMunicipis() {
    const municipis = dataService.getMunicipis(state.provincia, state.comarca);
    munSelect.innerHTML = '<option value="">Tots els municipis</option>';
    municipis.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.codi_ine;
      opt.textContent = m.nom;
      munSelect.appendChild(opt);
    });
    munSelect.value = state.municipi || '';
  }

  /**
   * Suport natiu del paràmetre URL ?m=XXXXX
   */
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const mParam = params.get('m');
    if (mParam) {
      const cleanIne = String(mParam).trim().padStart(5, '0');
      const m = dataService.getMunicipality(cleanIne);
      if (m) {
        state.provincia = m.codi_provincia;
        provSelect.value = state.provincia;

        populateComarques();
        state.comarca = m.codi_comarca;
        comarcaSelect.value = state.comarca;

        populateMunicipis();
        state.municipi = m.codi_ine;
        munSelect.value = state.municipi;
      }
    }
  }

  /**
   * Actualització de la URL del navegador en temps real sense recarregar la pàgina
   */
  function updateUrl() {
    const url = new URL(window.location);
    if (state.municipi) {
      url.searchParams.set('m', state.municipi);
    } else {
      url.searchParams.delete('m');
    }
    window.history.replaceState({}, '', url);
  }

  /**
   * Configuració d'esdeveniments de controls
   */
  function setupEventListeners() {
    // Canvi de Província
    provSelect.addEventListener('change', () => {
      state.provincia = provSelect.value || null;
      state.comarca = null;
      state.municipi = null;
      state.legendClass = null;

      populateComarques();
      populateMunicipis();
      updateUrl();
      refreshViews(true);
    });

    // Canvi de Comarca
    comarcaSelect.addEventListener('change', () => {
      state.comarca = comarcaSelect.value || null;
      state.municipi = null;
      state.legendClass = null;

      // Si s'escull comarca sense província, auto-seleccionar la província corresponent
      if (state.comarca && !state.provincia) {
        const comarques = dataService.getComarques();
        const found = comarques.find(c => c.codi === state.comarca);
        if (found) {
          state.provincia = found.codi_provincia;
          provSelect.value = state.provincia;
          populateComarques();
          comarcaSelect.value = state.comarca;
        }
      }

      populateMunicipis();
      updateUrl();
      refreshViews(true);
    });

    // Canvi de Municipi
    munSelect.addEventListener('change', () => {
      state.municipi = munSelect.value || null;
      state.legendClass = null;

      if (state.municipi) {
        const m = dataService.getMunicipality(state.municipi);
        if (m) {
          state.provincia = m.codi_provincia;
          provSelect.value = state.provincia;
          populateComarques();
          state.comarca = m.codi_comarca;
          comarcaSelect.value = state.comarca;
          populateMunicipis();
          munSelect.value = state.municipi;
        }
      }

      updateUrl();
      refreshViews(true);
    });

    // Botó Restablir filtres (barra d'eines del mapa i controls)
    document.querySelectorAll('#btnReset, .btn-reset').forEach(btn => {
      btn.addEventListener('click', () => {
        resetAllFilters();
      });
    });

    // Botó Descarregar CSV
    btnDownloadCsv.addEventListener('click', () => {
      downloadFilteredCsv();
    });

    // Botons de Temàtica del Mapa
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.theme = btn.getAttribute('data-theme');
        state.legendClass = null; // Reiniciar filtre de llegenda en canviar temàtica
        if (mapView) {
          mapView.activeLegendClass = null;
        }
        refreshViews(false);
      });
    });

    // Sincronitzar alçada del gràfic d'evolució amb Nacionalitat i Afiliacions (recte)
    const evoCard = document.querySelector('.evolution-card');
    if (evoCard && window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        syncBottomCardsHeight();
      });
      ro.observe(evoCard);
    }
    window.addEventListener('resize', syncBottomCardsHeight);
  }

  /**
   * Clic sobre municipi al mapa
   */
  function selectMunicipiFromMap(codiIne) {
    if (state.municipi === codiIne) {
      // Si ja estava seleccionat, commutar a Catalunya sencera o àmbit comarcal
      state.municipi = null;
    } else {
      state.municipi = codiIne;
      const m = dataService.getMunicipality(codiIne);
      if (m) {
        state.provincia = m.codi_provincia;
        provSelect.value = state.provincia;
        populateComarques();
        state.comarca = m.codi_comarca;
        comarcaSelect.value = state.comarca;
        populateMunicipis();
        munSelect.value = state.municipi;
      }
    }
    updateUrl();
    refreshViews(true);
  }

  /**
   * Restablir tots els filtres
   */
  function resetAllFilters() {
    state.provincia = null;
    state.comarca = null;
    state.municipi = null;
    state.legendClass = null;
    state.sex = 'tots';

    provSelect.value = '';
    populateComarques();
    populateMunicipis();

    if (mapView) {
      mapView.activeLegendClass = null;
      mapView.resetView();
    }
    updateUrl();
    refreshViews(true);
  }

  /**
   * Retorna la llista filtrada de municipis segons els criteris actius
   */
  function getFilteredMunicipalities() {
    let list = dataService.getAllMunicipalities();

    if (state.municipi) {
      const single = dataService.getMunicipality(state.municipi);
      return single ? [single] : [];
    }

    if (state.comarca) {
      list = list.filter(m => m.codi_comarca === state.comarca);
    } else if (state.provincia) {
      list = list.filter(m => m.codi_provincia === state.provincia);
    }

    // Si hi ha un filtre de classe de llegenda actiu
    if (state.legendClass && mapView) {
      const classes = mapView.getThemeClasses(state.theme);
      const activeClassObj = classes.find(c => c.id === state.legendClass);
      if (activeClassObj) {
        list = list.filter(m => activeClassObj.filter(m));
      } else if (state.legendClass === 'no_data') {
        list = list.filter(m => (state.theme === 'evol10' ? m.var_10a_pct === null : m.var_20a_pct === null));
      }
    }

    return list;
  }

  /**
   * Actualització conjunta de tots els components de la interfície
   */
  function refreshViews(shouldCenterMap = false) {
    const filteredMunicipalities = getFilteredMunicipalities();
    const stats = dataService.aggregateStats(filteredMunicipalities);

    // Actualitzar etiquetes de la capçalera
    updateHeaderScope(filteredMunicipalities, stats);

    // Actualitzar el Mapa
    if (mapView) {
      // L'àmbit geogràfic abans del filtre de llegenda per mostrar el context
      let baseScope = dataService.getAllMunicipalities();
      if (state.municipi) {
        const m = dataService.getMunicipality(state.municipi);
        baseScope = m ? [m] : [];
      } else if (state.comarca) {
        baseScope = baseScope.filter(m => m.codi_comarca === state.comarca);
      } else if (state.provincia) {
        baseScope = baseScope.filter(m => m.codi_provincia === state.provincia);
      }

      mapView.update(baseScope, state.municipi, state.theme, shouldCenterMap);
    }

    // Actualitzar els 6 Gràfics i el Gràfic d'Evolució
    if (chartsView) {
      let scopeLabel = 'Catalunya';
      if (state.municipi) {
        const m = dataService.getMunicipality(state.municipi);
        if (m) scopeLabel = `${m.nom} (${m.nom_comarca})`;
      } else if (state.comarca) {
        const comarques = dataService.getComarques();
        const c = comarques.find(x => x.codi === state.comarca);
        if (c) scopeLabel = `Comarca: ${c.nom}`;
      } else if (state.provincia) {
        const provs = dataService.getProvinces();
        const p = provs.find(x => x.codi === state.provincia);
        if (p) scopeLabel = `Província: ${p.nom}`;
      }

      chartsView.update(stats, state.sex, scopeLabel, state.theme);
    }
  }

  /**
   * Sincronització de l'alçada entre el gràfic d'evolució i els gràfics de Nacionalitat i Afiliacions
   */
  function syncBottomCardsHeight() {
    const evoCard = document.querySelector('.evolution-card');
    const chartsGrid = document.querySelector('.charts-grid');
    if (evoCard && chartsGrid && window.innerWidth > 1199) {
      const h = evoCard.offsetHeight;
      if (h > 0) {
        chartsGrid.style.setProperty('--bottom-cards-height', `${h}px`);
        chartsGrid.style.gridTemplateRows = `1fr 1fr ${h}px`;
        if (chartsView) chartsView.resize();
      }
    } else if (chartsGrid && window.innerWidth <= 1199) {
      chartsGrid.style.gridTemplateRows = '';
      if (chartsView) chartsView.resize();
    }
  }

  /**
   * Actualització de l'indicador d'àmbit actiu
   */
  function updateHeaderScope(filteredMunicipalities, stats) {
    if (state.municipi) {
      const m = dataService.getMunicipality(state.municipi);
      scopeTitle.textContent = `${m ? m.nom : 'Municipi'}`;
      scopeCount.textContent = `${m ? m.nom_comarca : ''}, Prov. ${m ? m.nom_provincia : ''} — ${stats.t195_total.toLocaleString('ca-ES')} hab.`;

      if (btnEmexMunicipi && m) {
        btnEmexMunicipi.style.display = 'inline-flex';
        btnEmexMunicipi.href = `https://www.idescat.cat/emex/?id=${m.codi_idescat || m.codi_ine}`;
        if (emexMunicipiNom) {
          emexMunicipiNom.textContent = m.nom;
        } else {
          btnEmexMunicipi.textContent = `Consulta dades completes de ${m.nom}`;
        }
      }
    } else if (state.comarca) {
      const comarques = dataService.getComarques();
      const c = comarques.find(x => x.codi === state.comarca);
      scopeTitle.textContent = `Comarca: ${c ? c.nom : ''}`;
      scopeCount.textContent = `${filteredMunicipalities.length} municipis — ${stats.t195_total.toLocaleString('ca-ES')} hab.`;
      if (btnEmexMunicipi) btnEmexMunicipi.style.display = 'none';
    } else if (state.provincia) {
      const provs = dataService.getProvinces();
      const p = provs.find(x => x.codi === state.provincia);
      scopeTitle.textContent = `Província: ${p ? p.nom : ''}`;
      scopeCount.textContent = `${filteredMunicipalities.length} municipis — ${stats.t195_total.toLocaleString('ca-ES')} hab.`;
      if (btnEmexMunicipi) btnEmexMunicipi.style.display = 'none';
    } else {
      scopeTitle.textContent = 'Catalunya';
      scopeCount.textContent = `${filteredMunicipalities.length} municipis — ${stats.t195_total.toLocaleString('ca-ES')} hab.`;
      if (btnEmexMunicipi) btnEmexMunicipi.style.display = 'none';
    }

    if (state.legendClass) {
      scopeTitle.textContent += ` [Filtre llegenda actiu]`;
    }
  }

  /**
   * Descàrrega directa en memòria del client de les dades filtrades en format CSV ';' amb BOM
   * Inclou dades generals, demogràfiques i tota la sèrie històrica anual 2000-2025
   */
  function downloadFilteredCsv() {
    const list = getFilteredMunicipalities();
    if (!list || list.length === 0) {
      alert('No hi ha dades per descarregar amb els filtres seleccionats.');
      return;
    }

    const yearHeaders = [];
    for (let yr = 2000; yr <= 2025; yr++) {
      yearHeaders.push(`pob_${yr}`);
    }

    const headers = [
      'codi_ine',
      'codi_idescat',
      'nom_municipi',
      'codi_comarca',
      'nom_comarca',
      'codi_provincia',
      'nom_provincia',
      'poblacio_total',
      'homes',
      'dones',
      'espanyola',
      'estrangera',
      'naixements_total',
      'defuncions_total',
      'afiliacions_total',
      ...yearHeaders,
      'var_10a_abs',
      'var_10a_pct',
      'var_20a_abs',
      'var_20a_pct'
    ];

    const rows = list.map(m => {
      const yearValues = [];
      for (let yr = 2000; yr <= 2025; yr++) {
        const val = (m.pob_years && m.pob_years[yr] !== undefined && m.pob_years[yr] !== null)
          ? m.pob_years[yr]
          : (m[`pob_${yr}`] !== undefined && m[`pob_${yr}`] !== null ? m[`pob_${yr}`] : '');
        yearValues.push(val);
      }

      return [
        m.codi_ine,
        m.codi_idescat || '',
        `"${(m.nom || '').replace(/"/g, '""')}"`,
        m.codi_comarca,
        `"${(m.nom_comarca || '').replace(/"/g, '""')}"`,
        m.codi_provincia,
        `"${(m.nom_provincia || '').replace(/"/g, '""')}"`,
        m.t195_total || 0,
        m.t195_homes || 0,
        m.t195_dones || 0,
        (m.t78_espanyola || 0) + (m.t81_espanyola || 0),
        (m.t78_estrangera || 0) + (m.t81_estrangera || 0),
        m.t164_total || 0,
        m.t165_total || 0,
        m.t183_total || 0,
        ...yearValues,
        m.var_10a_abs !== null && m.var_10a_abs !== undefined ? m.var_10a_abs : '',
        m.var_10a_pct !== null && m.var_10a_pct !== undefined ? String(m.var_10a_pct).replace('.', ',') : '',
        m.var_20a_abs !== null && m.var_20a_abs !== undefined ? m.var_20a_abs : '',
        m.var_20a_pct !== null && m.var_20a_pct !== undefined ? String(m.var_20a_pct).replace('.', ',') : ''
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dades_demografiques_catalunya_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
