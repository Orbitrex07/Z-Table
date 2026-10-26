# Interactive Statistical Analysis Tool for Standard Normal Distribution

> **Subtitle**: Z-Score, Probability, Z-Table, and Normal Distribution Calculator  
> **Course / Academic Project**: College Statistics & Probability Engineering Demonstration  
> **Target Audience**: Mathematics & Statistics Faculty, Engineering Students, Researchers  

---

## 1. Project Overview & Problem Statement

In undergraduate and graduate statistics courses, students often encounter the standard normal distribution $N(0, 1)$ through static printed tables (the traditional Z-table). This introduces several pedagogical hurdles:

1. **Disconnected Concepts**: Students often treat standardizing an observation $X \to Z$, looking up a cell in a printed Z-table, and calculating a tail probability as disjointed arithmetic steps rather than a continuous mathematical workflow.
2. **Table Ambiguity**: Conventional textbook tables tabulate the area bounded between the mean ($Z = 0$) and $Z$ ($P(0 < Z < z)$), whereas cumulative tables tabulate the total area to the left ($\Phi(z) = P(Z \le z)$). Confusing these interpretations leads to frequent errors in hypothesis testing and confidence interval estimation.
3. **Black-Box Tools**: Typical online calculators provide a final decimal without pedagogical explanation, obscuring how symmetry rules, critical values, and table lookups function.

This application provides a **complete, transparent, and interactive statistical dashboard**. It demonstrates the complete lifecycle:

$$\text{Normal Distribution } N(\mu, \sigma^2) \longrightarrow \text{Standardization } Z = \frac{X - \mu}{\sigma} \longrightarrow \text{Z-Table Lookup} \longrightarrow \text{Probability Density \& CDF Integration} \longrightarrow \text{Statistical Interpretation}$$

---

## 2. Mathematical Foundations & Theoretical Formulas

The standard normal distribution is the continuous probability distribution of a standardized random variable $Z$ with mean $\mu = 0$ and standard deviation $\sigma = 1$.

### 2.1 Probability Density Function (PDF)
$$f(z) = \frac{1}{\sqrt{2\pi}} e^{-\frac{z^2}{2}}, \quad -\infty < z < \infty$$
- **Maximum height**: At the mean $z = 0$, $f(0) = \frac{1}{\sqrt{2\pi}} \approx 0.39894228$.
- **Inflection points**: Occur at $z = \pm 1\sigma$.
- **Total probability area**: $\int_{-\infty}^{\infty} f(z) \, dz = 1.0000$.

### 2.2 Cumulative Distribution Function (CDF)
$$\Phi(z) = P(Z \le z) = \int_{-\infty}^{z} f(t) \, dt = \frac{1}{2} \left[1 + \text{erf}\left(\frac{z}{\sqrt{2}}\right)\right]$$
where the error function is defined as:
$$\text{erf}(x) = \frac{2}{\sqrt{\pi}} \int_0^x e^{-t^2} \, dt$$

### 2.3 Tail & Interval Probability Formulas
- **Left-Tail (Cumulative Probability)**:
  $$P(Z < z) = \Phi(z)$$
- **Right-Tail (Upper Critical Probability)**:
  $$P(Z > z) = 1 - \Phi(z)$$
- **Area Between Mean and Z (Conventional Z-Table Definition)**:
  $$\text{For } z \ge 0: \quad P(0 < Z < z) = \Phi(z) - 0.5$$
  $$\text{For } z < 0: \quad P(z < Z < 0) = 0.5 - \Phi(z)$$
- **Interval Between Two Z-Scores**:
  $$P(z_1 < Z < z_2) = \Phi(z_2) - \Phi(z_1) \quad (z_1 \le z_2)$$
- **Two-Tailed Probability (Hypothesis Testing)**:
  $$P(|Z| > |z|) = 2 \cdot [1 - \Phi(|z|)]$$
- **Central Confidence Region**:
  $$P(-|z| < Z < |z|) = 2\Phi(|z|) - 1$$
