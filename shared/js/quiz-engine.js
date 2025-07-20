/**
 * Enhanced Quiz Engine for The Canadian Style Learning Platform
 * Supports multiple question types with comprehensive feedback
 * FIXED VERSION - supports both new and legacy API calls
 */

export class QuizEngine {
    constructor(quizData, chapterId, sectionId) {
        this.quizData = quizData || { questions: [], title: 'Quiz' };
        this.chapterId = chapterId;
        this.sectionId = sectionId;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.isComplete = false;
        this.startTime = Date.now();
        this.container = null;
        this.timeLimit = null;
        this.timer = null;
        
        console.log('QuizEngine initialized:', { chapterId, sectionId, questionCount: this.quizData.questions?.length || 0 });
    }

    /**
     * LEGACY API SUPPORT - init() method for backward compatibility
     * This method does nothing but prevents errors in old code
     */
    init() {
        console.warn('QuizEngine.init() is deprecated. Use render() instead.');
        // For backward compatibility, we could call render here
        // but it's safer to just do nothing and let old code fail gracefully
        return this;
    }

    render() {
        // Create container element
        this.container = document.createElement('div');
        this.container.className = 'quiz-engine-container';
        this.container.setAttribute('data-chapter', this.chapterId);
        this.container.setAttribute('data-section', this.sectionId);
        
        // Check if we have questions
        if (!this.quizData.questions || this.quizData.questions.length === 0) {
            this.container.innerHTML = `
                <div class="quiz-placeholder">
                    <div class="quiz-icon">📝</div>
                    <h3>Quiz Coming Soon</h3>
                    <p>Interactive questions for this section are being prepared.</p>
                    <button class="btn btn-outline" onclick="this.closest('.quiz-engine-container').style.display='none'">
                        Continue Learning
                    </button>
                </div>
            `;
            return this.container;
        }

        // Render the current question
        this.renderCurrentQuestion();
        
        // Store reference for easy access
        this.container.quizEngine = this;
        
        return this.container;
    }

    renderCurrentQuestion() {
        if (this.isComplete) {
            this.renderResults();
            return;
        }

        const question = this.quizData.questions[this.currentQuestionIndex];
        if (!question) {
            console.error('No question found at index:', this.currentQuestionIndex);
            return;
        }

        const totalQuestions = this.quizData.questions.length;
        const progressPercentage = ((this.currentQuestionIndex + 1) / totalQuestions) * 100;

        this.container.innerHTML = `
            <div class="quiz-panel">
                <div class="quiz-header">
                    <div class="quiz-meta">
                        <h3 class="quiz-title">${this.quizData.title || 'Quiz'}</h3>
                        <span class="quiz-progress-text">Question ${this.currentQuestionIndex + 1} of ${totalQuestions}</span>
                    </div>
                    <div class="quiz-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="question-content">
                    <div class="question-stem">
                        <p>${question.stem || question.question}</p>
                        ${question.ref ? `<small class="question-ref">Reference: ${question.ref}</small>` : ''}
                    </div>
                    ${this.renderQuestion(question)}
                </div>
                
                <div class="quiz-footer">
                    <button class="btn btn-outline quiz-prev-btn" 
                            ${this.currentQuestionIndex === 0 ? 'disabled' : ''}
                            onclick="this.closest('.quiz-engine-container').quizEngine.previousQuestion()">
                        ← Previous
                    </button>
                    
                    <div class="quiz-actions">
                        <button class="btn btn-outline quiz-check-btn" 
                                onclick="this.closest('.quiz-engine-container').quizEngine.checkAnswer()">
                            Check Answer
                        </button>
                        <button class="btn btn-primary quiz-next-btn" 
                                onclick="this.closest('.quiz-engine-container').quizEngine.nextQuestion()" 
                                style="display: none;">
                            ${this.currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next →'}
                        </button>
                    </div>
                </div>
                
                <div class="quiz-feedback" id="feedback-${this.currentQuestionIndex}" style="display: none;"></div>
            </div>
        `;

        // Handle special question types
        this.setupQuestionInteractions(question);
    }

