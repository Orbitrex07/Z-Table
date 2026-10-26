/**
 * @file main.js
 * @description Main application orchestrator for the Interactive Statistical Analysis Tool
 * for Standard Normal Distribution (Z-Table Studio).
 */

import { NormalCurveCanvas } from './visualization/normalCurveCanvas.js';
import { setupModeManager } from './ui/modeManager.js';
import { setupMode1 } from './ui/mode1ZToProb.js';
import { setupMode2 } from './ui/mode2TwoZ.js';
import { setupMode3 } from './ui/mode3ProbToZ.js';
import { setupMode4 } from './ui/mode4XToZ.js';
import { setupMode5 } from './ui/mode5ZTable.js';
import { setupQuickAccess } from './ui/quickAccess.js';
import { setupExamples } from './ui/examples.js';

document.addEventListener('DOMContentLoaded', () => {
  // Theme management (dark / light)
  const savedTheme = localStorage.getItem('ztable_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  function updateThemeUI(theme) {
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('.theme-icon');
      const text = themeToggleBtn.querySelector('.theme-text');
      if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
      if (text) text.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }
  }
  updateThemeUI(savedTheme);

  // Initialize Interactive Normal Curve Canvas
  const canvasEl = document.getElementById('normal-curve-canvas');
  const curveCanvas = new NormalCurveCanvas(canvasEl, { theme: savedTheme });

  // Initialize Mode Controllers
  const panelMode1 = document.getElementById('panel-mode-1');
  const panelMode2 = document.getElementById('panel-mode-2');
  const panelMode3 = document.getElementById('panel-mode-3');
  const panelMode4 = document.getElementById('panel-mode-4');
  const panelMode5 = document.getElementById('panel-mode-5');

  const mode1 = setupMode1(panelMode1, curveCanvas);
  const mode2 = setupMode2(panelMode2, curveCanvas);
  const mode3 = setupMode3(panelMode3, curveCanvas);
  const mode4 = setupMode4(panelMode4, curveCanvas);
  const mode5 = setupMode5(panelMode5, curveCanvas);

  const tabsContainer = document.getElementById('mode-tabs-container');
  const panelsContainer = document.getElementById('mode-panels-container');

  const modeManager = setupModeManager(tabsContainer, panelsContainer, (activeModeId) => {
    if (activeModeId === 'mode-1') mode1.refresh();
    else if (activeModeId === 'mode-2') mode2.refresh();
    else if (activeModeId === 'mode-3') mode3.refresh();
    else if (activeModeId === 'mode-4') mode4.refresh();
    else if (activeModeId === 'mode-5') mode5.refresh();
  });

  const appControllers = {
    switchMode: (modeId) => modeManager.switchMode(modeId),
    mode1,
    mode2,
    mode3,
    mode4,
    mode5,
    curveCanvas,
  };

  // Initialize Quick Presets Chips
  const quickPresetsContainer = document.getElementById('quick-presets-container');
  if (quickPresetsContainer) {
    setupQuickAccess(quickPresetsContainer, (z) => {
      const current = modeManager.getCurrentMode();
      if (current === 'mode-5') {
        mode5.setZ(z);
      } else {
        if (current !== 'mode-1') {
          modeManager.switchMode('mode-1');
        }
        mode1.setZ(z);
      }
    });
  }

  // Initialize Empirical Rule Buttons (±1σ, ±2σ, ±3σ)
  const empiricalBtns = document.querySelectorAll('.empirical-btn');
  empiricalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sigma = Number(btn.dataset.sigma);
      modeManager.switchMode('mode-2');
      mode2.setValues(-sigma, sigma);
      const calcArea = document.getElementById('calculator-section');
      if (calcArea) {
        calcArea.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Initialize College Examples
  const examplesContainer = document.getElementById('college-examples-container');
  if (examplesContainer) {
    setupExamples(examplesContainer, appControllers);
  }

  // Handle Theme Toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('ztable_theme', nextTheme);
      updateThemeUI(nextTheme);
      curveCanvas.setTheme(nextTheme);
    });
  }

  // Start with default calculation on Mode 1
  mode1.setZ(1.25);
  window.__ZTABLE_APP__ = appControllers;
});
