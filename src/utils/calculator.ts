import { erf, standardNormalCDF, inverseNormalCDF } from './distributions';

// ==========================================
// 1. SCIENTIFIC EXPRESSION EVALUATOR
// ==========================================

export interface EvaluationResult {
  success: boolean;
  value?: number;
  error?: string;
  formatted?: string;
}

export function evaluateMathExpression(expr: string, angleMode: 'deg' | 'rad' = 'deg'): EvaluationResult {
  if (!expr || expr.trim() === '') {
    return { success: false, error: 'Expresión vacía' };
  }

  let cleaned = expr.trim();

  // Replace common symbols and aliases
  cleaned = cleaned
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/π/gi, 'PI')
    .replace(/pi/gi, 'PI')
    .replace(/phi/gi, 'PHI')
    .replace(/\^/g, '**');

  // Factorial handling: n! -> fact(n)
  cleaned = cleaned.replace(/(\d+(\.\d+)?|\b[A-Za-z0-9_]+\b|\([^\)]+\))!/g, 'fact($1)');

  try {
    const toRad = (x: number) => angleMode === 'deg' ? (x * Math.PI) / 180 : x;
    const toAngle = (x: number) => angleMode === 'deg' ? (x * 180) / Math.PI : x;

    const fact = (n: number): number => {
      const intN = Math.round(n);
      if (intN < 0) return NaN;
      if (intN === 0 || intN === 1) return 1;
      let res = 1;
      for (let i = 2; i <= Math.min(intN, 170); i++) res *= i;
      return res;
    };

    const nCr = (n: number, r: number): number => {
      if (r < 0 || r > n) return 0;
      return fact(n) / (fact(r) * fact(n - r));
    };

    const nPr = (n: number, r: number): number => {
      if (r < 0 || r > n) return 0;
      return fact(n) / fact(n - r);
    };

    // Safe environment context
    const context: Record<string, any> = {
      PI: Math.PI,
      E: Math.E,
      PHI: (1 + Math.sqrt(5)) / 2,
      Z90: 1.644853,
      Z95: 1.959964,
      Z99: 2.575829,
      Z9973: 3.0,
      sin: (x: number) => Math.sin(toRad(x)),
      cos: (x: number) => Math.cos(toRad(x)),
      tan: (x: number) => Math.tan(toRad(x)),
      asin: (x: number) => toAngle(Math.asin(x)),
      acos: (x: number) => toAngle(Math.acos(x)),
      atan: (x: number) => toAngle(Math.atan(x)),
      sinh: (x: number) => Math.sinh(x),
      cosh: (x: number) => Math.cosh(x),
      tanh: (x: number) => Math.tanh(x),
      sqrt: (x: number) => Math.sqrt(x),
      cbrt: (x: number) => Math.cbrt(x),
      abs: (x: number) => Math.abs(x),
      exp: (x: number) => Math.exp(x),
      ln: (x: number) => Math.log(x),
      log: (x: number) => Math.log10(x),
      log10: (x: number) => Math.log10(x),
      log2: (x: number) => Math.log2(x),
      round: (x: number, decimals: number = 0) => {
        const factor = Math.pow(10, decimals);
        return Math.round(x * factor) / factor;
      },
      floor: (x: number) => Math.floor(x),
      ceil: (x: number) => Math.ceil(x),
      fact,
      comb: nCr,
      nCr,
      perm: nPr,
      nPr,
      erf,
      normcdf: (z: number) => standardNormalCDF(z),
      norminv: (p: number) => inverseNormalCDF(p),
      deg: (rad: number) => (rad * 180) / Math.PI,
      rad: (deg: number) => (deg * Math.PI) / 180
    };

    // Syntax validation: check that only safe characters and identifiers exist
    const sanitized = cleaned.replace(/\s+/g, '');
    const validPattern = /^[0-9a-zA-Z_\.\+\-\*\/\(\)\,\s]+$/;
    if (!validPattern.test(sanitized)) {
      return { success: false, error: 'Caracteres no permitidos en la expresión' };
    }

    // Function constructor with isolated sandbox args
    const keys = Object.keys(context);
    const values = Object.values(context);
    const evaluator = new Function(...keys, `"use strict"; return (${cleaned});`);
    const val = evaluator(...values);

    if (typeof val !== 'number' || isNaN(val)) {
      return { success: false, error: 'El resultado no es un número válido (NaN)' };
    }

    if (!isFinite(val)) {
      return { success: false, error: 'Resultado infinito o división por cero (±Infinity)' };
    }

    return {
      success: true,
      value: val,
      formatted: formatResult(val)
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de sintaxis matemática' };
  }
}