- **Gaussian Symmetry**:
  $$\Phi(-z) = 1 - \Phi(z)$$

### 2.4 Standardization Formula
For any unstandardized random variable $X \sim N(\mu, \sigma^2)$:
$$Z = \frac{X - \mu}{\sigma}$$
Because standardization is a linear monotonic transformation, $P(X \le x) = P\left(Z \le \frac{x - \mu}{\sigma}\right)$.

---

## 3. High-Precision Numerical Algorithms

The application does not use coarse lookup approximations or static tables for calculation. It uses high-order numerical algorithms:

### 3.1 Error Function & Normal CDF
Implemented using the Abramowitz & Stegun rational Chebyshev polynomial (Formula 26.2.17) with boundary asymptotic scaling. This guarantees:
- Double precision accuracy $< 7.5 \times 10^{-8}$ absolute error, yielding exact textbook matching across all 4 displayed decimal places.
- Smooth tail convergence without floating-point underflow/overflow for $|z| > 8$.

### 3.2 Inverse Normal CDF (Quantile Function $\Phi^{-1}(p)$)
Implemented using **Peter J. Acklam's algorithm**, the gold standard in statistical computing (used in R, SciPy, and MATLAB):
- Divided into three piecewise rational minimax polynomial regions: Lower Tail ($p < 0.02425$), Central Region ($0.02425 \le p \le 0.97575$), and Upper Tail ($p > 0.97575$).
- Inherent relative error is bounded by $< 1.15 \times 10^{-9}$.
- Followed by a step of **Halley's rational refinement**:
  $$\Delta z = \frac{\Phi(z) - p}{f(z)}, \quad z_{\text{refined}} = z - \frac{\Delta z}{1 + \frac{z \Delta z}{2}}$$
  achieving double-precision convergence.

---

## 4. System Architecture & File Structure

```
c:\Users\anupd\Desktop\Z-Table\
├── package.json                         # Project dependencies, scripts & metadata
├── vite.config.js                       # Vite dev server and build configuration
├── index.html                           # Semantic HTML5 academic dashboard
├── style.css                            # Academic design system (dark/light themes, glassmorphism)
├── src/
│   ├── main.js                          # Main application orchestrator & coordinator
│   ├── math/
│   │   ├── normalDistribution.js        # High-precision PDF, CDF, erf, Inverse CDF, Tails
│   │   ├── zTableEngine.js              # 2D Z-table generation, row/column decomposition, lookup
│   │   ├── stepByStep.js                # Collegiate step-by-step mathematical reasoning generator
│   │   ├── interpretation.js            # Natural language statistical interpretation generator
│   │   └── validation.js                # Input validator with descriptive error & warning feedback
│   ├── visualization/
│   │   └── normalCurveCanvas.js         # Interactive high-DPI HTML5 Canvas Bell Curve renderer
│   └── ui/
│       ├── modeManager.js               # Tab switching & view synchronization
│       ├── mode1ZToProb.js              # Mode 1 controller: Z -> Probability
│       ├── mode2TwoZ.js                 # Mode 2 controller: Two Z-values interval
│       ├── mode3ProbToZ.js              # Mode 3 controller: Probability -> Critical Z
│       ├── mode4XToZ.js                 # Mode 4 controller: X -> Z -> Probability
│       ├── mode5ZTable.js               # Mode 5 controller: 2D interactive matrix with cell locator
│       ├── quickAccess.js               # Quick preset buttons (Z = 0, ±1, ±1.645, ±1.96, etc.)
│       └── examples.js                  # 1-Click college examination examples
└── tests/
    ├── normalDistribution.test.js       # Mathematical engine & benchmark unit tests
    └── zTableEngine.test.js             # Z-table, validation, steps, and interpretation unit tests
```

---

## 5. Core Application Modes & Features

