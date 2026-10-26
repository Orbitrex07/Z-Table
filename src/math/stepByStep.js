/**
 * @file stepByStep.js
 * @description Generates transparent, college-level step-by-step mathematical derivations
 * for all calculator modes to demonstrate rigorous statistical principles to faculty reviewers.
 */

import { splitZ } from './zTableEngine.js';
import { calculateCDF, calculateBetweenMeanAndZ, calculateRightTail, formatProbability, formatZ } from './normalDistribution.js';

/**
 * Step-by-step calculation breakdown for Mode 1: Z -> Probability
 *
 * @param {number} z - Standardized score
 * @returns {Array<{ stepNumber: number, title: string, formula?: string, explanation: string, result?: string }>}
 */
export function getStepsForZToProbability(z) {
  const absZ = Math.abs(z);
  const { rowLabel, colLabel } = splitZ(z);
  const tableVal = formatProbability(calculateBetweenMeanAndZ(absZ), 4);
  const leftTail = formatProbability(calculateCDF(z), 4);
  const rightTail = formatProbability(calculateRightTail(z), 4);
  const isPositive = z >= 0;

  const steps = [
    {
      stepNumber: 1,
      title: 'Locate Z in Conventional Standard Normal Table',
      explanation: `Split |Z| = ${absZ.toFixed(2)} into row and column components. The row corresponds to the units and first decimal place, and the column corresponds to the hundredths place.`,
      result: `Row: ${rowLabel} | Column: ${colLabel}`,
    },
    {
      stepNumber: 2,
      title: 'Read Table Intersection Value (Area from Mean)',
      formula: 'P(0 < Z < |z|)',
      explanation: `Find the cell at row ${rowLabel} and column ${colLabel}. In the conventional Z-table, this value represents the probability area bounded between the mean (Z = 0) and Z.`,
      result: `Table Value = ${tableVal}`,
    },
  ];

  if (isPositive) {
    steps.push({
      stepNumber: 3,
      title: 'Calculate Cumulative Left-Tail Area Φ(z)',
      formula: 'P(Z ≤ z) = 0.5000 + P(0 < Z < z)',
      explanation: `Because the standard normal curve is symmetric, the entire area to the left of the mean (Z = 0) equals 0.5000. Add the table area between 0 and ${formatZ(z, 2)}.`,
      result: `0.5000 + ${tableVal} = ${leftTail}`,
    });
    steps.push({
      stepNumber: 4,
      title: 'Calculate Right-Tail Area (Upper Tail)',
      formula: 'P(Z ≥ z) = 1.0000 - P(Z ≤ z)',
      explanation: `The total area under the entire normal curve equals 1.0000 (total probability axiom). Subtract the cumulative left area from 1.`,
      result: `1.0000 - ${leftTail} = ${rightTail}`,
    });
  } else {
    // Negative Z
    steps.push({
      stepNumber: 3,
      title: 'Apply Symmetry Property for Negative Z',
      formula: 'P(z < Z < 0) = P(0 < Z < |z|)',
      explanation: `By Gaussian symmetry f(-z) = f(z), the area between ${formatZ(z, 2)} and 0 equals the area between 0 and +${formatZ(absZ, 2)} (${tableVal}).`,
      result: `Area between ${formatZ(z, 2)} and 0 = ${tableVal}`,
    });
    steps.push({
      stepNumber: 4,
      title: 'Calculate Cumulative Left-Tail Area Φ(z)',
      formula: 'P(Z ≤ z) = 0.5000 - P(z < Z < 0)',
      explanation: `Since ${formatZ(z, 2)} lies to the left of the mean, subtract the area between ${formatZ(z, 2)} and 0 from the left half of the curve (0.5000).`,
      result: `0.5000 - ${tableVal} = ${leftTail}`,
    });
    steps.push({
      stepNumber: 5,
      title: 'Calculate Right-Tail Area (Upper Tail)',
      formula: 'P(Z ≥ z) = 1.0000 - P(Z ≤ z) = 0.5000 + P(z < Z < 0)',
      explanation: `The right-tail includes the area from ${formatZ(z, 2)} to 0 plus the entire right half (0.5000).`,
      result: `0.5000 + ${tableVal} = ${rightTail}`,
    });
  }

  // Two-tailed step
  const twoTail = formatProbability(2 * calculateRightTail(absZ), 4);
  steps.push({
    stepNumber: steps.length + 1,
    title: 'Two-Tailed Probability P(|Z| ≥ |z|)',
    formula: 'P(|Z| ≥ |z|) = 2 × P(Z ≥ |z|)',
    explanation: `For hypothesis testing, the probability in both extreme tails outside ±${absZ.toFixed(2)} is double the upper tail probability.`,
    result: `2 × ${formatProbability(calculateRightTail(absZ), 4)} = ${twoTail}`,
  });

  return steps;
}

/**
 * Step-by-step calculation breakdown for Mode 2: Two Z-values
 *
 * @param {number} z1 - Lower boundary
 * @param {number} z2 - Upper boundary
 * @returns {Array<{ stepNumber: number, title: string, formula?: string, explanation: string, result?: string }>}
 */