export function formatResult(num: number): string {
  if (Math.abs(num) < 1e-6 && num !== 0) {
    return num.toExponential(6);
  }
  if (Math.abs(num) >= 1e12) {
    return num.toExponential(6);
  }
  return Number(num.toFixed(8)).toString();
}

// ==========================================
// 2. STATISTICAL & MATHEMATICAL CONSTANTS
// ==========================================

export interface ScientificConstant {
  id: string;
  name: string;
  symbol: string;
  value: number;
  description: string;
  category: 'matematica' | 'estadistica' | 'calidad_spc' | 'fisica';
}

export const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  {
    id: 'pi',
    name: 'Número Pi (π)',
    symbol: 'π',
    value: Math.PI,
    description: 'Relación entre la circunferencia y su diámetro (3.14159265...)',
    category: 'matematica'
  },
  {
    id: 'e',
    name: 'Número de Euler (e)',
    symbol: 'e',
    value: Math.E,
    description: 'Base de los logaritmos naturales (2.71828182...)',
    category: 'matematica'
  },
  {
    id: 'phi',
    name: 'Proporción Áurea (φ)',
    symbol: 'φ',
    value: (1 + Math.sqrt(5)) / 2,
    description: 'Número de oro / Razón áurea (1.61803398...)',
    category: 'matematica'
  },
  {
    id: 'sqrt2',
    name: 'Raíz cuadrada de 2',
    symbol: '√2',
    value: Math.SQRT2,
    description: 'Constante pitagórica (1.41421356...)',
    category: 'matematica'
  },
  {
    id: 'z90',
    name: 'Z Crítico 90% (α=0.10)',
    symbol: 'Z₀.₉₀',
    value: 1.644853,
    description: 'Valor Z para intervalo bilateral del 90%',
    category: 'estadistica'
  },
  {
    id: 'z95',
    name: 'Z Crítico 95% (α=0.05)',
    symbol: 'Z₀.₉₅',
    value: 1.959964,
    description: 'Valor Z estándar para intervalo bilateral del 95%',
    category: 'estadistica'
  },
  {
    id: 'z99',
    name: 'Z Crítico 99% (α=0.01)',
    symbol: 'Z₀.₉₉',
    value: 2.575829,
    description: 'Valor Z para intervalo bilateral del 99%',
    category: 'estadistica'
  },
  {
    id: 'z3sigma',
    name: 'Z 3-Sigma (99.73%)',
    symbol: '3σ',
    value: 3.000000,
    description: 'Límites naturales de control estadístico de procesos SPC',
    category: 'calidad_spc'
  },
  {
    id: 'c4_n5',
    name: 'Factor c4 (n=5)',
    symbol: 'c₄(5)',
    value: 0.9400,
    description: 'Factor insesgado para estimar desviación estándar con n=5',
    category: 'calidad_spc'
  },
  {
    id: 'd2_n5',
    name: 'Factor d2 (n=5)',
    symbol: 'd₂(5)',
    value: 2.3260,
    description: 'Factor de conversión de Rango promedio a Sigma con n=5',
    category: 'calidad_spc'
  },
  {
    id: 'a2_n5',
    name: 'Factor A2 (n=5)',
    symbol: 'A₂(5)',
    value: 0.5770,
    description: 'Factor para límites de control de carta X-barra con n=5',
    category: 'calidad_spc'
  },
  {
    id: 'd4_n5',
    name: 'Factor D4 (n=5)',
    symbol: 'D₄(5)',
    value: 2.1140,
    description: 'Factor para Límite Superior de carta R con n=5',
    category: 'calidad_spc'
  }
];

// ==========================================
// 3. UNIT CONVERSION SYSTEM
// ==========================================

export type UnitCategory =
  | 'longitud'
  | 'masa'
  | 'temperatura'
  | 'presion'
  | 'tiempo'
  | 'angulo'
  | 'volumen'
  | 'fuerza_torque';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (baseVal: number) => number;
}

export const UNIT_CATEGORIES: { id: UnitCategory; label: string }[] = [
  { id: 'longitud', label: 'Longitud' },
  { id: 'masa', label: 'Masa / Peso' },
  { id: 'temperatura', label: 'Temperatura' },
  { id: 'presion', label: 'Presión' },
  { id: 'tiempo', label: 'Tiempo' },
  { id: 'angulo', label: 'Ángulo' },
  { id: 'volumen', label: 'Volumen' },
  { id: 'fuerza_torque', label: 'Fuerza y Torque' }
];

