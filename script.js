// ===== State Management =====
const state = {
    totalQuestions: 10,
    maxNumber: 5,
    currentQuestion: 0,
    errors: 0,
    num1: 0,
    num2: 0,
    correctAnswer: 0,
    recentQuestions: [], // Track recent questions to avoid repetition
    startTime: null, // Timer: when practice started
    endTime: null, // Timer: when practice ended
    elapsedTime: 0 // Timer: total elapsed time in seconds
};

// ===== DOM Elements =====
const screens = {
    settings: document.getElementById('settings-screen'),
    practice: document.getElementById('practice-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    // Settings screen
    questionCountInput: document.getElementById('question-count'),
    maxNumberInput: document.getElementById('max-number'),
    startBtn: document.getElementById('start-btn'),
    questionCountError: document.getElementById('question-count-error'),
    maxNumberError: document.getElementById('max-number-error'),

    // Practice screen
    answerForm: document.getElementById('answer-form'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    question: document.getElementById('question'),
    answerInput: document.getElementById('answer-input'),
    feedback: document.getElementById('feedback'),
    submitBtn: document.getElementById('submit-btn'),
    answerInputError: document.getElementById('answer-input-error'),

    // Results screen
    totalQuestionsDisplay: document.getElementById('total-questions'),
    totalErrorsDisplay: document.getElementById('total-errors'),
    elapsedTimeDisplay: document.getElementById('elapsed-time'),
    accuracyDisplay: document.getElementById('accuracy'),
    restartBtn: document.getElementById('restart-btn')
};

// ===== Utility Functions =====
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function generateQuestion() {
    let newQuestion;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loop

    do {
        // One number is from 2 to maxNumber
        // The other number is from 2 to 9
        const firstNumber = getRandomInt(2, state.maxNumber);
        const secondNumber = getRandomInt(2, 9);

        // Randomly decide which position for each number (50/50 chance)
        if (Math.random() < 0.5) {
            state.num1 = firstNumber;
            state.num2 = secondNumber;
        } else {
            state.num1 = secondNumber;
            state.num2 = firstNumber;
        }

        state.correctAnswer = state.num1 * state.num2;
        newQuestion = `${state.num1}×${state.num2}`;

        attempts++;
    } while (state.recentQuestions.includes(newQuestion) && attempts < maxAttempts);

    // Store current question in history
    state.recentQuestions.push(newQuestion);
    // Keep only last 10 questions
    if (state.recentQuestions.length > 10) {
        state.recentQuestions.shift();
    }

    elements.question.textContent = `${state.num1} × ${state.num2} = ?`;
}

function updateProgress() {
    const progress = (state.currentQuestion / state.totalQuestions) * 100;
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `Pytanie ${state.currentQuestion + 1} z ${state.totalQuestions}`;
}

function showFeedback(isCorrect) {
    elements.feedback.classList.remove('show', 'correct', 'incorrect');

    // Force reflow to restart animation
    void elements.feedback.offsetWidth;

    if (isCorrect) {
        elements.feedback.textContent = '✓ Prawidłowo!';
        elements.feedback.classList.add('correct');
    } else {
        elements.feedback.textContent = `✗ Nieprawidłowo. Prawidłowa odpowiedź: ${state.correctAnswer}`;
        elements.feedback.classList.add('incorrect');
        state.errors++;
    }

    elements.feedback.classList.add('show');
}

function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearError(errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
}

function validateSettings() {
    const questionCount = parseInt(elements.questionCountInput.value);
    const maxNumber = parseInt(elements.maxNumberInput.value);

    let isValid = true;

    // Clear previous errors
    clearError(elements.questionCountError);
    clearError(elements.maxNumberError);

    // Validate question count
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 100) {
        showError(elements.questionCountError, 'Liczba zadań musi być od 1 do 100');
        elements.questionCountInput.focus();
        isValid = false;
    }

    // Validate max number
    if (isNaN(maxNumber) || maxNumber < 2 || maxNumber > 9) {
        showError(elements.maxNumberError, 'Maksymalna liczba musi być od 2 do 9');
        if (isValid) elements.maxNumberInput.focus();
        isValid = false;
    }

    return isValid;
}

// ===== Game Flow Functions =====
function startGame() {
    if (!validateSettings()) {
        return;
    }

    // Initialize state
    state.totalQuestions = parseInt(elements.questionCountInput.value);
    state.maxNumber = parseInt(elements.maxNumberInput.value);
    state.currentQuestion = 0;
    state.errors = 0;
    state.recentQuestions = []; // Reset recent questions history

    // Start timer
    state.startTime = Date.now();
    state.endTime = null;
    state.elapsedTime = 0;

    // Reset UI
    elements.answerInput.value = '';
    elements.feedback.classList.remove('show');

    // Generate first question
    generateQuestion();
    updateProgress();

    // Show practice screen
    showScreen('practice');

    // Focus on answer input and scroll into view
    setTimeout(() => {
        elements.answerInput.focus();
        elements.answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function submitAnswer() {
    const userAnswer = parseInt(elements.answerInput.value);

    // Clear previous error
    clearError(elements.answerInputError);

    // Validate input
    if (isNaN(userAnswer)) {
        showError(elements.answerInputError, 'Proszę wpisać liczbę');
        elements.answerInput.focus();
        return;
    }

    // Check answer
    const isCorrect = userAnswer === state.correctAnswer;
    showFeedback(isCorrect);

    // Keep focus on input field for quick next answer
    elements.answerInput.focus();

    // Disable submit button temporarily
    elements.submitBtn.disabled = true;

    // Move to next question or show results
    setTimeout(() => {
        state.currentQuestion++;

        if (state.currentQuestion < state.totalQuestions) {
            // Next question
            generateQuestion();
            updateProgress();
            elements.answerInput.value = '';
            elements.feedback.classList.remove('show');
            elements.submitBtn.disabled = false;
            elements.answerInput.focus();
            elements.answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Show results
            showResults();
        }
    }, 1500);
}

function showResults() {
    // Stop timer and calculate elapsed time
    state.endTime = Date.now();
    state.elapsedTime = Math.floor((state.endTime - state.startTime) / 1000); // Convert to seconds

    const correctAnswers = state.totalQuestions - state.errors;
    const accuracy = Math.round((correctAnswers / state.totalQuestions) * 100);

    elements.totalQuestionsDisplay.textContent = state.totalQuestions;
    elements.totalErrorsDisplay.textContent = state.errors;
    elements.elapsedTimeDisplay.textContent = formatTime(state.elapsedTime);
    elements.accuracyDisplay.textContent = `Dokładność: ${accuracy}%`;

    // Change accuracy color based on performance
    if (accuracy >= 90) {
        elements.accuracyDisplay.style.color = 'var(--color-success)';
    } else if (accuracy >= 70) {
        elements.accuracyDisplay.style.color = 'var(--color-primary)';
    } else {
        elements.accuracyDisplay.style.color = 'var(--color-error)';
    }

    showScreen('results');
}

function restartGame() {
    elements.submitBtn.disabled = false;
    showScreen('settings');
}

// ===== Event Listeners =====
// Form submit handler (handles iOS Done button)
elements.answerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!elements.submitBtn.disabled) {
        submitAnswer();
    }
});

elements.startBtn.addEventListener('click', startGame);
elements.submitBtn.addEventListener('click', submitAnswer);
elements.restartBtn.addEventListener('click', restartGame);

// Keyboard support - handle Enter key and iOS Done button
elements.answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !elements.submitBtn.disabled) {
        e.preventDefault(); // Prevent form submission
        submitAnswer();
    }
});

// Prevent invalid input in number fields
[elements.questionCountInput, elements.maxNumberInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
});

// Clear errors when user starts typing
elements.questionCountInput.addEventListener('input', () => {
    clearError(elements.questionCountError);
});

elements.maxNumberInput.addEventListener('input', () => {
    clearError(elements.maxNumberError);
});

elements.answerInput.addEventListener('input', () => {
    clearError(elements.answerInputError);
});

// ===== Initialize =====
// Focus on first input on load
window.addEventListener('load', () => {
    elements.questionCountInput.focus();
});
// Keep answer input focused on practice screen (for mobile keyboard)
elements.answerInput.addEventListener('blur', () => {
    // Only refocus if we're on the practice screen and submit button is not disabled
    if (screens.practice.classList.contains('active') && !elements.submitBtn.disabled) {
        setTimeout(() => {
            elements.answerInput.focus();
        }, 100);
    }
});
