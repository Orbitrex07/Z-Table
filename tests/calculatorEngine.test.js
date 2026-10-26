import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNumber,
  tokenize,
  evaluateTokens,
  evaluateExpression,
  previewExpression
} from '../src/math/calculatorEngine.js';

test('Calculator Engine - Basic Arithmetic', () => {
  assert.equal(evaluateExpression('2 + 3'), 5);
  assert.equal(evaluateExpression('10 - 4'), 6);
  assert.equal(evaluateExpression('7 * 8'), 56);
  assert.equal(evaluateExpression('20 / 4'), 5);
  assert.equal(evaluateExpression('7 × 8'), 56); // unicode symbol
  assert.equal(evaluateExpression('20 ÷ 4'), 5); // unicode symbol
});

test('Calculator Engine - Order of Operations (PEMDAS)', () => {
  assert.equal(evaluateExpression('2 + 3 * 4'), 14);
  assert.equal(evaluateExpression('(2 + 3) * 4'), 20);
  assert.equal(evaluateExpression('10 - 2 * 3 + 4 / 2'), 6); // 10 - 6 + 2 = 6
  assert.equal(evaluateExpression('2 ^ 3 * 2'), 16); // 8 * 2 = 16
  assert.equal(evaluateExpression('2 * 3 ^ 2'), 18); // 2 * 9 = 18
});

test('Calculator Engine - Floating Point Decimals & Precision Formatting', () => {
  const result = evaluateExpression('0.1 + 0.2');
  assert.equal(formatNumber(result), '0.3');
  assert.equal(formatNumber(evaluateExpression('1 / 3'), 4), '0.3333');
  assert.equal(evaluateExpression('2.5 * 4'), 10);
});

test('Calculator Engine - Unary Minus & Negative Numbers', () => {
  assert.equal(evaluateExpression('-5 + 3'), -2);
  assert.equal(evaluateExpression('10 * -2'), -20);
  assert.equal(evaluateExpression('(-4) * (-5)'), 20);
  assert.equal(evaluateExpression('5 - -3'), 8);
});

test('Calculator Engine - Powers and Roots', () => {
  assert.equal(evaluateExpression('3 ^ 4'), 81);
  assert.equal(evaluateExpression('sqrt(25)'), 5);
  assert.equal(evaluateExpression('√36'), 6);
  assert.equal(evaluateExpression('√(16 + 9)'), 5);
});

test('Calculator Engine - Percentage & Implicit Multiplication', () => {
  assert.equal(evaluateExpression('50%'), 0.5);
  assert.equal(evaluateExpression('200 * 15%'), 30);
  assert.equal(evaluateExpression('5(4 + 2)'), 30); // implicit multiplication
});

test('Calculator Engine - Mathematical Constants', () => {
  assert.ok(Math.abs(evaluateExpression('pi') - Math.PI) < 1e-10);
  assert.ok(Math.abs(evaluateExpression('2 * pi') - (2 * Math.PI)) < 1e-10);
  assert.ok(Math.abs(evaluateExpression('e') - Math.E) < 1e-10);
});

test('Calculator Engine - Error Handling', () => {
  assert.throws(() => evaluateExpression('10 / 0'), /Cannot divide by zero/);
  assert.throws(() => evaluateExpression('sqrt(-9)'), /Cannot calculate square root of a negative number/);
  assert.throws(() => evaluateExpression('(2 + 3'), /Mismatched parentheses/);
  assert.throws(() => evaluateExpression('2 + * 3'), /Invalid/);
});

test('Calculator Engine - Safe Live Preview', () => {
  assert.equal(previewExpression('12 + 8'), 20);
  assert.equal(previewExpression('12 +'), 12); // ignores trailing operator
  assert.equal(previewExpression('5 * (4 + 2'), 30); // auto-closes bracket for preview
  assert.equal(previewExpression(''), null);
  assert.equal(previewExpression('10 / 0'), null);
});