export const UNITS_DATA: Record<UnitCategory, UnitDefinition[]> = {
  longitud: [
    { id: 'mm', name: 'Milímetros', symbol: 'mm', toBase: v => v / 1000, fromBase: b => b * 1000 },
    { id: 'cm', name: 'Centímetros', symbol: 'cm', toBase: v => v / 100, fromBase: b => b * 100 },
    { id: 'm', name: 'Metros', symbol: 'm', toBase: v => v, fromBase: b => b },
    { id: 'km', name: 'Kilómetros', symbol: 'km', toBase: v => v * 1000, fromBase: b => b / 1000 },
    { id: 'in', name: 'Pulgadas', symbol: 'in', toBase: v => v * 0.0254, fromBase: b => b / 0.0254 },
    { id: 'ft', name: 'Pies', symbol: 'ft', toBase: v => v * 0.3048, fromBase: b => b / 0.3048 },
    { id: 'yd', name: 'Yardas', symbol: 'yd', toBase: v => v * 0.9144, fromBase: b => b / 0.9144 },
    { id: 'mi', name: 'Millas', symbol: 'mi', toBase: v => v * 1609.344, fromBase: b => b / 1609.344 },
    { id: 'um', name: 'Micrómetros (µm)', symbol: 'µm', toBase: v => v * 1e-6, fromBase: b => b * 1e6 }
  ],
  masa: [
    { id: 'mg', name: 'Miligramos', symbol: 'mg', toBase: v => v / 1e6, fromBase: b => b * 1e6 },
    { id: 'g', name: 'Gramos', symbol: 'g', toBase: v => v / 1000, fromBase: b => b * 1000 },
    { id: 'kg', name: 'Kilogramos', symbol: 'kg', toBase: v => v, fromBase: b => b },
    { id: 'ton', name: 'Toneladas Métricas', symbol: 't', toBase: v => v * 1000, fromBase: b => b / 1000 },
    { id: 'oz', name: 'Onzas', symbol: 'oz', toBase: v => v * 0.0283495231, fromBase: b => b / 0.0283495231 },
    { id: 'lb', name: 'Libras', symbol: 'lb', toBase: v => v * 0.45359237, fromBase: b => b / 0.45359237 }
  ],
  temperatura: [
    { id: 'C', name: 'Grados Celsius', symbol: '°C', toBase: v => v, fromBase: b => b },
    { id: 'F', name: 'Grados Fahrenheit', symbol: '°F', toBase: v => (v - 32) * (5 / 9), fromBase: b => b * (9 / 5) + 32 },
    { id: 'K', name: 'Kelvin', symbol: 'K', toBase: v => v - 273.15, fromBase: b => b + 273.15 },
    { id: 'R', name: 'Rankine', symbol: '°R', toBase: v => (v - 491.67) * (5 / 9), fromBase: b => (b + 273.15) * (9 / 5) }
  ],
  presion: [
    { id: 'Pa', name: 'Pascales', symbol: 'Pa', toBase: v => v, fromBase: b => b },
    { id: 'kPa', name: 'Kilopascales', symbol: 'kPa', toBase: v => v * 1000, fromBase: b => b / 1000 },
    { id: 'MPa', name: 'Megapascales', symbol: 'MPa', toBase: v => v * 1e6, fromBase: b => b / 1e6 },
    { id: 'bar', name: 'Bar', symbol: 'bar', toBase: v => v * 1e5, fromBase: b => b / 1e5 },
    { id: 'psi', name: 'PSI (lb/in²)', symbol: 'psi', toBase: v => v * 6894.75729, fromBase: b => b / 6894.75729 },
    { id: 'atm', name: 'Atmósferas estándar', symbol: 'atm', toBase: v => v * 101325, fromBase: b => b / 101325 },
    { id: 'mmHg', name: 'Milímetros de Mercurio (Torr)', symbol: 'mmHg', toBase: v => v * 133.322368, fromBase: b => b / 133.322368 }
  ],
  tiempo: [
    { id: 'ms', name: 'Milisegundos', symbol: 'ms', toBase: v => v / 1000, fromBase: b => b * 1000 },
    { id: 's', name: 'Segundos', symbol: 's', toBase: v => v, fromBase: b => b },
    { id: 'min', name: 'Minutos', symbol: 'min', toBase: v => v * 60, fromBase: b => b / 60 },
    { id: 'h', name: 'Horas', symbol: 'h', toBase: v => v * 3600, fromBase: b => b / 3600 },
    { id: 'd', name: 'Días', symbol: 'd', toBase: v => v * 86400, fromBase: b => b / 86400 }
  ],
  angulo: [
    { id: 'deg', name: 'Grados Sexagesimales', symbol: '°', toBase: v => v, fromBase: b => b },
    { id: 'rad', name: 'Radianes', symbol: 'rad', toBase: v => (v * 180) / Math.PI, fromBase: b => (b * Math.PI) / 180 },
    { id: 'grad', name: 'Gradianes (Centesimales)', symbol: 'gon', toBase: v => v * 0.9, fromBase: b => b / 0.9 }
  ],
  volumen: [
    { id: 'ml', name: 'Mililitros / cm³', symbol: 'mL', toBase: v => v / 1000, fromBase: b => b * 1000 },
    { id: 'L', name: 'Litros', symbol: 'L', toBase: v => v, fromBase: b => b },
    { id: 'm3', name: 'Metros Cúbicos', symbol: 'm³', toBase: v => v * 1000, fromBase: b => b / 1000 },
    { id: 'floz', name: 'Onzas Líquidas US', symbol: 'fl oz', toBase: v => v * 0.0295735296, fromBase: b => b / 0.0295735296 },
    { id: 'gal', name: 'Galones US', symbol: 'gal', toBase: v => v * 3.785411784, fromBase: b => b / 3.785411784 }
  ],
  fuerza_torque: [
    { id: 'N', name: 'Newtons', symbol: 'N', toBase: v => v, fromBase: b => b },
    { id: 'kN', name: 'Kilonewtons', symbol: 'kN', toBase: v => v * 1000, fromBase: b => b / 1000 },
    { id: 'kgf', name: 'Kilogramo-fuerza', symbol: 'kgf', toBase: v => v * 9.80665, fromBase: b => b / 9.80665 },
    { id: 'lbf', name: 'Libras-fuerza', symbol: 'lbf', toBase: v => v * 4.44822162, fromBase: b => b / 4.44822162 },
    { id: 'Nm', name: 'Newton-metro (Torque)', symbol: 'N·m', toBase: v => v, fromBase: b => b },
    { id: 'lbfft', name: 'Libra-pie (Torque)', symbol: 'lbf·ft', toBase: v => v * 1.35581795, fromBase: b => b / 1.35581795 }
  ]
};

