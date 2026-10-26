import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePDF,
  calculateCDF,
  calculateLeftTail,
  calculateRightTail,
  calculateBetweenMeanAndZ,
  calculateBetween,
  calculateTwoTail,
  calculateCentralArea,
  calculateInverseCDF,
  calculateZScore,
  formatProbability,
  formatZ,
} from '../src/math/normalDistribution.js';

describe('Standard Normal Distribution - Mathematical Engine Verification', () => {
  test('PDF evaluations match standard analytical values', () => {
    // f(0) = 1 / sqrt(2*pi) ~= 0.398942
    assert.ok(Math.abs(calculatePDF(0) - 0.398942) < 1e-5);
    // f(1) = f(-1) ~= 0.241971
    assert.ok(Math.abs(calculatePDF(1) - 0.241971) < 1e-5);
    assert.ok(Math.abs(calculatePDF(-1) - 0.241971) < 1e-5);
    // f(2) ~= 0.053991
    assert.ok(Math.abs(calculatePDF(2) - 0.053991) < 1e-5);
    // Symmetry check
    assert.equal(calculatePDF(1.5), calculatePDF(-1.5));
  });

  test('CDF evaluations match standard statistical benchmark table', () => {
    // Z = 0 -> Phi(0) = 0.5000
    assert.ok(Math.abs(calculateCDF(0) - 0.5000) < 1e-4);

    // Z = 1.0 -> Phi(1.0) ~= 0.8413
    assert.ok(Math.abs(calculateCDF(1.0) - 0.84134) < 1e-4);

    // Z = -1.0 -> Phi(-1.0) ~= 0.1587
    assert.ok(Math.abs(calculateCDF(-1.0) - 0.15866) < 1e-4);

    // Z = 1.25 -> Phi(1.25) ~= 0.8944
    assert.ok(Math.abs(calculateCDF(1.25) - 0.89435) < 1e-4);

    // Z = 1.645 -> Phi(1.645) ~= 0.9500
    assert.ok(Math.abs(calculateCDF(1.645) - 0.9500) < 2e-4);

    // Z = -1.645 -> Phi(-1.645) ~= 0.0500
    assert.ok(Math.abs(calculateCDF(-1.645) - 0.0500) < 2e-4);

    // Z = 1.96 -> Phi(1.96) ~= 0.9750
    assert.ok(Math.abs(calculateCDF(1.96) - 0.97500) < 1e-4);

    // Z = -1.96 -> Phi(-1.96) ~= 0.0250
    assert.ok(Math.abs(calculateCDF(-1.96) - 0.02500) < 1e-4);

    // Z = 2.0 -> Phi(2.0) ~= 0.9772
    assert.ok(Math.abs(calculateCDF(2.0) - 0.97725) < 1e-4);

    // Z = -2.0 -> Phi(-2.0) ~= 0.0228
    assert.ok(Math.abs(calculateCDF(-2.0) - 0.02275) < 1e-4);

    // Z = 2.33 -> Phi(2.33) ~= 0.9901
    assert.ok(Math.abs(calculateCDF(2.33) - 0.99010) < 1e-4);

    // Z = 2.58 -> Phi(2.58) ~= 0.9951
    assert.ok(Math.abs(calculateCDF(2.58) - 0.99506) < 1e-4);

    // Z = 3.0 -> Phi(3.0) ~= 0.9987
    assert.ok(Math.abs(calculateCDF(3.0) - 0.99865) < 1e-4);
  });

  test('Symmetry property: Phi(-z) + Phi(z) = 1', () => {
    const testValues = [0.1, 0.5, 0.84, 1.25, 1.96, 2.33, 3.0, 3.49];
    for (const z of testValues) {
      const sum = calculateCDF(-z) + calculateCDF(z);
      assert.ok(Math.abs(sum - 1.0) < 1e-7, `Failed symmetry at z=${z}, sum=${sum}`);
    }
  });

  test('Conventional Z-table value: Area between mean (0) and Z', () => {
    // For Z = 1.25, area from 0 to 1.25 is 0.3944
    assert.equal(formatProbability(calculateBetweenMeanAndZ(1.25)), '0.3944');

    // For Z = -1.25, area from -1.25 to 0 is also 0.3944
    assert.equal(formatProbability(calculateBetweenMeanAndZ(-1.25)), '0.3944');

    // For Z = 1.96, area from 0 to 1.96 is 0.4750
    assert.equal(formatProbability(calculateBetweenMeanAndZ(1.96)), '0.4750');
  });

  test('Two Z-values probability calculation P(z1 < Z < z2)', () => {
    // Mode 2 example: z1 = -1.20, z2 = 1.50
    // Phi(1.50) ~= 0.9332, Phi(-1.20) ~= 0.1151
    // Diff ~= 0.8181
    const p = calculateBetween(-1.20, 1.50);
    assert.equal(formatProbability(p), '0.8181');

    // Automatic ordering if passed reversed
    const pReversed = calculateBetween(1.50, -1.20);
    assert.equal(formatProbability(p), formatProbability(pReversed));
  });

  test('Two-tailed and central probability tests', () => {
    // Two-tailed outside +/- 1.96 is 0.0500
    const twoTail = calculateTwoTail(1.96);
    assert.equal(formatProbability(twoTail), '0.0500');

    // Central confidence area for +/- 1.96 is 0.9500
    const central = calculateCentralArea(1.96);
    assert.equal(formatProbability(central), '0.9500');

    // Central area for +/- 1.0 is ~ 68.27% (Empirical Rule)
    const empirical1 = calculateCentralArea(1.0);
    assert.equal(formatProbability(empirical1), '0.6827');

    // Central area for +/- 2.0 is ~ 95.45% (Empirical Rule)
    const empirical2 = calculateCentralArea(2.0);
    assert.equal(formatProbability(empirical2), '0.9545');

    // Central area for +/- 3.0 is ~ 99.73% (Empirical Rule)
    const empirical3 = calculateCentralArea(3.0);
    assert.equal(formatProbability(empirical3), '0.9973');
  });

  test('Inverse CDF (Quantile) reproduces textbook critical values', () => {
    // p = 0.50 -> Z = 0
    assert.equal(formatZ(calculateInverseCDF(0.50), 4), '0.0000');

    // p = 0.90 -> Z ~= 1.2816
    assert.equal(formatZ(calculateInverseCDF(0.90), 4), '1.2816');

    // p = 0.95 -> Z ~= 1.6449
    assert.equal(formatZ(calculateInverseCDF(0.95), 4), '1.6449');

    // p = 0.975 -> Z ~= 1.9600
    assert.equal(formatZ(calculateInverseCDF(0.975), 4), '1.9600');

    // p = 0.99 -> Z ~= 2.3263
    assert.equal(formatZ(calculateInverseCDF(0.99), 4), '2.3263');

    // p = 0.995 -> Z ~= 2.5758
    assert.equal(formatZ(calculateInverseCDF(0.995), 4), '2.5758');

    // p = 0.05 -> Z ~= -1.6449
    assert.equal(formatZ(calculateInverseCDF(0.05), 4), '-1.6449');

    // p = 0.025 -> Z ~= -1.9600
    assert.equal(formatZ(calculateInverseCDF(0.025), 4), '-1.9600');
  });

  test('Roundtrip consistency: calculateInverseCDF(calculateCDF(z)) == z', () => {
    const testZs = [-3.0, -2.5, -1.96, -1.0, -0.5, 0.0, 0.5, 1.0, 1.96, 2.5, 3.0];
    for (const z of testZs) {
      const cdf = calculateCDF(z);
      const recoveredZ = calculateInverseCDF(cdf);
      assert.ok(Math.abs(recoveredZ - z) < 1e-4, `Failed roundtrip at z=${z}, recovered=${recoveredZ}`);
    }
  });

  test('Z-Score standardization formula: Z = (X - mu) / sigma', () => {
    // X = 85, mu = 70, sigma = 10 -> Z = 1.5
    const z = calculateZScore(85, 70, 10);
    assert.equal(z, 1.5);
    assert.equal(formatProbability(calculateLeftTail(z)), '0.9332');
    assert.equal(formatProbability(calculateRightTail(z)), '0.0668');
  });

  test('Input validation and edge case rejection', () => {
    // Probability boundaries
    assert.throws(() => calculateInverseCDF(0), RangeError);
    assert.throws(() => calculateInverseCDF(1), RangeError);
    assert.throws(() => calculateInverseCDF(-0.1), RangeError);
    assert.throws(() => calculateInverseCDF(1.05), RangeError);

    // Non-numbers
    assert.throws(() => calculateCDF('abc'), TypeError);
    assert.throws(() => calculatePDF(null), TypeError);

    // Standard deviation <= 0
    assert.throws(() => calculateZScore(50, 50, 0), RangeError);
    assert.throws(() => calculateZScore(50, 50, -5), RangeError);
  });
});
