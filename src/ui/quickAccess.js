/**
 * @file quickAccess.js
 * @description Quick preset buttons for common standard normal critical values:
 * Z = 0, ±0.5, ±1, ±1.28, ±1.645, ±1.96, ±2, ±2.33, ±2.58
 */

export function setupQuickAccess(container, onSelectZ) {
  const presets = [
    { label: 'Z = 0 (Mean)', val: 0.0 },
    { label: 'Z = +0.50', val: 0.5 },
    { label: 'Z = -0.50', val: -0.5 },
    { label: 'Z = +1.00 (1σ)', val: 1.0 },
    { label: 'Z = -1.00 (-1σ)', val: -1.0 },
    { label: 'Z = +1.28 (90% tail)', val: 1.28 },
    { label: 'Z = -1.28', val: -1.28 },
    { label: 'Z = +1.645 (95% 1-tail)', val: 1.645 },
    { label: 'Z = -1.645', val: -1.645 },
    { label: 'Z = +1.96 (95% 2-tail)', val: 1.96 },
    { label: 'Z = -1.96', val: -1.96 },
    { label: 'Z = +2.00 (2σ)', val: 2.0 },
    { label: 'Z = -2.00 (-2σ)', val: -2.0 },
    { label: 'Z = +2.33 (99% 1-tail)', val: 2.33 },
    { label: 'Z = -2.33', val: -2.33 },
    { label: 'Z = +2.58 (99% 2-tail)', val: 2.58 },
    { label: 'Z = -2.58', val: -2.58 },
  ];

  container.innerHTML = presets
    .map(
      (p) => `<button type="button" class="quick-chip-btn" data-val="${p.val}">${p.label}</button>`
    )
    .join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-chip-btn');
    if (!btn) return;
    const val = Number(btn.dataset.val);
    onSelectZ(val);

    // Active state
    container.querySelectorAll('.quick-chip-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
}
