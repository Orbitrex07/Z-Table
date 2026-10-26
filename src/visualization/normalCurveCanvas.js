/**
 * @file normalCurveCanvas.js
 * @description Interactive high-DPI HTML5 Canvas renderer for the Standard Normal Distribution.
 * Renders the Bell Curve, standard deviation markers, dynamic shaded regions,
 * Z-score pointer badges, and mouse crosshair tooltips.
 */

import { calculatePDF, calculateCDF } from '../math/normalDistribution.js';

export class NormalCurveCanvas {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [options]
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      zMin: -3.8,
      zMax: 3.8,
      padding: { top: 40, right: 35, bottom: 65, left: 55 },
      theme: 'dark', // 'dark' | 'light'
      ...options,
    };

    // State
    this.currentMode = 'z-to-prob'; // 'z-to-prob' | 'two-z' | 'prob-to-z' | 'x-to-z' | 'z-table'
    this.shadeType = 'left'; // 'left' | 'right' | 'between-mean' | 'between-two' | 'two-tail' | 'central'
    this.z1 = 0;
    this.z2 = 0;
    this.hoverZ = null;
    this.hoverPDF = null;
    this.isHovering = false;
    this.rawXParams = null; // { mean, stdDev } for Dual-Axis display in Mode 4

    // Resize handler with High-DPI support
    this.initEvents();
    this.resize();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseX >= this.plotArea.x && mouseX <= this.plotArea.x + this.plotArea.w &&
          mouseY >= this.plotArea.y && mouseY <= this.plotArea.y + this.plotArea.h) {
        this.isHovering = true;
        this.hoverZ = this.pixelToZ(mouseX);
        this.hoverPDF = calculatePDF(this.hoverZ);
        this.mousePos = { x: mouseX, y: mouseY };
      } else {
        this.isHovering = false;
        this.hoverZ = null;
      }
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this.hoverZ = null;
      this.render();
    });
  }

  setTheme(theme) {
    this.options.theme = theme;
    this.render();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(320, rect.width);
    const height = Math.min(460, Math.max(280, Math.round(width * 0.45)));

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.dpr = dpr;
    this.width = width;
    this.height = height;

    const p = this.options.padding;
    this.plotArea = {
      x: p.left,
      y: p.top,
      w: width - p.left - p.right,
      h: height - p.top - p.bottom,
    };

    this.render();
  }

  // Coordinate transforms
  zToPixel(z) {
    const ratio = (z - this.options.zMin) / (this.options.zMax - this.options.zMin);
    return this.plotArea.x + ratio * this.plotArea.w;
  }

  pixelToZ(px) {
    const ratio = (px - this.plotArea.x) / this.plotArea.w;
    return this.options.zMin + ratio * (this.options.zMax - this.options.zMin);
  }

  pdfToPixel(pdf) {
    // Standard normal maximum PDF is ~0.39894 at z=0. Scale max to 0.45 for margin
    const maxPDF = 0.44;
    const ratio = pdf / maxPDF;
    return this.plotArea.y + this.plotArea.h - (ratio * this.plotArea.h);
  }

  /**
   * Updates state and triggers repaint
   */
  updatePlot({ mode, shadeType, z1, z2, rawXParams }) {
    if (mode !== undefined) this.currentMode = mode;
    if (shadeType !== undefined) this.shadeType = shadeType;
    if (z1 !== undefined) this.z1 = z1;
    if (z2 !== undefined) this.z2 = z2;
    this.rawXParams = rawXParams !== undefined ? rawXParams : null;

    this.render();
  }

  render() {
    const { ctx, dpr, width, height, plotArea } = this;
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isDark = this.options.theme === 'dark';

    // Color tokens - Calm, non-glaring academic palette
    const colors = {
      bg: isDark ? '#141822' : '#ffffff',
      curveStroke: isDark ? '#5b8bf7' : '#2563eb', // Balanced blue
      grid: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.18)',
      axis: isDark ? '#3b4559' : '#cbd5e1',
      textPrimary: isDark ? '#f1f5f9' : '#0f172a',
      textMuted: isDark ? '#8a99ad' : '#64748b',
      meanLine: isDark ? '#cbd5e1' : '#475569',
      markerLine: isDark ? '#60a5fa' : '#3b82f6',
      primaryShadeStart: isDark ? 'rgba(91, 139, 247, 0.28)' : 'rgba(37, 99, 235, 0.20)',
      primaryShadeEnd: isDark ? 'rgba(91, 139, 247, 0.06)' : 'rgba(37, 99, 235, 0.04)',
      secondaryShadeStart: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.18)',
      secondaryShadeEnd: isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(100, 116, 139, 0.04)',
      activeMarker: isDark ? '#5b8bf7' : '#2563eb',
      badgeBg: isDark ? '#1d2331' : '#f1f5f9',
    };

    // 1. Draw Grid lines & Sigma markers
    this.drawGridAndMarkers(colors);

    // 2. Draw Shaded Area(s) based on calculation mode
    this.drawShadedRegions(colors);

    // 3. Draw Main Bell Curve Line
    this.drawBellCurve(colors);

    // 4. Draw Mean Marker line at z = 0
    this.drawMeanLine(colors);

    // 5. Draw Active Z Markers (lines, dots, labels)
    this.drawActiveZMarkers(colors);

    // 6. Draw Dual Axis for X (if available)
    if (this.rawXParams) {
      this.drawRawXAxis(colors);
    }

    // 7. Draw Mouse Hover Crosshair Tooltip
    if (this.isHovering && this.hoverZ !== null) {
      this.drawHoverCrosshair(colors);
    }

    ctx.restore();
  }

  drawGridAndMarkers(colors) {
    const { ctx, plotArea } = this;

    // Horizontal baseline
    const y0 = this.pdfToPixel(0);
    ctx.beginPath();
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.moveTo(plotArea.x, y0);
    ctx.lineTo(plotArea.x + plotArea.w, y0);
    ctx.stroke();

    // Standard deviation ticks: -3, -2, -1, 0, 1, 2, 3
    const sigmas = [-3, -2, -1, 0, 1, 2, 3];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const s of sigmas) {
      const px = this.zToPixel(s);

      // Vertical guide line
      ctx.beginPath();
      ctx.strokeStyle = s === 0 ? colors.grid : colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash(s === 0 ? [] : [3, 4]);
      ctx.moveTo(px, plotArea.y);
      ctx.lineTo(px, y0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tick mark
      ctx.beginPath();
      ctx.strokeStyle = colors.axis;
      ctx.lineWidth = 1.5;
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y0 + 6);
      ctx.stroke();

      // Z Label
      ctx.font = '600 12px Inter, sans-serif';
      ctx.fillStyle = s === 0 ? colors.meanLine : colors.textMuted;
      ctx.fillText(s === 0 ? '0 (μ)' : `${s > 0 ? '+' : ''}${s}σ`, px, y0 + 9);

      // Raw Z number
      ctx.font = '400 10px JetBrains Mono, monospace';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText(s.toString(), px, y0 + 24);
    }

    // Axis label
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'right';
    ctx.fillText('Z-Score (Standard Deviations σ)', plotArea.x + plotArea.w, y0 + 38);
  }

  drawBellCurve(colors) {
    const { ctx, plotArea } = this;
    const steps = 300;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const z = this.options.zMin + (i / steps) * (this.options.zMax - this.options.zMin);
      const pdf = calculatePDF(z);
      const px = this.zToPixel(z);
      const py = this.pdfToPixel(pdf);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    // Clean matte mathematical stroke with no shiny glow
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colors.curveStroke;
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  drawShadedRegions(colors) {
    const { ctx, plotArea } = this;
    const y0 = this.pdfToPixel(0);

    const shadeRange = (startZ, endZ, colorStart, colorEnd) => {
      const clampedStart = Math.max(this.options.zMin, Math.min(this.options.zMax, startZ));
      const clampedEnd = Math.max(this.options.zMin, Math.min(this.options.zMax, endZ));
      if (clampedStart >= clampedEnd) return;

      const steps = Math.max(10, Math.round((clampedEnd - clampedStart) * 50));
      const grad = ctx.createLinearGradient(0, plotArea.y, 0, y0);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(1, colorEnd);

      ctx.beginPath();
      ctx.moveTo(this.zToPixel(clampedStart), y0);

      for (let i = 0; i <= steps; i++) {
        const z = clampedStart + (i / steps) * (clampedEnd - clampedStart);
        const pdf = calculatePDF(z);
        ctx.lineTo(this.zToPixel(z), this.pdfToPixel(pdf));
      }

      ctx.lineTo(this.zToPixel(clampedEnd), y0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    };

    if (this.currentMode === 'two-z') {
      const minZ = Math.min(this.z1, this.z2);
      const maxZ = Math.max(this.z1, this.z2);
      shadeRange(minZ, maxZ, colors.primaryShadeStart, colors.primaryShadeEnd);
    } else if (this.shadeType === 'left') {
      shadeRange(this.options.zMin, this.z1, colors.primaryShadeStart, colors.primaryShadeEnd);
    } else if (this.shadeType === 'right') {
      shadeRange(this.z1, this.options.zMax, colors.primaryShadeStart, colors.primaryShadeEnd);
    } else if (this.shadeType === 'between-mean') {
      const minZ = Math.min(0, this.z1);
      const maxZ = Math.max(0, this.z1);
      shadeRange(minZ, maxZ, colors.secondaryShadeStart, colors.secondaryShadeEnd);
    } else if (this.shadeType === 'two-tail') {
      const absZ = Math.abs(this.z1);
      shadeRange(this.options.zMin, -absZ, colors.secondaryShadeStart, colors.secondaryShadeEnd);
      shadeRange(absZ, this.options.zMax, colors.secondaryShadeStart, colors.secondaryShadeEnd);
    } else if (this.shadeType === 'central') {
      const absZ = Math.abs(this.z1);
      shadeRange(-absZ, absZ, colors.primaryShadeStart, colors.primaryShadeEnd);
    }
  }

  drawMeanLine(colors) {
    const { ctx, plotArea } = this;
    const px = this.zToPixel(0);
    const py = this.pdfToPixel(calculatePDF(0));
    const y0 = this.pdfToPixel(0);

    ctx.beginPath();
    ctx.strokeStyle = colors.meanLine;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(px, py);
    ctx.lineTo(px, y0);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawActiveZMarkers(colors) {
    const { ctx } = this;
    const y0 = this.pdfToPixel(0);

    const drawSingleMarker = (z, labelText, color) => {
      if (z < this.options.zMin || z > this.options.zMax) return;

      const px = this.zToPixel(z);
      const pdf = calculatePDF(z);
      const py = this.pdfToPixel(pdf);

      // Vertical marker line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.moveTo(px, y0);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Top circle node
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Value badge above curve
      const badgeText = `${labelText} = ${z.toFixed(2)}`;
      ctx.font = '600 11px JetBrains Mono, monospace';
      const textMetrics = ctx.measureText(badgeText);
      const badgeW = textMetrics.width + 12;
      const badgeH = 20;
      const badgeX = Math.max(10, Math.min(this.width - badgeW - 10, px - badgeW / 2));
      const badgeY = Math.max(10, py - 26);

      // Badge bubble
      ctx.fillStyle = colors.badgeBg;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 5, true, true);

      ctx.fillStyle = colors.textPrimary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
    };

    if (this.currentMode === 'two-z') {
      drawSingleMarker(this.z1, 'Z₁', '#38bdf8');
      drawSingleMarker(this.z2, 'Z₂', '#ec4899');
    } else {
      drawSingleMarker(this.z1, 'Z', '#38bdf8');
    }
  }

  drawRawXAxis(colors) {
    const { ctx, plotArea } = this;
    if (!this.rawXParams) return;
    const { mean, stdDev } = this.rawXParams;
    const y0 = this.pdfToPixel(0) + 48;

    ctx.beginPath();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.moveTo(plotArea.x, y0);
    ctx.lineTo(plotArea.x + plotArea.w, y0);
    ctx.stroke();

    const sigmas = [-3, -2, -1, 0, 1, 2, 3];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const s of sigmas) {
      const px = this.zToPixel(s);
      const rawVal = mean + s * stdDev;

      ctx.beginPath();
      ctx.strokeStyle = '#64748b';
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y0 + 4);
      ctx.stroke();

      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillStyle = s === 0 ? colors.meanLine : colors.textMuted;
      ctx.fillText(rawVal.toFixed(1), px, y0 + 6);
    }

    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = colors.meanLine;
    ctx.textAlign = 'left';
    ctx.fillText(`Raw X Scale (μ=${mean}, σ=${stdDev})`, plotArea.x, y0 + 6);
  }

  drawHoverCrosshair(colors) {
    const { ctx, plotArea, hoverZ, hoverPDF } = this;
    const px = this.zToPixel(hoverZ);
    const py = this.pdfToPixel(hoverPDF);
    const y0 = this.pdfToPixel(0);

    // Crosshair lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.moveTo(px, y0);
    ctx.lineTo(px, py);
    ctx.moveTo(plotArea.x, py);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Intersection dot
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();

    // Floating Tooltip
    const tooltipText1 = `z: ${hoverZ.toFixed(2)}`;
    const tooltipText2 = `f(z): ${hoverPDF.toFixed(4)}`;
    const tooltipText3 = `Φ(z): ${calculateCDF(hoverZ).toFixed(4)}`;

    ctx.font = '500 11px JetBrains Mono, monospace';
    const boxW = 120;
    const boxH = 58;
    let boxX = px + 12;
    let boxY = py - 30;

    if (boxX + boxW > plotArea.x + plotArea.w) {
      boxX = px - boxW - 12;
    }
    if (boxY < plotArea.y) {
      boxY = plotArea.y + 10;
    }

    ctx.fillStyle = colors.badgeBg;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 6, true, true);

    ctx.fillStyle = colors.textPrimary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(tooltipText1, boxX + 8, boxY + 6);
    ctx.fillText(tooltipText2, boxX + 8, boxY + 22);
    ctx.fillText(tooltipText3, boxX + 8, boxY + 38);
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
