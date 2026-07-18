// ===== Difficulty Configuration =====
// Adapted for Polish school grades 1–3
const DIFFICULTY = {
    1: {
        label: '+/− do 20 · ×/÷ do ×3',
        addSub: { min: 1, max: 20 },
        mulA: [2, 3], mulB: [1, 5]
    },
    2: {
        label: '+/− do 50 · ×/÷ do ×5',
        addSub: { min: 1, max: 50 },
        mulA: [2, 5], mulB: [1, 10]
    },
    3: {
        label: '+/− do 99 · ×/÷ do ×9',
        addSub: { min: 1, max: 99 },
        mulA: [2, 9], mulB: [1, 10]
    }
};


// ===== State =====
const state = {
    totalQuestions: 10,
    difficulty: 1,
    selectedOps: ['add'],
    useBrackets: false,
    currentQuestion: 0,
    errors: 0,
    correctAnswer: 0,
    recentQuestions: [],
    startTime: null,
    endTime: null,
    elapsedTime: 0
};

// ===== DOM =====
const screens = {
    settings: document.getElementById('settings-screen'),
    practice: document.getElementById('practice-screen'),
    results: document.getElementById('results-screen')
};

const el = {
    questionCountInput: document.getElementById('question-count'),
    startBtn: document.getElementById('start-btn'),
    questionCountError: document.getElementById('question-count-error'),
    operationsError: document.getElementById('operations-error'),
    levelHint: document.getElementById('level-hint'),
    answerForm: document.getElementById('answer-form'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    question: document.getElementById('question'),
    answerInput: document.getElementById('answer-input'),
    feedback: document.getElementById('feedback'),
    submitBtn: document.getElementById('submit-btn'),
    answerInputError: document.getElementById('answer-input-error'),
    totalQuestionsDisplay: document.getElementById('total-questions'),
    totalCorrectDisplay: document.getElementById('total-correct'),
    elapsedTimeDisplay: document.getElementById('elapsed-time'),
    accuracyDisplay: document.getElementById('accuracy'),
    restartBtn: document.getElementById('restart-btn'),
    celebrationEmoji: document.getElementById('celebration-emoji'),
    resultsTitle: document.getElementById('results-title'),
    resultsSubtitle: document.getElementById('results-subtitle')
};

// ===== Utilities =====
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function showError(el, msg) { el.textContent = msg; el.style.display = 'block'; }
function clearError(el) { el.textContent = ''; el.style.display = 'none'; }

// ===== Question Generation =====
function generateQuestion() {
    const cfg = DIFFICULTY[state.difficulty];
    const ops = state.selectedOps;
    let result, attempts = 0;

    do {
        // Use composite (bracket) expression ~40% of the time when enabled
        const useComposite = state.useBrackets && Math.random() < 0.4;
        result = useComposite ? makeComposite(ops, cfg) : makeSimple(ops, cfg);
        attempts++;
    } while (state.recentQuestions.includes(result.text) && attempts < 40);

    state.correctAnswer = result.answer;
    state.recentQuestions.push(result.text);
    if (state.recentQuestions.length > 12) state.recentQuestions.shift();

    el.question.textContent = `${result.text} = ?`;
}

// Returns a simple 2-number expression
function makeSimple(ops, cfg) {
    return makeQuestion(ops, cfg);
}

// Returns a 3-number bracket expression
function makeComposite(ops, cfg) {
    const addSubOps = ops.filter(o => o === 'add' || o === 'sub');
    const hasMul = ops.includes('mul');

    // If multiplication is available and +/- ops exist, occasionally use (a+b)×c
    if (hasMul && addSubOps.length > 0 && Math.random() < 0.4) {
        return makeCompositeMul(cfg);
    }

    // Fall back to simple if no +/- ops
    if (addSubOps.length === 0) return makeSimple(ops, cfg);

    // Randomly pick left- or right-bracket pattern
    return Math.random() < 0.5
        ? makeLeftBracket(addSubOps, cfg.addSub.max)
        : makeRightBracket(addSubOps, cfg.addSub.max);
}

// (A op1 B) op2 C
function makeLeftBracket(ops, max) {
    const compositeMax = Math.min(max, 30);
    const op1 = pickRandom(ops);
    const op2 = pickRandom(ops);

    let a, b, innerVal, innerText;
    if (op1 === 'add') {
        a = randInt(1, Math.floor(compositeMax / 2));
        b = randInt(1, Math.floor(compositeMax / 2));
        innerVal = a + b;
        innerText = `${a} + ${b}`;
    } else {
        a = randInt(2, compositeMax);
        b = randInt(1, a);
        innerVal = a - b;
        innerText = `${a} − ${b}`;
    }

    let c, answer, text;
    if (op2 === 'add') {
        c = randInt(1, compositeMax);
        answer = innerVal + c;
        text = `(${innerText}) + ${c}`;
    } else {
        c = randInt(1, Math.max(innerVal, 1));
        answer = innerVal - c;
        text = `(${innerText}) − ${c}`;
    }
    return { text, answer };
}

// A op2 (B op1 C)
function makeRightBracket(ops, max) {
    const compositeMax = Math.min(max, 30);
    const op1 = pickRandom(ops);
    const op2 = pickRandom(ops);

    let b, c, innerVal, innerText;
    if (op1 === 'add') {
        b = randInt(1, Math.floor(compositeMax / 2));
        c = randInt(1, Math.floor(compositeMax / 2));
        innerVal = b + c;
        innerText = `${b} + ${c}`;
    } else {
        b = randInt(2, compositeMax);
        c = randInt(1, b);
        innerVal = b - c;
        innerText = `${b} − ${c}`;
    }

    let a, answer, text;
    if (op2 === 'add') {
        a = randInt(1, compositeMax);
        answer = a + innerVal;
        text = `${a} + (${innerText})`;
    } else {
        a = randInt(innerVal, compositeMax);  // a ≥ innerVal → result ≥ 0
        answer = a - innerVal;
        text = `${a} − (${innerText})`;
    }
    return { text, answer };
}

// (a + b) × c
function makeCompositeMul(cfg) {
    const [cMin, cMax] = cfg.mulA;
    const c = randInt(cMin, Math.min(cMax, 5));       // small multiplier
    const half = Math.min(Math.floor(cfg.addSub.max / 2), 10);
    const a = randInt(1, half);
    const b = randInt(1, half);
    if (Math.random() < 0.5) {
        return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c };
    }
    return { text: `${c} × (${a} + ${b})`, answer: c * (a + b) };
}

