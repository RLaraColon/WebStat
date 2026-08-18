import {
  DescriptiveStatsResult,
  TTest1Result,
  TTest2Result,
  AnovaResult,
  RegressionResult,
  ControlChartResult,
  CapabilityResult,
  CorrelationResult
} from '../types';
import {
  studentTCDF,
  studentTPValueTwoTailed,
  inverseStudentT,
  fDistributionPValue,
  getSPCFactors,
  standardNormalCDF,
  inverseNormalCDF
} from './distributions';

// Extract valid numbers from any column array
export function extractNumericValues(raw: (string | number | null | undefined)[]): number[] {
  const result: number[] = [];
  for (const v of raw) {
    if (v !== null && v !== undefined && v !== '') {
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.').trim());
      if (!isNaN(num) && isFinite(num)) {
        result.push(num);
      }
    }
  }
  return result;
}

// Compute comprehensive descriptive statistics
export function calculateDescriptiveStats(
  columnId: string,
  columnName: string,
  rawValues: (string | number | null | undefined)[],
  totalRows: number
): DescriptiveStatsResult {
  const values = extractNumericValues(rawValues);
  const n = values.length;
  const nMissing = totalRows - n;

  if (n === 0) {
    return {
      columnId,
      columnName,
      n: 0,
      nMissing,
      mean: 0,
      seMean: 0,
      stdDev: 0,
      variance: 0,
      coefVar: 0,
      sum: 0,
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      iqr: 0,
      skewness: 0,
      kurtosis: 0,
      ciLower95: 0,
      ciUpper95: 0,
      values: []
    };
  }

  // Sort for order statistics
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  // Sum of squared deviations
  let ss = 0;
  let sumCubed = 0;
  let sumFourth = 0;

  for (const v of values) {
    const diff = v - mean;
    ss += diff * diff;
    sumCubed += diff * diff * diff;
    sumFourth += diff * diff * diff * diff;
  }

  const variance = n > 1 ? ss / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const seMean = n > 0 ? stdDev / Math.sqrt(n) : 0;
  const coefVar = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // Percentiles (Minitab standard interpolation)
  function getPercentile(p: number): number {
    if (n === 1) return sorted[0];
    const rank = p * (n + 1);
    const k = Math.floor(rank);
    const d = rank - k;

    if (k < 1) return sorted[0];
    if (k >= n) return sorted[n - 1];
    return sorted[k - 1] + d * (sorted[k] - sorted[k - 1]);
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = getPercentile(0.25);
  const median = getPercentile(0.50);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Sample Skewness (Fisher-Pearson adjusted)
  let skewness = 0;
  if (n > 2 && stdDev > 0) {
    const m3 = sumCubed / n;
    skewness = (Math.sqrt(n * (n - 1)) / (n - 2)) * (m3 / Math.pow(stdDev, 3));
  }

  // Sample Kurtosis (Excess kurtosis)
  let kurtosis = 0;
  if (n > 3 && stdDev > 0) {
    const m4 = sumFourth / n;
    const term1 = (n - 1) / ((n - 2) * (n - 3));
    const term2 = (n + 1) * (m4 / Math.pow(variance, 2)) - 3 * (n - 1);
    kurtosis = term1 * term2;
  }

  // 95% Confidence Interval for Mean
  let ciLower95 = mean;
  let ciUpper95 = mean;
  if (n > 1) {
    const tCrit = inverseStudentT(0.975, n - 1);
    ciLower95 = mean - tCrit * seMean;
    ciUpper95 = mean + tCrit * seMean;
  }

  return {
    columnId,
    columnName,
    n,
    nMissing,
    mean,
    seMean,
    stdDev,
    variance,
    coefVar,
    sum,
    min,
    q1,
    median,
    q3,
    max,
    iqr,
    skewness,
    kurtosis,
    ciLower95,
    ciUpper95,
    values
  };
}

// 1-Sample T-Test
export function run1SampleTTest(
  columnName: string,
  rawValues: (string | number | null | undefined)[],
  hypothesizedMean: number,
  confidenceLevel: number = 95,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
): TTest1Result {
  const values = extractNumericValues(rawValues);
  const n = values.length;
  const df = n - 1;

  if (n < 2) {
    throw new Error('Se requieren al menos 2 observaciones para la prueba T de una muestra.');
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const ss = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const stdDev = Math.sqrt(ss / df);
  const seMean = stdDev / Math.sqrt(n);

  const tStatistic = (mean - hypothesizedMean) / seMean;

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = studentTPValueTwoTailed(tStatistic, df);
  } else if (alternative === 'less') {
    pValue = studentTCDF(tStatistic, df);
  } else {
    pValue = 1 - studentTCDF(tStatistic, df);
  }

  // Confidence interval
  const alpha = (100 - confidenceLevel) / 100;
  let ciLower = -Infinity;
  let ciUpper = Infinity;

  if (alternative === 'two-sided') {
    const tCrit = inverseStudentT(1 - alpha / 2, df);
    ciLower = mean - tCrit * seMean;
    ciUpper = mean + tCrit * seMean;
  } else if (alternative === 'greater') {
    const tCrit = inverseStudentT(1 - alpha, df);
    ciLower = mean - tCrit * seMean;
    ciUpper = Infinity;
  } else {
    const tCrit = inverseStudentT(1 - alpha, df);
    ciLower = -Infinity;
    ciUpper = mean + tCrit * seMean;
  }

  return {
    columnName,
    hypothesizedMean,
    sampleSize: n,
    mean,
    stdDev,
    seMean,
    tStatistic,
    df,
    pValue,
    ciLevel: confidenceLevel,
    ciLower,
    ciUpper,
    alternative
  };
}

// 2-Sample T-Test (Independent samples)
export function run2SampleTTest(
  col1Name: string,
  raw1: (string | number | null | undefined)[],
  col2Name: string,
  raw2: (string | number | null | undefined)[],
  equalVariances: boolean = false,
  confidenceLevel: number = 95,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
): TTest2Result {
  const v1 = extractNumericValues(raw1);
  const v2 = extractNumericValues(raw2);

  const n1 = v1.length;
  const n2 = v2.length;

  if (n1 < 2 || n2 < 2) {
    throw new Error('Ambas muestras deben contener al menos 2 observaciones.');
  }

  const mean1 = v1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = v2.reduce((a, b) => a + b, 0) / n2;

  const s1sq = v1.reduce((a, b) => a + (b - mean1) ** 2, 0) / (n1 - 1);
  const s2sq = v2.reduce((a, b) => a + (b - mean2) ** 2, 0) / (n2 - 1);
  const s1 = Math.sqrt(s1sq);
  const s2 = Math.sqrt(s2sq);

  const diff = mean1 - mean2;
  let seDiff = 0;
  let df = 0;

  if (equalVariances) {
    // Pooled variance
    const spSq = ((n1 - 1) * s1sq + (n2 - 1) * s2sq) / (n1 + n2 - 2);
    seDiff = Math.sqrt(spSq * (1 / n1 + 1 / n2));
    df = n1 + n2 - 2;
  } else {
    // Welch-Satterthwaite approximation
    const v1term = s1sq / n1;
    const v2term = s2sq / n2;
    seDiff = Math.sqrt(v1term + v2term);
    const num = Math.pow(v1term + v2term, 2);
    const denom = (Math.pow(v1term, 2) / (n1 - 1)) + (Math.pow(v2term, 2) / (n2 - 1));
    df = Math.max(1, Math.round(num / denom));
  }

  const tStatistic = diff / seDiff;

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = studentTPValueTwoTailed(tStatistic, df);
  } else if (alternative === 'less') {
    pValue = studentTCDF(tStatistic, df);
  } else {
    pValue = 1 - studentTCDF(tStatistic, df);
  }

  const alpha = (100 - confidenceLevel) / 100;
  let ciLower = -Infinity;
  let ciUpper = Infinity;

  if (alternative === 'two-sided') {
    const tCrit = inverseStudentT(1 - alpha / 2, df);
    ciLower = diff - tCrit * seDiff;
    ciUpper = diff + tCrit * seDiff;
  } else if (alternative === 'greater') {
    const tCrit = inverseStudentT(1 - alpha, df);
    ciLower = diff - tCrit * seDiff;
  } else {
    const tCrit = inverseStudentT(1 - alpha, df);
    ciUpper = diff + tCrit * seDiff;
  }

  return {
    col1Name,
    col2Name,
    n1,
    n2,
    mean1,
    mean2,
    s1,
    s2,
    diff,
    seDiff,
    tStatistic,
    df,
    pValue,
    ciLevel: confidenceLevel,
    ciLower,
    ciUpper,
    equalVariances,
    alternative
  };
}

