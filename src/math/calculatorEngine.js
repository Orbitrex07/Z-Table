/**
 * Calculator Mathematical Engine
 * Robust, safe mathematical tokenizer, parser, and evaluator.
 * Does NOT use unsafe eval() or new Function().
 * Implements standard operator precedence (PEMDAS / BODMAS) with unary operators,
 * parentheses, powers, square roots, and percentage calculations.
 */

// Format numbers nicely, avoiding floating-point precision issues like 0.1 + 0.2 = 0.30000000000000004
export function formatNumber(num, maxDecimals = 10) {
  if (num === null || num === undefined || isNaN(num)) return '';
  if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

  // Fix common IEEE 754 precision issues (e.g. 0.30000000000000004 -> 0.3)
  const rounded = Number(Math.round(Number(num + 'e' + maxDecimals)) + 'e-' + maxDecimals);
  
  // Format with standard scientific notation if too large or small
  const abs = Math.abs(rounded);
  if (abs !== 0 && (abs >= 1e14 || abs < 1e-9)) {
    return rounded.toExponential(6).replace(/e\+?/, 'e');
  }

  // Format with commas for thousands in the integer portion for presentation if needed
  const str = rounded.toString();
  return str;
}

// Token types
const TokenType = {
  NUMBER: 'NUMBER',
  OPERATOR: 'OPERATOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  FUNCTION: 'FUNCTION',
  PERCENT: 'PERCENT'
};

/**
 * Tokenizes a math expression string into tokens.
 * Normalizes symbols: × -> *, ÷ -> /, − -> -, √ -> sqrt, π -> Math.PI, e -> Math.E
 */
export function tokenize(expression) {
  if (!expression || typeof expression !== 'string') return [];

  // Normalize expression symbols
  let expr = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '') // remove digit grouping commas
    .replace(/√\s*([0-9.]+|\([^\)]+\))/g, 'sqrt($1)')
    .replace(/√/g, 'sqrt');

  const tokens = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const char = expr[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers (including decimal point)
    if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(expr[i + 1]))) {
      let numStr = '';
      let hasDot = false;

      while (i < len && (/[0-9]/.test(expr[i]) || (expr[i] === '.' && !hasDot))) {
        if (expr[i] === '.') hasDot = true;
        numStr += expr[i];
        i++;
      }

      tokens.push({ type: TokenType.NUMBER, value: parseFloat(numStr), raw: numStr });
      continue;
    }

    // Constants & Functions: sqrt, sin, cos, tan, pi, e
    if (/[a-zA-Z]/.test(char)) {
      let ident = '';
      while (i < len && /[a-zA-Z]/.test(expr[i])) {
        ident += expr[i].toLowerCase();
        i++;
      }

      if (ident === 'pi') {
        tokens.push({ type: TokenType.NUMBER, value: Math.PI, raw: 'π' });
      } else if (ident === 'e') {
        tokens.push({ type: TokenType.NUMBER, value: Math.E, raw: 'e' });
      } else if (ident === 'sqrt' || ident === 'abs') {
        tokens.push({ type: TokenType.FUNCTION, value: ident });
      } else {
        throw new Error(`Unknown identifier: ${ident}`);
      }
      continue;
    }

    // Percentage
    if (char === '%') {
      tokens.push({ type: TokenType.PERCENT, value: '%' });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(') {
      // Implicit multiplication: e.g. 5(2) -> 5 * (2) or )( -> ) * (
      const prev = tokens[tokens.length - 1];
      if (prev && (prev.type === TokenType.NUMBER || prev.type === TokenType.RPAREN || prev.type === TokenType.PERCENT)) {
        tokens.push({ type: TokenType.OPERATOR, value: '*' });
      }
      tokens.push({ type: TokenType.LPAREN, value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: TokenType.RPAREN, value: ')' });
      i++;
      continue;
    }

    // Operators: +, -, *, /, ^
    if (['+', '-', '*', '/', '^'].includes(char)) {
      // Determine if '-' is unary negation
      const prev = tokens[tokens.length - 1];
      const isUnary = (char === '-' || char === '+') &&
        (!prev || prev.type === TokenType.OPERATOR || prev.type === TokenType.LPAREN || prev.type === TokenType.FUNCTION);

      if (isUnary) {
        if (char === '-') {
          tokens.push({ type: TokenType.OPERATOR, value: 'unary-', precedence: 4, rightAssoc: true });
        }
        // Unary '+' is a no-op, ignore
      } else {
        const precedence = {
          '+': 1,
          '-': 1,
          '*': 2,
          '/': 2,
          '^': 3
        }[char];

        const rightAssoc = char === '^';
        tokens.push({ type: TokenType.OPERATOR, value: char, precedence, rightAssoc });
      }
      i++;
      continue;
    }

    throw new Error(`Unexpected character: '${char}'`);
  }

  return tokens;
}

