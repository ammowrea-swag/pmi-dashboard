(function () {
  const { meta, monthly, metrics } = window.PMI_DATA;

  const state = {
    currentMonthIndex: monthly.length - 1
  };

  const seriesConfig = [
    { canvasId: 'pmiChart', label: 'PMI', key: 'pmi' },
    { canvasId: 'ordersChart', label: 'New Orders', key: 'newOrders' },
    { canvasId: 'productionChart', label: 'Production', key: 'production' },
    { canvasId: 'employmentChart', label: 'Employment', key: 'employment' },
    { canvasId: 'pricesChart', label: 'Prices', key: 'prices' }
  ];

  const historicalData = {
    months: monthly.map((d) => d.month.replace(' 20', ' '))
  };

  function formatChange(change) {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} pts`;
  }

  function getCurrentMetrics() {
    const current = monthly[state.currentMonthIndex];
    const previous = state.currentMonthIndex > 0 ? monthly[state.currentMonthIndex - 1] : null;

    return metrics.map((def) => {
      const value = current[def.key];
      const prevValue = previous ? previous[def.key] : value;
      const change = value - prevValue;

      return {
        ...def,
        value,
        previous: prevValue,
        change
      };
    });
  }

  function renderHeader() {
    document.getElementById('lastUpdated').textContent = `Latest Data: ${meta.latestDataMonth} | Released: ${meta.releaseDate}`;
    document.getElementById('pmiTrendTitle').textContent = `Manufacturing PMI® Trend (${monthly.length} Months)`;
    document.getElementById('highlights').innerHTML =
      '<strong>March 2026 Highlights:</strong> Manufacturing expanded for a third straight month, with the PMI® at 52.7, ' +
      'up from 52.4 in February. New Orders remained in expansion at 53.5, while Production strengthened to 55.1. ' +
      'The Prices Index surged to 78.3 (highest since June 2022), reflecting broad input cost pressures. ' +
      'Employment remained in contraction at 48.7, and New Export Orders slipped back into contraction at 49.9.';
  }

  function renderMetrics() {
    const metricsGrid = document.getElementById('metricsGrid');
    const currentMetrics = getCurrentMetrics();

    metricsGrid.innerHTML = '';

    currentMetrics.forEach((metric) => {
      const isExpanding = metric.value > 50;
      const changeType = metric.change > 0 ? 'positive' : metric.change < 0 ? 'negative' : 'neutral';
      const trendEmoji = metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→';

      const card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = `
        <div class="metric-header">
          <div class="metric-title">${metric.title}</div>
          <div class="metric-trend">${trendEmoji}</div>
        </div>
        <div class="metric-value">${metric.value.toFixed(1)}</div>
        <div class="metric-change ${changeType}">
          ${formatChange(metric.change)}
        </div>
        <div class="metric-info">
          <div>Previous: ${metric.previous.toFixed(1)}</div>
          <div style="margin-top: 4px;">
            Status: <span class="${isExpanding ? 'expansion' : 'contraction'}">
              ${isExpanding ? 'Expansion' : 'Contraction'}
            </span>
          </div>
          ${metric.info ? `<div style="margin-top: 8px; font-style: italic;">${metric.info}</div>` : ''}
        </div>
      `;
      metricsGrid.appendChild(card);
    });
  }

  function updateMonthControls() {
    document.getElementById('currentMonth').textContent = monthly[state.currentMonthIndex].month;
    document.getElementById('prevMonth').disabled = state.currentMonthIndex === 0;
    document.getElementById('nextMonth').disabled = state.currentMonthIndex === monthly.length - 1;
  }

  function bindMonthNavigation() {
    document.getElementById('prevMonth').addEventListener('click', () => {
      if (state.currentMonthIndex > 0) {
        state.currentMonthIndex -= 1;
        renderMetrics();
        updateMonthControls();
      }
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
      if (state.currentMonthIndex < monthly.length - 1) {
        state.currentMonthIndex += 1;
        renderMetrics();
        updateMonthControls();
      }
    });
  }

  function createChart(canvasId, label, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    let yMin = Math.floor(Math.min(40, minValue - 2));
    let yMax = Math.ceil(maxValue + 2);

    yMin = Math.min(yMin, 48);
    yMax = Math.max(yMax, 52);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: historicalData.months,
        datasets: [
          {
            label,
            data,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          },
          {
            label: 'Threshold (50)',
            data: Array(historicalData.months.length).fill(50),
            borderColor: '#e53e3e',
            borderWidth: 2,
            borderDash: [10, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: '600',
                family: 'Georgia, serif'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
              family: 'Georgia, serif'
            },
            bodyFont: {
              size: 13,
              family: 'Georgia, serif'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: yMin,
            max: yMax,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 12,
                family: 'Georgia, serif'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                family: 'Georgia, serif'
              }
            }
          }
        }
      }
    });
  }

  function initCharts() {
    seriesConfig.forEach((series) => {
      const data = monthly.map((d) => d[series.key]);
      createChart(series.canvasId, series.label, data);
    });
  }

  function init() {
    renderHeader();
    renderMetrics();
    updateMonthControls();
    bindMonthNavigation();
    initCharts();
  }

  init();
})();