// Paired T-Test
export function runPairedTTest(
  col1Name: string,
  raw1: (string | number | null | undefined)[],
  col2Name: string,
  raw2: (string | number | null | undefined)[],
  confidenceLevel: number = 95,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
): TTest1Result {
  const minLen = Math.min(raw1.length, raw2.length);
  const diffs: number[] = [];

  for (let i = 0; i < minLen; i++) {
    const v1 = raw1[i];
    const v2 = raw2[i];
    if (v1 !== null && v1 !== undefined && v1 !== '' && v2 !== null && v2 !== undefined && v2 !== '') {
      const num1 = typeof v1 === 'number' ? v1 : parseFloat(String(v1).replace(',', '.'));
      const num2 = typeof v2 === 'number' ? v2 : parseFloat(String(v2).replace(',', '.'));
      if (!isNaN(num1) && !isNaN(num2)) {
        diffs.push(num1 - num2);
      }
    }
  }

  return run1SampleTTest(
    `Diferencia (${col1Name} - ${col2Name})`,
    diffs,
    0,
    confidenceLevel,
    alternative
  );
}

// One-Way ANOVA
export function runOneWayAnova(
  factorName: string,
  responseName: string,
  factorValues: (string | number | null | undefined)[],
  responseValues: (string | number | null | undefined)[]
): AnovaResult {
  // Group responses by factor level
  const groupMap: Record<string, number[]> = {};
  const len = Math.min(factorValues.length, responseValues.length);

  for (let i = 0; i < len; i++) {
    const factor = factorValues[i];
    const resp = responseValues[i];

    if (factor !== null && factor !== undefined && factor !== '' &&
        resp !== null && resp !== undefined && resp !== '') {
      const fKey = String(factor).trim();
      const num = typeof resp === 'number' ? resp : parseFloat(String(resp).replace(',', '.'));
      if (!isNaN(num) && fKey !== '') {
        if (!groupMap[fKey]) groupMap[fKey] = [];
        groupMap[fKey].push(num);
      }
    }
  }

  const groupKeys = Object.keys(groupMap);
  const k = groupKeys.length;

  if (k < 2) {
    throw new Error('ANOVA requiere al menos 2 grupos o niveles distintos del factor.');
  }

  let grandTotal = 0;
  let totalN = 0;
  let allValues: number[] = [];

  const groupsSummary = groupKeys.map(key => {
    const vals = groupMap[key];
    const n = vals.length;
    if (n === 0) throw new Error(`El grupo ${key} no tiene observaciones válidas.`);
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const ss = vals.reduce((a, b) => a + (b - mean) ** 2, 0);
    const stdDev = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;

    grandTotal += sum;
    totalN += n;
    allValues = allValues.concat(vals);

    return {
      name: key,
      n,
      mean,
      stdDev,
      ciLower: 0,
      ciUpper: 0,
      values: vals
    };
  });

  const grandMean = grandTotal / totalN;

  // Degrees of Freedom
  const dfFactor = k - 1;
  const dfError = totalN - k;
  const dfTotal = totalN - 1;

  if (dfError <= 0) {
    throw new Error('Grados de libertad de error insuficientes. Añada más datos.');
  }

  // Sum of Squares
  let ssFactor = 0;
  let ssError = 0;

  for (const g of groupsSummary) {
    ssFactor += g.n * (g.mean - grandMean) ** 2;
    for (const val of g.values) {
      ssError += (val - g.mean) ** 2;
    }
  }

  const ssTotal = ssFactor + ssError;
  const msFactor = ssFactor / dfFactor;
  const msError = ssError / dfError;

  const fValue = msError > 0 ? msFactor / msError : 0;
  const pValue = fDistributionPValue(fValue, dfFactor, dfError);

  const pooledStdDev = Math.sqrt(msError);
  const rSquared = ssTotal > 0 ? (ssFactor / ssTotal) * 100 : 0;
  const rSquaredAdj = ssTotal > 0 ? (1 - (msError / (ssTotal / dfTotal))) * 100 : 0;

  // Individual 95% CIs based on pooled standard deviation
  const tCrit = inverseStudentT(0.975, dfError);
  for (const g of groupsSummary) {
    const margin = tCrit * (pooledStdDev / Math.sqrt(g.n));
    g.ciLower = g.mean - margin;
    g.ciUpper = g.mean + margin;
  }

  return {
    factorName,
    responseName,
    groups: groupsSummary,
    dfFactor,
    dfError,
    dfTotal,
    ssFactor,
    ssError,
    ssTotal,
    msFactor,
    msError,
    fValue,
    pValue,
    rSquared,
    rSquaredAdj,
    pooledStdDev
  };
}