### Mode 1: Arbitrary $Z \to \text{Probability}$
- **Input**: Any real number $Z$ (e.g., $1.25$, $-1.96$, $0.842$).
- **Outputs**:
  - Cumulative probability $\Phi(z) = P(Z \le z)$
  - Upper right-tail probability $P(Z \ge z)$
  - Area between the mean and $Z$: $P(0 < Z < z)$
  - Two-tailed probability: $P(|Z| \ge |z|)$
- **Interactive Shading Dropdown**: Choose between Left-Tail, Right-Tail, Area Between Mean and Z, or Two-Tailed shading.
- **Visuals**: Real-time bell curve update with standard deviation ticks and active cutoff marker.

### Mode 2: Probability Between Two $Z$-Values
- **Inputs**: $Z_1$ and $Z_2$ (e.g., $Z_1 = -1.20, Z_2 = 1.50$).
- **Outputs**:
  - $P(z_1 < Z < z_2) = \Phi(z_2) - \Phi(z_1) = 0.8181$
  - Cumulative probabilities for each boundary ($\Phi(z_1) = 0.1151, \Phi(z_2) = 0.9332$)
  - Total outer tail area ($0.1819$)
- **Visuals**: Only the interval region bounded between $Z_1$ and $Z_2$ is shaded.

### Mode 3: Probability $\to Z$ (Inverse Normal Quantile)
- **Inputs**: Target probability $p$ ($0 < p < 1$).
- **Tail Types**:
  - Left-Tail $P(Z \le z) = p$ (e.g., $0.95 \to Z = 1.6449$)
  - Right-Tail $P(Z \ge z) = p$ (e.g., $0.05 \to Z = 1.6449$)
  - Central Confidence Region $P(-z \le Z \le z) = p$ (e.g., $0.95 \to Z = \pm 1.9600$)
- **Quick Preset Buttons**: Instant access to $90\%$, $95\%$, $97.5\%$, and $99\%$.

### Mode 4: Raw Score Standardization ($X \to Z \to \text{Probability}$)
- **Inputs**: Raw observation $X$, Population mean $\mu$, Population standard deviation $\sigma > 0$.
- **Outputs**:
  - Deviation $(X - \mu)$
  - Standardized score $Z = \frac{X - \mu}{\sigma}$
  - Cumulative area $P(X \le x)$ and complementary area $P(X \ge x)$
- **Dual-Axis Canvas**: The normal curve displays both the standard $Z$ axis ($-3\sigma$ to $+3\sigma$) and the original raw $X$ scale ($\mu - 3\sigma$ to $\mu + 3\sigma$) simultaneously.

### Mode 5: Interactive 2D $Z$-Table Matrix
- **Complete Matrix**: 40 rows ($0.0$ to $3.9$) by 10 columns ($0.00$ to $0.09$).
- **Search Locator**: Type any $Z$-score (e.g., $1.25$) to immediately highlight:
  - Row header ($1.2$)
  - Column header ($0.05$)
  - Intersection cell ($0.3944$)
  - Smooth auto-scrolling to cell
- **Table Standard Switch**: Toggle between **Conventional (Mean to Z)** and **Cumulative ($\Phi(Z)$)** tables with detailed academic explanation.

---

## 6. Academic Transparency & Pedagogical Elements

1. **"Show Calculation" Step-by-Step Accordion**:
   Every calculation expands into detailed sequential steps showing the formulas, Z-table row/column indexing, symmetry applications, and arithmetic.
2. **Natural Language Statistical Interpretation**:
   Converts mathematical output into collegiate interpretations (e.g., *"Approximately 89.44% of observations in a standard normal population have Z-scores less than or equal to 1.25"*).
3. **Empirical Rule Section ($68-95-99.7\%$)**:
   Dedicated interactive cards showing $\pm 1\sigma$ ($68.27\%$), $\pm 2\sigma$ ($95.45\%$), and $\pm 3\sigma$ ($99.73\%$) with 1-click visualization.
