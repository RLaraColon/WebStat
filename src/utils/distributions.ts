/**
 * Statistical distributions and mathematical functions
 * 100% Client-Side calculation with zero API dependencies.
 */

// Error function approximation
export function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

// Standard Normal CDF: Phi(z)
export function standardNormalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Standard Normal PDF: phi(z)
export function standardNormalPDF(z: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

// Inverse Standard Normal Quantile (Probit) - Rational approximation
export function inverseNormalCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Beasley-Springer-Moro / Acklam approximation
  const a = [
    -3.969683028665376e+01,  2.209460984245205e+02,
    -2.759285104469687e+02,  1.383577518672690e+02,
    -3.066479806614716e+01,  2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,  1.615858368580409e+02,
    -1.556989798598866e+02,  6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
     4.374664141464968e+00,  2.938163982698783e+00
  ];
  const d = [
     7.784695709041462e-03,  3.224671290700398e-01,
     2.445134137142996e+00,  3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Log Gamma function ln(Gamma(x)) - Lanczos approximation
export function logGamma(x: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    a += p[i] / (x + i + 1);
  }
  const t = x + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// Incomplete Beta function I_x(a, b) using continued fraction
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Symmetry transformation
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a);
  }

  const factor = Math.exp(
    a * Math.log(x) + b * Math.log(1 - x) - logGamma(a) - logGamma(b) + logGamma(a + b)
  ) / a;

  // Continued fraction (Lentz's method)
  const maxIterations = 200;
  const epsilon = 1e-12;
  const tiny = 1e-30;

  let c = 1.0;
  let d = 1.0 - (a + b) * x / (a + 1.0);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    // Even step
    let numerator = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1.0 + numerator * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1.0 + numerator / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1.0 / d;
    h *= d * c;

    // Odd step
    numerator = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1.0 + numerator * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1.0 + numerator / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1.0 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1.0) < epsilon) {
      break;
    }
  }

  return factor * h;
}

// Student's t-distribution CDF
export function studentTCDF(t: number, df: number): number {
  if (df <= 0) return NaN;
  const x = df / (df + t * t);
  const ibeta = regularizedIncompleteBeta(x, df / 2, 0.5);
  if (t > 0) {
    return 1 - 0.5 * ibeta;
  } else {
    return 0.5 * ibeta;
  }
}

// Student's t-distribution p-value (two-tailed)
export function studentTPValueTwoTailed(t: number, df: number): number {
  const cdf = studentTCDF(Math.abs(t), df);
  return 2 * (1 - cdf);
}

// Inverse Student's t quantile (approximate using Hill's method or binary search)
export function inverseStudentT(p: number, df: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  if (df === 1) return Math.tan(Math.PI * (p - 0.5));
  if (df === 2) return (2 * p - 1) / Math.sqrt(2 * p * (1 - p));

  // Binary search with normal approximation as seed
  const z = inverseNormalCDF(p);
  if (df > 100) return z + (z*z*z + z) / (4 * df);

  let low = -100;
  let high = 100;
  let guess = z * Math.sqrt(df / (df - 2 > 0 ? df - 2 : 1));
  if (guess < low) guess = low;
  if (guess > high) guess = high;

  for (let i = 0; i < 50; i++) {
    const cdf = studentTCDF(guess, df);
    const err = cdf - p;
    if (Math.abs(err) < 1e-8) break;
    if (err > 0) {
      high = guess;
    } else {
      low = guess;
    }
    guess = 0.5 * (low + high);
  }
  return guess;
}

// F-Distribution CDF and P-value
export function fDistributionCDF(f: number, df1: number, df2: number): number {
  if (f <= 0) return 0;
  const x = (df1 * f) / (df1 * f + df2);
  return regularizedIncompleteBeta(x, df1 / 2, df2 / 2);
}

export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  return 1 - fDistributionCDF(f, df1, df2);
}

// Control Chart Factors Table (A2, D3, D4, d2, c4) for Subgroup Sizes n = 2 to 25
export interface SPCFactors {
  A2: number;
  D3: number;
  D4: number;
  d2: number;
  c4: number;
}

export const SPC_FACTORS_TABLE: Record<number, SPCFactors> = {
  2:  { A2: 1.880, D3: 0,     D4: 3.267, d2: 1.128, c4: 0.7979 },
  3:  { A2: 1.023, D3: 0,     D4: 2.574, d2: 1.693, c4: 0.8862 },
  4:  { A2: 0.729, D3: 0,     D4: 2.282, d2: 2.059, c4: 0.9213 },
  5:  { A2: 0.577, D3: 0,     D4: 2.114, d2: 2.326, c4: 0.9400 },
  6:  { A2: 0.483, D3: 0,     D4: 2.004, d2: 2.534, c4: 0.9515 },
  7:  { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704, c4: 0.9594 },
  8:  { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847, c4: 0.9650 },
  9:  { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970, c4: 0.9693 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078, c4: 0.9727 },
  11: { A2: 0.285, D3: 0.256, D4: 1.744, d2: 3.173, c4: 0.9754 },
  12: { A2: 0.266, D3: 0.283, D4: 1.717, d2: 3.258, c4: 0.9776 },
  13: { A2: 0.249, D3: 0.307, D4: 1.693, d2: 3.336, c4: 0.9794 },
  14: { A2: 0.235, D3: 0.328, D4: 1.672, d2: 3.407, c4: 0.9810 },
  15: { A2: 0.223, D3: 0.347, D4: 1.653, d2: 3.472, c4: 0.9823 },
  16: { A2: 0.212, D3: 0.363, D4: 1.637, d2: 3.532, c4: 0.9835 },
  17: { A2: 0.203, D3: 0.378, D4: 1.622, d2: 3.588, c4: 0.9845 },
  18: { A2: 0.194, D3: 0.391, D4: 1.608, d2: 3.640, c4: 0.9854 },
  19: { A2: 0.187, D3: 0.403, D4: 1.597, d2: 3.689, c4: 0.9862 },
  20: { A2: 0.180, D3: 0.415, D4: 1.585, d2: 3.735, c4: 0.9869 },
  25: { A2: 0.153, D3: 0.459, D4: 1.541, d2: 3.931, c4: 0.9896 }
};

export function getSPCFactors(n: number): SPCFactors {
  if (SPC_FACTORS_TABLE[n]) return SPC_FACTORS_TABLE[n];
  if (n < 2) return { A2: 0, D3: 0, D4: 0, d2: 1.128, c4: 1 };
  if (n > 25) {
    // Large n approximation
    const c4 = 4*(n-1) / (4*n - 3);
    const d2 = Math.sqrt(2) * (Math.exp(logGamma(n/2) - logGamma((n-1)/2)));
    return { A2: 3 / (Math.sqrt(n) * 3), D3: Math.max(0, 1 - 3/(d2*Math.sqrt(2*(n-1)))), D4: 1 + 3/(d2*Math.sqrt(2*(n-1))), d2, c4 };
  }
  // Interpolate closest
  const keys = Object.keys(SPC_FACTORS_TABLE).map(Number).sort((a,b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (n > keys[i] && n < keys[i+1]) {
      return SPC_FACTORS_TABLE[keys[i]];
    }
  }
  return SPC_FACTORS_TABLE[5];
}
