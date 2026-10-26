import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { splitZ, generateZTable, lookupZTable } from '../src/math/zTableEngine.js';
import {
  validateZInput,
  validateTwoZInputs,
  validateProbabilityInput,
  validateXToZInputs,
} from '../src/math/validation.js';
import {
  getStepsForZToProbability,
  getStepsForTwoZ,
  getStepsForProbToZ,
  getStepsForXToZ,
} from '../src/math/stepByStep.js';
import {
  interpretZToProbability,
  interpretTwoZ,
  interpretProbToZ,
  interpretXToZ,
} from '../src/math/interpretation.js';

describe('Z-Table Engine & Matrix Verification', () => {
  test('splitZ correctly separates units/tenths from hundredths', () => {
    const res1 = splitZ(1.25);
    assert.equal(res1.rowLabel, '1.2');
    assert.equal(res1.colLabel, '0.05');
    assert.equal(res1.rowIndex, 12);
    assert.equal(res1.colIndex, 5);

    const res2 = splitZ(0.00);
    assert.equal(res2.rowLabel, '0.0');
    assert.equal(res2.colLabel, '0.00');

    const res3 = splitZ(-1.96);
    assert.equal(res3.rowLabel, '1.9');
    assert.equal(res3.colLabel, '0.06');
  });

  test('generateZTable generates complete 40-row x 10-col matrix', () => {
    const conventional = generateZTable('conventional', 3.9);
    assert.equal(conventional.columns.length, 10);
    assert.equal(conventional.rows.length, 40); // 0.0 to 3.9 inclusive
    assert.equal(conventional.rows[0].label, '0.0');
    assert.equal(conventional.rows[0].values[0], '0.0000'); // P(0 < Z < 0)

    // Cell at row 1.2 (index 12), col 0.05 (index 5) should be 0.3944
    assert.equal(conventional.rows[12].values[5], '0.3944');

    const cumulative = generateZTable('cumulative', 3.9);
    assert.equal(cumulative.rows[0].values[0], '0.5000'); // Phi(0)
    assert.equal(cumulative.rows[12].values[5], '0.8944'); // Phi(1.25)
  });

  test('lookupZTable matches collegiate textbook standards', () => {
    const lookupConv = lookupZTable(1.25, 'conventional');
    assert.equal(lookupConv.rowLabel, '1.2');
    assert.equal(lookupConv.colLabel, '0.05');
    assert.equal(lookupConv.tableValue, '0.3944');
    assert.equal(lookupConv.rawValues.leftTail, '0.8944');
    assert.equal(lookupConv.rawValues.rightTail, '0.1056');

    const lookupCum = lookupZTable(1.25, 'cumulative');
    assert.equal(lookupCum.tableValue, '0.8944');
  });
});

describe('Input Validation Module Verification', () => {
  test('validateZInput accepts valid numbers and flags out-of-range warnings', () => {
    assert.equal(validateZInput(1.25).isValid, true);
    assert.equal(validateZInput('-1.96').value, -1.96);
    assert.equal(validateZInput('').isValid, false);
    assert.equal(validateZInput('abc').isValid, false);

    const extreme = validateZInput(7.5);
    assert.equal(extreme.isValid, true);
    assert.ok(extreme.warning.includes('extreme outlier'));
  });

  test('validateTwoZInputs verifies boundaries and ordering', () => {
    const valid = validateTwoZInputs(-1.20, 1.50);
    assert.equal(valid.isValid, true);
    assert.equal(valid.z1, -1.20);
    assert.equal(valid.z2, 1.50);

    const reversed = validateTwoZInputs(1.50, -1.20);
    assert.equal(reversed.isValid, true);
    assert.ok(reversed.warning.includes('automatically evaluate'));

    const equal = validateTwoZInputs(1.5, 1.5);
    assert.equal(equal.isValid, true);
    assert.ok(equal.warning.includes('mathematically 0'));
  });

  test('validateProbabilityInput ensures 0 < p < 1 strictly', () => {
    assert.equal(validateProbabilityInput(0.95).isValid, true);
    assert.equal(validateProbabilityInput(0).isValid, false);
    assert.equal(validateProbabilityInput(1).isValid, false);
    assert.equal(validateProbabilityInput(-0.2).isValid, false);
    assert.equal(validateProbabilityInput(1.5).isValid, false);
    assert.equal(validateProbabilityInput('text').isValid, false);
  });

  test('validateXToZInputs enforces sigma > 0', () => {
    const valid = validateXToZInputs(85, 70, 10);
    assert.equal(valid.isValid, true);
    assert.equal(valid.x, 85);
    assert.equal(valid.mean, 70);
    assert.equal(valid.stdDev, 10);

    assert.equal(validateXToZInputs(85, 70, 0).isValid, false);
    assert.equal(validateXToZInputs(85, 70, -5).isValid, false);
  });
});

describe('Pedagogical Step-by-Step Generator Verification', () => {
  test('Generates detailed steps for Mode 1 (Positive and Negative Z)', () => {
    const stepsPos = getStepsForZToProbability(1.25);
    assert.ok(stepsPos.length >= 4);
    assert.ok(stepsPos[0].result.includes('Row: 1.2'));
    assert.ok(stepsPos[1].result.includes('0.3944'));
    assert.ok(stepsPos[2].result.includes('0.8944'));

    const stepsNeg = getStepsForZToProbability(-1.25);
    assert.ok(stepsNeg.length >= 5);
    assert.ok(stepsNeg.some((s) => s.title.includes('Symmetry')));
  });

  test('Generates steps for Mode 2 (Two Z-values)', () => {
    const steps = getStepsForTwoZ(-1.20, 1.50);
    assert.equal(steps.length, 4);
    assert.ok(steps[3].result.includes('0.8181'));
  });

  test('Generates steps for Mode 3 (Inverse Normal)', () => {
    const stepsLeft = getStepsForProbToZ(0.95, 'left', 1.6449);
    assert.ok(stepsLeft.length >= 3);
    assert.ok(stepsLeft[2].result.includes('1.6449'));

    const stepsCentral = getStepsForProbToZ(0.95, 'central', 1.9600);
    assert.ok(stepsCentral.length >= 3);
    assert.ok(stepsCentral[2].result.includes('1.9600'));
  });

  test('Generates steps for Mode 4 (X -> Z -> Probability)', () => {
    const steps = getStepsForXToZ(85, 70, 10, 1.5);
    assert.equal(steps.length, 6);
    assert.ok(steps[2].result.includes('Z = (15.00) / 10 = 1.50'));
    assert.ok(steps[4].result.includes('0.9332'));
  });
});

describe('Natural Language Statistical Interpretation Generator', () => {
  test('Creates clear academic explanations for all calculators', () => {
    const interp1 = interpretZToProbability(1.25, 0.8944, 0.1056, 0.3944);
    assert.ok(interp1.includes('89.44% of observations'));

    const interp2 = interpretTwoZ(-1.20, 1.50, 0.8181);
    assert.ok(interp2.includes('81.81%'));

    const interp3 = interpretProbToZ(0.95, 'left', 1.6449);
    assert.ok(interp3.includes('Z = 1.6449'));

    const interp4 = interpretXToZ(85, 70, 10, 1.5, 0.9332);
    assert.ok(interp4.includes('1.50 standard deviations above the population mean'));
  });
});