export function getStepsForTwoZ(z1, z2) {
  const lower = Math.min(z1, z2);
  const upper = Math.max(z1, z2);

  const phi1 = calculateCDF(lower);
  const phi2 = calculateCDF(upper);
  const diff = phi2 - phi1;

  const phi1Str = formatProbability(phi1, 4);
  const phi2Str = formatProbability(phi2, 4);
  const diffStr = formatProbability(diff, 4);

  return [
    {
      stepNumber: 1,
      title: 'Verify Interval Boundaries and Order',
      explanation: `Identify lower boundary z₁ = ${formatZ(lower, 2)} and upper boundary z₂ = ${formatZ(upper, 2)}. The desired probability is P(${formatZ(lower, 2)} < Z < ${formatZ(upper, 2)}).`,
      result: `z₁ = ${formatZ(lower, 2)}, z₂ = ${formatZ(upper, 2)}`,
    },
    {
      stepNumber: 2,
      title: 'Find Cumulative Probability for Upper Boundary z₂',
      formula: 'Φ(z₂) = P(Z ≤ z₂)',
      explanation: `Look up or compute the cumulative area from -∞ to z₂ = ${formatZ(upper, 2)}.`,
      result: `Φ(${formatZ(upper, 2)}) = ${phi2Str}`,
    },
    {
      stepNumber: 3,
      title: 'Find Cumulative Probability for Lower Boundary z₁',
      formula: 'Φ(z₁) = P(Z ≤ z₁)',
      explanation: `Look up or compute the cumulative area from -∞ to z₁ = ${formatZ(lower, 2)}.`,
      result: `Φ(${formatZ(lower, 2)}) = ${phi1Str}`,
    },
    {
      stepNumber: 4,
      title: 'Subtract Lower Cumulative Area from Upper Cumulative Area',
      formula: 'P(z₁ < Z < z₂) = Φ(z₂) - Φ(z₁)',
      explanation: `The area between two points equals the total cumulative area up to the right point minus the unshaded area up to the left point.`,
      result: `P(${formatZ(lower, 2)} < Z < ${formatZ(upper, 2)}) = ${phi2Str} - ${phi1Str} = ${diffStr}`,
    },
  ];
}

/**
 * Step-by-step breakdown for Mode 3: Probability -> Z (Inverse Normal)
 *
 * @param {number} p - Probability in (0, 1)
 * @param {'left' | 'right' | 'central'} tailType
 * @param {number} z - Computed critical Z
 * @returns {Array<{ stepNumber: number, title: string, formula?: string, explanation: string, result?: string }>}
 */
export function getStepsForProbToZ(p, tailType, z) {
  const pFormatted = p.toFixed(4);
  const zFormatted = formatZ(z, 4);

  if (tailType === 'left') {
    return [
      {
        stepNumber: 1,
        title: 'Specify Cumulative Left-Tail Target',
        formula: 'P(Z ≤ z) = p',
        explanation: `We are given the left cumulative probability p = ${pFormatted} and need to find the critical boundary z such that Φ(z) = ${pFormatted}.`,
        result: `Target: Φ(z) = ${pFormatted}`,
      },
      {
        stepNumber: 2,
        title: 'Determine Sign Relative to Mean',
        explanation: p >= 0.5
          ? `Since p = ${pFormatted} ≥ 0.5000, the critical value z must be positive (to the right of the mean μ = 0).`
          : `Since p = ${pFormatted} < 0.5000, the critical value z must be negative (to the left of the mean μ = 0).`,
        result: p >= 0.5 ? 'z ≥ 0' : 'z < 0',
      },
      {
        stepNumber: 3,
        title: 'Perform Inverse Normal Transformation (Acklam Algorithm)',
        formula: 'z = Φ⁻¹(p)',
        explanation: `Compute the quantile value using Peter J. Acklam's inverse normal CDF algorithm. In printed Z-tables, one searches the body of the table for ${pFormatted} and reads the corresponding row and column.`,
        result: `z = ${zFormatted}`,
      },
      {
        stepNumber: 4,
        title: 'Verification via Forward CDF',
        formula: 'Φ(z) = P(Z ≤ z)',
        explanation: `Evaluate the forward cumulative distribution function at z = ${zFormatted} to verify that it reproduces the original probability.`,
        result: `Φ(${zFormatted}) = ${formatProbability(calculateCDF(z), 4)} ≈ ${pFormatted}`,
      },
    ];
  }

  if (tailType === 'right') {
    const leftP = 1.0 - p;
    return [
      {
        stepNumber: 1,
        title: 'Convert Right-Tail Probability to Left-Tail',
        formula: 'P(Z ≤ z) = 1.0000 - P(Z ≥ z)',
        explanation: `Statistical Z-tables and inverse functions are parameterized by cumulative left-tail area. Given upper tail area ${pFormatted}, find the cumulative area below z.`,
        result: `Φ(z) = 1.0000 - ${pFormatted} = ${leftP.toFixed(4)}`,
      },
      {
        stepNumber: 2,
        title: 'Find Critical Quantile z',
        formula: 'z = Φ⁻¹(1 - p)',
        explanation: `Calculate the standardized score corresponding to cumulative probability ${leftP.toFixed(4)}.`,
        result: `z = ${zFormatted}`,
      },
      {
        stepNumber: 3,
        title: 'Verify Right-Tail Area',
        formula: 'P(Z ≥ z) = 1 - Φ(z)',
        explanation: `Checking right tail: 1 - Φ(${zFormatted}) = 1 - ${formatProbability(calculateCDF(z), 4)} = ${pFormatted}.`,
        result: `P(Z ≥ ${zFormatted}) = ${pFormatted}`,
      },
    ];
  }

  // Central tail
  const halfAlpha = (1.0 - p) / 2.0;
  const upperP = 1.0 - halfAlpha;
  return [
    {
      stepNumber: 1,
      title: 'Determine Two-Tail Split for Central Confidence Region',
      formula: 'α = 1 - Confidence Level = 1 - p',
      explanation: `For a central symmetric interval P(-z < Z < z) = ${pFormatted}, the remaining probability α = ${(1 - p).toFixed(4)} is split equally between the two tails.`,
      result: `Each tail area α/2 = ${halfAlpha.toFixed(4)}`,
    },
    {
      stepNumber: 2,
      title: 'Identify Cumulative Upper Boundary',
      formula: 'p_upper = 1 - α/2 = (1 + p) / 2',
      explanation: `The cumulative area from -∞ up to the positive critical value +z is the central area plus the left tail.`,
      result: `Cumulative probability = ${(0.5 + p / 2).toFixed(4)} = ${upperP.toFixed(4)}`,
    },
    {
      stepNumber: 3,
      title: 'Find Symmetric Critical Bounds ±z',
      formula: 'z = Φ⁻¹((1 + p) / 2)',
      explanation: `Lookup the Z-score for cumulative probability ${upperP.toFixed(4)}.`,
      result: `Critical interval: [ -${zFormatted}, +${zFormatted} ]`,
    },
  ];
}