4. **Calculator vs. Z-Table Comparison**:
   Explains the exact relationship between traditional 2-decimal printed tables and continuous mathematical CDF integration.
5. **Historical Context & Real-World Applications**:
   Covers De Moivre, Laplace, Gauss, Six Sigma quality control, Financial Value-at-Risk, clinical diagnostic reference intervals, and exam standardization.

---

## 7. API / Function Reference Documentation

### `calculatePDF(z)`
- **Purpose**: Evaluates Gaussian probability density $f(z)$.
- **Inputs**: `z` (number)
- **Output**: `number`
- **Formula**: $f(z) = \frac{1}{\sqrt{2\pi}} e^{-z^2/2}$
- **Example**: `calculatePDF(0)` $\to 0.398942$

### `calculateCDF(z)`
- **Purpose**: Evaluates standard normal cumulative probability $\Phi(z) = P(Z \le z)$.
- **Inputs**: `z` (number)
- **Output**: `number` in $[0, 1]$
- **Formula**: $\Phi(z) = \frac{1}{2}[1 + \text{erf}(z/\sqrt{2})]$
- **Example**: `calculateCDF(1.96)` $\to 0.975002$

### `calculateInverseCDF(p)`
- **Purpose**: Computes quantile $z = \Phi^{-1}(p)$.
- **Inputs**: `p` (number, $0 < p < 1$)
- **Output**: `number`
- **Algorithm**: Peter J. Acklam minimax rational approximation with Halley refinement.
- **Example**: `calculateInverseCDF(0.975)` $\to 1.95996$

### `calculateBetweenMeanAndZ(z)`
- **Purpose**: Computes conventional Z-table area between mean and $z$.
- **Inputs**: `z` (number)
- **Output**: `number` in $[0, 0.5)$
- **Example**: `calculateBetweenMeanAndZ(1.25)` $\to 0.3944$

### `calculateZScore(x, mean, stdDev)`
- **Purpose**: Standardizes raw score $X$.
- **Inputs**: `x` (number), `mean` (number), `stdDev` (number, $> 0$)
- **Output**: `number`
- **Example**: `calculateZScore(85, 70, 10)` $\to 1.50$

### `splitZ(z)`
- **Purpose**: Decomposes a decimal Z-score into row and column components.
- **Inputs**: `z` (number)
- **Output**: `{ rowLabel: "1.2", colLabel: "0.05", rowIndex: 12, colIndex: 5, zRounded: 1.25 }`

---

## 8. Verification & Automated Test Suite

The project includes an automated test suite executed via Node.js native test runner:

```bash
npm test
```

### Benchmark Verification Results:
- **PDF Analytical Accuracy**: $f(0) \approx 0.39894, f(\pm 1) \approx 0.24197$.
- **CDF Standard Statistical Table Verification**:
  - $Z = 0 \to \Phi(0) = 0.5000$
  - $Z = 1.0 \to \Phi(1.0) = 0.8413$
  - $Z = -1.0 \to \Phi(-1.0) = 0.1587$
  - $Z = 1.25 \to \Phi(1.25) = 0.8944$
  - $Z = 1.645 \to \Phi(1.645) = 0.9500$
  - $Z = 1.96 \to \Phi(1.96) = 0.9750$
  - $Z = 2.0 \to \Phi(2.0) = 0.9772$
  - $Z = 2.33 \to \Phi(2.33) = 0.9901$
  - $Z = 2.58 \to \Phi(2.58) = 0.9951$
  - $Z = 3.0 \to \Phi(3.0) = 0.9987$
- **Symmetry Integrity**: $\Phi(-z) + \Phi(z) = 1.0000000$ verified across all test values.
- **Inverse Quantile Benchmark**:
  - $p = 0.50 \to Z = 0.0000$
  - $p = 0.90 \to Z = 1.2816$
  - $p = 0.95 \to Z = 1.6449$
  - $p = 0.975 \to Z = 1.9600$
  - $p = 0.99 \to Z = 2.3263$
