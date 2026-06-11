// ── Referencias al DOM ──────────────────────────────────────────────────────
const display = document.getElementById('display');
const exprEl  = document.getElementById('expr');

// ── Estado ──────────────────────────────────────────────────────────────────
let currentValue  = '0';   // Número visible en pantalla
let previousValue = '';    // Operando anterior
let operator      = null;  // Operador pendiente (+, −, ×, ÷)
let shouldReset   = false; // Si el próximo dígito reemplaza el display
let fullExpr      = '';    // Expresión completa para la fila superior

// ── Actualizar display ───────────────────────────────────────────────────────
function updateDisplay(val, isResult = false) {
  let formatted = String(val);

  if (!isNaN(parseFloat(formatted)) && isFinite(parseFloat(formatted))) {
    const num = parseFloat(formatted);

    // Notación científica para números muy grandes
    if (Math.abs(num) >= 1e12) {
      formatted = num.toExponential(4);
    } else {
      // Máximo 10 decimales, sin trailing zeros
      formatted = parseFloat(num.toFixed(10)).toString();
    }
  }

  display.textContent = formatted;
  display.className   = 'display-value' + (isResult ? ' accent' : '');

  // Ajuste dinámico del tamaño de fuente
  const len = formatted.length;
  if      (len > 12) display.style.fontSize = '24px';
  else if (len > 9)  display.style.fontSize = '32px';
  else if (len > 6)  display.style.fontSize = '38px';
  else               display.style.fontSize = '44px';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function toNumber(v) {
  return parseFloat(String(v).replace(',', '.'));
}

function calculate(a, op, b) {
  const x = toNumber(a);
  const y = toNumber(b);
  switch (op) {
    case '+': return x + y;
    case '−': return x - y;
    case '×': return x * y;
    case '÷': return y === 0 ? 'Error' : x / y;
    default:  return y;
  }
}

// ── Acciones ─────────────────────────────────────────────────────────────────

function handleNum(v) {
  if (currentValue === 'Error') reset();

  if (shouldReset) {
    currentValue = v;
    shouldReset  = false;
  } else {
    if (currentValue.length >= 12) return; // Límite de dígitos
    currentValue = (currentValue === '0') ? v : currentValue + v;
  }

  updateDisplay(currentValue);
}

function handleOp(op) {
  if (currentValue === 'Error') return;

  // Si ya había un operador pendiente y el usuario no ha ingresado nuevo número,
  // solo actualiza el operador
  if (operator && !shouldReset) {
    const result = calculate(previousValue, operator, currentValue);
    if (result === 'Error') { showError(); return; }
    previousValue = String(result);
    currentValue  = String(result);
    updateDisplay(result);
  } else {
    previousValue = currentValue;
  }

  operator    = op;
  shouldReset = true;
  fullExpr    = previousValue + ' ' + op;
  exprEl.textContent = fullExpr;
}

function handleEquals() {
  if (!operator || currentValue === 'Error') return;

  const a = previousValue;
  const b = currentValue;
  const op = operator;

  const result = calculate(a, op, b);

  fullExpr = a + ' ' + op + ' ' + b + ' =';
  exprEl.textContent = fullExpr;

  if (result === 'Error') { showError(); return; }

  currentValue  = String(result);
  previousValue = '';
  operator      = null;
  shouldReset   = true;

  updateDisplay(result, true);
}

function handleDot() {
  if (shouldReset) {
    currentValue = '0';
    shouldReset  = false;
  }
  if (!currentValue.includes('.')) {
    currentValue += '.';
    updateDisplay(currentValue);
  }
}

function handleSign() {
  if (currentValue === '0' || currentValue === 'Error') return;
  currentValue = currentValue.startsWith('-')
    ? currentValue.slice(1)
    : '-' + currentValue;
  updateDisplay(currentValue);
}

function handlePercent() {
  if (currentValue === 'Error') return;
  const num = toNumber(currentValue) / 100;
  currentValue = String(num);
  updateDisplay(currentValue);
}

function handleBackspace() {
  if (currentValue === 'Error' || shouldReset) { reset(); return; }
  currentValue = currentValue.length > 1
    ? currentValue.slice(0, -1)
    : '0';
  updateDisplay(currentValue);
}

function reset() {
  currentValue  = '0';
  previousValue = '';
  operator      = null;
  shouldReset   = false;
  fullExpr      = '';
  exprEl.textContent = '';
  display.className  = 'display-value';
  display.style.fontSize = '44px';
  updateDisplay('0');
}

function showError() {
  display.textContent    = 'Error';
  display.className      = 'display-value error';
  display.style.fontSize = '28px';
  currentValue  = 'Error';
  previousValue = '';
  operator      = null;
  shouldReset   = true;
  exprEl.textContent = '';
}

// ── Eventos: clicks ──────────────────────────────────────────────────────────
document.querySelector('.grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const { action, value } = btn.dataset;

  switch (action) {
    case 'num':     handleNum(value);     break;
    case 'op':      handleOp(value);      break;
    case 'equals':  handleEquals();       break;
    case 'dot':     handleDot();          break;
    case 'sign':    handleSign();         break;
    case 'percent': handlePercent();      break;
    case 'clear':   reset();              break;
  }
});

// ── Eventos: teclado ─────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ('0123456789'.includes(e.key)) {
    handleNum(e.key);
  } else if (e.key === '+') {
    handleOp('+');
  } else if (e.key === '-') {
    handleOp('−');
  } else if (e.key === '*') {
    handleOp('×');
  } else if (e.key === '/') {
    e.preventDefault();
    handleOp('÷');
  } else if (e.key === 'Enter' || e.key === '=') {
    handleEquals();
  } else if (e.key === '.') {
    handleDot();
  } else if (e.key === 'Backspace') {
    handleBackspace();
  } else if (e.key === 'Escape') {
    reset();
  } else if (e.key === '%') {
    handlePercent();
  }
});