function makeQuestion(ops, cfg) {
    const op = pickRandom(ops);

    switch (op) {
        case 'add': return makeAdd(cfg.addSub);
        case 'sub': return makeSub(cfg.addSub);
        case 'mul': return makeMul(cfg.mulA, cfg.mulB);
        case 'div': return makeDiv(cfg.mulA, cfg.mulB);
        default: return makeAdd(cfg.addSub);
    }
}

function makeAdd({ min, max }) {
    const a = randInt(min, max);
    // b is chosen so that a+b doesn't go absurdly over max (soft limit)
    const b = randInt(min, Math.min(max, Math.max(max - a, min)));
    return { text: `${a} + ${b}`, answer: a + b };
}

function makeSub({ min, max }) {
    // a >= b so result is always >= 0
    const a = randInt(min, max);
    const b = randInt(min, a);
    return { text: `${a} − ${b}`, answer: a - b };
}

function makeMul([aMin, aMax], [bMin, bMax]) {
    const a = randInt(aMin, aMax);
    const b = randInt(bMin, bMax);
    // randomise order so child doesn't always see smaller × bigger
    if (Math.random() < 0.5) {
        return { text: `${a} × ${b}`, answer: a * b };
    }
    return { text: `${b} × ${a}`, answer: a * b };
}

function makeDiv([aMin, aMax], [bMin, bMax]) {
    // divisor = a, quotient = b  → dividend = a*b, always integer
    const a = randInt(aMin, aMax);
    const b = randInt(bMin, bMax);
    return { text: `${a * b} ÷ ${a}`, answer: b };
}

// ===== UI =====
function updateProgress() {
    const pct = (state.currentQuestion / state.totalQuestions) * 100;
    el.progressFill.style.width = `${pct}%`;
    el.progressText.textContent =
        `Zadanie ${state.currentQuestion + 1} z ${state.totalQuestions}`;
}

function showFeedback(isCorrect) {
    el.feedback.classList.remove('show', 'correct', 'incorrect');
    void el.feedback.offsetWidth; // reflow

    if (isCorrect) {
        const phrases = ['✓ Dobrze!', '✓ Świetnie!', '✓ Brawo!', '✓ Poprawnie!'];
        el.feedback.textContent = pickRandom(phrases);
        el.feedback.classList.add('correct');
    } else {
        el.feedback.textContent = `✗ Niepoprawnie. Prawidłowa odpowiedź: ${state.correctAnswer}`;
        el.feedback.classList.add('incorrect');
        state.errors++;
    }

    el.feedback.classList.add('show');
}

// ===== Validation =====
function validateSettings() {
    let valid = true;
    clearError(el.questionCountError);
    clearError(el.operationsError);

    const qc = parseInt(el.questionCountInput.value);
    if (isNaN(qc) || qc < 1 || qc > 100) {
        showError(el.questionCountError, 'Wpisz liczbę od 1 do 100');
        el.questionCountInput.focus();
        valid = false;
    }

    if (state.selectedOps.length === 0) {
        showError(el.operationsError, 'Wybierz przynajmniej jedno działanie');
        valid = false;
    }

    return valid;
}

