/**
 * @file examples.js
 * @description Interactive college statistics examples with 1-click automatic loading.
 */

export function setupExamples(container, appControllers) {
  const examples = [
    {
      id: 'ex1',
      title: 'Example 1: Left-Tail Cumulative Area',
      problem: 'Find P(Z < 1.25)',
      expected: '0.8944',
      badge: 'Z → Probability',
      mode: 'mode-1',
      description: 'Find the proportion of standard normal observations with Z < 1.25.',
      action: () => {
        appControllers.switchMode('mode-1');
        appControllers.mode1.setRegion('left');
        appControllers.mode1.setZ(1.25);
      },
    },
    {
      id: 'ex2',
      title: 'Example 2: Right-Tail Critical Region',
      problem: 'Find P(Z > 1.96)',
      expected: '0.0250',
      badge: 'Z → Probability',
      mode: 'mode-1',
      description: 'Calculate the probability in the upper 2.5% tail beyond Z = 1.96.',
      action: () => {
        appControllers.switchMode('mode-1');
        appControllers.mode1.setRegion('right');
        appControllers.mode1.setZ(1.96);
      },
    },
    {
      id: 'ex3',
      title: 'Example 3: Central 95% Confidence Interval',
      problem: 'Find P(-1.96 < Z < 1.96)',
      expected: '0.9500',
      badge: 'Two Z-Values',
      mode: 'mode-2',
      description: 'Compute the symmetric central probability between -1.96 and +1.96.',
      action: () => {
        appControllers.switchMode('mode-2');
        appControllers.mode2.setValues(-1.96, 1.96);
      },
    },
    {
      id: 'ex4',
      title: 'Example 4: Negative Z Left Tail',
      problem: 'Find P(Z < -1.645)',
      expected: '0.0500',
      badge: 'Z → Probability',
      mode: 'mode-1',
      description: 'Find the lower 5% tail area using symmetry properties.',
      action: () => {
        appControllers.switchMode('mode-1');
        appControllers.mode1.setRegion('left');
        appControllers.mode1.setZ(-1.645);
      },
    },
    {
      id: 'ex5',
      title: 'Example 5: Standardizing Raw Observation X',
      problem: 'If X ~ N(70, 10²), find P(X < 85)',
      expected: 'Z = 1.50 → 0.9332',
      badge: 'X → Z → Probability',
      mode: 'mode-4',
      description: 'Convert raw score X = 85 with μ = 70, σ = 10 into Z = 1.50 and find probability.',
      action: () => {
        appControllers.switchMode('mode-4');
        appControllers.mode4.setValues(85, 70, 10);
      },
    },
  ];

  container.innerHTML = `
    <div class="examples-grid">
      ${examples
        .map(
          (ex) => `
        <div class="example-card" data-ex-id="${ex.id}">
          <div class="example-top">
            <span class="example-mode-badge">${ex.badge}</span>
            <span class="example-ans-badge">Ans: ${ex.expected}</span>
          </div>
          <h4 class="example-title">${ex.title}</h4>
          <p class="example-problem"><code>${ex.problem}</code></p>
          <p class="example-desc">${ex.description}</p>
          <button type="button" class="btn-load-example" data-ex-id="${ex.id}">
            Load Example in Calculator →
          </button>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-load-example');
    if (!btn) return;
    const exId = btn.dataset.exId;
    const found = examples.find((ex) => ex.id === exId);
    if (found) {
      found.action();
      // Smooth scroll up to calculator
      const calcArea = document.querySelector('#calculator-section');
      if (calcArea) {
        calcArea.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}
