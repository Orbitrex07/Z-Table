/**
 * @file mode1ZToProb.js
 * @description Controller for Mode 1: Arbitrary Z-Score -> Cumulative and Tail Probabilities
 */

import { validateZInput } from '../math/validation.js';
import {
  calculateCDF,
  calculateRightTail,
  calculateBetweenMeanAndZ,
  calculateTwoTail,
  formatProbability,
  formatZ,
} from '../math/normalDistribution.js';
import { getStepsForZToProbability } from '../math/stepByStep.js';
import { interpretZToProbability } from '../math/interpretation.js';

export function setupMode1(container, curveCanvas) {
  const zInput = container.querySelector('#mode1-z-input');
  const regionSelect = container.querySelector('#mode1-region-select');
  const errorBox = container.querySelector('#mode1-error');
  const warningBox = container.querySelector('#mode1-warning');
  const resultsCard = container.querySelector('#mode1-results');
  const stepsContainer = container.querySelector('#mode1-steps-list');
  const interpretationBox = container.querySelector('#mode1-interpretation');

  // Value display spans
  const valPhi = container.querySelector('#mode1-val-phi');
  const valLeft = container.querySelector('#mode1-val-left');
  const valRight = container.querySelector('#mode1-val-right');
  const valMeanToZ = container.querySelector('#mode1-val-meantoz');
  const valTwoTail = container.querySelector('#mode1-val-twotail');

  function calculateAndRender() {
    const rawZ = zInput.value;
    const validation = validateZInput(rawZ);

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

    const z = validation.value;
    const cdf = calculateCDF(z);
    const leftTail = cdf;
    const rightTail = calculateRightTail(z);
    const meanToZ = calculateBetweenMeanAndZ(z);
    const twoTail = calculateTwoTail(z);

    // Update Result Display
    valPhi.textContent = formatProbability(cdf, 4);
    valLeft.textContent = formatProbability(leftTail, 4);
    valRight.textContent = formatProbability(rightTail, 4);
    valMeanToZ.textContent = formatProbability(meanToZ, 4);
    valTwoTail.textContent = formatProbability(twoTail, 4);

    // Update Natural Language Interpretation
    interpretationBox.textContent = interpretZToProbability(z, leftTail, rightTail, meanToZ);

    // Update Step-by-Step Explanation
    const steps = getStepsForZToProbability(z);
    renderSteps(steps, stepsContainer);

    // Update Canvas Curve
    const selectedRegion = regionSelect.value; // 'left' | 'right' | 'between-mean' | 'two-tail'
    curveCanvas.updatePlot({
      mode: 'z-to-prob',
      shadeType: selectedRegion,
      z1: z,
    });
  }

  // Event Listeners
  zInput.addEventListener('input', calculateAndRender);
  regionSelect.addEventListener('change', calculateAndRender);

  // Expose setter for external quick presets
  return {
    setZ(value) {
      zInput.value = value;
      calculateAndRender();
    },
    setRegion(region) {
      regionSelect.value = region;
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