export function convertUnit(
  val: number,
  category: UnitCategory,
  fromUnitId: string,
  toUnitId: string
): number {
  if (isNaN(val)) return NaN;
  const list = UNITS_DATA[category];
  const fromUnit = list.find(u => u.id === fromUnitId);
  const toUnit = list.find(u => u.id === toUnitId);
  if (!fromUnit || !toUnit) return val;

  const baseVal = fromUnit.toBase(val);
  return toUnit.fromBase(baseVal);
}

// ==========================================
// 4. RANDOM NUMBER GENERATORS
// ==========================================

export type DistributionType =
  | 'normal'
  | 'uniform_continuous'
  | 'uniform_integer'
  | 'exponential'
  | 'poisson'
  | 'binomial'
  | 'weibull'
  | 'lognormal';

export interface DistributionConfig {
  id: DistributionType;
  name: string;
  description: string;
  defaultParams: Record<string, number>;
  paramLabels: Record<string, { label: string; min?: number; max?: number; step?: number }>;
}

export const DISTRIBUTIONS_CONFIG: Record<DistributionType, DistributionConfig> = {
  normal: {
    id: 'normal',
    name: 'Normal (Gaussiana)',
    description: 'Distribución en campana con Media (μ) y Desviación Estándar (σ)',
    defaultParams: { mean: 50, stdev: 5 },
    paramLabels: {
      mean: { label: 'Media (μ)', step: 1 },
      stdev: { label: 'Desv. Estándar (σ)', min: 0.0001, step: 0.5 }
    }
  },
  uniform_continuous: {
    id: 'uniform_continuous',
    name: 'Uniforme Continua',
    description: 'Valores decimales equiprobables entre Min (a) y Max (b)',
    defaultParams: { min: 0, max: 100 },
    paramLabels: {
      min: { label: 'Mínimo (a)', step: 1 },
      max: { label: 'Máximo (b)', step: 1 }
    }
  },
  uniform_integer: {
    id: 'uniform_integer',
    name: 'Uniforme Discreta (Enteros)',
    description: 'Números enteros equiprobables (ej. dados 1-6, conteos)',
    defaultParams: { min: 1, max: 100 },
    paramLabels: {
      min: { label: 'Mínimo (Entero)', step: 1 },
      max: { label: 'Máximo (Entero)', step: 1 }
    }
  },
  exponential: {
    id: 'exponential',
    name: 'Exponencial',
    description: 'Tiempos de espera o fallas con Media (β) o Tasa (λ = 1/β)',
    defaultParams: { mean: 10 },
    paramLabels: {
      mean: { label: 'Media / Tiempo medio (β)', min: 0.001, step: 1 }
    }
  },
  poisson: {
    id: 'poisson',
    name: 'Poisson (Conteos)',
    description: 'Número de eventos por intervalo con tasa promedio (λ)',
    defaultParams: { lambda: 5 },
    paramLabels: {
      lambda: { label: 'Tasa promedio (λ)', min: 0.01, step: 0.5 }
    }
  },
  binomial: {
    id: 'binomial',
    name: 'Binomial (Éxitos en n ensayos)',
    description: 'Número de éxitos en n ensayos con probabilidad p',
    defaultParams: { trials: 20, prob: 0.5 },
    paramLabels: {
      trials: { label: 'Ensayos (n)', min: 1, step: 1 },
      prob: { label: 'Probabilidad de éxito (p)', min: 0, max: 1, step: 0.05 }
    }
  },
  weibull: {
    id: 'weibull',
    name: 'Weibull (Confiabilidad)',
    description: 'Distribución de confiabilidad con Forma (k) y Escala (λ)',
    defaultParams: { shape: 1.5, scale: 50 },
    paramLabels: {
      shape: { label: 'Forma (k)', min: 0.1, step: 0.1 },
      scale: { label: 'Escala (λ)', min: 0.1, step: 1 }
    }
  },
  lognormal: {
    id: 'lognormal',
    name: 'Lognormal',
    description: 'Variable cuyo logaritmo sigue una distribución normal',
    defaultParams: { logMean: 3, logStdev: 0.5 },
    paramLabels: {
      logMean: { label: 'Media Logarítmica (μ_log)', step: 0.5 },
      logStdev: { label: 'Desv. Logarítmica (σ_log)', min: 0.01, step: 0.1 }
    }
  }
};