// Simple & Multiple Linear Regression
export function runLinearRegression(
  responseColName: string,
  yRaw: (string | number | null | undefined)[],
  predictorColNames: string[],
  xRaws: (string | number | null | undefined)[][]
): RegressionResult {
  const p = predictorColNames.length;
  if (p === 0) throw new Error('Seleccione al menos una variable predictora.');

  const rowCount = yRaw.length;
  const cleanY: number[] = [];
  const cleanX: number[][] = [];

  for (let r = 0; r < rowCount; r++) {
    const yVal = yRaw[r];
    if (yVal === null || yVal === undefined || yVal === '') continue;
    const yNum = typeof yVal === 'number' ? yVal : parseFloat(String(yVal).replace(',', '.'));
    if (isNaN(yNum)) continue;

    let validRow = true;
    const xRow: number[] = [];

    for (let c = 0; c < p; c++) {
      const xVal = xRaws[c][r];
      if (xVal === null || xVal === undefined || xVal === '') {
        validRow = false;
        break;
      }
      const xNum = typeof xVal === 'number' ? xVal : parseFloat(String(xVal).replace(',', '.'));
      if (isNaN(xNum)) {
        validRow = false;
        break;
      }
      xRow.push(xNum);
    }

    if (validRow) {
      cleanY.push(yNum);
      cleanX.push(xRow);
    }
  }

  const n = cleanY.length;
  if (n <= p + 1) {
    throw new Error(`Se requieren al menos ${p + 2} observaciones completas para estimar el modelo.`);
  }

  // If Simple Linear Regression (p === 1)
  if (p === 1) {
    const x1 = cleanX.map(r => r[0]);
    const sumX = x1.reduce((a, b) => a + b, 0);
    const sumY = cleanY.reduce((a, b) => a + b, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let sxx = 0;
    let sxy = 0;
    let syy = 0;

    for (let i = 0; i < n; i++) {
      const dx = x1[i] - meanX;
      const dy = cleanY[i] - meanY;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    }

    if (sxx === 0) throw new Error('La variable predictora no presenta variabilidad (desviación = 0).');

    const beta1 = sxy / sxx;
    const beta0 = meanY - beta1 * meanX;

    const fits: number[] = [];
    const residuals: number[] = [];
    let ssRes = 0;
    let ssReg = 0;

    for (let i = 0; i < n; i++) {
      const fit = beta0 + beta1 * x1[i];
      const res = cleanY[i] - fit;
      fits.push(fit);
      residuals.push(res);
      ssRes += res * res;
      ssReg += (fit - meanY) ** 2;
    }

    const dfReg = 1;
    const dfRes = n - 2;
    const dfTotal = n - 1;
    const ssTotal = syy;

    const msReg = ssReg / dfReg;
    const msRes = ssRes / dfRes;
    const s = Math.sqrt(msRes);

    const seBeta1 = s / Math.sqrt(sxx);
    const seBeta0 = s * Math.sqrt(1 / n + (meanX * meanX) / sxx);

    const tBeta0 = beta0 / seBeta0;
    const pBeta0 = studentTPValueTwoTailed(tBeta0, dfRes);

    const tBeta1 = beta1 / seBeta1;
    const pBeta1 = studentTPValueTwoTailed(tBeta1, dfRes);

    const fStat = msReg / msRes;
    const pAnova = fDistributionPValue(fStat, dfReg, dfRes);

    const rSq = ssTotal > 0 ? (ssReg / ssTotal) * 100 : 0;
    const rSqAdj = ssTotal > 0 ? (1 - (msRes / (ssTotal / dfTotal))) * 100 : 0;

    const sign = beta1 >= 0 ? '+' : '-';
    const eq = `${responseColName} = ${beta0.toFixed(4)} ${sign} ${Math.abs(beta1).toFixed(4)} * ${predictorColNames[0]}`;

    return {
      responseCol: responseColName,
      predictorCols: predictorColNames,
      equation: eq,
      coefficients: [
        { term: 'Constante', coef: beta0, seCoef: seBeta0, tValue: tBeta0, pValue: pBeta0, vif: 1 },
        { term: predictorColNames[0], coef: beta1, seCoef: seBeta1, tValue: tBeta1, pValue: pBeta1, vif: 1 }
      ],
      summary: {
        s,
        rSq,
        rSqAdj
      },
      anova: [
        { source: 'Regresión', df: dfReg, ss: ssReg, ms: msReg, f: fStat, p: pAnova },
        { source: 'Error residual', df: dfRes, ss: ssRes, ms: msRes, f: 0, p: 0 },
        { source: 'Total', df: dfTotal, ss: ssTotal, ms: 0, f: 0, p: 0 }
      ],
      fits,
      residuals,
      xValues: cleanX,
      yValues: cleanY
    };
  }

  // Multiple Linear Regression using standard Normal Equations (X'X) * Beta = X'Y
  const k = p + 1; // including intercept
  // Build X matrix with column of 1s
  const X: number[][] = cleanX.map(row => [1, ...row]);

  // Compute X'X
  const XtX: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let r = 0; r < n; r++) {
        sum += X[r][i] * X[r][j];
      }
      XtX[i][j] = sum;
    }
  }

  // Compute X'Y
  const XtY: number[] = Array(k).fill(0);
  for (let i = 0; i < k; i++) {
    let sum = 0;
    for (let r = 0; r < n; r++) {
      sum += X[r][i] * cleanY[r];
    }
    XtY[i] = sum;
  }

  // Invert XtX using Gauss-Jordan with partial pivoting
  const invXtX = invertMatrix(XtX);
  if (!invXtX) {
    throw new Error('Matriz singular: Hay variables predictoras con colinealidad perfecta o varianza cero.');
  }

  // Beta = (XtX)^-1 * XtY
  const beta: number[] = Array(k).fill(0);
  for (let i = 0; i < k; i++) {
    let sum = 0;
    for (let j = 0; j < k; j++) {
      sum += invXtX[i][j] * XtY[j];
    }
    beta[i] = sum;
  }

  const meanY = cleanY.reduce((a, b) => a + b, 0) / n;
  const fits: number[] = [];
  const residuals: number[] = [];
  let ssRes = 0;
  let ssReg = 0;
  let ssTotal = 0;

  for (let r = 0; r < n; r++) {
    let fit = 0;
    for (let i = 0; i < k; i++) {
      fit += X[r][i] * beta[i];
    }
    const res = cleanY[r] - fit;
    fits.push(fit);
    residuals.push(res);
    ssRes += res * res;
    ssReg += (fit - meanY) ** 2;
    ssTotal += (cleanY[r] - meanY) ** 2;
  }

  const dfReg = p;
  const dfRes = n - k;
  const dfTotal = n - 1;

  const msReg = ssReg / dfReg;
  const msRes = ssRes / dfRes;
  const s = Math.sqrt(msRes);

  const fStat = msReg / msRes;
  const pAnova = fDistributionPValue(fStat, dfReg, dfRes);

  const rSq = ssTotal > 0 ? (ssReg / ssTotal) * 100 : 0;
  const rSqAdj = ssTotal > 0 ? (1 - (msRes / (ssTotal / dfTotal))) * 100 : 0;

  const coefficients = [];
  // Term 0 (Constante)
  const seBeta0 = s * Math.sqrt(Math.max(0, invXtX[0][0]));
  const tBeta0 = beta[0] / (seBeta0 || 1e-10);
  const pBeta0 = studentTPValueTwoTailed(tBeta0, dfRes);

  coefficients.push({
    term: 'Constante',
    coef: beta[0],
    seCoef: seBeta0,
    tValue: tBeta0,
    pValue: pBeta0
  });

  let eq = `${responseColName} = ${beta[0].toFixed(4)}`;

  for (let j = 1; j < k; j++) {
    const varName = predictorColNames[j - 1];
    const b = beta[j];
    const seB = s * Math.sqrt(Math.max(0, invXtX[j][j]));
    const tB = b / (seB || 1e-10);
    const pB = studentTPValueTwoTailed(tB, dfRes);

    coefficients.push({
      term: varName,
      coef: b,
      seCoef: seB,
      tValue: tB,
      pValue: pB
    });

    const sign = b >= 0 ? '+' : '-';
    eq += ` ${sign} ${Math.abs(b).toFixed(4)} * ${varName}`;
  }

  return {
    responseCol: responseColName,
    predictorCols: predictorColNames,
    equation: eq,
    coefficients,
    summary: { s, rSq, rSqAdj },
    anova: [
      { source: 'Regresión', df: dfReg, ss: ssReg, ms: msReg, f: fStat, p: pAnova },
      { source: 'Error residual', df: dfRes, ss: ssRes, ms: msRes, f: 0, p: 0 },
      { source: 'Total', df: dfTotal, ss: ssTotal, ms: 0, f: 0, p: 0 }
    ],
    fits,
    residuals,
    xValues: cleanX,
    yValues: cleanY
  };
}

