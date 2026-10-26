/**
 * @file mode5ZTable.js
 * @description Interactive visual Z-Table Matrix component.
 * Renders complete 2D matrix (0.0 to 3.9 x 0.00 to 0.09) with dynamic row, column, and cell highlighting,
 * dual table mode switch (Conventional vs Cumulative), search locator, and academic distinction notes.
 */

import { generateZTable, lookupZTable } from '../math/zTableEngine.js';
import { validateZInput } from '../math/validation.js';

export function setupMode5(container, curveCanvas) {
  const tableTypeSelect = container.querySelector('#ztable-type-select');
  const zSearchInput = container.querySelector('#ztable-search-input');
  const tableContainer = container.querySelector('#ztable-matrix-wrapper');
  const highlightInfoBox = container.querySelector('#ztable-highlight-info');
  const explanationBox = container.querySelector('#ztable-mode-explanation');

  let currentTableType = 'conventional'; // 'conventional' | 'cumulative'
  let activeZ = 1.25;

  function renderTableMatrix() {
    const tableData = generateZTable(currentTableType, 3.9);

    let html = `
      <table class="z-table" id="rendered-z-matrix">
        <thead>
          <tr>
            <th class="corner-cell">Z</th>
            ${tableData.columns.map((col, idx) => `<th class="col-header" data-col-idx="${idx}">${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    tableData.rows.forEach((row, rIdx) => {
      html += `
        <tr data-row-idx="${rIdx}">
          <th class="row-header" data-row-idx="${rIdx}">${row.label}</th>
          ${row.values
            .map(
              (val, cIdx) =>
                `<td class="z-cell" data-row-idx="${rIdx}" data-col-idx="${cIdx}" title="Z = ${(rIdx/10 + cIdx/100).toFixed(2)}">${val}</td>`
            )
            .join('')}
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    tableContainer.innerHTML = html;
    attachCellClickListeners();
    applyHighlight(activeZ);
  }

  function attachCellClickListeners() {
    const cells = tableContainer.querySelectorAll('.z-cell');
    cells.forEach((cell) => {
      cell.addEventListener('click', () => {
        const rIdx = Number(cell.dataset.rowIdx);
        const cIdx = Number(cell.dataset.colIdx);
        const clickedZ = (rIdx / 10 + cIdx / 100);
        zSearchInput.value = clickedZ.toFixed(2);
        activeZ = clickedZ;
        applyHighlight(clickedZ);
      });
    });
  }

  function applyHighlight(z) {
    const validation = validateZInput(z);
    if (!validation.isValid) return;

    activeZ = validation.value;
    const lookup = lookupZTable(activeZ, currentTableType);

    // Remove previous highlights
    tableContainer.querySelectorAll('.highlight-row, .highlight-col, .highlight-cell').forEach((el) => {
      el.classList.remove('highlight-row', 'highlight-col', 'highlight-cell');
    });

    // Highlight row header and all row cells
    const rowEl = tableContainer.querySelector(`tr[data-row-idx="${lookup.rowIndex}"]`);
    if (rowEl) {
      rowEl.classList.add('highlight-row');
    }

    // Highlight column header and all column cells
    const colHeaders = tableContainer.querySelectorAll(`th[data-col-idx="${lookup.colIndex}"]`);
    colHeaders.forEach((th) => th.classList.add('highlight-col'));
    const colCells = tableContainer.querySelectorAll(`td[data-col-idx="${lookup.colIndex}"]`);
    colCells.forEach((td) => td.classList.add('highlight-col'));

    // Highlight target cell
    const targetCell = tableContainer.querySelector(
      `td[data-row-idx="${lookup.rowIndex}"][data-col-idx="${lookup.colIndex}"]`
    );
    if (targetCell) {
      targetCell.classList.add('highlight-cell');
      // Scroll into view if needed
      targetCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    // Update Info Box
    const signExplanation = activeZ < 0 ? ` (Using symmetry |Z| = ${Math.abs(activeZ).toFixed(2)})` : '';
    highlightInfoBox.innerHTML = `
      <div class="ztable-detail-card">
        <div class="ztable-detail-grid">
          <div><span class="label">Input Z:</span> <strong class="val text-cyan">${activeZ.toFixed(2)}${signExplanation}</strong></div>
          <div><span class="label">Row:</span> <strong class="val">${lookup.rowLabel}</strong></div>
          <div><span class="label">Column:</span> <strong class="val">${lookup.colLabel}</strong></div>
          <div><span class="label">Table Cell Value:</span> <strong class="val text-highlight">${lookup.tableValue}</strong></div>
        </div>
        <div class="ztable-area-breakdown">
          <p><strong>Table Value Meaning:</strong> ${lookup.description}</p>
          <div class="ztable-triplet">
            <span class="chip">Area Mean to Z: <b>${lookup.rawValues.areaFromMean}</b></span>
            <span class="chip">Cumulative Left Area Φ(Z): <b>${lookup.rawValues.leftTail}</b></span>
            <span class="chip">Upper Right Tail: <b>${lookup.rawValues.rightTail}</b></span>
          </div>
        </div>
      </div>
    `;

    // Update canvas curve
    if (curveCanvas) {
      curveCanvas.updatePlot({
        mode: 'z-table',
        shadeType: currentTableType === 'conventional' ? 'between-mean' : 'left',
        z1: activeZ,
      });
    }
  }

  function updateExplanation() {
    if (currentTableType === 'conventional') {
      explanationBox.innerHTML = `
        <div class="academic-note-box conventional">
          <h4>Conventional Z-Table Standard: Area Bounded Between Mean (μ = 0) and Z</h4>
          <p>In traditional statistics textbooks, table entries reflect $P(0 < Z < z)$, covering values from <strong>0.0000</strong> to <strong>0.4999</strong>. 
          To obtain the cumulative probability $\\Phi(z)$, add <strong>0.5000</strong> for positive Z (since the left half of the normal curve equals 0.5000).</p>
        </div>
      `;
    } else {
      explanationBox.innerHTML = `
        <div class="academic-note-box cumulative">
          <h4>Cumulative Z-Table Standard: Area to the Left of Z ($\\Phi(z)$)</h4>
          <p>In modern statistical software and cumulative tables, entries represent $P(Z \\le z) = \\Phi(z)$, extending from <strong>0.5000</strong> at the mean up to <strong>0.9999</strong> at $Z = 3.99$. 
          The area between the mean and $Z$ is obtained by subtracting 0.5000.</p>
        </div>
      `;
    }
  }

  // Event handlers
  tableTypeSelect.addEventListener('change', (e) => {
    currentTableType = e.target.value;
    updateExplanation();
    renderTableMatrix();
  });

  zSearchInput.addEventListener('input', (e) => {
    const rawVal = e.target.value;
    const v = validateZInput(rawVal);
    if (v.isValid) {
      applyHighlight(v.value);
    }
  });

  // Initial render
  updateExplanation();
  renderTableMatrix();

  return {
    setZ(z) {
      zSearchInput.value = z;
      activeZ = Number(z);
      applyHighlight(activeZ);
    },
    refresh() {
      applyHighlight(activeZ);
    },
  };
}
