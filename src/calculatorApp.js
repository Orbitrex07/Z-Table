/**
 * Calculator UI Controller & Interactive State Manager
 * Handles input synchronization, keyboard typing, keypad interactions,
 * live preview, history storage, memory operations, and animations.
 */

import { evaluateExpression, formatNumber, previewExpression } from './math/calculatorEngine.js';

export class CalculatorApp {
  constructor() {
    this.expression = '';
    this.lastResult = null;
    this.memoryValue = 0;
    this.history = [];
    this.soundEnabled = false;
    this.audioCtx = null;

    // Load persisted state
    this.loadState();

    // DOM Elements
    this.inputEl = document.getElementById('calc-input');
    this.previewEl = document.getElementById('calc-preview');
    this.resultEl = document.getElementById('calc-result');
    this.keypadEl = document.getElementById('calc-keypad');
    this.historyListEl = document.getElementById('history-list');
    this.historyDrawerEl = document.getElementById('history-drawer');
    this.historyEmptyEl = document.getElementById('history-empty');
    this.memoryBadgeEl = document.getElementById('memory-badge');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');
    this.copyResultBtn = document.getElementById('copy-result-btn');
    this.toggleHistoryBtn = document.getElementById('toggle-history-btn');
    this.closeHistoryBtn = document.getElementById('close-history-btn');

    this.initEventListeners();
    this.render();
  }