// Matrix Inversion (Gauss-Jordan)
function invertMatrix(M: number[][]): number[][] | null {
  const n = M.length;
  // Augment matrix with identity
  const A: number[][] = M.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let i = 0; i < n; i++) {
    // Pivot
    let maxRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) {
        maxRow = r;
      }
    }
    if (Math.abs(A[maxRow][i]) < 1e-12) return null; // singular

    // Swap
    const temp = A[i];
    A[i] = A[maxRow];
    A[maxRow] = temp;

    // Scale pivot row
    const pivot = A[i][i];
    for (let c = 0; c < 2 * n; c++) {
      A[i][c] /= pivot;
    }

    // Eliminate column in other rows
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = A[r][i];
        for (let c = 0; c < 2 * n; c++) {
          A[r][c] -= factor * A[i][c];
        }
      }
    }
  }

  // Extract inverted matrix
  return A.map(row => row.slice(n));
}

// Statistical Process Control (SPC): Xbar-R, I-MR, P-Chart
export function runControlChart(
  type: 'xbar-r' | 'imr' | 'p-chart',
  varName: string,
  rawValues: (string | number | null | undefined)[],
  subgroupSize: number = 5,
  sampleSizeCol?: (string | number | null | undefined)[]
): ControlChartResult {
  const values = extractNumericValues(rawValues);

  if (type === 'imr') {
    // Individual & Moving Range (subgroupSize = 1)
    const n = values.length;
    if (n < 2) throw new Error('Se requieren al menos 2 datos para el gráfico I-MR.');

    const mrValues: number[] = [];
    const subgroups: ControlChartResult['subgroups'] = values.map((val, idx) => {
      let mr = 0;
      if (idx > 0) {
        mr = Math.abs(val - values[idx - 1]);
        mrValues.push(mr);
      }
      return {
        index: idx + 1,
        mean: val,
        range: mr,
        size: 1,
        values: [val]
      };
    });

    const meanI = values.reduce((a, b) => a + b, 0) / n;
    const meanMR = mrValues.reduce((a, b) => a + b, 0) / mrValues.length;
    const d2 = 1.128; // for n = 2 moving range

    const uclI = meanI + 3 * (meanMR / d2);
    const lclI = meanI - 3 * (meanMR / d2);

    const D4 = 3.267; // for n=2
    const uclMR = D4 * meanMR;
    const lclMR = 0;

    const violations: { chart: 'Xbar' | 'R' | 'I' | 'MR' | 'P'; pointIndex: number; rule: string }[] = [];

    subgroups.forEach((sg, idx) => {
      if (sg.mean > uclI || sg.mean < lclI) {
        sg.isOutOfControlMean = true;
        violations.push({
          chart: 'I',
          pointIndex: idx + 1,
          rule: 'Punto fuera de los límites de control de 3 sigma (Test 1)'
        });
      }
      if (idx > 0 && (sg.range > uclMR || sg.range < lclMR)) {
        sg.isOutOfControlRange = true;
        violations.push({
          chart: 'MR',
          pointIndex: idx + 1,
          rule: 'Rango móvil fuera de límites (Test 1)'
        });
      }
    });

    return {
      type: 'imr',
      variableName: varName,
      subgroupSize: 1,
      subgroups,
      xbar: { cl: meanI, ucl: uclI, lcl: lclI },
      r: { cl: meanMR, ucl: uclMR, lcl: lclMR },
      violations
    };
  }

  if (type === 'xbar-r') {
    // Xbar and R Chart
    const k = Math.floor(values.length / subgroupSize);
    if (k < 2) {
      throw new Error(`Se requieren al menos 2 subgrupos completos de tamaño ${subgroupSize}. Total de datos actuales: ${values.length}.`);
    }

    const subgroups = [];
    const xMeans: number[] = [];
    const ranges: number[] = [];

    for (let i = 0; i < k; i++) {
      const subVals = values.slice(i * subgroupSize, (i + 1) * subgroupSize);
      const m = subVals.reduce((a, b) => a + b, 0) / subgroupSize;
      const min = Math.min(...subVals);
      const max = Math.max(...subVals);
      const r = max - min;

      xMeans.push(m);
      ranges.push(r);

      subgroups.push({
        index: i + 1,
        mean: m,
        range: r,
        size: subgroupSize,
        values: subVals,
        isOutOfControlMean: false,
        isOutOfControlRange: false
      });
    }

    const xbarBar = xMeans.reduce((a, b) => a + b, 0) / k;
    const rBar = ranges.reduce((a, b) => a + b, 0) / k;

    const factors = getSPCFactors(subgroupSize);
    const uclX = xbarBar + factors.A2 * rBar;
    const lclX = xbarBar - factors.A2 * rBar;

    const uclR = factors.D4 * rBar;
    const lclR = factors.D3 * rBar;

    const violations: { chart: 'Xbar' | 'R' | 'I' | 'MR' | 'P'; pointIndex: number; rule: string }[] = [];

    subgroups.forEach((sg, idx) => {
      if (sg.mean > uclX || sg.mean < lclX) {
        sg.isOutOfControlMean = true;
        violations.push({
          chart: 'Xbar',
          pointIndex: idx + 1,
          rule: 'Media de subgrupo fuera de límites de 3σ (Regla 1)'
        });
      }
      if (sg.range > uclR || sg.range < lclR) {
        sg.isOutOfControlRange = true;
        violations.push({
          chart: 'R',
          pointIndex: idx + 1,
          rule: 'Rango de subgrupo fuera de límites (Regla 1)'
        });
      }
    });

    return {
      type: 'xbar-r',
      variableName: varName,
      subgroupSize,
      subgroups,
      xbar: { cl: xbarBar, ucl: uclX, lcl: lclX },
      r: { cl: rBar, ucl: uclR, lcl: lclR },
      violations
    };
  }

  // P-Chart (Proportion non-conforming)
  const defects = values;
  const n = defects.length;
  const sampleSizes = sampleSizeCol ? extractNumericValues(sampleSizeCol) : Array(n).fill(subgroupSize);

  let totalDefects = 0;
  let totalSampled = 0;

  const proportions: number[] = [];
  const subgroups = [];

  for (let i = 0; i < n; i++) {
    const d = defects[i];
    const sSize = sampleSizes[i] || subgroupSize;
    const p = sSize > 0 ? d / sSize : 0;

    totalDefects += d;
    totalSampled += sSize;
    proportions.push(p);

    subgroups.push({
      index: i + 1,
      mean: p,
      range: 0,
      size: sSize,
      values: [d],
      isOutOfControlMean: false
    });
  }

  const pBar = totalSampled > 0 ? totalDefects / totalSampled : 0;
  const avgN = totalSampled / n;

  // Limits based on average sample size (or point by point)
  const seP = avgN > 0 ? Math.sqrt((pBar * (1 - pBar)) / avgN) : 0;
  const uclP = Math.min(1, pBar + 3 * seP);
  const lclP = Math.max(0, pBar - 3 * seP);

  const violations: { chart: 'Xbar' | 'R' | 'I' | 'MR' | 'P'; pointIndex: number; rule: string }[] = [];

  subgroups.forEach((sg, idx) => {
    // Specific limit for this subgroup
    const curSeP = sg.size > 0 ? Math.sqrt((pBar * (1 - pBar)) / sg.size) : seP;
    const curUCL = Math.min(1, pBar + 3 * curSeP);
    const curLCL = Math.max(0, pBar - 3 * curSeP);

    if (sg.mean > curUCL || sg.mean < curLCL) {
      sg.isOutOfControlMean = true;
      violations.push({
        chart: 'P',
        pointIndex: idx + 1,
        rule: 'Proporción de defectos fuera de límites de control'
      });
    }
  });

  return {
    type: 'p-chart',
    variableName: varName,
    subgroupSize: Math.round(avgN),
    subgroups,
    xbar: { cl: pBar, ucl: uclP, lcl: lclP },
    r: { cl: 0, ucl: 0, lcl: 0 },
    violations
  };
}

