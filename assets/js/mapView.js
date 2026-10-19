/**
 * MapView.js
 * Mòdul B: Controlador cartogràfic basat exclusivament en Apache ECharts.
 * 3 temàtiques, escales oficials, etiquetatge dinàmic a zoom >= 13.15 (escala 1:50.000)
 * i llegenda interactiva amb recompte d'elements i percentatge.
 * Suporta visualització exclusiva de l'àmbit filtrat (província, comarca o municipi)
 * i botó de centratge / restabliment de zoom (casita).
 */

class MapView {
  constructor(containerId, legendContainerId, dataService, onMunicipalitySelect, onLegendFilterChange) {
    this.container = document.getElementById(containerId);
    this.legendContainer = document.getElementById(legendContainerId);
    this.dataService = dataService;
    this.onMunicipalitySelect = onMunicipalitySelect;
    this.onLegendFilterChange = onLegendFilterChange;

    this.chart = null;
    this.currentTheme = 'pop'; // 'pop', 'evol10', 'evol20'
    this.selectedCodiIne = null;
    this.activeLegendClass = null; // null = cap filtre, o 'c0', 'c1', ...
    this.currentZoom = 1.05;
    this.geoCenter = [1.75, 41.75]; // Centre de Catalunya
    this.currentCenter = [1.75, 41.75];
    this.labelsVisible = false;
    this.currentMapName = 'catalunya_full';
    this.lastScope = [];
    this.isFiltered = false;
  }

  /**
   * Inicialització d'ECharts i registre de la capa geogràfica completa
   */
  init() {
    if (!this.container) return;

    this.fullGeoJSON = this.dataService.getGeoJSON();
    echarts.registerMap('catalunya_full', this.fullGeoJSON);

    this.chart = echarts.init(this.container);

    // Event de clic sobre municipi al mapa
    this.chart.on('click', (params) => {
      if (params.data && params.data.codi_ine) {
        if (this.onMunicipalitySelect) {
          this.onMunicipalitySelect(params.data.codi_ine);
        }
      }
    });

    // Event de zoom i desplaçament (roam)
    this.chart.on('georoam', (params) => {
      if (params.zoom) {
        this.currentZoom = this.currentZoom * params.zoom;
        if (this.currentZoom < 1.05) this.currentZoom = 1.05;
      }
      try {
        const opt = this.chart.getOption();
        if (opt && opt.series && opt.series[0] && opt.series[0].center) {
          this.currentCenter = opt.series[0].center;
        }
      } catch (e) {}

      this.checkZoomScale();
    });

    // Botons de centratge (casita)
    const btnCenter = document.getElementById('btnCenterMap');
    if (btnCenter) {
      btnCenter.addEventListener('click', () => this.resetView());
    }
    const btnFloatingCenter = document.getElementById('btnFloatingCenter');
    if (btnFloatingCenter) {
      btnFloatingCenter.addEventListener('click', () => this.resetView());
    }

    // Responsivitat
    window.addEventListener('resize', () => {
      if (this.chart) this.chart.resize();
    });

    if (window.ResizeObserver && this.container) {
      const ro = new ResizeObserver(() => {
        if (this.chart) this.chart.resize();
      });
      ro.observe(this.container);
    }
  }

  /**
   * Comprovació de zoom per a l'escala 1:50.000 (zoom >= 13.15)
   */
  checkZoomScale() {
    const isTinyScope = this.isFiltered && this.lastScope && this.lastScope.length <= 15;
    const shouldShowLabels = this.currentZoom >= 13.15 || isTinyScope;
    if (shouldShowLabels !== this.labelsVisible) {
      this.labelsVisible = shouldShowLabels;
      this.chart.setOption({
        series: [
          {
            id: 'cat_map_series',
            label: {
              show: this.labelsVisible,
              formatter: (params) => {
                const d = this.findDataByIne(params.name);
                if (!d) return params.name;
                return `${d.nom_municipi}\n${d.formattedValue}`;
              }
            }
          }
        ]
      });
    }
  }

