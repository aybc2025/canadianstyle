/**
 * Enhanced Quiz Engine for The Canadian Style Learning Platform
 * Supports multiple question types with comprehensive feedback
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
            <div class="instruction">Select all correct answers:</div>
            <div class="options-list" data-question-type="multi-select">
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
                <p class="fill-blank-question">${question.text || question.stem}</p>
                <input type="text" class="fill-blank-input" 
                       placeholder="Enter your answer..." 
                       autocomplete="off">
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
                        <span class="score-display" id="score-${this.currentQuestionIndex}">0/${cards.length}</span>
                    </div>
                </div>
                <div class="flashcard" id="flashcard-${this.currentQuestionIndex}" data-card-index="0">
                    <div class="card-front" onclick="this.closest('.flashcard').classList.add('flipped')">
                        ${cards[0]?.front || 'No cards available'}
                    </div>
                    <div class="card-back">
                        <div class="card-answer">${cards[0]?.back || ''}</div>
                        <div class="card-actions">
                            <button class="btn btn-outline" onclick="this.closest('.quiz-engine-container').quizEngine.quickfireNext(false)">
                                ❌ Incorrect
                            </button>
                            <button class="btn btn-primary" onclick="this.closest('.quiz-engine-container').quizEngine.quickfireNext(true)">
                                ✅ Correct
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupQuestionInteractions(question) {
        if (question.type === 'drag-drop') {
            this.setupDragAndDrop();
        } else if (question.type === 'quickfire') {
            this.setupQuickfire(question);
        }
        
        // Add click handlers for options
        this.container.querySelectorAll('.option-label').forEach(label => {
            label.addEventListener('click', () => {
                // Handle single vs multiple selection
                const questionType = label.closest('[data-question-type]')?.dataset.questionType;
                if (questionType === 'mcq' || questionType === 'true-false') {
                    // Single selection - remove other selections
                    label.closest('.options-list').querySelectorAll('.option-label').forEach(l => {
                        l.classList.remove('selected');
                    });
                }
                label.classList.toggle('selected');
            });
        });
    }

    setupDragAndDrop() {
        const dragContainer = this.container.querySelector('.drag-items');
        if (!dragContainer) return;

        let draggedElement = null;

        dragContainer.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('drag-item')) {
                draggedElement = e.target;
                e.target.classList.add('dragging');
            }
        });

        dragContainer.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('drag-item')) {
                e.target.classList.remove('dragging');
                draggedElement = null;
            }
        });

        dragContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(dragContainer, e.clientY);
            if (draggedElement) {
                if (afterElement == null) {
                    dragContainer.appendChild(draggedElement);
                } else {
                    dragContainer.insertBefore(draggedElement, afterElement);
                }
            }
        });
    }

    getDragAfterElement(container, y) {
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

    setupQuickfire(question) {
        const timeLimit = question.timeLimit || 30;
        const cards = question.cards || [];
        let currentCardIndex = 0;
        let timeRemaining = timeLimit;
        let score = 0;

        this.quickfireData = {
            cards,
            currentCardIndex: 0,
            score: 0,
            totalTime: timeLimit
        };

        // Start timer
        this.timer = setInterval(() => {
            timeRemaining--;
            const timerDisplay = this.container.querySelector(`#timer-${this.currentQuestionIndex}`);
            if (timerDisplay) {
                timerDisplay.textContent = `${timeRemaining}s`;
            }
            
            if (timeRemaining <= 0) {
                clearInterval(this.timer);
                this.quickfireTimeUp();
            }
        }, 1000);
    }

    quickfireNext(isCorrect) {
        if (!this.quickfireData) return;

        if (isCorrect) {
            this.quickfireData.score++;
        }

        this.quickfireData.currentCardIndex++;
        
        // Update score display
        const scoreDisplay = this.container.querySelector(`#score-${this.currentQuestionIndex}`);
        if (scoreDisplay) {
            scoreDisplay.textContent = `${this.quickfireData.score}/${this.quickfireData.cards.length}`;
        }

        // Check if finished
        if (this.quickfireData.currentCardIndex >= this.quickfireData.cards.length) {
            clearInterval(this.timer);
            this.quickfireComplete();
            return;
        }

        // Show next card
        const flashcard = this.container.querySelector(`#flashcard-${this.currentQuestionIndex}`);
        const nextCard = this.quickfireData.cards[this.quickfireData.currentCardIndex];
        
        if (flashcard && nextCard) {
            flashcard.classList.remove('flipped');
            flashcard.querySelector('.card-front').textContent = nextCard.front;
            flashcard.querySelector('.card-answer').textContent = nextCard.back;
        }
    }

    quickfireTimeUp() {
        this.quickfireComplete();
    }

    quickfireComplete() {
        const percentage = Math.round((this.quickfireData.score / this.quickfireData.cards.length) * 100);
        this.score = percentage >= 70 ? 1 : 0; // Pass if 70% or better
        this.answers[this.currentQuestionIndex] = {
            userAnswer: `${this.quickfireData.score}/${this.quickfireData.cards.length}`,
            isCorrect: this.score === 1,
            question: 'Quickfire Round'
        };
        
        this.showFeedback({
            rationale: `You got ${this.quickfireData.score} out of ${this.quickfireData.cards.length} correct (${percentage}%).`
        }, null, this.score === 1);
        
        // Show next button
        const checkBtn = this.container.querySelector('.quiz-check-btn');
        const nextBtn = this.container.querySelector('.quiz-next-btn');
        
        if (checkBtn) checkBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'inline-block';
    }

    checkAnswer() {
        const question = this.quizData.questions[this.currentQuestionIndex];
        
        // Skip if quickfire (handled separately)
        if (question.type === 'quickfire') {
            return;
        }
        
        const userAnswer = this.getUserAnswer();
        const isCorrect = this.validateAnswer(question, userAnswer);
        
        this.answers[this.currentQuestionIndex] = {
            userAnswer,
            isCorrect,
            question: question.stem || question.question
        };

        if (isCorrect) {
            this.score++;
        }

        this.showFeedback(question, userAnswer, isCorrect);
        
        // Hide check button, show next button
        const checkBtn = this.container.querySelector('.quiz-check-btn');
        const nextBtn = this.container.querySelector('.quiz-next-btn');
        
        if (checkBtn) checkBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'inline-block';
        
        // Disable further input
        this.disableInputs();
    }

    getUserAnswer() {
        const questionContainer = this.container.querySelector('.question-content');
        const questionType = questionContainer.querySelector('[data-question-type]')?.dataset.questionType;
        
        switch (questionType) {
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
                const correctAnswers = Array.isArray(question.correct) ? question.correct : [question.correct];
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

    showFeedback(question, userAnswer, isCorrect) {
        const feedbackEl = this.container.querySelector(`#feedback-${this.currentQuestionIndex}`);
        if (!feedbackEl) return;

        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackIcon = isCorrect ? '✅' : '❌';
        const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';
        
        let explanationText = '';
        if (question.rationale) {
            explanationText = `<div class="explanation">${question.rationale}</div>`;
        } else if (!isCorrect && question.options) {
            const correctOption = question.options.find(opt => opt.correct);
            if (correctOption) {
                explanationText = `<div class="explanation">The correct answer is: ${correctOption.label || correctOption}</div>`;
            }
        }

        feedbackEl.innerHTML = `
            <div class="feedback-content ${feedbackClass}">
                <div class="feedback-header">
                    <span class="feedback-icon">${feedbackIcon}</span>
                    <span class="feedback-text">${feedbackText}</span>
                </div>
                ${explanationText}
            </div>
        `;
        
        feedbackEl.style.display = 'block';
        
        // Scroll feedback into view
        setTimeout(() => {
            feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    disableInputs() {
        const inputs = this.container.querySelectorAll('input, .clickable-word, .drag-item');
        inputs.forEach(input => {
            input.disabled = true;
            input.style.pointerEvents = 'none';
            input.style.opacity = '0.7';
        });
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderCurrentQuestion();
        } else {
            this.finishQuiz();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderCurrentQuestion();
        }
    }

    finishQuiz() {
        this.isComplete = true;
        this.renderResults();
        
        // Mark section as complete if score is good enough
        const percentage = (this.score / this.quizData.questions.length) * 100;
        if (percentage >= 80 && window.setProgress) {
            window.setProgress(this.chapterId, this.sectionId, true);
        }
        
        // Emit completion event
        window.dispatchEvent(new CustomEvent('quiz-completed', {
            detail: {
                chapterId: this.chapterId,
                sectionId: this.sectionId,
                score: this.score,
                total: this.quizData.questions.length,
                percentage: Math.round(percentage),
                answers: this.answers
            }
        }));
    }

    renderResults() {
        const percentage = Math.round((this.score / this.quizData.questions.length) * 100);
        const passed = percentage >= 80;
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
        
        this.container.innerHTML = `
            <div class="quiz-results">
                <div class="results-header">
                    <div class="results-icon ${passed ? 'passed' : 'failed'}">
                        ${passed ? '🎉' : '📝'}
                    </div>
                    <h3>${passed ? 'Congratulations!' : 'Good Effort!'}</h3>
                    <p class="results-message ${passed ? 'passed' : 'failed'}">
                        ${passed ? 
                            'You have successfully completed this quiz!' : 
                            'Review the material and try again to improve your score.'
                        }
                    </p>
                </div>
                
                <div class="results-stats">
                    <div class="stat">
                        <span class="stat-value">${this.score}</span>
                        <span class="stat-label">Correct Answers</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${percentage}%</span>
                        <span class="stat-label">Score</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${timeSpent}s</span>
                        <span class="stat-label">Time Taken</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${this.quizData.questions.length}</span>
                        <span class="stat-label">Total Questions</span>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-outline" onclick="this.closest('.quiz-engine-container').quizEngine.reviewAnswers()">
                        Review Answers
                    </button>
                    ${!passed ? `
                        <button class="btn btn-primary" onclick="this.closest('.quiz-engine-container').quizEngine.retakeQuiz()">
                            Retake Quiz
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="this.closest('.quiz-engine-container').style.display='none'">
                            Continue Learning
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    reviewAnswers() {
        this.container.innerHTML = `
            <div class="answer-review">
                <div class="review-header">
                    <h3>Answer Review</h3>
                    <span class="review-score">${this.score}/${this.quizData.questions.length} Correct</span>
                </div>
                
                <div class="review-content">
                    ${this.answers.map((answer, index) => {
                        const question = this.quizData.questions[index];
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

// Export for use in other modules
export const loadQuizData = QuizEngine.loadQuizData;

// Make available globally for onclick handlers
window.QuizEngine = QuizEngine;

console.log('Enhanced QuizEngine loaded successfully');