// Process Capability Analysis (Cp, Cpk, Pp, Ppk)
export function runCapabilityAnalysis(
  varName: string,
  rawValues: (string | number | null | undefined)[],
  lsl?: number,
  usl?: number,
  target?: number,
  subgroupSize: number = 5
): CapabilityResult {
  const values = extractNumericValues(rawValues);
  const n = values.length;

  if (n < 5) throw new Error('Se requieren al menos 5 observaciones para el análisis de capacidad.');
  if (lsl === undefined && usl === undefined) {
    throw new Error('Debe especificar al menos un límite de especificación (LSL o USL).');
  }

  const mean = values.reduce((a, b) => a + b, 0) / n;

  // Overall standard deviation (sample standard deviation)
  const ss = values.reduce((a, b) => a + (b - mean) ** 2, 0);
  const overallStdDev = Math.sqrt(ss / (n - 1));

  // Within-subgroup standard deviation via average range
  let withinStdDev = overallStdDev;
  const sgSize = Math.max(2, Math.min(subgroupSize, 25));
  const numSubgroups = Math.floor(n / sgSize);

  if (numSubgroups >= 2) {
    let sumR = 0;
    for (let i = 0; i < numSubgroups; i++) {
      const chunk = values.slice(i * sgSize, (i + 1) * sgSize);
      sumR += Math.max(...chunk) - Math.min(...chunk);
    }
    const rBar = sumR / numSubgroups;
    const factors = getSPCFactors(sgSize);
    withinStdDev = rBar / factors.d2;
  }

  // Capability Indices (Potential / Within)
  let cp: number | undefined;
  let cpl: number | undefined;
  let cpu: number | undefined;
  let cpk: number | undefined;

  if (lsl !== undefined && usl !== undefined && usl > lsl) {
    cp = (usl - lsl) / (6 * withinStdDev);
  }
  if (lsl !== undefined) {
    cpl = (mean - lsl) / (3 * withinStdDev);
  }
  if (usl !== undefined) {
    cpu = (usl - mean) / (3 * withinStdDev);
  }
  if (cpl !== undefined && cpu !== undefined) {
    cpk = Math.min(cpl, cpu);
  } else if (cpl !== undefined) {
    cpk = cpl;
  } else if (cpu !== undefined) {
    cpk = cpu;
  }

  // Overall Performance Indices (Pp, Ppk)
  let pp: number | undefined;
  let ppl: number | undefined;
  let ppu: number | undefined;
  let ppk: number | undefined;

  if (lsl !== undefined && usl !== undefined && usl > lsl) {
    pp = (usl - lsl) / (6 * overallStdDev);
  }
  if (lsl !== undefined) {
    ppl = (mean - lsl) / (3 * overallStdDev);
  }
  if (usl !== undefined) {
    ppu = (usl - mean) / (3 * overallStdDev);
  }
  if (ppl !== undefined && ppu !== undefined) {
    ppk = Math.min(ppl, ppu);
  } else if (ppl !== undefined) {
    ppk = ppl;
  } else if (ppu !== undefined) {
    ppk = ppu;
  }

  // Expected PPM out of spec
  let ppmBelow = 0;
  let ppmAbove = 0;

  if (lsl !== undefined && withinStdDev > 0) {
    const zL = (lsl - mean) / withinStdDev;
    ppmBelow = standardNormalCDF(zL) * 1_000_000;
  }
  if (usl !== undefined && withinStdDev > 0) {
    const zU = (usl - mean) / withinStdDev;
    ppmAbove = (1 - standardNormalCDF(zU)) * 1_000_000;
  }

  return {
    variableName: varName,
    lsl,
    usl,
    target,
    sampleSize: n,
    mean,
    overallStdDev,
    withinStdDev,
    cp,
    cpl,
    cpu,
    cpk,
    pp,
    ppl,
    ppu,
    ppk,
    ppmExpectedBelow: Math.round(ppmBelow),
    ppmExpectedAbove: Math.round(ppmAbove),
    ppmExpectedTotal: Math.round(ppmBelow + ppmAbove),
    values
  };
}

