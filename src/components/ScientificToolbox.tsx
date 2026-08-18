import React, { useState } from 'react';
import { WorksheetData } from '../types';
import {
  Calculator as CalcIcon,
  RotateCcw,
  Copy,
  Check,
  Plus,
  ArrowRightLeft,
  Sparkles,
  Bookmark,
  CornerDownLeft,
  Divide,
  Percent,
  Sigma,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  evaluateMathExpression,
  formatResult,
  SCIENTIFIC_CONSTANTS,
  ScientificConstant,
  UNIT_CATEGORIES,
  UNITS_DATA,
  UnitCategory,
  convertUnit,
  DISTRIBUTIONS_CONFIG,
  DistributionType,
  generateRandomSample
} from '../utils/calculator';

interface ScientificToolboxProps {
  worksheet: WorksheetData;
  selectedColumnId?: string | null;
  selectedRowIndex?: number | null;
  onInsertValueToCell: (value: number | string) => void;
  onInsertColumnData: (columnName: string, data: (number | string)[], overwriteColId?: string) => void;
}

export const ScientificToolbox: React.FC<ScientificToolboxProps> = ({
  worksheet,
  selectedColumnId,
  selectedRowIndex,
  onInsertValueToCell,
  onInsertColumnData
}) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'units' | 'constants' | 'random'>('calc');

  // ==========================================
  // CALCULATOR STATE
  // ==========================================
  const [expression, setExpression] = useState<string>('');
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [calcHistory, setCalcHistory] = useState<Array<{ expr: string; res: number; time: string }>>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ==========================================
  // UNIT CONVERTER STATE
  // ==========================================
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('longitud');
  const [fromUnit, setFromUnit] = useState<string>(UNITS_DATA.longitud[0].id);
  const [toUnit, setToUnit] = useState<string>(UNITS_DATA.longitud[2].id);
  const [unitInput, setUnitInput] = useState<string>('100');

  // Update units when category changes
  const handleCategoryChange = (cat: UnitCategory) => {
    setUnitCategory(cat);
    const list = UNITS_DATA[cat];
    setFromUnit(list[0].id);
    setToUnit(list[Math.min(1, list.length - 1)].id);
  };

  // Calculate unit conversion
  const numericUnitInput = parseFloat(unitInput) || 0;
  const convertedUnitValue = convertUnit(numericUnitInput, unitCategory, fromUnit, toUnit);

  // ==========================================
  // RANDOM GENERATOR STATE
  // ==========================================
  const [distType, setDistType] = useState<DistributionType>('normal');
  const [distParams, setDistParams] = useState<Record<string, number>>(DISTRIBUTIONS_CONFIG.normal.defaultParams);
  const [sampleSize, setSampleSize] = useState<number>(worksheet.rows.length > 0 ? worksheet.rows.length : 20);
  const [sampleDecimals, setSampleDecimals] = useState<number>(4);
  const [targetColumnOption, setTargetColumnOption] = useState<'new' | 'selected'>('new');
  const [customColName, setCustomColName] = useState<string>('');
  const [previewSample, setPreviewSample] = useState<number[]>(() =>
    generateRandomSample('normal', DISTRIBUTIONS_CONFIG.normal.defaultParams, 6, 4)
  );

  const handleDistChange = (newDist: DistributionType) => {
    setDistType(newDist);
    const defaults = DISTRIBUTIONS_CONFIG[newDist].defaultParams;
    setDistParams(defaults);
    setPreviewSample(generateRandomSample(newDist, defaults, 6, sampleDecimals));
  };

  const handleParamChange = (paramKey: string, val: number) => {
    const updated = { ...distParams, [paramKey]: val };
    setDistParams(updated);
    setPreviewSample(generateRandomSample(distType, updated, 6, sampleDecimals));
  };

  const handleRegeneratePreview = () => {
    setPreviewSample(generateRandomSample(distType, distParams, 6, sampleDecimals));
  };

  const handleApplyRandomData = () => {
    const sample = generateRandomSample(distType, distParams, sampleSize, sampleDecimals);
    const distName = DISTRIBUTIONS_CONFIG[distType].name.split(' ')[0];
    const finalName = customColName.trim() || `${distName}_N${sampleSize}`;
    
    if (targetColumnOption === 'selected' && selectedColumnId) {
      onInsertColumnData(finalName, sample, selectedColumnId);
    } else {
      onInsertColumnData(finalName, sample);
    }
  };

  // ==========================================
  // CALCULATOR ACTIONS
  // ==========================================
  const handleCalcButton = (char: string) => {
    setExpression(prev => prev + char);
  };

  const handleClearCalc = () => {
    setExpression('');
    setLastResult(null);
  };

  const handleBackspaceCalc = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleEvaluate = () => {
    if (!expression.trim()) return;
    const res = evaluateMathExpression(expression, angleMode);
    if (res.success && res.value !== undefined) {
      setLastResult(res.value);
      setCalcHistory(prev => [
        { expr: expression, res: res.value!, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);
    } else {
      alert(`Error en expresión: ${res.error}`);
    }
  };

  const handleCopyValue = (val: string | number) => {
    const text = String(val);
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // Active cell label
  const targetCol = worksheet.columns.find(c => c.id === selectedColumnId) || worksheet.columns[0];
  const targetRowDisplay = (selectedRowIndex !== null && selectedRowIndex !== undefined) ? selectedRowIndex + 1 : 1;

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none">
      {/* Mini Tabs Header */}
      <div className="flex border-b border-slate-200 bg-slate-100 p-1 gap-1 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('calc')}
          className={`flex-1 py-1.5 px-1.5 rounded flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'calc'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title="Calculadora científica con funciones avanzadas"
        >
          <CalcIcon className="w-3.5 h-3.5" />
          <span>Científica</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 py-1.5 px-1.5 rounded flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'units'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title="Conversiones de unidades industriales y de ingeniería"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Unidades</span>
        </button>

        <button
          onClick={() => setActiveTab('constants')}
          className={`flex-1 py-1.5 px-1.5 rounded flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'constants'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title="Constantes matemáticas y estadísticas Z, c4, d2, A2"
        >
          <Sigma className="w-3.5 h-3.5" />
          <span>Constantes</span>
        </button>

        <button
          onClick={() => setActiveTab('random')}
          className={`flex-1 py-1.5 px-1.5 rounded flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'random'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title="Generador de números aleatorios y distribuciones"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Aleatorios</span>
        </button>
      </div>

      {/* Target Cell / Location Bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
        <span className="flex items-center space-x-1">
          <span className="font-medium text-slate-400">Celda Destino:</span>
          <span className="font-bold text-blue-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
            {targetCol ? `${targetCol.id} (R${targetRowDisplay})` : 'C1 (R1)'}
          </span>
        </span>
        <span className="text-[10px] text-slate-500 truncate max-w-[110px]" title={targetCol?.name}>
          {targetCol?.name || 'Columna 1'}
        </span>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
        {/* ==================================================== */}
        {/* 1. CALCULADORA CIENTÍFICA TAB */}
        {/* ==================================================== */}
        {activeTab === 'calc' && (
          <div className="space-y-2.5">
            {/* Display Box */}
            <div className="bg-slate-900 rounded-lg p-2.5 text-right border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setAngleMode(angleMode === 'deg' ? 'rad' : 'deg')}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[9px] font-bold uppercase transition-colors"
                    title="Alternar entre Grados Sexagesimales (DEG) y Radianes (RAD)"
                  >
                    {angleMode.toUpperCase()}
                  </button>
                  <span>{angleMode === 'deg' ? 'Grados' : 'Radianes'}</span>
                </div>
                {lastResult !== null && <span className="text-emerald-400">Listo</span>}
              </div>

              {/* Expression input */}
              <input
                type="text"
                value={expression}
                onChange={e => setExpression(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleEvaluate();
                }}
                placeholder="0"
                className="w-full bg-transparent text-slate-100 text-sm font-mono text-right outline-none focus:text-white"
              />

              {/* Result Preview */}
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1 truncate">
                {lastResult !== null ? `= ${formatResult(lastResult)}` : '\u00A0'}
              </div>
            </div>

            {/* Quick Action: Insert to Sheet / Copy */}
            {lastResult !== null && (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onInsertValueToCell(lastResult)}
                  className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center justify-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                  title="Insertar este resultado directamente en la celda activa de la hoja de trabajo"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  <span>Insertar en Hoja</span>
                </button>

                <button
                  onClick={() => handleCopyValue(lastResult)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center justify-center space-x-1 border border-slate-300 transition-colors cursor-pointer"
                >
                  {copiedText === String(lastResult) ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Scientific Functions Grid */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Funciones Científicas
              </div>
              <div className="grid grid-cols-4 gap-1 font-mono text-[11px]">
                <button
                  onClick={() => handleCalcButton('sin(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  sin
                </button>
                <button
                  onClick={() => handleCalcButton('cos(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  cos
                </button>
                <button
                  onClick={() => handleCalcButton('tan(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  tan
                </button>
                <button
                  onClick={() => handleCalcButton('sqrt(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  √x
                </button>

                <button
                  onClick={() => handleCalcButton('ln(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  ln
                </button>
                <button
                  onClick={() => handleCalcButton('log(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  log₁₀
                </button>
                <button
                  onClick={() => handleCalcButton('exp(')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  eˣ
                </button>
                <button
                  onClick={() => handleCalcButton('^')}
                  className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium transition-colors"
                >
                  xʸ
                </button>

                <button
                  onClick={() => handleCalcButton('asin(')}
                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 rounded border border-slate-200 text-[10px] transition-colors"
                >
                  sin⁻¹
                </button>
                <button
                  onClick={() => handleCalcButton('acos(')}
                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 rounded border border-slate-200 text-[10px] transition-colors"
                >
                  cos⁻¹
                </button>
                <button
                  onClick={() => handleCalcButton('atan(')}
                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 rounded border border-slate-200 text-[10px] transition-colors"
                >
                  tan⁻¹
                </button>
                <button
                  onClick={() => handleCalcButton('!')}
                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 rounded border border-slate-200 text-[10px] transition-colors"
                >
                  n!
                </button>

                <button
                  onClick={() => handleCalcButton('PI')}
                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded border border-amber-200 font-bold transition-colors"
                >
                  π
                </button>
                <button
                  onClick={() => handleCalcButton('E')}
                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded border border-amber-200 font-bold transition-colors"
                >
                  e
                </button>
                <button
                  onClick={() => handleCalcButton('normcdf(')}
                  className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded border border-purple-200 text-[10px] font-semibold transition-colors"
                  title="Función de Distribución Acumulada Normal Estándar: normcdf(z)"
                >
                  Φ(z)
                </button>
                <button
                  onClick={() => handleCalcButton('norminv(')}
                  className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded border border-purple-200 text-[10px] font-semibold transition-colors"
                  title="Cuantil Normal Inverso: norminv(p)"
                >
                  Z(p)
                </button>
              </div>
            </div>

            {/* Standard Keypad */}
            <div className="grid grid-cols-4 gap-1 font-mono text-xs font-semibold">
              <button
                onClick={handleClearCalc}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 transition-colors"
              >
                C
              </button>
              <button
                onClick={() => handleCalcButton('(')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
              >
                (
              </button>
              <button
                onClick={() => handleCalcButton(')')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
              >
                )
              </button>
              <button
                onClick={handleBackspaceCalc}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors flex items-center justify-center"
              >
                ⌫
              </button>

              <button
                onClick={() => handleCalcButton('7')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                7
              </button>
              <button
                onClick={() => handleCalcButton('8')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                8
              </button>
              <button
                onClick={() => handleCalcButton('9')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                9
              </button>
              <button
                onClick={() => handleCalcButton('/')}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 transition-colors"
              >
                ÷
              </button>

              <button
                onClick={() => handleCalcButton('4')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                4
              </button>
              <button
                onClick={() => handleCalcButton('5')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                5
              </button>
              <button
                onClick={() => handleCalcButton('6')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                6
              </button>
              <button
                onClick={() => handleCalcButton('*')}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 transition-colors"
              >
                ×
              </button>

              <button
                onClick={() => handleCalcButton('1')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                1
              </button>
              <button
                onClick={() => handleCalcButton('2')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                2
              </button>
              <button
                onClick={() => handleCalcButton('3')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                3
              </button>
              <button
                onClick={() => handleCalcButton('-')}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 transition-colors"
              >
                −
              </button>

              <button
                onClick={() => handleCalcButton('0')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                0
              </button>
              <button
                onClick={() => handleCalcButton('.')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors shadow-2xs"
              >
                .
              </button>
              <button
                onClick={() => handleCalcButton('%')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
              >
                %
              </button>
              <button
                onClick={() => handleCalcButton('+')}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={handleEvaluate}
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold font-mono text-sm shadow-xs transition-colors cursor-pointer"
            >
              = Calcular
            </button>

            {/* History List */}
            {calcHistory.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Historial Reciente</span>
                  <button
                    onClick={() => setCalcHistory([])}
                    className="text-slate-400 hover:text-rose-600 text-[9px] font-normal"
                  >
                    Borrar
                  </button>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {calcHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setExpression(item.expr);
                        setLastResult(item.res);
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 flex items-center justify-between font-mono text-[10px] cursor-pointer transition-colors"
                      title="Clic para restaurar en calculadora"
                    >
                      <span className="text-slate-600 truncate max-w-[130px]">{item.expr}</span>
                      <span className="font-bold text-blue-700">= {formatResult(item.res)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. CONVERSOR DE UNIDADES TAB */}
        {/* ==================================================== */}
        {activeTab === 'units' && (
          <div className="space-y-3">
            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Magnitud Física
              </label>
              <select
                value={unitCategory}
                onChange={e => handleCategoryChange(e.target.value as UnitCategory)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {UNIT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Value */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Valor a Convertir
              </label>
              <input
                type="number"
                value={unitInput}
                onChange={e => setUnitInput(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-mono text-slate-800 font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="100"
              />
            </div>

            {/* From & To Units */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">De (Origen):</label>
                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none"
                >
                  {UNITS_DATA[unitCategory].map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">A (Destino):</label>
                <select
                  value={toUnit}
                  onChange={e => setToUnit(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none"
                >
                  {UNITS_DATA[unitCategory].map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversion Result Card */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center space-y-1 shadow-2xs">
              <div className="text-[10px] text-blue-600 font-medium">Resultado de Conversión</div>
              <div className="text-lg font-bold font-mono text-blue-950 truncate">
                {isNaN(convertedUnitValue) ? '0' : formatResult(convertedUnitValue)}{' '}
                <span className="text-xs text-blue-700 font-sans">
                  {UNITS_DATA[unitCategory].find(u => u.id === toUnit)?.symbol}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => onInsertValueToCell(convertedUnitValue)}
                className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center justify-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                title="Insertar valor convertido en la celda activa"
              >
                <CornerDownLeft className="w-3 h-3" />
                <span>Insertar en Hoja</span>
              </button>

              <button
                onClick={() => handleCopyValue(convertedUnitValue)}
                className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium flex items-center justify-center space-x-1 border border-slate-300 transition-colors cursor-pointer"
              >
                {copiedText === String(convertedUnitValue) ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. CONSTANTES ESTADÍSTICAS Y FÍSICAS TAB */}
        {/* ==================================================== */}
        {activeTab === 'constants' && (
          <div className="space-y-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Constantes Matemáticas y de Calidad
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
              {SCIENTIFIC_CONSTANTS.map(item => (
                <div
                  key={item.id}
                  className="p-2 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-200 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-800 rounded font-serif text-[11px] font-bold">
                        {item.symbol}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-900">
                      {formatResult(item.value)}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">{item.description}</p>

                  <div className="flex items-center justify-end space-x-1 pt-1">
                    <button
                      onClick={() => handleCopyValue(item.value)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 text-[10px] flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copiar</span>
                    </button>
                    <button
                      onClick={() => {
                        setExpression(prev => prev + item.symbol);
                        setActiveTab('calc');
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span>Usar en Calc</span>
                    </button>
                    <button
                      onClick={() => onInsertValueToCell(item.value)}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-medium flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <CornerDownLeft className="w-2.5 h-2.5" />
                      <span>Insertar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. GENERADOR DE NÚMEROS ALEATORIOS TAB */}
        {/* ==================================================== */}
        {activeTab === 'random' && (
          <div className="space-y-3">
            {/* Distribution Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Distribución de Probabilidad
              </label>
              <select
                value={distType}
                onChange={e => handleDistChange(e.target.value as DistributionType)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {Object.values(DISTRIBUTIONS_CONFIG).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1 italic">
                {DISTRIBUTIONS_CONFIG[distType].description}
              </p>
            </div>

            {/* Dynamic Parameters */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Parámetros del Modelo
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DISTRIBUTIONS_CONFIG[distType].paramLabels).map(([key, cfg]: [string, { label: string; min?: number; max?: number; step?: number }]) => (
                  <div key={key}>
                    <label className="block text-[10px] text-slate-600 mb-0.5">{cfg.label}:</label>
                    <input
                      type="number"
                      value={distParams[key] ?? 0}
                      step={cfg.step || 1}
                      min={cfg.min}
                      max={cfg.max}
                      onChange={e => handleParamChange(key, parseFloat(e.target.value) || 0)}
                      className="w-full p-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Size and Options */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Cantidad (N datos):
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={sampleSize}
                  onChange={e => setSampleSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Decimales:
                </label>
                <select
                  value={sampleDecimals}
                  onChange={e => {
                    const dec = parseInt(e.target.value);
                    setSampleDecimals(dec);
                    setPreviewSample(generateRandomSample(distType, distParams, 6, dec));
                  }}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none"
                >
                  <option value={0}>0 (Enteros)</option>
                  <option value={2}>2 decimales</option>
                  <option value={4}>4 decimales</option>
                  <option value={6}>6 decimales</option>
                </select>
              </div>
            </div>

            {/* Insertion Destination */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Destino en la Hoja de Trabajo
              </label>
              <div className="space-y-1 text-xs">
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="targetOpt"
                    checked={targetColumnOption === 'new'}
                    onChange={() => setTargetColumnOption('new')}
                    className="text-blue-600"
                  />
                  <span>Crear nueva columna</span>
                </label>

                {selectedColumnId && (
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="targetOpt"
                      checked={targetColumnOption === 'selected'}
                      onChange={() => setTargetColumnOption('selected')}
                      className="text-blue-600"
                    />
                    <span>Sobrescribir columna actual ({selectedColumnId})</span>
                  </label>
                )}
              </div>

              <input
                type="text"
                value={customColName}
                onChange={e => setCustomColName(e.target.value)}
                placeholder={`Nombre (ej. ${DISTRIBUTIONS_CONFIG[distType].name.split(' ')[0]}_N${sampleSize})`}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 mt-1 placeholder:text-slate-400"
              />
            </div>

            {/* Sample Preview Card */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  Vista Previa (Primeros 6)
                </span>
                <button
                  onClick={handleRegeneratePreview}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 text-[10px] font-medium"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Regenerar</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {previewSample.map((val, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-800"
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleApplyRandomData}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar y Cargar en Hoja</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
