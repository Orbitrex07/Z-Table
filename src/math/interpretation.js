/**
 * @file interpretation.js
 * @description Generates collegiate-level natural language statistical interpretations
 * for standard normal calculations, converting numbers into meaningful real-world statements.
 */

import { formatProbability, formatZ } from './normalDistribution.js';

/**
 * Natural language interpretation for Mode 1: Z -> Probability
 *
 * @param {number} z - Standardized score
 * @param {number} leftTail - P(Z <= z)
 * @param {number} rightTail - P(Z >= z)
 * @param {number} meanToZ - P(0 < Z < |z|)
 * @returns {string} Explanatory paragraph
 */
export function interpretZToProbability(z, leftTail, rightTail, meanToZ) {
  const pctLeft = (leftTail * 100).toFixed(2);
  const pctRight = (rightTail * 100).toFixed(2);
  const pctMeanToZ = (meanToZ * 100).toFixed(2);
  const zStr = formatZ(z, 2);
  const absZStr = Math.abs(z).toFixed(2);

  if (z === 0) {
    return `A Z-score of 0 represents the exact population mean (μ = 0). Exactly 50.00% of observations fall below the mean, and 50.00% fall above it.`;
  }

  if (z > 0) {
    return `In a standard normal population, approximately ${pctLeft}% of observations have Z-scores less than or equal to ${zStr} (percentile rank: ${pctLeft}th percentile). Conversely, only ${pctRight}% of observations exceed this value in the upper tail. The region bounded between the mean and ${zStr} accounts for ${pctMeanToZ}% of the total distribution.`;
  }

  return `In a standard normal population, approximately ${pctLeft}% of observations have Z-scores less than or equal to ${zStr} (in the lower tail). Conversely, ${pctRight}% of observations are greater than this value. The region bounded between ${zStr} and the mean represents ${pctMeanToZ}% of the population.`;
}

/**
 * Natural language interpretation for Mode 2: Two Z-values
 *
 * @param {number} z1 - Lower boundary
 * @param {number} z2 - Upper boundary
 * @param {number} probability - P(z1 < Z < z2)
 * @returns {string}
 */
export function interpretTwoZ(z1, z2, probability) {
  const lower = Math.min(z1, z2);
  const upper = Math.max(z1, z2);
  const pct = (probability * 100).toFixed(2);

  return `Approximately ${pct}% of all observations in a standard normal population fall within the interval between Z = ${formatZ(lower, 2)} and Z = ${formatZ(upper, 2)}. If you randomly select an individual from this population, there is a ${pct}% chance (probability of ${formatProbability(probability, 4)}) that their standardized score will lie inside this range.`;
}

/**
 * Natural language interpretation for Mode 3: Probability -> Z
 *
 * @param {number} p - Input probability
 * @param {'left' | 'right' | 'central'} tailType
 * @param {number} z - Critical Z
 * @returns {string}
 */
export function interpretProbToZ(p, tailType, z) {
  const pct = (p * 100).toFixed(2);
  const zStr = formatZ(z, 4);

  if (tailType === 'left') {
    return `To separate the lowest ${pct}% of a standard normal population from the remaining ${(100 - p * 100).toFixed(2)}%, the cutoff threshold is Z = ${zStr}. Any observation with a Z-score at or below ${zStr} falls within the lowest ${pct}% of the distribution.`;
  }

  if (tailType === 'right') {
    return `To separate the top ${pct}% of a standard normal population in the upper tail, the cutoff threshold is Z = ${zStr}. Only ${pct}% of observations achieve a Z-score greater than or equal to ${zStr}.`;
  }

  return `To capture the central ${pct}% of the population centered symmetrically about the mean (μ = 0), the critical boundaries are Z = -${Math.abs(z).toFixed(4)} and Z = +${Math.abs(z).toFixed(4)}. Exactly ${pct}% of the distribution lies between these two bounds, with ${(50 - p * 50).toFixed(2)}% in each of the two outer tails.`;
}

/**
 * Natural language interpretation for Mode 4: X -> Z -> Probability
 *
 * @param {number} x - Raw observation
 * @param {number} mean - Mean
 * @param {number} stdDev - Std Dev
 * @param {number} z - Z score
 * @param {number} leftTail - P(X <= x)
 * @returns {string}
 */
export function interpretXToZ(x, mean, stdDev, z, leftTail) {
  const pctLeft = (leftTail * 100).toFixed(2);
  const pctRight = ((1 - leftTail) * 100).toFixed(2);
  const zStr = formatZ(z, 2);
  const signWord = z >= 0 ? 'above' : 'below';

  return `An observation of X = ${x} lies ${Math.abs(z).toFixed(2)} standard deviations ${signWord} the population mean (μ = ${mean}, σ = ${stdDev}), yielding a standardized Z-score of ${zStr}. Approximately ${pctLeft}% of the population has values less than or equal to ${x} (percentile rank: ${pctLeft}th percentile), while ${pctRight}% have values exceeding ${x}.`;
}