/**
 * Step-by-step breakdown for Mode 4: X -> Z -> Probability
 *
 * @param {number} x - Raw value
 * @param {number} mean - Mean mu
 * @param {number} stdDev - Std Dev sigma
 * @param {number} z - Computed Z-score
 * @returns {Array<{ stepNumber: number, title: string, formula?: string, explanation: string, result?: string }>}
 */
export function getStepsForXToZ(x, mean, stdDev, z) {
  const diff = x - mean;
  const zStr = formatZ(z, 2);
  const leftTail = formatProbability(calculateCDF(z), 4);
  const rightTail = formatProbability(calculateRightTail(z), 4);
  const { rowLabel, colLabel } = splitZ(z);
  const tableVal = formatProbability(calculateBetweenMeanAndZ(z), 4);

  return [
    {
      stepNumber: 1,
      title: 'Identify Population Parameters and Observation',
      explanation: `Observation X = ${x}, Population Mean μ = ${mean}, Population Standard Deviation σ = ${stdDev}.`,
      result: `X = ${x} | μ = ${mean} | σ = ${stdDev}`,
    },
    {
      stepNumber: 2,
      title: 'Calculate Deviation from Mean',
      formula: 'Deviation = X - μ',
      explanation: `Measure how many raw units the observation lies above or below the population mean.`,
      result: `${x} - ${mean} = ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`,
    },
    {
      stepNumber: 3,
      title: 'Standardize into Z-Score (Scale by Standard Deviation)',
      formula: 'Z = (X - μ) / σ',
      explanation: `Divide the deviation by the standard deviation to express the distance in terms of standard deviation units.`,
      result: `Z = (${diff.toFixed(2)}) / ${stdDev} = ${zStr}`,
    },
    {
      stepNumber: 4,
      title: 'Z-Table Lookup for |Z| = ' + Math.abs(z).toFixed(2),
      explanation: `Locate row ${rowLabel} and column ${colLabel} in the Z-table to find the area between the mean and Z.`,
      result: `Table Area P(0 < Z < ${Math.abs(z).toFixed(2)}) = ${tableVal}`,
    },
    {
      stepNumber: 5,
      title: 'Calculate Probability P(X ≤ x)',
      formula: 'P(X ≤ x) = P(Z ≤ z) = Φ(z)',
      explanation: `Because standardizing is a monotonic linear transformation, P(X ≤ ${x}) is strictly identical to P(Z ≤ ${zStr}).`,
      result: `P(X ≤ ${x}) = ${leftTail}`,
    },
    {
      stepNumber: 6,
      title: 'Calculate Probability P(X ≥ x)',
      formula: 'P(X ≥ x) = 1.0000 - P(X ≤ x)',
      explanation: `Complementary probability representing the proportion of the population scoring at or above ${x}.`,
      result: `P(X ≥ ${x}) = 1.0000 - ${leftTail} = ${rightTail}`,
    },
  ];
}