/**
 * Evaluates an array of tokens using the Shunting-Yard algorithm and RPN evaluation.
 */
export function evaluateTokens(tokens) {
  if (!tokens || tokens.length === 0) return 0;

  const outputQueue = [];
  const operatorStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === TokenType.NUMBER) {
      outputQueue.push(token.value);
    } else if (token.type === TokenType.FUNCTION) {
      operatorStack.push(token);
    } else if (token.type === TokenType.PERCENT) {
      // Postfix percentage: applies to the top of outputQueue
      // E.g., 50% => 0.50; or in binary contexts: 200 + 10% => 200 + 200 * 0.1
      if (outputQueue.length === 0) throw new Error('Invalid use of %');
      const val = outputQueue.pop();
      outputQueue.push(val / 100);
    } else if (token.type === TokenType.OPERATOR) {
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top.type === TokenType.OPERATOR) {
          const higherPrec = top.precedence > token.precedence;
          const samePrecLeftAssoc = top.precedence === token.precedence && !token.rightAssoc;
          if (higherPrec || samePrecLeftAssoc) {
            outputQueue.push(operatorStack.pop());
            continue;
          }
        } else if (top.type === TokenType.FUNCTION) {
          outputQueue.push(operatorStack.pop());
          continue;
        }
        break;
      }
      operatorStack.push(token);
    } else if (token.type === TokenType.LPAREN) {
      operatorStack.push(token);
    } else if (token.type === TokenType.RPAREN) {
      let foundMatching = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop();
        if (top.type === TokenType.LPAREN) {
          foundMatching = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundMatching) {
        throw new Error('Mismatched parentheses: extra closing bracket');
      }
      // If the top of the stack is a function, pop it onto the output queue
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === TokenType.FUNCTION) {
        outputQueue.push(operatorStack.pop());
      }
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop();
    if (top.type === TokenType.LPAREN || top.type === TokenType.RPAREN) {
      throw new Error('Mismatched parentheses: unclosed bracket');
    }
    outputQueue.push(top);
  }

  // Evaluate RPN
  const evalStack = [];
  for (const item of outputQueue) {
    if (typeof item === 'number') {
      evalStack.push(item);
    } else if (item.type === TokenType.FUNCTION) {
      if (evalStack.length < 1) throw new Error(`Missing argument for ${item.value}`);
      const arg = evalStack.pop();
      if (item.value === 'sqrt') {
        if (arg < 0) throw new Error('Cannot calculate square root of a negative number');
        evalStack.push(Math.sqrt(arg));
      } else if (item.value === 'abs') {
        evalStack.push(Math.abs(arg));
      }
    } else if (item.type === TokenType.OPERATOR) {
      if (item.value === 'unary-') {
        if (evalStack.length < 1) throw new Error('Invalid unary minus');
        const a = evalStack.pop();
        evalStack.push(-a);
      } else {
        if (evalStack.length < 2) throw new Error(`Invalid expression near operator '${item.value}'`);
        const b = evalStack.pop();
        const a = evalStack.pop();

        switch (item.value) {
          case '+':
            evalStack.push(a + b);
            break;
          case '-':
            evalStack.push(a - b);
            break;
          case '*':
            evalStack.push(a * b);
            break;
          case '/':
            if (b === 0) throw new Error('Cannot divide by zero');
            evalStack.push(a / b);
            break;
          case '^':
            evalStack.push(Math.pow(a, b));
            break;
          default:
            throw new Error(`Unsupported operator: ${item.value}`);
        }
      }
    }
  }

  if (evalStack.length !== 1) {
    throw new Error('Invalid mathematical expression syntax');
  }

  return evalStack[0];
}

/**
 * Main evaluation entry point.
 * Takes a string expression, tokenizes, evaluates, and returns the result number.
 */
export function evaluateExpression(exprString) {
  if (!exprString || !exprString.trim()) return 0;
  const tokens = tokenize(exprString.trim());
  return evaluateTokens(tokens);
}

/**
 * Safe live preview evaluation:
 * Evaluates without throwing, returns null if incomplete or invalid.
 */
export function previewExpression(exprString) {
  if (!exprString || !exprString.trim()) return null;
  
  let clean = exprString.trim();

  // Strip trailing operators for preview
  clean = clean.replace(/[+\-*/^]+$/, '');
  if (!clean) return null;

  // Auto-close open parentheses for preview
  const openCount = (clean.match(/\(/g) || []).length;
  const closeCount = (clean.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    clean = clean + ')'.repeat(openCount - closeCount);
  }

  try {
    const tokens = tokenize(clean);
    const result = evaluateTokens(tokens);
    if (isNaN(result) || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}