// Pearson Correlation Matrix
export function calculateCorrelationMatrix(
  colNames: string[],
  dataColumns: (string | number | null | undefined)[][]
): CorrelationResult {
  const k = colNames.length;
  const matrix = [];

  for (let i = 0; i < k; i++) {
    for (let j = i; j < k; j++) {
      const raw1 = dataColumns[i];
      const raw2 = dataColumns[j];
      const len = Math.min(raw1.length, raw2.length);

      const pairs: [number, number][] = [];
      for (let r = 0; r < len; r++) {
        const v1 = raw1[r];
        const v2 = raw2[r];
        if (v1 !== null && v1 !== undefined && v1 !== '' && v2 !== null && v2 !== undefined && v2 !== '') {
          const n1 = typeof v1 === 'number' ? v1 : parseFloat(String(v1).replace(',', '.'));
          const n2 = typeof v2 === 'number' ? v2 : parseFloat(String(v2).replace(',', '.'));
          if (!isNaN(n1) && !isNaN(n2)) {
            pairs.push([n1, n2]);
          }
        }
      }

      const n = pairs.length;
      if (n < 3) {
        matrix.push({ var1: colNames[i], var2: colNames[j], r: i === j ? 1 : 0, pValue: 1, n });
        continue;
      }

      const mean1 = pairs.reduce((a, b) => a + b[0], 0) / n;
      const mean2 = pairs.reduce((a, b) => a + b[1], 0) / n;

      let sxx = 0;
      let syy = 0;
      let sxy = 0;

      for (const [x, y] of pairs) {
        const dx = x - mean1;
        const dy = y - mean2;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
      }

      const denom = Math.sqrt(sxx * syy);
      const r = denom > 0 ? sxy / denom : (i === j ? 1 : 0);

      // t-statistic for Pearson r
      let pVal = 0;
      if (i === j) {
        pVal = 0;
      } else if (Math.abs(r) >= 1) {
        pVal = 0;
      } else {
        const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
        pVal = studentTPValueTwoTailed(t, n - 2);
      }

      matrix.push({
        var1: colNames[i],
        var2: colNames[j],
        r,
        pValue: pVal,
        n
      });
    }
  }

  return {
    variables: colNames,
    matrix
  };
}