// ===== Game Flow =====
function startGame() {
    if (!validateSettings()) return;

    state.totalQuestions = parseInt(el.questionCountInput.value);
    state.currentQuestion = 0;
    state.errors = 0;
    state.recentQuestions = [];
    state.startTime = Date.now();
    state.endTime = null;
    state.elapsedTime = 0;

    el.answerInput.value = '';
    el.feedback.classList.remove('show');
    el.submitBtn.disabled = false;

    generateQuestion();
    updateProgress();
    showScreen('practice');

    setTimeout(() => {
        el.answerInput.focus();
        el.answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function submitAnswer() {
    const userAnswer = parseInt(el.answerInput.value);
    clearError(el.answerInputError);

    if (isNaN(userAnswer)) {
        showError(el.answerInputError, 'Wpisz liczbę');
        el.answerInput.focus();
        return;
    }

    const isCorrect = userAnswer === state.correctAnswer;
    showFeedback(isCorrect);
    el.answerInput.focus();
    el.submitBtn.disabled = true;

    setTimeout(() => {
        state.currentQuestion++;
        if (state.currentQuestion < state.totalQuestions) {
            generateQuestion();
            updateProgress();
            el.answerInput.value = '';
            el.feedback.classList.remove('show');
            el.submitBtn.disabled = false;
            el.answerInput.focus();
            el.answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            showResults();
        }
    }, 1400);
}

function showResults() {
    state.endTime = Date.now();
    state.elapsedTime = Math.floor((state.endTime - state.startTime) / 1000);

    const correct = state.totalQuestions - state.errors;
    const accuracy = Math.round((correct / state.totalQuestions) * 100);

    el.totalQuestionsDisplay.textContent = state.totalQuestions;
    el.totalCorrectDisplay.textContent = correct;
    el.elapsedTimeDisplay.textContent = formatTime(state.elapsedTime);
    el.accuracyDisplay.textContent = `Dokładność: ${accuracy}%`;

    if (accuracy === 100) {
        el.celebrationEmoji.textContent = '🏆';
        el.resultsTitle.textContent = 'Idealnie!';
        el.resultsSubtitle.textContent = 'Zero błędów — prawdziwy mistrz!';
        el.accuracyDisplay.style.color = 'var(--color-success)';
    } else if (accuracy >= 80) {
        el.celebrationEmoji.textContent = '🎉';
        el.resultsTitle.textContent = 'Brawo!';
        el.resultsSubtitle.textContent = 'Doskonały wynik!';
        el.accuracyDisplay.style.color = 'var(--color-success)';
    } else if (accuracy >= 60) {
        el.celebrationEmoji.textContent = '👍';
        el.resultsTitle.textContent = 'Dobrze!';
        el.resultsSubtitle.textContent = 'Spróbuj jeszcze raz!';
        el.accuracyDisplay.style.color = 'var(--color-primary)';
    } else {
        el.celebrationEmoji.textContent = '💪';
        el.resultsTitle.textContent = 'Ćwicz dalej!';
        el.resultsSubtitle.textContent = 'Nie poddawaj się — dasz radę!';
        el.accuracyDisplay.style.color = 'var(--color-error)';
    }

    showScreen('results');
}

function restartGame() {
    el.submitBtn.disabled = false;
    showScreen('settings');
}

// ===== Toggle Logic =====

// Operations — multi-select
document.getElementById('operations-group').addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    btn.classList.toggle('active');
    const op = btn.dataset.op;
    const active = btn.classList.contains('active');
    btn.setAttribute('aria-pressed', active);
    if (active) {
        if (!state.selectedOps.includes(op)) state.selectedOps.push(op);
    } else {
        state.selectedOps = state.selectedOps.filter(o => o !== op);
    }
    clearError(el.operationsError);
});

// Brackets — single on/off toggle
document.getElementById('brackets-toggle').addEventListener('click', () => {
    const btn = document.getElementById('brackets-toggle');
    state.useBrackets = !state.useBrackets;
    btn.classList.toggle('active', state.useBrackets);
    btn.setAttribute('aria-pressed', state.useBrackets);
    btn.querySelector('.brackets-text').innerHTML = state.useBrackets
        ? 'Włączone — np. <strong>(4 + 3) × 2</strong>'
        : 'Wyłączone — np. <strong>(4 + 3) × 2</strong>';
});

// Difficulty — single select

document.getElementById('difficulty-group').addEventListener('click', e => {
    const btn = e.target.closest('.diff-btn');
    if (!btn) return;
    document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    state.difficulty = parseInt(btn.dataset.level);
    el.levelHint.textContent = DIFFICULTY[state.difficulty].label;
});

// ===== Event Listeners =====
el.answerForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!el.submitBtn.disabled) submitAnswer();
});

el.startBtn.addEventListener('click', startGame);
el.submitBtn.addEventListener('click', submitAnswer);
el.restartBtn.addEventListener('click', restartGame);

el.answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !el.submitBtn.disabled) {
        e.preventDefault();
        submitAnswer();
    }
});

el.questionCountInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') startGame();
});

el.questionCountInput.addEventListener('input', () => clearError(el.questionCountError));
el.answerInput.addEventListener('input', () => clearError(el.answerInputError));

el.answerInput.addEventListener('blur', () => {
    if (screens.practice.classList.contains('active') && !el.submitBtn.disabled) {
        setTimeout(() => el.answerInput.focus(), 100);
    }
});

// ===== Init =====
window.addEventListener('load', () => {
    el.levelHint.textContent = DIFFICULTY[state.difficulty].label;
    el.questionCountInput.focus();
});
