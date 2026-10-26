/**
 * @file modeManager.js
 * @description Coordinates tab switching between the 5 calculator modes and synchronizes
 * curve canvas redraws and shared state.
 */

export function setupModeManager(tabsContainer, modePanelsContainer, onModeChange) {
  const tabButtons = tabsContainer.querySelectorAll('.mode-tab-btn');
  const panels = modePanelsContainer.querySelectorAll('.mode-panel');

  function activateMode(modeId) {
    // Update tab button states
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.mode === modeId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update panel visibility
    panels.forEach((panel) => {
      const isActive = panel.id === `panel-${modeId}`;
      panel.classList.toggle('active', isActive);
      panel.classList.toggle('hidden', !isActive);
    });

    if (typeof onModeChange === 'function') {
      onModeChange(modeId);
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateMode(btn.dataset.mode);
    });
  });

  return {
    switchMode(modeId) {
      activateMode(modeId);
    },
    getCurrentMode() {
      const activeBtn = tabsContainer.querySelector('.mode-tab-btn.active');
      return activeBtn ? activeBtn.dataset.mode : 'mode-1';
    },
  };
}