// Compute Normal Probability Plot (Q-Q plot) points
export function calculateProbabilityPlotData(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { points: [], mean: 0, stdDev: 0, adStat: 0, pValue: 0 };

  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const ss = sorted.reduce((a, b) => a + (b - mean) ** 2, 0);
  const stdDev = n > 1 ? Math.sqrt(ss / (n - 1)) : 1;

  // Blom's plotting position: p_i = (i - 3/8) / (n + 1/4)
  const points = sorted.map((val, idx) => {
    const i = idx + 1;
    const p = (i - 0.375) / (n + 0.25);
    const theoreticalZ = inverseNormalCDF(p);
    return {
      x: val,
      y: p * 100, // percentile (%)
      zScore: theoreticalZ,
      fittedX: mean + theoreticalZ * stdDev
    };
  });

  // Anderson-Darling Statistic approximation
  let adSum = 0;
  for (let idx = 0; idx < n; idx++) {
    const i = idx + 1;
    const z = (sorted[idx] - mean) / (stdDev || 1);
    const fZ = Math.max(1e-10, Math.min(1 - 1e-10, standardNormalCDF(z)));
    adSum += (2 * i - 1) * Math.log(fZ) + (2 * (n - i) + 1) * Math.log(1 - fZ);
  }
  const aSquared = -n - (1 / n) * adSum;
  // Adjusted AD for estimated mean & variance
  const aSquaredAdj = aSquared * (1 + 0.75 / n + 2.25 / (n * n));

  // Approx p-value for Anderson-Darling
  let pVal = 0.5;
  if (aSquaredAdj >= 0.60) {
    pVal = Math.exp(1.2937 - 5.709 * aSquaredAdj + 0.0186 * (aSquaredAdj ** 2));
  } else if (aSquaredAdj > 0.34) {
    pVal = Math.exp(0.9177 - 4.279 * aSquaredAdj - 1.38 * (aSquaredAdj ** 2));
  } else if (aSquaredAdj > 0.20) {
    pVal = 1 - Math.exp(-8.318 + 42.796 * aSquaredAdj - 59.938 * (aSquaredAdj ** 2));
  } else {
    pVal = 1 - Math.exp(-13.436 + 101.14 * aSquaredAdj - 223.73 * (aSquaredAdj ** 2));
  }
  pVal = Math.max(0.001, Math.min(0.999, pVal));

  return {
    points,
    mean,
    stdDev,
    adStat: aSquaredAdj,
    pValue: pVal
  };
}
