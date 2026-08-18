import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Scatter, Chart } from 'react-chartjs-2';
import {
  Download,
  Maximize2,
  X,
  RefreshCw,
  Info,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { standardNormalPDF } from '../utils/distributions';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ChartViewData {
  type: 'histogram' | 'boxplot' | 'scatter' | 'xbar-r' | 'imr' | 'p-chart' | 'capability' | 'probability';
  title: string;
  variableName: string;
  data: any;
}

interface ChartViewerProps {
  chartData?: ChartViewData;
  chartView?: ChartViewData;
  onClose?: () => void;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({ chartData: propData, chartView, onClose }) => {
  const chartData = propData || chartView;
  const chartRef = useRef<any>(null);

  if (!chartData) return null;

  const downloadChartImage = () => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const url = chart.toBase64Image();
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITPA_${chartData.type}_${chartData.variableName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  // Render according to chart type
  const renderChartContent = () => {
    switch (chartData.type) {
      case 'histogram':
        return renderHistogram(chartData);
      case 'scatter':
        return renderScatter(chartData);
      case 'xbar-r':
        return renderXbarR(chartData);
      case 'imr':
        return renderIMR(chartData);
      case 'p-chart':
        return renderPChart(chartData);
      case 'capability':
        return renderCapability(chartData);
      case 'probability':
        return renderProbabilityPlot(chartData);
      case 'boxplot':
      default:
        return renderBoxplot(chartData);
    }
  };

  // 1. Histogram with Superimposed Normal Distribution Curve
  const renderHistogram = (cd: ChartViewData) => {
    const { values, mean, stdDev, n } = cd.data;
    if (!values || values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const binCount = Math.max(5, Math.min(20, Math.ceil(Math.sqrt(n))));
    const binWidth = range / binCount;

    const binLabels: string[] = [];
    const binCounts: number[] = Array(binCount).fill(0);
    const binMids: number[] = [];

    for (let i = 0; i < binCount; i++) {
      const bMin = min + i * binWidth;
      const bMax = bMin + binWidth;
      const mid = (bMin + bMax) / 2;
      binMids.push(mid);
      binLabels.push(`${bMin.toFixed(2)} - ${bMax.toFixed(2)}`);
    }

    values.forEach((v: number) => {
      let bIdx = Math.floor((v - min) / binWidth);
      if (bIdx >= binCount) bIdx = binCount - 1;
      if (bIdx < 0) bIdx = 0;
      binCounts[bIdx]++;
    });

    // Normal curve points
    const normalCurvePoints = binMids.map(mid => {
      const z = (mid - mean) / (stdDev || 1);
      const pdf = standardNormalPDF(z) / (stdDev || 1);
      // Scale PDF by sample size and bin width to match frequency count
      return pdf * n * binWidth;
    });

    const data = {
      labels: binLabels,
      datasets: [
        {
          type: 'line' as const,
          label: `Curva Normal (μ=${mean.toFixed(3)}, σ=${stdDev.toFixed(3)})`,
          data: normalCurvePoints,
          borderColor: '#dc2626',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'bar' as const,
          label: 'Frecuencia Observada',
          data: binCounts,
          backgroundColor: 'rgba(59, 130, 246, 0.65)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 3,
          yAxisID: 'y'
        }
      ]
    };

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: {
          display: true,
          text: `Histograma de ${cd.variableName} con Ajuste Normal`,
          font: { size: 14, weight: 'bold' },
          color: '#1e293b'
        },
        legend: { position: 'top' as const }
      },
      scales: {
        y: {
          title: { display: true, text: 'Frecuencia (Conteo)' },
          grid: { color: '#e2e8f0' }
        },
        x: {
          title: { display: true, text: cd.variableName },
          grid: { display: false }
        }
      }
    };

    return (
      <div className="relative w-full h-[380px]">
        {/* @ts-ignore */}
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    );
  };

  // 2. Scatter Plot with Linear Trendline
  const renderScatter = (cd: ChartViewData) => {
    const { xValues, yValues, equation, rSq, xName, yName } = cd.data;
    const points = xValues.map((x: number, i: number) => ({ x, y: yValues[i] }));
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);

    // Compute line endpoints
    const regResult = cd.data.regression;
    const b0 = regResult?.coefficients?.[0]?.coef ?? 0;
    const b1 = regResult?.coefficients?.[1]?.coef ?? 0;

    const linePoints = [
      { x: minX, y: b0 + b1 * minX },
      { x: maxX, y: b0 + b1 * maxX }
    ];

    const data = {
      datasets: [
        {
          label: `Ajuste Lineal (R² = ${(rSq || 0).toFixed(2)}%)`,
          data: linePoints,
          type: 'line' as const,
          borderColor: '#dc2626',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Observaciones',
          data: points,
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: '#1d4ed8',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Gráfico de Dispersión: ${yName} vs ${xName}`,
          font: { size: 14, weight: 'bold' },
          color: '#1e293b'
        },
        subtitle: {
          display: true,
          text: `Ecuación: ${equation || ''}`,
          color: '#475569'
        }
      },
      scales: {
        x: {
          type: 'linear' as const,
          position: 'bottom' as const,
          title: { display: true, text: xName },
          grid: { color: '#f1f5f9' }
        },
        y: {
          title: { display: true, text: yName },
          grid: { color: '#e2e8f0' }
        }
      }
    };

    return (
      <div className="relative w-full h-[380px]">
        {/* @ts-ignore */}
        <Scatter ref={chartRef} data={data} options={options} />
      </div>
    );
  };

  // 3. Xbar-R Control Chart
  const renderXbarR = (cd: ChartViewData) => {
    const { subgroups, xbar, r, variableName, subgroupSize } = cd.data;
    const labels = subgroups.map((s: any) => `Sub ${s.index}`);
    const meanVals = subgroups.map((s: any) => s.mean);
    const rangeVals = subgroups.map((s: any) => s.range);

    const xbarData = {
      labels,
      datasets: [
        {
          label: 'Media de Subgrupo (X̄)',
          data: meanVals,
          borderColor: '#2563eb',
          backgroundColor: subgroups.map((s: any) => (s.isOutOfControlMean ? '#dc2626' : '#2563eb')),
          pointRadius: subgroups.map((s: any) => (s.isOutOfControlMean ? 7 : 4)),
          pointHoverRadius: 8,
          pointStyle: subgroups.map((s: any) => (s.isOutOfControlMean ? 'triangle' : 'circle')),
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: `LSC / UCL (${xbar.ucl.toFixed(3)})`,
          data: Array(subgroups.length).fill(xbar.ucl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: `Línea Central LC (${xbar.cl.toFixed(3)})`,
          data: Array(subgroups.length).fill(xbar.cl),
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: `LIC / LCL (${xbar.lcl.toFixed(3)})`,
          data: Array(subgroups.length).fill(xbar.lcl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    };

    const rData = {
      labels,
      datasets: [
        {
          label: 'Rango de Subgrupo (R)',
          data: rangeVals,
          borderColor: '#0284c7',
          backgroundColor: subgroups.map((s: any) => (s.isOutOfControlRange ? '#dc2626' : '#0284c7')),
          pointRadius: subgroups.map((s: any) => (s.isOutOfControlRange ? 7 : 4)),
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: `LSC (${r.ucl.toFixed(3)})`,
          data: Array(subgroups.length).fill(r.ucl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: `LC (${r.cl.toFixed(3)})`,
          data: Array(subgroups.length).fill(r.cl),
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: `LIC (${r.lcl.toFixed(3)})`,
          data: Array(subgroups.length).fill(r.lcl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    };

    const commonOptions = (chartTitle: string) => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: chartTitle, font: { size: 12, weight: 'bold' } },
        legend: { position: 'top' as const, labels: { boxWidth: 12, font: { size: 10 } } }
      },
      scales: {
        y: { grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    });

    return (
      <div className="space-y-4">
        <div className="bg-slate-100 p-2 rounded text-xs text-slate-700 font-sans flex items-center justify-between">
          <div>
            <strong>Gráfico Xbar-R:</strong> {variableName} (Tamaño de subgrupo n = {subgroupSize})
          </div>
          {cd.data.violations?.length > 0 ? (
            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-semibold text-[11px]">
              ⚠️ {cd.data.violations.length} punto(s) fuera de control detectados
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px]">
              ✓ Proceso bajo control estadístico
            </span>
          )}
        </div>
        <div className="h-[210px] w-full">
          {/* @ts-ignore */}
          <Line ref={chartRef} data={xbarData} options={commonOptions('Gráfico de Medias (X̄)')} />
        </div>
        <div className="h-[190px] w-full">
          {/* @ts-ignore */}
          <Line data={rData} options={commonOptions('Gráfico de Rangos (R)')} />
        </div>
      </div>
    );
  };

  // 4. I-MR Control Chart
  const renderIMR = (cd: ChartViewData) => {
    const { subgroups, xbar, r, variableName } = cd.data;
    const labels = subgroups.map((s: any) => `#${s.index}`);
    const iVals = subgroups.map((s: any) => s.mean);

    const iData = {
      labels,
      datasets: [
        {
          label: 'Valor Individual (I)',
          data: iVals,
          borderColor: '#3b82f6',
          backgroundColor: subgroups.map((s: any) => (s.isOutOfControlMean ? '#ef4444' : '#3b82f6')),
          pointRadius: 4,
          borderWidth: 2
        },
        {
          label: `LSC (${xbar.ucl.toFixed(2)})`,
          data: Array(subgroups.length).fill(xbar.ucl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: `LC (${xbar.cl.toFixed(2)})`,
          data: Array(subgroups.length).fill(xbar.cl),
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: `LIC (${xbar.lcl.toFixed(2)})`,
          data: Array(subgroups.length).fill(xbar.lcl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    };

    return (
      <div className="space-y-3">
        <div className="h-[360px] w-full">
          {/* @ts-ignore */}
          <Line
            ref={chartRef}
            data={iData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: `Gráfico de Valores Individuales (I-MR): ${variableName}` },
                legend: { position: 'top' as const }
              }
            }}
          />
        </div>
      </div>
    );
  };

  // 5. P-Chart
  const renderPChart = (cd: ChartViewData) => {
    const { subgroups, xbar, variableName } = cd.data;
    const labels = subgroups.map((s: any) => `Lote ${s.index}`);
    const pVals = subgroups.map((s: any) => s.mean);

    const data = {
      labels,
      datasets: [
        {
          label: 'Proporción de Defectuosos (p)',
          data: pVals,
          borderColor: '#f59e0b',
          backgroundColor: subgroups.map((s: any) => (s.isOutOfControlMean ? '#ef4444' : '#f59e0b')),
          pointRadius: subgroups.map((s: any) => (s.isOutOfControlMean ? 6 : 4)),
          borderWidth: 2
        },
        {
          label: `LSC (${xbar.ucl.toFixed(4)})`,
          data: Array(subgroups.length).fill(xbar.ucl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: `LC p̄ (${xbar.cl.toFixed(4)})`,
          data: Array(subgroups.length).fill(xbar.cl),
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: `LIC (${xbar.lcl.toFixed(4)})`,
          data: Array(subgroups.length).fill(xbar.lcl),
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    };

    return (
      <div className="h-[380px] w-full">
        {/* @ts-ignore */}
        <Line
          ref={chartRef}
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: `Gráfico P (Control por Atributos): ${variableName}` }
            }
          }}
        />
      </div>
    );
  };

  // 6. Capability Analysis Plot
  const renderCapability = (cd: ChartViewData) => {
    const { values, mean, withinStdDev, overallStdDev, lsl, usl, target, cp, cpk, pp, ppk } = cd.data;
    const min = Math.min(...values, lsl ?? Infinity, target ?? Infinity);
    const max = Math.max(...values, usl ?? -Infinity, target ?? -Infinity);
    const binCount = 15;
    const binWidth = (max - min) / binCount;

    const binLabels: string[] = [];
    const binCounts: number[] = Array(binCount).fill(0);
    const binMids: number[] = [];

    for (let i = 0; i < binCount; i++) {
      const bMin = min + i * binWidth;
      const bMax = bMin + binWidth;
      binMids.push((bMin + bMax) / 2);
      binLabels.push(bMin.toFixed(2));
    }

    values.forEach((v: number) => {
      let bIdx = Math.floor((v - min) / binWidth);
      if (bIdx >= binCount) bIdx = binCount - 1;
      if (bIdx >= 0) binCounts[bIdx]++;
    });

    const withinCurve = binMids.map(mid => {
      const z = (mid - mean) / (withinStdDev || 1);
      return (standardNormalPDF(z) / (withinStdDev || 1)) * values.length * binWidth;
    });

    const data = {
      labels: binLabels,
      datasets: [
        {
          type: 'line' as const,
          label: `Ajuste Dentro de Subgrupo (σ = ${withinStdDev.toFixed(3)})`,
          data: withinCurve,
          borderColor: '#dc2626',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0
        },
        {
          type: 'bar' as const,
          label: 'Datos de Proceso',
          data: binCounts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: '#2563eb',
          borderWidth: 1
        }
      ]
    };

    return (
      <div className="space-y-4">
        {/* Capability Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs">
          <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
            <div className="text-slate-500 font-medium">Cp (Potencial)</div>
            <div className="text-lg font-bold text-slate-800">{cp !== undefined ? cp.toFixed(2) : 'N/A'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
            <div className="text-slate-500 font-medium">Cpk (Capacidad Real)</div>
            <div className={`text-lg font-bold ${cpk !== undefined && cpk >= 1.33 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {cpk !== undefined ? cpk.toFixed(2) : 'N/A'}
            </div>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
            <div className="text-slate-500 font-medium">Pp (Rendimiento)</div>
            <div className="text-lg font-bold text-slate-800">{pp !== undefined ? pp.toFixed(2) : 'N/A'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
            <div className="text-slate-500 font-medium">Ppk (Rendimiento Real)</div>
            <div className={`text-lg font-bold ${ppk !== undefined && ppk >= 1.33 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {ppk !== undefined ? ppk.toFixed(2) : 'N/A'}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <Chart
            type="bar"
            ref={chartRef}
            data={data as any}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: `Informe de Capacidad del Proceso: ${cd.variableName} (LIE/LSL=${lsl ?? 'N/A'}, LSE/USL=${usl ?? 'N/A'})`
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  // 7. Normal Probability Plot (Q-Q)
  const renderProbabilityPlot = (cd: ChartViewData) => {
    const { points, mean, stdDev, adStat, pValue } = cd.data;
    const scatterPoints = points.map((p: any) => ({ x: p.x, y: p.y }));

    const minX = Math.min(...points.map((p: any) => p.x));
    const maxX = Math.max(...points.map((p: any) => p.x));

    const linePoints = [
      { x: mean - 3 * stdDev, y: 0.13 },
      { x: mean, y: 50 },
      { x: mean + 3 * stdDev, y: 99.87 }
    ];

    const data = {
      datasets: [
        {
          label: 'Línea de Ajuste Normal',
          data: linePoints,
          type: 'line' as const,
          borderColor: '#dc2626',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'Datos Empíricos (Percentil %)',
          data: scatterPoints,
          backgroundColor: 'rgba(37, 99, 235, 0.8)',
          borderColor: '#1d4ed8',
          pointRadius: 4
        }
      ]
    };

    return (
      <div className="space-y-3">
        <div className="bg-slate-100 p-2.5 rounded text-xs flex items-center justify-between text-slate-700 border border-slate-200">
          <span>Prueba de Normalidad Anderson-Darling: <strong>AD = {adStat.toFixed(3)}</strong></span>
          <span className={`px-2 py-0.5 rounded font-bold ${pValue >= 0.05 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            Valor P = {pValue.toFixed(4)} ({pValue >= 0.05 ? 'Normalidad aceptada' : 'No normal'})
          </span>
        </div>
        <div className="h-[340px] w-full">
          <Chart
            type="scatter"
            ref={chartRef}
            data={data as any}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: `Gráfica de Probabilidad Normal para ${cd.variableName}` }
              },
              scales: {
                x: { title: { display: true, text: cd.variableName } },
                y: { title: { display: true, text: 'Porcentaje Acumulado (%)' }, min: 0, max: 100 }
              }
            }}
          />
        </div>
      </div>
    );
  };

  // 8. Boxplot
  const renderBoxplot = (cd: ChartViewData) => {
    const { min, q1, median, q3, max, mean, varName } = cd.data;
    return (
      <div className="p-4 flex flex-col items-center justify-center space-y-6">
        <h4 className="text-sm font-bold text-slate-800">Diagrama de Caja (Boxplot) de {varName}</h4>
        <div className="w-full max-w-md bg-slate-50 p-6 border border-slate-200 rounded-lg shadow-2xs">
          {/* SVG Boxplot representation */}
          <svg viewBox="0 0 400 160" className="w-full h-auto">
            {/* Whiskers */}
            <line x1="40" y1="80" x2="120" y2="80" stroke="#475569" strokeWidth="2" />
            <line x1="280" y1="80" x2="360" y2="80" stroke="#475569" strokeWidth="2" />
            {/* Min tick */}
            <line x1="40" y1="60" x2="40" y2="100" stroke="#475569" strokeWidth="2" />
            {/* Max tick */}
            <line x1="360" y1="60" x2="360" y2="100" stroke="#475569" strokeWidth="2" />
            {/* Box */}
            <rect x="120" y="40" width="160" height="80" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" rx="4" />
            {/* Median line */}
            <line x1="200" y1="40" x2="200" y2="120" stroke="#dc2626" strokeWidth="3" />
            {/* Mean symbol */}
            <circle cx="205" cy="80" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />

            {/* Labels */}
            <text x="40" y="125" fontSize="11" textAnchor="middle" fill="#64748b">Min: {min?.toFixed(2)}</text>
            <text x="120" y="30" fontSize="11" textAnchor="middle" fill="#2563eb">Q1: {q1?.toFixed(2)}</text>
            <text x="200" y="145" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#dc2626">Mediana: {median?.toFixed(2)}</text>
            <text x="280" y="30" fontSize="11" textAnchor="middle" fill="#2563eb">Q3: {q3?.toFixed(2)}</text>
            <text x="360" y="125" fontSize="11" textAnchor="middle" fill="#64748b">Max: {max?.toFixed(2)}</text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden flex flex-col w-full max-w-4xl max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Chart Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm tracking-wide">{chartData.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadChartImage}
              title="Descargar imagen PNG"
              className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded border border-blue-500 transition-colors shadow-2xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar PNG</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="p-4 bg-white flex-1 overflow-y-auto min-h-[380px]">
          {renderChartContent()}
        </div>
      </div>
    </div>
  );
};
