/**
 * @file zTableEngine.js
 * @description Engine for generating, indexing, and querying the standard statistical Z-Table.
 * Supports both Conventional (Mean to Z) and Cumulative (Left tail Phi(Z)) tables.
 */

import { calculateCDF, calculateBetweenMeanAndZ, calculateRightTail, formatProbability } from './normalDistribution.js';

/**
 * Splits a decimal Z-score into row and column components.
 * e.g., 1.25 -> row "1.2", column "0.05"
 * e.g., -0.84 -> row "0.8", column "0.04" (sign handled separately)
 *
 * @param {number} z - Standardized score
 * @returns {{ rowLabel: string, colLabel: string, rowIndex: number, colIndex: number, zRounded: number }}
 */
export function splitZ(z) {
  const absZ = Math.abs(z);
  // Round to 2 decimal places to match standard printed Z-table precision
  const rounded = Math.round(absZ * 100) / 100;
  
  // Row is first decimal digit: e.g. 1.2
  const rowVal = Math.floor(rounded * 10) / 10;
  // Column is second decimal digit: e.g. 0.05
  const colVal = Math.round((rounded - rowVal) * 100) / 100;

  const rowLabel = rowVal.toFixed(1);
  const colLabel = colVal.toFixed(2);
  const rowIndex = Math.round(rowVal * 10);
  const colIndex = Math.round(colVal * 100);

  return {
    rowLabel,
    colLabel,
    rowIndex,
    colIndex,
    zRounded: rounded,
  };
}

/**
 * Generates full Z-Table matrix.
 * 
 * @param {'conventional' | 'cumulative'} [tableType='conventional']
 * - 'conventional': Area between mean (0) and Z, i.e., P(0 < Z < z). Values 0.0000 to 0.4999.
 * - 'cumulative': Area to the left of Z, i.e., Phi(z). Values 0.5000 to 0.9999 for z >= 0.
 * @param {number} [maxRow=3.9] - Maximum row value (standard 3.9)
 * @returns {{ rows: Array<{ label: string, values: string[] }>, columns: string[], tableType: string }}
 */
export function generateZTable(tableType = 'conventional', maxRow = 3.9) {
  const columns = ['0.00', '0.01', '0.02', '0.03', '0.04', '0.05', '0.06', '0.07', '0.08', '0.09'];
  const rows = [];

  const rowCount = Math.round(maxRow * 10) + 1;

  for (let i = 0; i < rowCount; i++) {
    const rowVal = i / 10;
    const rowLabel = rowVal.toFixed(1);
    const rowValues = [];

    for (let j = 0; j < 10; j++) {
      const colVal = j / 100;
      const z = rowVal + colVal;
      let prob;

      if (tableType === 'conventional') {
        prob = calculateBetweenMeanAndZ(z);
      } else {
        prob = calculateCDF(z);
      }

      rowValues.push(formatProbability(prob, 4));
    }

    rows.push({
      label: rowLabel,
      values: rowValues,
    });
  }

  return {
    tableType,
    columns,
    rows,
  };
}

/**
 * Looks up exact Z-table coordinates, intersection cell value, and full statistical context.
 *
 * @param {number} z - Standardized score
 * @param {'conventional' | 'cumulative'} [tableType='conventional']
 * @returns {object} Lookup metadata and probabilities
 */
export function lookupZTable(z, tableType = 'conventional') {
  if (typeof z !== 'number' || Number.isNaN(z)) {
    throw new TypeError('lookupZTable: input z must be a valid number');
  }

  const { rowLabel, colLabel, rowIndex, colIndex, zRounded } = splitZ(z);
  const isPositive = z >= 0;
  const absZ = Math.abs(z);

  // Exact continuous values
  const cdf = calculateCDF(z);
  const leftTail = cdf;
  const rightTail = calculateRightTail(z);
  const areaFromMean = calculateBetweenMeanAndZ(z);

  // Table cell values corresponding to 2-decimal rounded Z
  const tableMeanToZ = calculateBetweenMeanAndZ(zRounded);
  const tableCumulative = calculateCDF(zRounded);

  const displayedTableVal = tableType === 'conventional' 
    ? formatProbability(tableMeanToZ, 4) 
    : formatProbability(tableCumulative, 4);

  return {
    inputZ: z,
    zRounded,
    isPositive,
    tableType,
    rowLabel,
    colLabel,
    rowIndex,
    colIndex,
    tableValue: displayedTableVal,
    rawValues: {
      leftTail: formatProbability(leftTail, 4),
      rightTail: formatProbability(rightTail, 4),
      areaFromMean: formatProbability(areaFromMean, 4),
      continuousCDF: cdf,
    },
    isOutOfBounds: absZ > 3.99,
    description: tableType === 'conventional'
      ? `Area between Mean (Z = 0) and Z = ${zRounded.toFixed(2)} is ${displayedTableVal}`
      : `Cumulative Left-Tail Area P(Z ≤ ${zRounded.toFixed(2)}) is ${displayedTableVal}`,
  };
}