  /**
   * Definició de les classes per a cada temàtica
   */
  getThemeClasses(themeId) {
    if (themeId === 'pop') {
      return [
        {
          id: 'pop_low',
          label: '< 20.000 hab.',
          color: '#EAD5AC', // Marró fluix
          filter: (m) => (m.t195_total || 0) < 20000
        },
        {
          id: 'pop_mid',
          label: '20.000 - 50.000 hab.',
          color: '#648662', // Verd fluix
          filter: (m) => (m.t195_total || 0) >= 20000 && (m.t195_total || 0) <= 50000
        },
        {
          id: 'pop_high',
          label: '> 50.000 hab.',
          color: '#1A3E26', // Verd fosc
          filter: (m) => (m.t195_total || 0) > 50000
        }
      ];
    } else if (themeId === 'evol10') {
      // 6 classes divergents amb var_10a_pct
      return [
        {
          id: 'dec_high',
          label: 'Descens significatiu (< -10%)',
          color: '#8B1C24', // Vermell fosc
          filter: (m) => m.var_10a_pct !== null && m.var_10a_pct < -10
        },
        {
          id: 'dec_mid',
          label: 'Descens moderat (-10% a -5%)',
          color: '#D3262D', // Vermell mig
          filter: (m) => m.var_10a_pct !== null && m.var_10a_pct >= -10 && m.var_10a_pct < -5
        },
        {
          id: 'dec_low',
          label: 'Descens lleuger (<-5%)',
          color: '#E84A4F', // Vermell fluix
          filter: (m) => m.var_10a_pct !== null && m.var_10a_pct >= -5 && m.var_10a_pct < 0
        },
        {
          id: 'creix_low',
          label: 'Creixement lleuger (< +5%)',
          color: '#648662', // Verd fluix
          filter: (m) => m.var_10a_pct !== null && m.var_10a_pct >= 0 && m.var_10a_pct <= 5
        },
        {
          id: 'creix_mid',
          label: 'Creixement significatiu (+5% a +15%)',
          color: '#2B5738', // Verd mig
          filter: (m) => m.var_10a_pct !== null && m.var_10a_pct > 5 && m.var_10a_pct <= 15
        },
        {
          id: 'creix_high',
          label: 'Creixement molt intens (> +15%)',
          color: '#1A3E26', // Verd fosc
          filter: (m) => m.var_10a_pct !== null && m.var_10a_pct > 15
        }
      ];
    } else if (themeId === 'evol20') {
      // 6 classes divergents amb var_20a_pct
      return [
        {
          id: 'dec20_high',
          label: 'Descens significatiu (< -15%)',
          color: '#8B1C24', // Vermell fosc
          filter: (m) => m.var_20a_pct !== null && m.var_20a_pct < -15
        },
        {
          id: 'dec20_mid',
          label: 'Descens moderat (-15% a -5%)',
          color: '#D3262D', // Vermell mig
          filter: (m) => m.var_20a_pct !== null && m.var_20a_pct >= -15 && m.var_20a_pct < -5
        },
        {
          id: 'dec20_low',
          label: 'Descens lleuger (<-5%)',
          color: '#E84A4F', // Vermell fluix
          filter: (m) => m.var_20a_pct !== null && m.var_20a_pct >= -5 && m.var_20a_pct < 0
        },
        {
          id: 'creix20_low',
          label: 'Creixement lleuger (< +10%)',
          color: '#648662', // Verd fluix
          filter: (m) => m.var_20a_pct !== null && m.var_20a_pct >= 0 && m.var_20a_pct <= 10
        },
        {
          id: 'creix20_mid',
          label: 'Creixement significatiu (+10% a +25%)',
          color: '#2B5738', // Verd mig
          filter: (m) => m.var_20a_pct !== null && m.var_20a_pct > 10 && m.var_20a_pct <= 25
        },
        {
          id: 'creix20_high',
          label: 'Creixement molt intens (> +25%)',
          color: '#1A3E26', // Verd fosc
          filter: (m) => m.var_20a_pct !== null && m.var_20a_pct > 25
        }
      ];
    }
    return [];
  }

  /**
   * Format català de milers amb punts
   */
  formatCatalanNumber(num, isPercent = false) {
    if (num === null || num === undefined) return 'Sense dades';
    if (isPercent) {
      return (num >= 0 ? '+' : '') + num.toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%';
    }
    return num.toLocaleString('ca-ES');
  }

