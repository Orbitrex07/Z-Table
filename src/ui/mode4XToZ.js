/**
 * @file mode4XToZ.js
 * @description Controller for Mode 4: Raw Score Standardization X -> Z -> Probabilities
 */

import { validateXToZInputs } from '../math/validation.js';
import { calculateZScore, calculateCDF, calculateRightTail, calculateBetweenMeanAndZ, formatProbability, formatZ } from '../math/normalDistribution.js';
import { getStepsForXToZ } from '../math/stepByStep.js';
import { interpretXToZ } from '../math/interpretation.js';

export function setupMode4(container, curveCanvas) {
  const xInput = container.querySelector('#mode4-x-input');
  const meanInput = container.querySelector('#mode4-mean-input');
  const stdDevInput = container.querySelector('#mode4-std-input');
  const errorBox = container.querySelector('#mode4-error');
  const warningBox = container.querySelector('#mode4-warning');
  const resultsCard = container.querySelector('#mode4-results');
  const stepsContainer = container.querySelector('#mode4-steps-list');
  const interpretationBox = container.querySelector('#mode4-interpretation');

  const valZScore = container.querySelector('#mode4-val-z');
  const valLeftProb = container.querySelector('#mode4-val-left');
  const valRightProb = container.querySelector('#mode4-val-right');
  const valMeanToZ = container.querySelector('#mode4-val-meantoz');

  function calculateAndRender() {
    const rawX = xInput.value;
    const rawMean = meanInput.value;
    const rawStdDev = stdDevInput.value;

    const validation = validateXToZInputs(rawX, rawMean, rawStdDev);

    if (!validation.isValid) {
      errorBox.textContent = validation.error;
      errorBox.classList.remove('hidden');
      warningBox.classList.add('hidden');
      resultsCard.classList.add('opacity-50');
      return;
    }

    errorBox.classList.add('hidden');
    if (validation.warning) {
      warningBox.textContent = validation.warning;
      warningBox.classList.remove('hidden');
    } else {
      warningBox.classList.add('hidden');
    }
    resultsCard.classList.remove('opacity-50');

    const { x, mean, stdDev } = validation;
    const z = calculateZScore(x, mean, stdDev);
    const leftTail = calculateCDF(z);
    const rightTail = calculateRightTail(z);
    const meanToZ = calculateBetweenMeanAndZ(z);

    valZScore.textContent = formatZ(z, 2);
    valLeftProb.textContent = formatProbability(leftTail, 4);
    valRightProb.textContent = formatProbability(rightTail, 4);
    valMeanToZ.textContent = formatProbability(meanToZ, 4);

    interpretationBox.textContent = interpretXToZ(x, mean, stdDev, z, leftTail);

    const steps = getStepsForXToZ(x, mean, stdDev, z);
    renderSteps(steps, stepsContainer);

    // Update curve with Dual Axis (X and Z)
    curveCanvas.updatePlot({
      mode: 'x-to-z',
      shadeType: 'left',
      z1: z,
      rawXParams: { mean, stdDev },
    });
  }

  xInput.addEventListener('input', calculateAndRender);
  meanInput.addEventListener('input', calculateAndRender);
  stdDevInput.addEventListener('input', calculateAndRender);

  return {
    setValues(x, mean, stdDev) {
      xInput.value = x;
      meanInput.value = mean;
      stdDevInput.value = stdDev;
      calculateAndRender();
    },
    refresh() {
      calculateAndRender();
    },
  };
}

function renderSteps(steps, container) {
  container.innerHTML = '';
  steps.forEach((step) => {
    const li = document.createElement('li');
    li.className = 'step-item';
    li.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Step ${step.stepNumber}</span>
        <strong class="step-title">${step.title}</strong>
      </div>
      ${step.formula ? `<div class="step-formula"><code>${step.formula}</code></div>` : ''}
      <p class="step-desc">${step.explanation}</p>
      ${step.result ? `<div class="step-result"><strong>Result:</strong> <span>${step.result}</span></div>` : ''}
    `;
    container.appendChild(li);
  });
}