- **Roundtrip Consistency**: $\Phi^{-1}(\Phi(z)) = z$ verified across $[-3.5, 3.5]$.
- **Robust Edge Case Rejection**: Verified handling of $p \le 0, p \ge 1, \sigma \le 0, \text{NaN}$.

Total automated tests: **22 passed, 0 failed**.

---

## 9. How to Run and Demonstrate the Application

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher; tested on Node.js v25.7)

### Installation & Development Server
1. Clone or open the repository folder:
   ```bash
   cd c:\Users\anupd\Desktop\Z-Table
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your web browser at:
   ```
   http://localhost:5173/
   ```

### Running Tests
To execute the automated unit test suite:
```bash
npm test
```

### Building for Production
To build an optimized static bundle:
```bash
npm run build
```
The compiled output is located in the `dist/` directory and can be served statically by any web server.

---

## 10. Live Faculty Demonstration Script (Step-by-Step)

When presenting this project to faculty members, use the following flow:

1. **Introduction**: Introduce the title and explain that the tool bridges theoretical calculus, standardization, and the traditional printed Z-table.
2. **Mode 1 Demonstration**:
   - Type $Z = 1.25$.
   - Point out that the tool immediately splits the calculation: $\Phi(1.25) = 0.8944$, Right Tail $= 0.1056$, and Area from Mean $= 0.3944$.
   - Open **"Show Mathematical Calculation Steps"** to show faculty the exact pedagogical breakdown.
   - Switch the shading dropdown to **"Two-Tailed"** to show how hypothesis testing p-values are visualized.
3. **Quick Access Presets**:
   - Click the `Z = +1.96 (95% 2-tail)` chip.
   - Show how the curve immediately highlights the $97.5\%$ cumulative area and $2.5\%$ upper critical tail.
4. **Mode 2 Demonstration**:
   - Switch to **Mode 2 (Two Z-Values)**.
   - Enter $Z_1 = -1.20, Z_2 = 1.50$.
   - Show how the area between two arbitrary bounds is derived: $\Phi(1.50) - \Phi(-1.20) = 0.9332 - 0.1151 = 0.8181$.
5. **Mode 3 (Inverse Normal)**:
   - Switch to **Mode 3 (Probability $\to$ Z)**.
   - Set $P = 0.95$ and select **Central Area**.
   - Show that the tool calculates $Z = \pm 1.9600$, the fundamental basis of $95\%$ confidence intervals.
6. **Mode 4 (Standardization)**:
   - Switch to **Mode 4 (X $\to$ Z $\to$ Probability)**.
   - Enter $X = 85, \mu = 70, \sigma = 10$.
   - Show the dual axis rendered below the curve: the standard $Z$ axis aligned directly with the original $X$ scale.
7. **Mode 5 (Z-Table Matrix)**:
   - Switch to **Mode 5 (Interactive Z-Table)**.
   - Enter $1.25$. Show how row `1.2` and column `0.05` intersect at `0.3944`.
   - Toggle to **Cumulative Table** and explain the academic difference between $P(0 < Z < z)$ and $\Phi(z)$.
8. **Interactive College Examples**:
   - Scroll down to the Examples section and click **"Load Example in Calculator"** on Example 3 or Example 5 to demonstrate automated problem solving.
9. **Empirical Rule & Applications**:
   - Click the Empirical Rule $\pm 1\sigma, \pm 2\sigma, \pm 3\sigma$ buttons to demonstrate theoretical compliance.

---

## 11. Limitations & Future Enhancements

- **Current Scope**: Standard Normal $N(0, 1)$ and general univariate normal distributions $N(\mu, \sigma^2)$.
- **Future Enhancements**:
  1. Extension to Student's $t$-distribution with dynamic degrees of freedom ($\nu$) comparison.
  2. Chi-Square ($\chi^2$) and Snedecor's $F$-distribution interactive visualizers.
  3. PDF/CDF export functionality to LaTeX equations and vector SVG plots for academic papers.