  /**
   * Actualització reactiva del mapa i la llegenda
   * Si es filtra una província, comarca o municipi es visualitza només l'àmbit filtrat.
   */
  update(scopeMunicipalities, selectedCodiIne = null, themeId = null, shouldResetZoom = false) {
    if (!this.chart) return;
    if (themeId) this.currentTheme = themeId;
    this.selectedCodiIne = selectedCodiIne;
    this.lastScope = scopeMunicipalities || [];

    const allMunicipalities = this.dataService.getAllMunicipalities();
    const totalCount = allMunicipalities.length;
    this.isFiltered = this.lastScope.length < totalCount;

    if (shouldResetZoom) {
      this.currentZoom = 1.05;
      this.currentCenter = [...this.geoCenter];
      this.labelsVisible = false;
    }

    const classes = this.getThemeClasses(this.currentTheme);
    const scopeSet = new Set(this.lastScope.map(m => m.codi_ine));

    // Si està filtrat, crear i registrar GeoJSON que conté NOMÉS les geometries filtrades
    if (this.isFiltered && this.fullGeoJSON && this.fullGeoJSON.features) {
      const filteredFeatures = this.fullGeoJSON.features.filter(f => scopeSet.has(f.properties.ine));
      const filteredGeo = {
        type: 'FeatureCollection',
        features: filteredFeatures
      };
      this.currentMapName = 'catalunya_filtered_' + Date.now();
      echarts.registerMap(this.currentMapName, filteredGeo);
    } else {
      this.currentMapName = 'catalunya_full';
    }

    // Map data items (només per als elements que es mostren)
    const seriesData = [];
    this.cachedDataMap = new Map();

    const displayList = this.isFiltered ? this.lastScope : allMunicipalities;

    displayList.forEach(m => {
      let classObj = null;
      let rawVal = 0;
      let formattedVal = '';

      if (this.currentTheme === 'pop') {
        rawVal = m.t195_total || 0;
        formattedVal = `${this.formatCatalanNumber(rawVal)} hab.`;
        classObj = classes.find(c => c.filter(m));
      } else if (this.currentTheme === 'evol10') {
        rawVal = m.var_10a_pct;
        formattedVal = this.formatCatalanNumber(rawVal, true);
        classObj = classes.find(c => c.filter(m));
      } else if (this.currentTheme === 'evol20') {
        rawVal = m.var_20a_pct;
        formattedVal = this.formatCatalanNumber(rawVal, true);
        classObj = classes.find(c => c.filter(m));
      }

      const classId = classObj ? classObj.id : 'no_data';
      const baseColor = classObj ? classObj.color : '#E5E7EB';

      // Comprovar filtre de la llegenda
      const matchesLegend = !this.activeLegendClass || this.activeLegendClass === classId;
      const isSelected = this.selectedCodiIne && this.selectedCodiIne === m.codi_ine;

      let areaColor = baseColor;
      let opacity = 1;
      let borderWidth = 0.5;
      let borderColor = '#FFFFFF';

      if (!matchesLegend) {
        areaColor = '#E5E7EB';
        opacity = 0.25;
        borderColor = '#D1D5DB';
      }

      if (isSelected) {
        borderWidth = 2.5;
        borderColor = '#111827';
        areaColor = '#FBBF24'; // Destacat taronja institucional
        opacity = 1;
      }

      const item = {
        name: m.codi_ine,
        codi_ine: m.codi_ine,
        nom_municipi: m.nom,
        comarca: m.nom_comarca,
        provincia: m.nom_provincia,
        value: rawVal,
        formattedValue: formattedVal,
        classId: classId,
        itemStyle: {
          areaColor: areaColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          opacity: opacity
        }
      };

      seriesData.push(item);
      this.cachedDataMap.set(m.codi_ine, item);
    });

    const isTinyScope = this.isFiltered && displayList.length <= 15;
    const shouldShowLabels = this.currentZoom >= 13.15 || isTinyScope;
    this.labelsVisible = shouldShowLabels;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: '#1F2937',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12
        },
        extraCssText: 'border-radius: 5px !important; box-shadow: none !important;',
        formatter: (params) => {
          if (!params.data) return params.name;
          const d = params.data;
          let themeLabel = '';
          if (this.currentTheme === 'pop') themeLabel = 'Població total';
          else if (this.currentTheme === 'evol10') themeLabel = 'Evolució 10 anys (2015-2025)';
          else if (this.currentTheme === 'evol20') themeLabel = 'Evolució 20 anys (2005-2025)';

          return `
            <div style="font-weight: 700; margin-bottom: 4px; color: #111827;">${d.nom_municipi}</div>
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 6px;">${d.comarca} (${d.provincia})</div>
            <div style="font-size: 12px; color: #374151;">
              <span>${themeLabel}:</span>
              <strong style="margin-left: 6px; color: #111827;">${d.formattedValue}</strong>
            </div>
            <div style="font-size: 10px; color: #9CA3AF; margin-top: 4px;">Codi INE: ${d.codi_ine}</div>
          `;
        }
      },
      series: [
        {
          id: 'cat_map_series',
          type: 'map',
          map: this.currentMapName,
          roam: true,
          // Si no està filtrat, mantenim el centre i zoom estàndard si cal reiniciar, o el zoom actual si és un canvi de temàtica
          ...(this.isFiltered ? {} : {
            center: shouldResetZoom ? this.geoCenter : this.currentCenter,
            zoom: shouldResetZoom ? 1.05 : this.currentZoom
          }),
          scaleLimit: { min: 0.5, max: 40 },
          label: {
            show: shouldShowLabels,
            color: '#111827',
            fontSize: 10,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 600,
            formatter: (params) => {
              const d = this.findDataByIne(params.name);
              if (!d) return params.name;
              return `${d.nom_municipi}\n${d.formattedValue}`;
            }
          },
          itemStyle: {
            areaColor: '#E5E7EB',
            borderColor: '#FFFFFF',
            borderWidth: 0.5
          },
          emphasis: {
            itemStyle: {
              areaColor: '#FBBF24',
              borderColor: '#111827',
              borderWidth: 1.5
            },
            label: {
              show: true,
              color: '#111827',
              fontSize: 11,
              fontWeight: 700
            }
          },
          select: {
            disabled: true
          },
          data: seriesData
        }
      ]
    };

    // Actualitzar instància amb notMerge = true per aplicar el mapa filtrat i colors nets
    this.chart.setOption(option, true);

    // Renderitzar la llegenda interactiva amb recompte sobre l'àmbit filtrat
    this.renderLegend(classes, displayList);
  }

  /**
   * Cerca en memòria d'elements data del mapa
   */
  findDataByIne(ine) {
    if (!this.cachedDataMap) return null;
    return this.cachedDataMap.get(ine) || null;
  }

  /**
   * Render de la llegenda HTML interactiva amb recompte de municipis (% i N) i habitants (% i N)
   */
  renderLegend(classes, scopeMunicipalities) {
    if (!this.legendContainer) return;

    const totalMunicipis = scopeMunicipalities.length;
    const totalHabitants = scopeMunicipalities.reduce((acc, m) => acc + (m.t195_total || 0), 0);

    if (this.currentTheme === 'evol10' || this.currentTheme === 'evol20') {
      this.legendContainer.classList.add('theme-evol');
    } else {
      this.legendContainer.classList.remove('theme-evol');
    }

    let html = `
      <div class="legend-panel-header">
        <span class="legend-title">${this.getThemeTitle()}</span>
        ${this.activeLegendClass ? `<button id="btnClearLegendFilter" class="legend-clear-btn" title="Desfer filtre de llegenda">✕ Treure</button>` : ''}
      </div>
    `;
    html += `<div class="legend-classes">`;

    classes.forEach(c => {
      const matchingMuns = scopeMunicipalities.filter(m => c.filter(m));
      const count = matchingMuns.length;
      const pctMuns = totalMunicipis > 0 ? ((count / totalMunicipis) * 100).toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';

      const habSum = matchingMuns.reduce((acc, m) => acc + (m.t195_total || 0), 0);
      const pctHab = totalHabitants > 0 ? ((habSum / totalHabitants) * 100).toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';
      const formattedHab = habSum.toLocaleString('ca-ES');

      const isActive = this.activeLegendClass === c.id;

      html += `
        <div class="legend-item ${isActive ? 'active' : ''}" data-class-id="${c.id}" title="Clicar per filtrar mapa i gràfics">
          <div class="legend-item-header">
            <span class="legend-color-box" style="background-color: ${c.color};"></span>
            <span class="legend-label">${c.label}</span>
          </div>
          <div class="legend-item-data">
            <div class="legend-data-row">
              <span class="legend-val"><strong>${count}</strong> mun.</span>
              <span class="legend-pct">(${pctMuns}%)</span>
            </div>
            <div class="legend-data-row">
              <span class="legend-val"><strong>${formattedHab}</strong> hab.</span>
              <span class="legend-pct">(${pctHab}%)</span>
            </div>
          </div>
        </div>
      `;
    });

    // Cas per municipis sense dades en temàtiques històriques
    if (this.currentTheme !== 'pop') {
      const noDataMuns = scopeMunicipalities.filter(m => (this.currentTheme === 'evol10' ? m.var_10a_pct === null : m.var_20a_pct === null));
      const noDataCount = noDataMuns.length;
      if (noDataCount > 0) {
        const pctMuns = totalMunicipis > 0 ? ((noDataCount / totalMunicipis) * 100).toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';
        const noDataHab = noDataMuns.reduce((acc, m) => acc + (m.t195_total || 0), 0);
        const pctHab = totalHabitants > 0 ? ((noDataHab / totalHabitants) * 100).toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';
        const formattedHab = noDataHab.toLocaleString('ca-ES');
        const isActive = this.activeLegendClass === 'no_data';

        html += `
          <div class="legend-item ${isActive ? 'active' : ''}" data-class-id="no_data" title="Clicar per filtrar mapa i gràfics">
            <div class="legend-item-header">
              <span class="legend-color-box" style="background-color: #E5E7EB; border: 1px solid #D1D5DB;"></span>
              <span class="legend-label">Sense dades</span>
            </div>
            <div class="legend-item-data">
              <div class="legend-data-row">
                <span class="legend-val"><strong>${noDataCount}</strong> mun.</span>
                <span class="legend-pct">(${pctMuns}%)</span>
              </div>
              <div class="legend-data-row">
                <span class="legend-val"><strong>${formattedHab}</strong> hab.</span>
                <span class="legend-pct">(${pctHab}%)</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    html += `</div>`;
    this.legendContainer.innerHTML = html;

    // Vincular botó de desfer filtre
    const btnClear = this.legendContainer.querySelector('#btnClearLegendFilter');
    if (btnClear) {
      btnClear.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeLegendClass = null;
        if (this.onLegendFilterChange) {
          this.onLegendFilterChange(null, this.currentTheme);
        }
      });
    }

    // Vincular esdeveniments de clic als elements de la llegenda
    const legendItems = this.legendContainer.querySelectorAll('.legend-item');
    legendItems.forEach(elem => {
      elem.addEventListener('click', () => {
        const classId = elem.getAttribute('data-class-id');
        if (this.activeLegendClass === classId) {
          this.activeLegendClass = null; // Toggle off
        } else {
          this.activeLegendClass = classId;
        }

        if (this.onLegendFilterChange) {
          this.onLegendFilterChange(this.activeLegendClass, this.currentTheme);
        }
      });
    });
  }

  getThemeTitle() {
    if (this.currentTheme === 'pop') return 'Població 2025 per municipi';
    if (this.currentTheme === 'evol10') return 'Evolució 10 anys (2015–2025)';
    if (this.currentTheme === 'evol20') return 'Evolució 20 anys (2005–2025)';
    return 'Llegenda';
  }

  /**
   * Restablir vista / zoom al centre de l'àmbit actual (casita)
   */
  resetView() {
    this.currentZoom = 1.05;
    this.currentCenter = [...this.geoCenter];
    this.labelsVisible = false;
    if (this.chart) {
      if (this.isFiltered) {
        // En àmbit filtrat, recreem la vista neta amb bounding box automàtic
        this.update(this.lastScope, this.selectedCodiIne, this.currentTheme, true);
      } else {
        this.chart.setOption({
          series: [
            {
              id: 'cat_map_series',
              center: this.geoCenter,
              zoom: 1.05,
              label: {
                show: false
              }
            }
          ]
        });
      }
    }
  }
}

// Exportar globalment
window.MapView = MapView;
