/**
 * @file mode3ProbToZ.js
 * @description Controller for Mode 3: Probability -> Z-Score (Inverse Standard Normal Quantile)
 */

import { validateProbabilityInput } from '../math/validation.js';
import { calculateInverseCDF, calculateCDF, formatProbability, formatZ } from '../math/normalDistribution.js';
import { getStepsForProbToZ } from '../math/stepByStep.js';
import { interpretProbToZ } from '../math/interpretation.js';

export function setupMode3(container, curveCanvas) {
  const probInput = container.querySelector('#mode3-prob-input');
  const tailTypeSelect = container.querySelector('#mode3-tail-select');
  const errorBox = container.querySelector('#mode3-error');
  const warningBox = container.querySelector('#mode3-warning');
  const resultsCard = container.querySelector('#mode3-results');
  const stepsContainer = container.querySelector('#mode3-steps-list');
  const interpretationBox = container.querySelector('#mode3-interpretation');

  const valZ = container.querySelector('#mode3-val-z');
  const valTargetProb = container.querySelector('#mode3-val-target');
  const valActualCDF = container.querySelector('#mode3-val-actual');
  const valTailLabel = container.querySelector('#mode3-val-tail-label');

  // Quick probability presets (0.90, 0.95, 0.975, 0.99)
  const presetButtons = container.querySelectorAll('.preset-prob-btn');
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      probInput.value = btn.dataset.value;
      calculateAndRender();
    });
  });

  function calculateAndRender() {
    const rawP = probInput.value;
    const validation = validateProbabilityInput(rawP);

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

    const p = validation.value;
    const tailType = tailTypeSelect.value; // 'left' | 'right' | 'central'

    let effectiveCumP = p;
    let computedZ = 0;

    if (tailType === 'left') {
      effectiveCumP = p;
      computedZ = calculateInverseCDF(effectiveCumP);
      valTailLabel.textContent = 'Left Tail P(Z ≤ z)';
    } else if (tailType === 'right') {
      effectiveCumP = 1.0 - p;
      computedZ = calculateInverseCDF(effectiveCumP);
      valTailLabel.textContent = 'Right Tail P(Z ≥ z)';
    } else if (tailType === 'central') {
      // Central area: p = 2*Phi(z) - 1 => Phi(z) = (1 + p) / 2
      effectiveCumP = (1.0 + p) / 2.0;
      computedZ = Math.abs(calculateInverseCDF(effectiveCumP));
      valTailLabel.textContent = 'Central Area P(-z ≤ Z ≤ z)';
    }

    valZ.textContent = tailType === 'central' ? `±${formatZ(computedZ, 4)}` : formatZ(computedZ, 4);
    valTargetProb.textContent = p.toFixed(4);
    valActualCDF.textContent = formatProbability(calculateCDF(computedZ), 4);

    interpretationBox.textContent = interpretProbToZ(p, tailType, computedZ);

    const steps = getStepsForProbToZ(p, tailType, computedZ);
    renderSteps(steps, stepsContainer);

    curveCanvas.updatePlot({
      mode: 'prob-to-z',
      shadeType: tailType === 'central' ? 'central' : tailType,
      z1: computedZ,
    });
  }

  probInput.addEventListener('input', calculateAndRender);
  tailTypeSelect.addEventListener('change', calculateAndRender);

  return {
    setValue(p, tailType = 'left') {
      probInput.value = p;
      tailTypeSelect.value = tailType;
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