    renderQuestion(question) {
        const type = question.type || 'mcq';
        
        switch (type) {
            case 'mcq':
                return this.renderMultipleChoice(question);
            case 'multi-select':
                return this.renderMultiSelect(question);
            case 'fill-blank':
                return this.renderFillBlank(question);
            case 'true-false':
                return this.renderTrueFalse(question);
            case 'drag-drop':
                return this.renderDragDrop(question);
            case 'error-spot':
                return this.renderErrorSpot(question);
            case 'quickfire':
                return this.renderQuickfire(question);
            default:
                console.warn('Unknown question type:', type);
                return this.renderMultipleChoice(question);
        }
    }

    renderMultipleChoice(question) {
        if (!question.options || question.options.length === 0) {
            return '<p class="error-message">No answer options available</p>';
        }

        return `
            <div class="options-list" data-question-type="mcq">
                ${question.options.map((option, index) => `
                    <label class="option-label" data-option-index="${index}">
                        <input type="radio" name="quiz-answer-${this.currentQuestionIndex}" 
                               value="${index}" class="option-input">
                        <span class="option-text">${option.label || option}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    renderMultiSelect(question) {
        if (!question.options || question.options.length === 0) {
            return '<p class="error-message">No answer options available</p>';
        }

        return `
            <div class="options-list" data-question-type="multi-select">
                <p class="instruction">Select all correct answers:</p>
                ${question.options.map((option, index) => `
                    <label class="option-label" data-option-index="${index}">
                        <input type="checkbox" name="quiz-answer-${this.currentQuestionIndex}" 
                               value="${index}" class="option-input">
                        <span class="option-text">${option.label || option}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    renderFillBlank(question) {
        return `
            <div class="fill-blank-container" data-question-type="fill-blank">
                <div class="fill-blank-input-wrapper">
                    <input type="text" class="fill-blank-input" placeholder="Type your answer here..." autocomplete="off">
                </div>
                ${question.hint ? `<small class="question-hint">Hint: ${question.hint}</small>` : ''}
            </div>
        `;
    }

    renderTrueFalse(question) {
        return `
            <div class="options-list" data-question-type="true-false">
                <label class="option-label" data-option-index="true">
                    <input type="radio" name="quiz-answer-${this.currentQuestionIndex}" 
                           value="true" class="option-input">
                    <span class="option-text">True</span>
                </label>
                <label class="option-label" data-option-index="false">
                    <input type="radio" name="quiz-answer-${this.currentQuestionIndex}" 
                           value="false" class="option-input">
                    <span class="option-text">False</span>
                </label>
            </div>
        `;
    }

    renderDragDrop(question) {
        const items = question.items || question.options || [];
        return `
            <div class="drag-drop-container" data-question-type="drag-drop">
                <p class="instruction">Drag items to arrange them in the correct order:</p>
                <div class="drag-items" id="drag-container-${this.currentQuestionIndex}">
                    ${items.map((item, index) => `
                        <div class="drag-item" draggable="true" data-item-id="${index}" data-original-index="${index}">
                            ${item.label || item}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderErrorSpot(question) {
        const words = question.text.split(' ');
        return `
            <div class="error-spot-container" data-question-type="error-spot">
                <p class="instruction">Click on the word that contains an error:</p>
                <div class="error-text">
                    ${words.map((word, index) => `
                        <span class="clickable-word" data-word-index="${index}" onclick="this.classList.toggle('selected')">
                            ${word}
                        </span>
                    `).join(' ')}
                </div>
            </div>
        `;
    }

    renderQuickfire(question) {
        const cards = question.cards || [];
        const timeLimit = question.timeLimit || 30;
        
        return `
            <div class="quickfire-container" data-question-type="quickfire">
                <div class="quickfire-header">
                    <div class="quickfire-timer">
                        <span class="timer-label">Time remaining:</span>
                        <span class="timer-display" id="timer-${this.currentQuestionIndex}">${timeLimit}s</span>
                    </div>
                    <div class="quickfire-score">
                        <span class="score-label">Score:</span>
                        <span class="score-display" id="score-${this.currentQuestionIndex}">0</span>
                    </div>
                </div>
                <div class="quickfire-cards">
                    ${cards.map((card, index) => `
                        <div class="quickfire-card" data-card-index="${index}" style="display: ${index === 0 ? 'block' : 'none'}">
                            <div class="card-question">${card.question}</div>
                            <div class="card-options">
                                ${card.options.map((option, optIndex) => `
                                    <button class="card-option" data-option="${optIndex}">${option}</button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    setupQuestionInteractions(question) {
        const type = question.type || 'mcq';
        
        switch (type) {
            case 'drag-drop':
                this.setupDragDrop();
                break;
            case 'quickfire':
                this.setupQuickfire(question);
                break;
            case 'fill-blank':
                this.setupFillBlank();
                break;
        }
    }

    setupDragDrop() {
        const container = this.container.querySelector('.drag-items');
        if (!container) return;

        let draggedElement = null;

        container.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        });

        container.addEventListener('dragend', (e) => {
            e.target.style.opacity = '';
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && e.target.classList.contains('drag-item')) {
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            }
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.drag-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }

    setupQuickfire(question) {
        const timeLimit = question.timeLimit || 30;
        let currentCard = 0;
        let score = 0;
        let timeLeft = timeLimit;
        
        const timerDisplay = this.container.querySelector(`#timer-${this.currentQuestionIndex}`);
        const scoreDisplay = this.container.querySelector(`#score-${this.currentQuestionIndex}`);
        
        this.timer = setInterval(() => {
            timeLeft--;
            if (timerDisplay) timerDisplay.textContent = `${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.endQuickfire(score, question.cards.length);
            }
        }, 1000);
        
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-option')) {
                const optionIndex = parseInt(e.target.dataset.option);
                const card = question.cards[currentCard];
                
                if (optionIndex === card.correct) {
                    score++;
                    if (scoreDisplay) scoreDisplay.textContent = score;
                    e.target.classList.add('correct');
                } else {
                    e.target.classList.add('incorrect');
                }
                
                setTimeout(() => {
                    currentCard++;
                    if (currentCard < question.cards.length) {
                        this.showNextCard(currentCard);
                    } else {
                        clearInterval(this.timer);
                        this.endQuickfire(score, question.cards.length);
                    }
                }, 1000);
            }
        });
    }

    setupFillBlank() {
        const input = this.container.querySelector('.fill-blank-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            });
        }
    }

    showNextCard(cardIndex) {
        const cards = this.container.querySelectorAll('.quickfire-card');
        cards.forEach((card, index) => {
            card.style.display = index === cardIndex ? 'block' : 'none';
        });
    }

    endQuickfire(score, total) {
        const percentage = Math.round((score / total) * 100);
        this.showFeedback(null, null, percentage >= 70, `You got ${score} out of ${total} correct (${percentage}%)`);
    }

    checkAnswer() {
        const question = this.quizData.questions[this.currentQuestionIndex];
        const userAnswer = this.getUserAnswer(question);
        const isCorrect = this.validateAnswer(question, userAnswer);
        
        // Store answer
        this.answers[this.currentQuestionIndex] = {
            question: question,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            timestamp: Date.now()
        };
        
        // Update score
        if (isCorrect) {
            this.score++;
        }
        
        // Show feedback
        this.showFeedback(question, userAnswer, isCorrect);
        
        // Show next button
        const nextBtn = this.container.querySelector('.quiz-next-btn');
        const checkBtn = this.container.querySelector('.quiz-check-btn');
        if (nextBtn && checkBtn) {
            nextBtn.style.display = 'inline-block';
            checkBtn.style.display = 'none';
        }
    }

    getUserAnswer(question) {
        const questionContainer = this.container.querySelector('.question-content');
        const type = question.type || 'mcq';
        
        switch (type) {
            case 'mcq':
            case 'true-false':
                const selectedRadio = questionContainer.querySelector('input[type="radio"]:checked');
                return selectedRadio ? selectedRadio.value : null;
                
            case 'multi-select':
                const selectedCheckboxes = questionContainer.querySelectorAll('input[type="checkbox"]:checked');
                return Array.from(selectedCheckboxes).map(cb => cb.value);
                
            case 'fill-blank':
                const textInput = questionContainer.querySelector('.fill-blank-input');
                return textInput ? textInput.value.trim() : '';
                
            case 'drag-drop':
                const dragItems = questionContainer.querySelectorAll('.drag-item');
                return Array.from(dragItems).map(item => item.dataset.originalIndex);
                
            case 'error-spot':
                const selectedWord = questionContainer.querySelector('.clickable-word.selected');
                return selectedWord ? selectedWord.dataset.wordIndex : null;
                
            default:
                return null;
        }
    }

    validateAnswer(question, userAnswer) {
        const type = question.type || 'mcq';
        
        switch (type) {
            case 'mcq':
                const correctOption = question.options.findIndex(opt => opt.correct);
                return userAnswer === correctOption.toString();
                
            case 'multi-select':
                const correctIndices = question.options
                    .map((opt, index) => opt.correct ? index.toString() : null)
                    .filter(index => index !== null);
                return Array.isArray(userAnswer) && 
                       userAnswer.length === correctIndices.length &&
                       userAnswer.every(answer => correctIndices.includes(answer));
                       
            case 'true-false':
                return userAnswer === question.correct.toString();
                
            case 'fill-blank':
                const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
                return correctAnswers.some(correct => 
                    userAnswer.toLowerCase() === correct.toLowerCase()
                );
                
            case 'drag-drop':
                const correctOrder = question.correctOrder || question.options.map((_, i) => i.toString());
                return Array.isArray(userAnswer) && 
                       userAnswer.length === correctOrder.length &&
                       userAnswer.every((answer, index) => answer === correctOrder[index]);
                       
            case 'error-spot':
                return userAnswer === question.errorIndex.toString();
                
            default:
                return false;
        }
    }

    showFeedback(question, userAnswer, isCorrect, customMessage = null) {
        const feedbackEl = this.container.querySelector(`#feedback-${this.currentQuestionIndex}`);
        if (!feedbackEl) return;

        const feedbackClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
        const feedbackIcon = isCorrect ? '✅' : '❌';
        const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';
        
        let message = customMessage || feedbackText;
        if (question && question.rationale) {
            message += `<br><strong>Explanation:</strong> ${question.rationale}`;
        }

        feedbackEl.className = `quiz-feedback ${feedbackClass}`;
        feedbackEl.innerHTML = `
            <div class="feedback-header">
                <span class="feedback-icon">${feedbackIcon}</span>
                <span class="feedback-status">${feedbackText}</span>
            </div>
            <div class="feedback-message">${message}</div>
        `;
        
        feedbackEl.style.display = 'block';
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderCurrentQuestion();
        } else {
            this.completeQuiz();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderCurrentQuestion();
        }
    }

    completeQuiz() {
        this.isComplete = true;
        const endTime = Date.now();
        const timeSpent = Math.round((endTime - this.startTime) / 1000);
        const percentage = Math.round((this.score / this.quizData.questions.length) * 100);
        
        // Emit completion event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('quiz-completed', {
                detail: {
                    chapterId: this.chapterId,
                    sectionId: this.sectionId,
                    score: this.score,
                    total: this.quizData.questions.length,
                    percentage: percentage,
                    timeSpent: timeSpent,
                    answers: this.answers
                }
            }));
        }
        
        this.renderResults();
    }

    renderResults() {
        const percentage = Math.round((this.score / this.quizData.questions.length) * 100);
        const passed = percentage >= 80;
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
        
        this.container.innerHTML = `
            <div class="quiz-results">
                <div class="results-header">
                    <div class="results-icon ${passed ? 'results-pass' : 'results-fail'}">
                        ${passed ? '🎉' : '📚'}
                    </div>
                    <h3 class="results-title">${passed ? 'Well Done!' : 'Keep Learning!'}</h3>
                    <p class="results-subtitle">
                        ${passed ? 'You passed this quiz!' : 'Review the material and try again.'}
                    </p>
                </div>
                
                <div class="results-stats">
                    <div class="stat-item">
                        <span class="stat-label">Score</span>
                        <span class="stat-value">${this.score}/${this.quizData.questions.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Percentage</span>
                        <span class="stat-value">${percentage}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Time</span>
                        <span class="stat-value">${timeSpent}s</span>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-outline" onclick="this.closest('.quiz-engine-container').quizEngine.reviewAnswers()">
                        Review Answers
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.quiz-engine-container').quizEngine.retakeQuiz()">
                        Retake Quiz
                    </button>
                </div>
            </div>
        `;
    }

    reviewAnswers() {
        this.container.innerHTML = `
            <div class="quiz-review">
                <div class="review-header">
                    <h3>Answer Review</h3>
                    <p>Review your answers and explanations:</p>
                </div>
                
                <div class="review-questions">
                    ${this.answers.map((answer, index) => {
                        const question = answer.question;
                        return `
                            <div class="review-item ${answer.isCorrect ? 'correct' : 'incorrect'}">
                                <div class="review-question">
                                    <span class="question-number">Q${index + 1}</span>
                                    <span class="question-text">${question.stem || question.question}</span>
                                    <span class="result-icon">${answer.isCorrect ? '✅' : '❌'}</span>
                                </div>
                                ${question.rationale ? `
                                    <div class="review-explanation">
                                        <strong>Explanation:</strong> ${question.rationale}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="review-actions">
                    <button class="btn btn-outline" onclick="this.closest('.quiz-engine-container').quizEngine.renderResults()">
                        Back to Results
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.quiz-engine-container').quizEngine.retakeQuiz()">
                        Retake Quiz
                    </button>
                </div>
            </div>
        `;
    }

    retakeQuiz() {
        // Reset quiz state
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.isComplete = false;
        this.startTime = Date.now();
        
        // Clear any timers
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Re-render first question
        this.renderCurrentQuestion();
    }

    // Static method to load quiz data from JSON files
    static async loadQuizData(chapterId) {
        try {
            const response = await fetch(`../data/${chapterId}-quiz.json`);
            if (!response.ok) {
                throw new Error(`Quiz data not found for ${chapterId}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not load quiz data:', error);
            return null;
        }
    }
}

// LEGACY CONSTRUCTOR SUPPORT - for old code that uses different parameter order
export class LegacyQuizEngine extends QuizEngine {
    constructor(containerId, quizData, chapterId, sectionId) {
        // Call parent constructor with corrected parameter order
        super(quizData, chapterId, sectionId);
        
        // Store container ID for legacy compatibility
        this.legacyContainerId = containerId;
        
        console.warn('LegacyQuizEngine is deprecated. Use QuizEngine with new parameter order.');
    }
    
    // Legacy init method that appends to existing container
    init() {
        if (this.legacyContainerId) {
            const container = document.getElementById(this.legacyContainerId);
            if (container) {
                const quizElement = this.render();
                container.appendChild(quizElement);
            } else {
                console.error('Legacy container not found:', this.legacyContainerId);
            }
        }
        return this;
    }
}

// Export for use in other modules
export const loadQuizData = QuizEngine.loadQuizData;

// Make available globally for onclick handlers and legacy code
if (typeof window !== 'undefined') {
    window.QuizEngine = QuizEngine;
    window.LegacyQuizEngine = LegacyQuizEngine;
}

console.log('Enhanced QuizEngine loaded successfully');