  loadState() {
    try {
      const savedHistory = localStorage.getItem('calc_history');
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }
      const savedMemory = localStorage.getItem('calc_memory');
      if (savedMemory) {
        this.memoryValue = parseFloat(savedMemory) || 0;
      }
      const savedSound = localStorage.getItem('calc_sound');
      this.soundEnabled = savedSound === 'true';
    } catch {
      this.history = [];
      this.memoryValue = 0;
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('calc_history', JSON.stringify(this.history.slice(0, 50)));
    } catch {
      // Storage full or unavailable
    }
  }

  saveMemory() {
    try {
      localStorage.setItem('calc_memory', this.memoryValue.toString());
    } catch {
      // Ignore
    }
  }

  playAudioFeedback(freq = 440, type = 'sine') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.08);
      }
    } catch {
      // Ignore Web Audio errors
    }
  }

  initEventListeners() {
    // Physical Keyboard Input
    window.addEventListener('keydown', (e) => this.handleKeyboardInput(e));

    // Input Bar Direct Typing and editing
    if (this.inputEl) {
      this.inputEl.addEventListener('input', () => {
        this.expression = this.inputEl.value;
        this.updateLivePreview();
      });

      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.calculate();
        }
      });
    }

    // Keypad Click Delegation
    if (this.keypadEl) {
      this.keypadEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-key], button[data-action]');
        if (!btn) return;
        const key = btn.getAttribute('data-key');
        const action = btn.getAttribute('data-action');

        this.highlightButton(btn);

        if (key) {
          this.insertChar(key);
        } else if (action) {
          this.handleAction(action);
        }
      });
    }

    // Copy Result Button
    if (this.copyResultBtn) {
      this.copyResultBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // History Toggle & Controls
    if (this.toggleHistoryBtn) {
      this.toggleHistoryBtn.addEventListener('click', () => this.toggleHistoryDrawer(true));
    }
    if (this.closeHistoryBtn) {
      this.closeHistoryBtn.addEventListener('click', () => this.toggleHistoryDrawer(false));
    }
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // Sound Toggle
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('calc_sound', this.soundEnabled.toString());
        this.updateSoundButton();
        if (this.soundEnabled) this.playAudioFeedback(600, 'triangle');
      });
      this.updateSoundButton();
    }

    // Theme Toggle
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Auto focus input on click outside buttons
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('button') &&
        !e.target.closest('.history-drawer') &&
        this.inputEl &&
        document.activeElement !== this.inputEl
      ) {
        // Keep input focused so the user can just type immediately
        this.inputEl.focus();
      }
    });
  }

  updateSoundButton() {
    if (!this.soundToggleBtn) return;
    this.soundToggleBtn.innerHTML = this.soundEnabled
      ? '<span class="icon">🔊</span><span class="btn-label">Sound On</span>'
      : '<span class="icon">🔇</span><span class="btn-label">Muted</span>';
    this.soundToggleBtn.classList.toggle('active', this.soundEnabled);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('calc_theme', newTheme);
    if (this.themeToggleBtn) {
      this.themeToggleBtn.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
      this.themeToggleBtn.querySelector('.theme-text').textContent = newTheme === 'dark' ? 'Dark' : 'Light';
    }
    this.playAudioFeedback(520, 'sine');
  }

  toggleHistoryDrawer(show) {
    if (!this.historyDrawerEl) return;
    if (show !== undefined) {
      this.historyDrawerEl.classList.toggle('open', show);
    } else {
      this.historyDrawerEl.classList.toggle('open');
    }
  }

  highlightButton(btn) {
    if (!btn) return;
    btn.classList.add('key-pressed');
    setTimeout(() => btn.classList.remove('key-pressed'), 140);
  }

  highlightKeyBySelector(selector) {
    const btn = document.querySelector(selector);
    if (btn) this.highlightButton(btn);
  }

  handleKeyboardInput(e) {
    // If user is focused on an input other than our calc-input, ignore
    if (e.target.tagName === 'INPUT' && e.target !== this.inputEl) return;

    const key = e.key;

    // Digits
    if (/[0-9]/.test(key)) {
      this.highlightKeyBySelector(`button[data-key="${key}"]`);
      this.insertChar(key);
      e.preventDefault();
      return;
    }

    // Decimal point
    if (key === '.') {
      this.highlightKeyBySelector(`button[data-key="."]`);
      this.insertChar('.');
      e.preventDefault();
      return;
    }

    // Operators
    if (key === '+' || key === '-') {
      this.highlightKeyBySelector(`button[data-key="${key}"]`);
      this.insertChar(key);
      e.preventDefault();
      return;
    }

    if (key === '*' || key === 'x' || key === 'X') {
      this.highlightKeyBySelector(`button[data-key="*"]`);
      this.insertChar('*');
      e.preventDefault();
      return;
    }

    if (key === '/') {
      this.highlightKeyBySelector(`button[data-key="/"]`);
      this.insertChar('/');
      e.preventDefault();
      return;
    }

    if (key === '^') {
      this.highlightKeyBySelector(`button[data-key="^"]`);
      this.insertChar('^');
      e.preventDefault();
      return;
    }

    if (key === '%') {
      this.highlightKeyBySelector(`button[data-key="%"]`);
      this.insertChar('%');
      e.preventDefault();
      return;
    }

    if (key === '(' || key === ')') {
      this.highlightKeyBySelector(`button[data-key="${key}"]`);
      this.insertChar(key);
      e.preventDefault();
      return;
    }

    // Enter or Equals
    if (key === 'Enter' || key === '=') {
      this.highlightKeyBySelector(`button[data-action="equals"]`);
      this.calculate();
      e.preventDefault();
      return;
    }

    // Backspace
    if (key === 'Backspace') {
      this.highlightKeyBySelector(`button[data-action="backspace"]`);
      this.backspace();
      e.preventDefault();
      return;
    }

    // Clear / Escape
    if (key === 'Escape' || key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey || document.activeElement !== this.inputEl)) {
      this.highlightKeyBySelector(`button[data-action="clear"]`);
      this.clear();
      e.preventDefault();
      return;
    }
  }

  insertChar(char) {
    this.playAudioFeedback(480, 'sine');
    
    // Clear display if error was showing
    if (this.resultEl && this.resultEl.classList.contains('error-state')) {
      this.resultEl.classList.remove('error-state');
    }

    // If we just calculated a result and the user starts typing a digit or bracket, start fresh
    const isDigitOrParen = /[0-9(]/.test(char);
    if (this.lastResult !== null && this.expression === '' && isDigitOrParen) {
      this.lastResult = null;
    }

    // If we just calculated and type an operator (+, -, *, /, ^), continue with the last answer
    if (this.lastResult !== null && this.expression === '' && ['+', '-', '*', '/', '^', '%'].includes(char)) {
      this.expression = formatNumber(this.lastResult);
      this.lastResult = null;
    }

    this.expression += char;
    this.syncInput();
    this.updateLivePreview();
  }

  handleAction(action) {
    switch (action) {
      case 'clear':
        this.playAudioFeedback(320, 'square');
        this.clear();
        break;
      case 'all-clear':
        this.playAudioFeedback(300, 'square');
        this.allClear();
        break;
      case 'backspace':
        this.playAudioFeedback(380, 'sine');
        this.backspace();
        break;
      case 'equals':
        this.playAudioFeedback(680, 'triangle');
        this.calculate();
        break;
      case 'sqrt':
        this.playAudioFeedback(540, 'sine');
        this.insertSqrt();
        break;
      case 'negate':
        this.playAudioFeedback(460, 'sine');
        this.toggleSign();
        break;
      case 'mc':
        this.playAudioFeedback(350, 'triangle');
        this.memoryClear();
        break;
      case 'mr':
        this.playAudioFeedback(500, 'triangle');
        this.memoryRecall();
        break;
      case 'm-plus':
        this.playAudioFeedback(550, 'triangle');
        this.memoryAdd();
        break;
      case 'm-minus':
        this.playAudioFeedback(450, 'triangle');
        this.memorySubtract();
        break;
      default:
        break;
    }
  }

  insertSqrt() {
    if (this.expression && !/[+\-*/^(]$/.test(this.expression.trim())) {
      this.expression = `sqrt(${this.expression})`;
    } else {
      this.expression += 'sqrt(';
    }
    this.syncInput();
    this.updateLivePreview();
  }

  toggleSign() {
    if (!this.expression) {
      if (this.lastResult !== null) {
        this.expression = formatNumber(-this.lastResult);
        this.lastResult = -this.lastResult;
      } else {
        this.expression = '-';
      }
    } else if (this.expression.startsWith('-(') && this.expression.endsWith(')')) {
      this.expression = this.expression.slice(2, -1);
    } else if (this.expression.startsWith('-')) {
      this.expression = this.expression.slice(1);
    } else {
      this.expression = `-(${this.expression})`;
    }
    this.syncInput();
    this.updateLivePreview();
  }

  backspace() {
    if (this.expression.length > 0) {
      // Check if ends with 'sqrt('
      if (this.expression.endsWith('sqrt(')) {
        this.expression = this.expression.slice(0, -5);
      } else {
        this.expression = this.expression.slice(0, -1);
      }
      this.syncInput();
      this.updateLivePreview();
    }
  }

  clear() {
    this.expression = '';
    this.syncInput();
    this.updateLivePreview();
    if (this.resultEl) {
      this.resultEl.textContent = this.lastResult !== null ? formatNumber(this.lastResult) : '0';
      this.resultEl.classList.remove('error-state');
    }
  }

  allClear() {
    this.expression = '';
    this.lastResult = null;
    this.syncInput();
    this.updateLivePreview();
    if (this.resultEl) {
      this.resultEl.textContent = '0';
      this.resultEl.classList.remove('error-state');
    }
  }

  syncInput() {
    if (this.inputEl) {
      this.inputEl.value = this.expression;
      // Scroll to end of input if long
      this.inputEl.scrollLeft = this.inputEl.scrollWidth;
    }
  }

  updateLivePreview() {
    if (!this.previewEl) return;
    const preview = previewExpression(this.expression);
    if (preview !== null && this.expression.trim() !== '') {
      this.previewEl.textContent = `= ${formatNumber(preview)}`;
      this.previewEl.classList.add('visible');
    } else {
      this.previewEl.textContent = '';
      this.previewEl.classList.remove('visible');
    }
  }

  calculate() {
    const rawExpr = this.expression.trim();
    if (!rawExpr) return;

    try {
      const numResult = evaluateExpression(rawExpr);
      const formatted = formatNumber(numResult);

      if (this.resultEl) {
        this.resultEl.textContent = formatted;
        this.resultEl.classList.remove('error-state');
        this.resultEl.classList.add('result-pop');
        setTimeout(() => this.resultEl.classList.remove('result-pop'), 220);
      }

      // Record to history
      const historyItem = {
        expression: rawExpr,
        result: formatted,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.history.unshift(historyItem);
      this.saveHistory();
      this.renderHistory();

      // Reset expression for next calculation, but retain lastResult
      this.lastResult = numResult;
      this.expression = '';
      this.syncInput();
      this.updateLivePreview();

    } catch (err) {
      this.playAudioFeedback(200, 'sawtooth');
      if (this.resultEl) {
        this.resultEl.textContent = err.message || 'Error';
        this.resultEl.classList.add('error-state');
      }
      if (this.previewEl) {
        this.previewEl.textContent = '';
      }
    }
  }

  // Memory functions
  getCurrentValue() {
    if (this.lastResult !== null) return this.lastResult;
    if (this.expression) {
      try {
        return evaluateExpression(this.expression);
      } catch {
        return 0;
      }
    }
    return 0;
  }

  memoryClear() {
    this.memoryValue = 0;
    this.saveMemory();
    this.updateMemoryBadge();
  }

  memoryRecall() {
    if (this.memoryValue !== 0) {
      this.insertChar(formatNumber(this.memoryValue));
    }
  }

  memoryAdd() {
    const val = this.getCurrentValue();
    this.memoryValue += val;
    this.saveMemory();
    this.updateMemoryBadge();
  }

  memorySubtract() {
    const val = this.getCurrentValue();
    this.memoryValue -= val;
    this.saveMemory();
    this.updateMemoryBadge();
  }

  updateMemoryBadge() {
    if (!this.memoryBadgeEl) return;
    if (this.memoryValue !== 0) {
      this.memoryBadgeEl.textContent = `M: ${formatNumber(this.memoryValue)}`;
      this.memoryBadgeEl.classList.add('active');
    } else {
      this.memoryBadgeEl.textContent = '';
      this.memoryBadgeEl.classList.remove('active');
    }
  }

  copyToClipboard() {
    const textToCopy = this.resultEl ? this.resultEl.textContent : '';
    if (!textToCopy || textToCopy === '0' || textToCopy === 'Error') return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.showToast(`Copied "${textToCopy}" to clipboard!`);
    }).catch(() => {
      this.showToast('Could not copy to clipboard.');
    });
  }

  showToast(msg) {
    let toast = document.getElementById('calc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'calc-toast';
      toast.className = 'calc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyListEl) return;

    if (this.history.length === 0) {
      if (this.historyEmptyEl) this.historyEmptyEl.style.display = 'block';
      this.historyListEl.innerHTML = '';
      return;
    }

    if (this.historyEmptyEl) this.historyEmptyEl.style.display = 'none';

    this.historyListEl.innerHTML = this.history.map((item, idx) => `
      <div class="history-card" data-idx="${idx}">
        <div class="history-card-header">
          <span class="history-expr">${escapeHtml(item.expression)}</span>
          <span class="history-time">${escapeHtml(item.timestamp)}</span>
        </div>
        <div class="history-result">= ${escapeHtml(item.result)}</div>
        <div class="history-card-actions">
          <button type="button" class="btn-history-use" data-action="use-result" title="Use result">Use Ans</button>
          <button type="button" class="btn-history-use" data-action="use-expr" title="Edit formula">Edit</button>
        </div>
      </div>
    `).join('');

    // Attach click listeners to history cards
    const cards = this.historyListEl.querySelectorAll('.history-card');
    cards.forEach(card => {
      const idx = parseInt(card.getAttribute('data-idx'), 10);
      const item = this.history[idx];
      if (!item) return;

      const useAnsBtn = card.querySelector('[data-action="use-result"]');
      if (useAnsBtn) {
        useAnsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.insertChar(item.result);
          this.toggleHistoryDrawer(false);
        });
      }

      const useExprBtn = card.querySelector('[data-action="use-expr"]');
      if (useExprBtn) {
        useExprBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.expression = item.expression;
          this.syncInput();
          this.updateLivePreview();
          this.toggleHistoryDrawer(false);
        });
      }

      // Clicking card anywhere loads expression
      card.addEventListener('click', () => {
        this.expression = item.expression;
        this.syncInput();
        this.updateLivePreview();
        this.toggleHistoryDrawer(false);
      });
    });
  }

  render() {
    this.renderHistory();
    this.updateMemoryBadge();
    this.syncInput();
    this.updateLivePreview();
    if (this.inputEl) {
      this.inputEl.focus();
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
