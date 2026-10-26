/**
 * @file mode2TwoZ.js
 * @description Controller for Mode 2: Probability Between Two Z-Values P(z1 < Z < z2)
 */

import { validateTwoZInputs } from '../math/validation.js';
import { calculateCDF, calculateBetween, formatProbability, formatZ } from '../math/normalDistribution.js';
import { getStepsForTwoZ } from '../math/stepByStep.js';
import { interpretTwoZ } from '../math/interpretation.js';

export function setupMode2(container, curveCanvas) {
  const z1Input = container.querySelector('#mode2-z1-input');
  const z2Input = container.querySelector('#mode2-z2-input');
  const errorBox = container.querySelector('#mode2-error');
  const warningBox = container.querySelector('#mode2-warning');
  const resultsCard = container.querySelector('#mode2-results');
  const stepsContainer = container.querySelector('#mode2-steps-list');
  const interpretationBox = container.querySelector('#mode2-interpretation');

  const valInterval = container.querySelector('#mode2-val-interval');
  const valPhi1 = container.querySelector('#mode2-val-phi1');
  const valPhi2 = container.querySelector('#mode2-val-phi2');
  const valBetween = container.querySelector('#mode2-val-between');
  const valOutside = container.querySelector('#mode2-val-outside');

  function calculateAndRender() {
    const rawZ1 = z1Input.value;
    const rawZ2 = z2Input.value;
    const validation = validateTwoZInputs(rawZ1, rawZ2);

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

    const lower = Math.min(validation.z1, validation.z2);
    const upper = Math.max(validation.z1, validation.z2);

    const phi1 = calculateCDF(lower);
    const phi2 = calculateCDF(upper);
    const pBetween = phi2 - phi1;
    const pOutside = 1.0 - pBetween;

    valInterval.textContent = `[${formatZ(lower, 2)}, ${formatZ(upper, 2)}]`;
    valPhi1.textContent = formatProbability(phi1, 4);
    valPhi2.textContent = formatProbability(phi2, 4);
    valBetween.textContent = formatProbability(pBetween, 4);
    valOutside.textContent = formatProbability(pOutside, 4);

    interpretationBox.textContent = interpretTwoZ(lower, upper, pBetween);

    const steps = getStepsForTwoZ(lower, upper);
    renderSteps(steps, stepsContainer);

    curveCanvas.updatePlot({
      mode: 'two-z',
      shadeType: 'between-two',
      z1: lower,
      z2: upper,
    });
  }

  z1Input.addEventListener('input', calculateAndRender);
  z2Input.addEventListener('input', calculateAndRender);

  return {
    setValues(z1, z2) {
      z1Input.value = z1;
      z2Input.value = z2;
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
