/**
 * ChartsView.js
 * Mòdul C: Panell de 6 gràfics interactius amb Apache ECharts més el gràfic d'evolució històrica.
 * Filtre creuat mestre per sexe des del Gràfic 1 cap als gràfics 2, 3, 4 i 5.
 * Format de milers català en tooltips i etiquetes.
 * Gràfic 3: Defuncions per sexe (Taula t165).
 * Gràfic 5: Població per nacionalitat (Taules t78 i t81).
 * Gràfic 6: Afiliacions a la Seguretat Social en Verd Mig (#2B5738).
 * Gràfic Evolució: Evolució anual de la població (2000–2025).
 */

class ChartsView {
  constructor(containerIds, onSexFilterChange) {
    this.containerIds = containerIds; // { g1, g2, g3, g4, g5, g6, evol }
    this.onSexFilterChange = onSexFilterChange;

    this.charts = {};
    this.selectedSex = 'tots'; // 'tots', 'homes', 'dones'
    this.currentStats = null;
    this.currentScopeName = 'Catalunya';
    this.currentTheme = 'pop'; // 'pop', 'evol10', 'evol20'
  }

  /**
   * Inicialització de les instàncies d'Apache ECharts
   */
  init() {
    Object.keys(this.containerIds).forEach(key => {
      const el = document.getElementById(this.containerIds[key]);
      if (el) {
        this.charts[key] = echarts.init(el);
      }
    });

    // Vincular clic al Gràfic 1 (Població per Sexe) tant a sectors com a la llegenda
    if (this.charts.g1) {
      this.charts.g1.on('click', (params) => {
        let clickedSex = null;
        if (params.data && params.data.rawSex) {
          clickedSex = params.data.rawSex;
        } else if (params.componentType === 'legend') {
          clickedSex = params.name === 'Homes' ? 'homes' : (params.name === 'Dones' ? 'dones' : null);
        }
        if (!clickedSex) return;

        if (this.selectedSex === clickedSex) {
          this.selectedSex = 'tots'; // Commuta / deselecciona
        } else {
          this.selectedSex = clickedSex;
        }

        if (this.onSexFilterChange) {
          this.onSexFilterChange(this.selectedSex);
        }
        this.renderAll();
      });
    }

    // Gestor de redimensionament
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  /**
   * Redimensionar tots els gràfics actius
   */
  resize() {
    Object.values(this.charts).forEach(c => {
      if (c) c.resize();
    });
  }

  /**
   * Format català de nombres enters amb separador de milers
   */
  formatNum(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('ca-ES');
  }

  /**
   * Tooltip estàndard institucional
   */
  getCommonTooltip() {
    return {
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
      extraCssText: 'border-radius: 5px !important; box-shadow: none !important;'
    };
  }

  /**
   * Actualització global amb dades agregades
   */
  update(stats, selectedSex = null, scopeName = null, theme = null) {
    this.currentStats = stats;
    if (selectedSex) this.selectedSex = selectedSex;
    if (scopeName) this.currentScopeName = scopeName;
    if (theme) this.currentTheme = theme;
    this.renderAll();
  }

  /**
   * Dibuix / actualització de tots els gràfics
   */
  renderAll() {
    if (!this.currentStats) return;
    this.renderG1();
    this.renderG2();
    this.renderG3(); // Defuncions i Naixements (Gràfic partit)
    this.renderG4(); // Població per Nacionalitat
    this.renderG5(); // Afiliacions a la Seguretat Social
    this.renderEvolution(); // Evolució 2000-2025
  }

  /**
   * Gràfic 1 — Població per Sexe (pie-borderRadius, Taula t195)
   */
  renderG1() {
    if (!this.charts.g1) return;
    const s = this.currentStats;
    const homes = s.t195_homes || 0;
    const dones = s.t195_dones || 0;
    const total = homes + dones;

    const homesPct = total > 0 ? ((homes / total) * 100).toFixed(1) : 0;
    const donesPct = total > 0 ? ((dones / total) * 100).toFixed(1) : 0;

    const isFilteredHomes = this.selectedSex === 'homes';
    const isFilteredDones = this.selectedSex === 'dones';

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        ...this.getCommonTooltip(),
        formatter: (params) => {
          return `
            <div style="font-weight: 700; margin-bottom: 4px;">${params.name}</div>
            <div>Població: <strong>${this.formatNum(params.value)} hab.</strong> (${params.percent}%)</div>
            <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">Clic per filtrar altres gràfics</div>
          `;
        }
      },
      legend: {
        bottom: '1%',
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 14,
        selectedMode: false,
        textStyle: {
          fontSize: 11,
          fontFamily: "'Inter', system-ui, sans-serif",
          color: '#4B5563'
        },
        formatter: (name) => {
          if (name === 'Homes') {
            return `Homes: ${this.formatNum(homes)} hab. (${homesPct}%)`;
          }
          if (name === 'Dones') {
            return `Dones: ${this.formatNum(dones)} hab. (${donesPct}%)`;
          }
          return name;
        }
      },
      series: [
        {
          name: 'Població per Sexe',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '43%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#FFFFFF',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: {
              show: false
            }
          },
          data: [
            {
              value: homes,
              name: 'Homes',
              rawSex: 'homes',
              itemStyle: {
                color: '#5D939F', // Blau mig
                opacity: isFilteredDones ? 0.3 : 1
              }
            },
            {
              value: dones,
              name: 'Dones',
              rawSex: 'dones',
              itemStyle: {
                color: '#D3262D', // Vermell mig
                opacity: isFilteredHomes ? 0.3 : 1
              }
            }
          ]
        }
      ]
    };

    this.charts.g1.setOption(option, true);
  }

  /**
   * Gràfic 2 — Població per Grups d'Edat (bar-y-category-stack, Taules t31 i t37)
   */
  renderG2() {
    if (!this.charts.g2) return;
    const s = this.currentStats;
    const categories = ['De 0 a 14 anys', 'De 15 a 64 anys', 'De 65 a 84 anys', 'De 85 anys i més'];

    const homesData = [s.t31_0_14 || 0, s.t31_15_64 || 0, s.t31_65_84 || 0, s.t31_85_mes || 0];
    const donesData = [s.t37_0_14 || 0, s.t37_15_64 || 0, s.t37_65_84 || 0, s.t37_85_mes || 0];

    const series = [];

    if (this.selectedSex === 'tots' || this.selectedSex === 'homes') {
      series.push({
        name: 'Homes',
        type: 'bar',
        stack: 'total',
        itemStyle: {
          color: '#5D939F', // Blau mig
          borderRadius: this.selectedSex === 'homes' ? [0, 5, 5, 0] : [0, 0, 0, 0]
        },
        data: homesData
      });
    }

    if (this.selectedSex === 'tots' || this.selectedSex === 'dones') {
      series.push({
        name: 'Dones',
        type: 'bar',
        stack: 'total',
        itemStyle: {
          color: '#D3262D', // Vermell mig
          borderRadius: [0, 5, 5, 0]
        },
        data: donesData
      });
    }

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1F2937', fontFamily: "'Inter', sans-serif", fontSize: 12 },
        extraCssText: 'border-radius: 5px !important; box-shadow: none !important;',
        formatter: (params) => {
          let str = `<div style="font-weight: 700; margin-bottom: 4px;">${params[0].axisValueLabel}</div>`;
          let sum = 0;
          params.forEach(p => {
            sum += p.value;
            str += `<div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <strong>${this.formatNum(p.value)} hab.</strong></div>`;
          });
          if (params.length > 1) {
            str += `<div style="margin-top:4px;border-top:1px solid #E5E7EB;padding-top:4px;">Total grup: <strong>${this.formatNum(sum)} hab.</strong></div>`;
          }
          return str;
        }
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#4B5563' }
      },
      grid: {
        top: '6%',
        left: '3%',
        right: '7%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10,
          color: '#6B7280',
          formatter: (v) => (v >= 1000 ? (v / 1000).toLocaleString('ca-ES') + 'k' : v)
        },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 10, color: '#374151', fontWeight: 500 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E5E7EB' } }
      },
      series: series
    };

    this.charts.g2.setOption(option, true);
  }

  /**
   * Gràfic 3 — Defuncions i Naixements (Gràfic partit estil Grups d'Edat a la mateixa escala)
   */
  renderG3() {
    if (!this.charts.g3) return;
    const s = this.currentStats;

    const defHomes = s.t165_homes || 0;
    const defDones = s.t165_dones || 0;
    const totalDef = defHomes + defDones;

    const naixHomes = s.t164_nens || 0;
    const naixDones = s.t164_nenes || 0;
    const totalNaix = naixHomes + naixDones;

    // Actualitzar indicador de saldo natural a la capçalera de la targeta
    const badge = document.getElementById('naturalBalanceBadge');
    if (badge) {
      const saldo = totalNaix - totalDef;
      const sign = saldo >= 0 ? '+' : '';
      badge.textContent = `Saldo natural: ${sign}${this.formatNum(saldo)} hab.`;
      badge.style.color = saldo >= 0 ? '#1A3E26' : '#8B1C24';
      badge.style.backgroundColor = saldo >= 0 ? '#EBF5EF' : '#FEE2E2';
      badge.style.borderColor = saldo >= 0 ? '#A7F3D0' : '#FECACA';
    }

    const isFilteredHomes = this.selectedSex === 'homes';
    const isFilteredDones = this.selectedSex === 'dones';

    // Determinar escala màxima compartida per garantir comparació exacta 1:1
    const maxVal = Math.max(defHomes, defDones, naixHomes, naixDones, 1);
    const maxSharedScale = Math.ceil(maxVal * 1.38);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1F2937', fontFamily: "'Inter', sans-serif", fontSize: 12 },
        extraCssText: 'border-radius: 5px !important; box-shadow: none !important;',
        formatter: (params) => {
          const isDef = params.seriesName === 'Defuncions';
          const total = isDef ? totalDef : totalNaix;
          const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
          return `
            <div style="font-weight: 700; margin-bottom: 4px;">${params.seriesName} — ${params.name}</div>
            <div>Població: <strong>${this.formatNum(params.value)} hab.</strong> (${pct}%)</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Total àmbit: ${this.formatNum(total)} hab.</div>
          `;
        }
      },
      title: [
        {
          text: `DEFUNCIONS: ${this.formatNum(totalDef)} hab.`,
          left: '24%',
          top: '3%',
          textAlign: 'center',
          textStyle: {
            fontSize: 11,
            fontWeight: 700,
            color: '#1F2937',
            fontFamily: "'Inter', sans-serif"
          }
        },
        {
          text: `NAIXEMENTS: ${this.formatNum(totalNaix)} hab.`,
          left: '74%',
          top: '3%',
          textAlign: 'center',
          textStyle: {
            fontSize: 11,
            fontWeight: 700,
            color: '#1F2937',
            fontFamily: "'Inter', sans-serif"
          }
        }
      ],
      grid: [
        // Grid 0: Defuncions (Esquerra)
        {
          left: '12%',
          right: '54%',
          top: '26%',
          bottom: '12%',
          containLabel: true
        },
        // Grid 1: Naixements (Dreta)
        {
          left: '58%',
          right: '8%',
          top: '26%',
          bottom: '12%',
          containLabel: true
        }
      ],
      xAxis: [
        {
          gridIndex: 0,
          type: 'value',
          min: 0,
          max: maxSharedScale,
          axisLabel: {
            fontSize: 9,
            color: '#6B7280',
            formatter: (v) => (v >= 1000 ? (v / 1000).toLocaleString('ca-ES') + 'k' : v)
          },
          splitLine: { lineStyle: { color: '#F3F4F6' } }
        },
        {
          gridIndex: 1,
          type: 'value',
          min: 0,
          max: maxSharedScale,
          axisLabel: {
            fontSize: 9,
            color: '#6B7280',
            formatter: (v) => (v >= 1000 ? (v / 1000).toLocaleString('ca-ES') + 'k' : v)
          },
          splitLine: { lineStyle: { color: '#F3F4F6' } }
        }
      ],
      yAxis: [
        {
          gridIndex: 0,
          type: 'category',
          data: ['Dones', 'Homes'],
          axisLabel: { fontSize: 10, color: '#374151', fontWeight: 600 },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#E5E7EB' } }
        },
        {
          gridIndex: 1,
          type: 'category',
          data: ['Dones', 'Homes'],
          axisLabel: { fontSize: 10, color: '#374151', fontWeight: 600 },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#E5E7EB' } }
        }
      ],
      series: [
        // 1. Defuncions (Esquerra)
        {
          name: 'Defuncions',
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          barWidth: 16,
          data: [
            {
              value: defDones,
              name: 'Dones',
              itemStyle: {
                color: '#D3262D', // Vermell mig
                borderRadius: [0, 4, 4, 0],
                opacity: isFilteredHomes ? 0.3 : 1
              }
            },
            {
              value: defHomes,
              name: 'Homes',
              itemStyle: {
                color: '#5D939F', // Blau mig
                borderRadius: [0, 4, 4, 0],
                opacity: isFilteredDones ? 0.3 : 1
              }
            }
          ],
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            formatter: (p) => {
              const pct = totalDef > 0 ? ((p.value / totalDef) * 100).toFixed(1) : '0';
              return `${this.formatNum(p.value)} (${pct}%)`;
            }
          }
        },
        // 2. Naixements (Dreta)
        {
          name: 'Naixements',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          barWidth: 16,
          data: [
            {
              value: naixDones,
              name: 'Dones',
              itemStyle: {
                color: '#D3262D', // Vermell mig
                borderRadius: [0, 4, 4, 0],
                opacity: isFilteredHomes ? 0.3 : 1
              }
            },
            {
              value: naixHomes,
              name: 'Homes',
              itemStyle: {
                color: '#5D939F', // Blau mig
                borderRadius: [0, 4, 4, 0],
                opacity: isFilteredDones ? 0.3 : 1
              }
            }
          ],
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            formatter: (p) => {
              const pct = totalNaix > 0 ? ((p.value / totalNaix) * 100).toFixed(1) : '0';
              return `${this.formatNum(p.value)} (${pct}%)`;
            }
          }
        }
      ]
    };

    this.charts.g3.setOption(option, true);
  }

  /**
   * Gràfic 4 — Població per Nacionalitat (pie-borderRadius, Taules t78 i t81)
   */
  renderG4() {
    if (!this.charts.g4) return;
    const s = this.currentStats;

    let espanyola = 0;
    let estrangera = 0;

    if (this.selectedSex === 'homes') {
      espanyola = s.t78_espanyola || 0;
      estrangera = s.t78_estrangera || 0;
    } else if (this.selectedSex === 'dones') {
      espanyola = s.t81_espanyola || 0;
      estrangera = s.t81_estrangera || 0;
    } else {
      espanyola = (s.t78_espanyola || 0) + (s.t81_espanyola || 0);
      estrangera = (s.t78_estrangera || 0) + (s.t81_estrangera || 0);
    }

    const total = espanyola + estrangera;
    const espPct = total > 0 ? ((espanyola / total) * 100).toFixed(1) : 0;
    const estPct = total > 0 ? ((estrangera / total) * 100).toFixed(1) : 0;

    const sexSuffix = this.selectedSex === 'homes' ? ' (Homes)' : (this.selectedSex === 'dones' ? ' (Dones)' : '');

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        ...this.getCommonTooltip(),
        formatter: (params) => {
          return `
            <div style="font-weight: 700; margin-bottom: 4px;">Nacionalitat ${params.name}</div>
            <div>Població: <strong>${this.formatNum(params.value)} hab.</strong> (${params.percent}%)</div>
          `;
        }
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#4B5563' }
      },
      series: [
        {
          name: `Nacionalitat${sexSuffix}`,
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#FFFFFF',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'inside',
            formatter: '{d}%',
            fontSize: 11,
            fontWeight: 700,
            color: '#FFFFFF'
          },
          emphasis: {
            scale: true,
            scaleSize: 6
          },
          data: [
            {
              value: espanyola,
              name: `Espanyola (${espPct}%)`,
              itemStyle: { color: '#2B5738' } // Verd mig
            },
            {
              value: estrangera,
              name: `Estrangera (${estPct}%)`,
              itemStyle: { color: '#D4B581' } // Marró mig
            }
          ]
        }
      ]
    };

    this.charts.g4.setOption(option, true);
  }

  /**
   * Gràfic 5 — Afiliacions a la Seguretat Social per Sectors (Taula t183)
   */
  renderG5() {
    if (!this.charts.g5) return;
    const s = this.currentStats;
    const sectors = ['Agricultura', 'Indústria', 'Construcció', 'Serveis'];
    const values = [
      s.t183_agricultura || 0,
      s.t183_industria || 0,
      s.t183_construccio || 0,
      s.t183_serveis || 0
    ];

    const total = values.reduce((a, b) => a + b, 0) || s.t183_total || 1;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1F2937', fontFamily: "'Inter', sans-serif", fontSize: 12 },
        extraCssText: 'border-radius: 5px !important; box-shadow: none !important;',
        formatter: (params) => {
          const p = params[0];
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : 0;
          return `
            <div style="font-weight: 700; margin-bottom: 4px;">Sector: ${p.axisValueLabel}</div>
            <div>Afiliacions: <strong>${this.formatNum(p.value)}</strong> (${pct}%)</div>
          `;
        }
      },
      grid: {
        top: '6%',
        left: '3%',
        right: '18%', // Espai per a l'etiqueta a la dreta de la barra
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10,
          color: '#6B7280',
          formatter: (v) => (v >= 1000 ? (v / 1000).toLocaleString('ca-ES') + 'k' : v)
        },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      yAxis: {
        type: 'category',
        data: sectors,
        axisLabel: { fontSize: 10, color: '#374151', fontWeight: 500 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E5E7EB' } }
      },
      series: [
        {
          name: 'Afiliacions',
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#2B5738', // Verd mig
            borderRadius: [0, 5, 5, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => {
              const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
              return `${this.formatNum(params.value)} (${pct}%)`;
            },
            fontSize: 10,
            fontWeight: 600,
            color: '#374151'
          }
        }
      ]
    };

    this.charts.g5.setOption(option, true);
  }

  /**
   * Gràfic d'Evolució Històrica de la Població
   * S'adapta dinàmicament a la temàtica seleccionada (2015–2025 per a evol10, 2005–2025 per a evol20, 2000–2025 per a pop)
   */
  renderEvolution() {
    if (!this.charts.evol) return;
    const s = this.currentStats;
    const hist = s.historical || {};

    let startYear = 2000;
    const endYear = 2025;

    if (this.currentTheme === 'evol10') {
      startYear = 2015;
    } else if (this.currentTheme === 'evol20') {
      startYear = 2005;
    }

    const years = [];
    const values = [];

    for (let yr = startYear; yr <= endYear; yr++) {
      years.push(String(yr));
      values.push(hist[yr] || 0);
    }

    const startVal = values[0] || 0;
    const endVal = values[values.length - 1] || 0;
    const diff = endVal - startVal;
    const diffPct = startVal > 0 ? ((diff / startVal) * 100).toFixed(1) : 0;

    // Actualitzar títol de la targeta d'evolució
    const titleEl = document.getElementById('evolutionTitle');
    if (titleEl) {
      titleEl.textContent = `Evolució de la Població (${startYear}–${endYear})`;
    }

    // Actualitzar subtítol d'àmbit al DOM
    const subtitleEl = document.getElementById('evolutionScopeSubtitle');
    if (subtitleEl) {
      const sign = diff >= 0 ? '+' : '';
      subtitleEl.innerHTML = `<strong>${this.currentScopeName}</strong> · Variació ${startYear}–${endYear}: <span style="color:${diff >= 0 ? '#2B5738' : '#D3262D'}; font-weight:700;">${sign}${this.formatNum(diff)} hab. (${sign}${diffPct}%)</span>`;
    }

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#3A6B7E', width: 1.5, type: 'dashed' } },
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1F2937', fontFamily: "'Inter', sans-serif", fontSize: 12 },
        extraCssText: 'border-radius: 5px !important; box-shadow: none !important;',
        formatter: (params) => {
          const p = params[0];
          const yr = Number(p.axisValue);
          const val = p.value;
          const varSinceStart = val - startVal;
          const varPct = startVal > 0 ? ((varSinceStart / startVal) * 100).toFixed(2) : '0';
          const sign = varSinceStart >= 0 ? '+' : '';

          return `
            <div style="font-weight: 700; color: #111827; margin-bottom: 4px;">Any ${yr}</div>
            <div style="font-size: 13px; color: #111827; margin-bottom: 4px;">Població: <strong style="color: #3A6B7E;">${this.formatNum(val)} hab.</strong></div>
            <div style="font-size: 11px; color: #6B7280;">Respecte a l'any ${startYear}: <strong style="color: ${varSinceStart >= 0 ? '#2B5738' : '#D3262D'};">${sign}${this.formatNum(varSinceStart)} hab. (${sign}${varPct}%)</strong></div>
          `;
        }
      },
      grid: {
        top: '12%',
        left: '2%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: years,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: {
          color: '#6B7280',
          fontSize: 10,
          interval: (idx, val) => {
            const yr = Number(val);
            if (startYear === 2015) {
              return true; // Mostra tots els anys (2015 a 2025)
            } else if (startYear === 2005) {
              return (yr - 2005) % 2 === 0 || yr === 2025; // Cada 2 anys + l'últim
            }
            return yr % 5 === 0 || yr === 2025; // Cada 5 anys + l'últim
          }
        },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        scale: true, // Escala automàtica per ressaltar la tendència
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
        axisLabel: {
          color: '#6B7280',
          fontSize: 10,
          formatter: (v) => {
            if (v >= 1000000) return (v / 1000000).toLocaleString('ca-ES', { maximumFractionDigits: 2 }) + 'M';
            if (v >= 1000) return (v / 1000).toLocaleString('ca-ES', { maximumFractionDigits: 1 }) + 'k';
            return v;
          }
        }
      },
      series: [
        {
          name: 'Població',
          type: 'line',
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          itemStyle: {
            color: '#3A6B7E' // Blau/petrol institucional
          },
          lineStyle: {
            width: 2.5,
            color: '#3A6B7E'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(58, 107, 126, 0.35)' },
              { offset: 1, color: 'rgba(58, 107, 126, 0.02)' }
            ])
          },
          data: values
        }
      ]
    };

    this.charts.evol.setOption(option, true);
  }
}

// Exportar globalment
window.ChartsView = ChartsView;