/**
 * Generate a single random number from specified distribution
 */
export function generateRandomNumber(dist: DistributionType, params: Record<string, number>): number {
  switch (dist) {
    case 'normal': {
      const mean = params.mean ?? 0;
      const stdev = params.stdev ?? 1;
      // Box-Muller transform
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return mean + z * stdev;
    }

    case 'uniform_continuous': {
      const min = params.min ?? 0;
      const max = params.max ?? 100;
      return min + Math.random() * (max - min);
    }

    case 'uniform_integer': {
      const min = Math.ceil(params.min ?? 1);
      const max = Math.floor(params.max ?? 100);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    case 'exponential': {
      const mean = params.mean ?? 10;
      let u = 0;
      while (u === 0) u = Math.random();
      return -mean * Math.log(u);
    }

    case 'poisson': {
      const lambda = params.lambda ?? 5;
      if (lambda < 30) {
        // Knuth's algorithm
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
          k++;
          p *= Math.random();
        } while (p > L);
        return k - 1;
      } else {
        // Gaussian approximation for large lambda
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
      }
    }

    case 'binomial': {
      const n = Math.round(params.trials ?? 10);
      const p = Math.max(0, Math.min(1, params.prob ?? 0.5));
      let successes = 0;
      for (let i = 0; i < n; i++) {
        if (Math.random() < p) successes++;
      }
      return successes;
    }

    case 'weibull': {
      const shape = params.shape ?? 1.5;
      const scale = params.scale ?? 50;
      let u = 0;
      while (u === 0) u = Math.random();
      return scale * Math.pow(-Math.log(u), 1 / shape);
    }

    case 'lognormal': {
      const logMean = params.logMean ?? 0;
      const logStdev = params.logStdev ?? 1;
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return Math.exp(logMean + z * logStdev);
    }

    default:
      return Math.random();
  }
}

/**
 * Generate a sample array of size N
 */
export function generateRandomSample(
  dist: DistributionType,
  params: Record<string, number>,
  count: number,
  decimals: number = 4
): number[] {
  const n = Math.max(1, Math.min(count, 5000));
  const results: number[] = [];
  const factor = Math.pow(10, decimals);

  for (let i = 0; i < n; i++) {
    const val = generateRandomNumber(dist, params);
    if (decimals >= 0 && decimals <= 10) {
      results.push(Math.round(val * factor) / factor);
    } else {
      results.push(val);
    }
  }

  return results;
}
