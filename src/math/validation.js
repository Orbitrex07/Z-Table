/**
 * @file validation.js
 * @description Input validation and sanitization for standard normal distribution calculator.
 * Prevents application crashes and returns clear, instructional feedback to users.
 */

/**
 * Validates a standard Z-score input.
 *
 * @param {string | number} rawZ - Raw input
 * @returns {{ isValid: boolean, value: number, error?: string, warning?: string }}
 */
export function validateZInput(rawZ) {
  if (rawZ === undefined || rawZ === null || String(rawZ).trim() === '') {
    return { isValid: false, value: NaN, error: 'Please enter a Z-score value (e.g., 1.25, -1.96).' };
  }

  const num = Number(rawZ);
  if (Number.isNaN(num)) {
    return { isValid: false, value: NaN, error: `"${rawZ}" is not a valid number. Please enter numeric digits.` };
  }

  let warning = undefined;
  if (Math.abs(num) > 6.0) {
    warning = `Note: |Z| = ${Math.abs(num).toFixed(2)} is an extreme outlier beyond ±6σ. The cumulative area is virtually ${num > 0 ? '1.0000' : '0.0000'} (within 10⁻⁹).`;
  }

  return { isValid: true, value: num, warning };
}

/**
 * Validates two Z-scores for an interval calculation.
 *
 * @param {string | number} rawZ1 - Lower bound
 * @param {string | number} rawZ2 - Upper bound
 * @returns {{ isValid: boolean, z1: number, z2: number, error?: string, warning?: string }}
 */
export function validateTwoZInputs(rawZ1, rawZ2) {
  const v1 = validateZInput(rawZ1);
  if (!v1.isValid) return { isValid: false, z1: NaN, z2: NaN, error: `Boundary Z₁: ${v1.error}` };

  const v2 = validateZInput(rawZ2);
  if (!v2.isValid) return { isValid: false, z1: NaN, z2: NaN, error: `Boundary Z₂: ${v2.error}` };

  if (v1.value === v2.value) {
    return {
      isValid: true,
      z1: v1.value,
      z2: v2.value,
      warning: `Z₁ and Z₂ are equal (${v1.value}). The area under a continuous curve at a single point is mathematically 0.`,
    };
  }

  let warning = undefined;
  if (v1.value > v2.value) {
    warning = `Boundary Z₁ (${v1.value}) is greater than Z₂ (${v2.value}). The calculator will automatically evaluate the ordered interval [${v2.value}, ${v1.value}].`;
  }

  return {
    isValid: true,
    z1: v1.value,
    z2: v2.value,
    warning: warning || v1.warning || v2.warning,
  };
}

/**
 * Validates a probability input for inverse CDF lookup.
 *
 * @param {string | number} rawP - Probability input
 * @returns {{ isValid: boolean, value: number, error?: string, warning?: string }}
 */
export function validateProbabilityInput(rawP) {
  if (rawP === undefined || rawP === null || String(rawP).trim() === '') {
    return { isValid: false, value: NaN, error: 'Please enter a target probability between 0 and 1 (e.g., 0.95).' };
  }

  const num = Number(rawP);
  if (Number.isNaN(num)) {
    return { isValid: false, value: NaN, error: `"${rawP}" is not a valid number. Please enter decimal numbers.` };
  }

  if (num <= 0.0) {
    return { isValid: false, value: NaN, error: 'Probability must be strictly greater than 0 (P > 0). Cumulative area cannot be ≤ 0.' };
  }

  if (num >= 1.0) {
    return { isValid: false, value: NaN, error: 'Probability must be strictly less than 1 (P < 1). Cumulative area cannot be ≥ 1.' };
  }

  let warning = undefined;
  if (num < 0.0001 || num > 0.9999) {
    warning = `Probability ${num} is in the extreme tails; the resulting critical Z will lie beyond ±3.7σ.`;
  }

  return { isValid: true, value: num, warning };
}

/**
 * Validates raw score standardization inputs X, mean (mu), stdDev (sigma).
 *
 * @param {string | number} rawX - Observation X
 * @param {string | number} rawMean - Population mean mu
 * @param {string | number} rawStdDev - Population standard deviation sigma
 * @returns {{ isValid: boolean, x: number, mean: number, stdDev: number, error?: string, warning?: string }}
 */
export function validateXToZInputs(rawX, rawMean, rawStdDev) {
  if (rawX === undefined || rawX === null || String(rawX).trim() === '') {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: 'Please enter the observation value X.' };
  }
  const x = Number(rawX);
  if (Number.isNaN(x)) {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: `Observation X ("${rawX}") is not a valid number.` };
  }

  if (rawMean === undefined || rawMean === null || String(rawMean).trim() === '') {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: 'Please enter the population mean (μ).' };
  }
  const mean = Number(rawMean);
  if (Number.isNaN(mean)) {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: `Mean μ ("${rawMean}") is not a valid number.` };
  }

  if (rawStdDev === undefined || rawStdDev === null || String(rawStdDev).trim() === '') {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: 'Please enter the standard deviation (σ).' };
  }
  const stdDev = Number(rawStdDev);
  if (Number.isNaN(stdDev)) {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: `Standard deviation σ ("${rawStdDev}") is not a valid number.` };
  }

  if (stdDev <= 0) {
    return { isValid: false, x: NaN, mean: NaN, stdDev: NaN, error: `Standard deviation (σ) must be strictly positive (σ > 0). Received: ${stdDev}.` };
  }

  return { isValid: true, x, mean, stdDev };
}
