export type DataType = 'numeric' | 'text' | 'date';

export interface ColumnDefinition {
  id: string; // e.g. 'C1', 'C2'
  name: string; // e.g. 'Diametro', 'Temperatura'
  type: DataType;
  width?: number;
}

export interface WorksheetData {
  id: string;
  title: string;
  columns: ColumnDefinition[];
  rows: Record<string, string | number | null>[]; // array of row objects keyed by col id
  createdAt: string;
  updatedAt: string;
}

export interface SessionEntry {
  id: string;
  timestamp: string;
  title: string;
  type: 'descriptive' | 'ttest1' | 'ttest2' | 'ttest_paired' | 'anova' | 'regression' | 'control_chart' | 'capability' | 'correlation' | 'system';
  summaryText: string;
  htmlReport?: string;
  chartData?: any;
}

export interface DescriptiveStatsResult {
  columnId: string;
  columnName: string;
  n: number;
  nMissing: number;
  mean: number;
  seMean: number;
  stdDev: number;
  variance: number;
  coefVar: number;
  sum: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  ciLower95: number;
  ciUpper95: number;
  values: number[];
}

export interface TTest1Result {
  columnName: string;
  hypothesizedMean: number;
  sampleSize: number;
  mean: number;
  stdDev: number;
  seMean: number;
  tStatistic: number;
  df: number;
  pValue: number;
  ciLevel: number;
  ciLower: number;
  ciUpper: number;
  alternative: 'two-sided' | 'less' | 'greater';
}

export interface TTest2Result {
  col1Name: string;
  col2Name: string;
  n1: number;
  n2: number;
  mean1: number;
  mean2: number;
  s1: number;
  s2: number;
  diff: number;
  seDiff: number;
  tStatistic: number;
  df: number;
  pValue: number;
  ciLevel: number;
  ciLower: number;
  ciUpper: number;
  equalVariances: boolean;
  alternative: 'two-sided' | 'less' | 'greater';
}

export interface AnovaResult {
  factorName: string;
  responseName: string;
  groups: {
    name: string;
    n: number;
    mean: number;
    stdDev: number;
    ciLower: number;
    ciUpper: number;
    values: number[];
  }[];
  dfFactor: number;
  dfError: number;
  dfTotal: number;
  ssFactor: number;
  ssError: number;
  ssTotal: number;
  msFactor: number;
  msError: number;
  fValue: number;
  pValue: number;
  rSquared: number;
  rSquaredAdj: number;
  pooledStdDev: number;
}

export interface RegressionResult {
  responseCol: string;
  predictorCols: string[];
  equation: string;
  coefficients: {
    term: string;
    coef: number;
    seCoef: number;
    tValue: number;
    pValue: number;
    vif?: number;
  }[];
  summary: {
    s: number;
    rSq: number;
    rSqAdj: number;
  };
  anova: {
    source: string;
    df: number;
    ss: number;
    ms: number;
    f: number;
    p: number;
  }[];
  fits: number[];
  residuals: number[];
  xValues: number[][];
  yValues: number[];
}

export interface ControlChartResult {
  type: 'xbar-r' | 'imr' | 'p-chart';
  variableName: string;
  subgroupSize: number;
  subgroups: {
    index: number;
    mean: number;
    range: number;
    size: number;
    values: number[];
    isOutOfControlMean?: boolean;
    isOutOfControlRange?: boolean;
  }[];
  xbar: {
    cl: number;
    ucl: number;
    lcl: number;
  };
  r: {
    cl: number;
    ucl: number;
    lcl: number;
  };
  violations: {
    chart: 'Xbar' | 'R' | 'I' | 'MR' | 'P';
    pointIndex: number;
    rule: string;
  }[];
}

export interface CapabilityResult {
  variableName: string;
  lsl?: number;
  usl?: number;
  target?: number;
  sampleSize: number;
  mean: number;
  overallStdDev: number;
  withinStdDev: number;
  cp?: number;
  cpl?: number;
  cpu?: number;
  cpk?: number;
  pp?: number;
  ppl?: number;
  ppu?: number;
  ppk?: number;
  ppmExpectedBelow?: number;
  ppmExpectedAbove?: number;
  ppmExpectedTotal?: number;
  values: number[];
}

export interface CorrelationResult {
  variables: string[];
  matrix: {
    var1: string;
    var2: string;
    r: number;
    pValue: number;
    n: number;
  }[];
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
