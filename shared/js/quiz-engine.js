// Quiz Engine for The Canadian Style Learning Platform
// Fixed version - prevents null values and improves error handling

export class QuizEngine {
    constructor(quizData, chapterId, sectionId) {
        this.quizData = quizData || { questions: [], title: 'Quiz' };
        this.chapterId = chapterId;
        this.sectionId = sectionId;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.startTime = Date.now();
        this.isComplete = false;
        this.container = null;
    }

    // Create and return the quiz container element
    render() {
        if (!this.quizData.questions || this.quizData.questions.length === 0) {
            return this.renderEmptyQuiz();
        }

        this.container = document.createElement('div');
        this.container.className = 'quiz-engine-container';
        this.renderCurrentQuestion();
        return this.container;
    }

    renderEmptyQuiz() {
        const emptyContainer = document.createElement('div');
        emptyContainer.className = 'quiz-empty';
        emptyContainer.innerHTML = `
            <div class="empty-quiz-message">
                <p>📝 Quiz questions will be available soon for this section.</p>
            </div>
        `;
        return emptyContainer;
    }

    renderCurrentQuestion() {
        if (this.isComplete) {
            this.renderResults();
            return;
        }

        const question = this.quizData.questions[this.currentQuestionIndex];
        const questionNumber = this.currentQuestionIndex + 1;
        const totalQuestions = this.quizData.questions.length;

        this.container.innerHTML = `
            <div class="quiz-panel">
                <div class="quiz-header">
                    <h3 class="quiz-title">${this.quizData.title || 'Section Quiz'}</h3>
                    <div class="quiz-meta">
                        <span class="question-counter">
                            Question ${questionNumber} of ${totalQuestions}
                        </span>
                        <div class="quiz-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(questionNumber / totalQuestions) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="quiz-body">
                    <div class="question-stem">
                        ${question.stem || question.question || 'Question text not available'}
                    </div>
                    
                    <div class="question-content">
                        ${this.renderQuestion(question)}
                    </div>
                </div>
                
                <div class="quiz-footer">
                    <button class="btn btn-secondary quiz-prev-btn" 
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

        // Store reference to this quiz engine on the container
        this.container.quizEngine = this;
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
            default:
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
                <p class="instruction">Select all that apply:</p>
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
                <div class="fill-blank-question">
                    ${question.text || question.stem || 'Complete the sentence:'}
                </div>
                <input type="text" class="fill-blank-input" 
                       placeholder="Enter your answer here..." 
                       data-correct-answer="${question.answer || ''}">
            </div>
        `;
    }

    renderTrueFalse(question) {
        return `
            <div class="options-list" data-question-type="true-false">
                <label class="option-label" data-option-index="0">
                    <input type="radio" name="quiz-answer-${this.currentQuestionIndex}" 
                           value="true" class="option-input">
                    <span class="option-text">True</span>
                </label>
                <label class="option-label" data-option-index="1">
                    <input type="radio" name="quiz-answer-${this.currentQuestionIndex}" 
                           value="false" class="option-input">
                    <span class="option-text">False</span>
                </label>
            </div>
        `;
    }

    renderDragDrop(question) {
        const items = question.items || [];
        return `
            <div class="drag-drop-container" data-question-type="drag-drop">
                <p class="instruction">Drag items to arrange them in the correct order:</p>
                <div class="drag-items">
                    ${items.map((item, index) => `
                        <div class="drag-item" draggable="true" data-item-id="${index}">
                            ${item}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    checkAnswer() {
        const question = this.quizData.questions[this.currentQuestionIndex];
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
                return Array.from(dragItems).map(item => item.dataset.itemId);
                
            default:
                return null;
        }
    }

    validateAnswer(question, userAnswer) {
        const type = question.type || 'mcq';
        
        switch (type) {
            case 'mcq':
                const correctIndex = question.options.findIndex(opt => opt.correct === true);
                return parseInt(userAnswer) === correctIndex;
                
            case 'multi-select':
                const correctIndices = question.options
                    .map((opt, index) => opt.correct ? index.toString() : null)
                    .filter(index => index !== null);
                return Array.isArray(userAnswer) && 
                       userAnswer.length === correctIndices.length &&
                       userAnswer.every(ans => correctIndices.includes(ans));
                
            case 'fill-blank':
                const correctAnswer = question.answer || '';
                return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
                
            case 'true-false':
                return userAnswer === question.answer?.toString();
                
            case 'drag-drop':
                const correctOrder = question.correctOrder || [];
                return Array.isArray(userAnswer) && 
                       userAnswer.length === correctOrder.length &&
                       userAnswer.every((item, index) => item === correctOrder[index]);
                
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
    }

    disableInputs() {
        const inputs = this.container.querySelectorAll('input, button');
        inputs.forEach(input => {
            if (!input.classList.contains('quiz-next-btn') && !input.classList.contains('quiz-prev-btn')) {
                input.disabled = true;
            }
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
                        ${passed ? '🎉' : '📚'}
                    </div>
                    <h3>Quiz Complete!</h3>
                </div>
                
                <div class="results-stats">
                    <div class="stat">
                        <div class="stat-value">${this.score}/${this.quizData.questions.length}</div>
                        <div class="stat-label">Correct Answers</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${percentage}%</div>
                        <div class="stat-label">Score</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${timeSpent}s</div>
                        <div class="stat-label">Time Spent</div>
                    </div>
                </div>
                
                <div class="results-message ${passed ? 'passed' : 'failed'}">
                    ${passed 
                        ? '✅ Great job! You passed this quiz and the section is now marked as complete.' 
                        : '📖 You need 80% or higher to pass. Review the material and try again.'}
                </div>
                
                <div class="results-actions">
                    ${!passed ? `
                        <button class="btn btn-primary" onclick="this.closest('.quiz-engine-container').quizEngine.retryQuiz()">
                            Try Again
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="this.closest('.quiz-engine-container').quizEngine.reviewAnswers()">
                        Review Answers
                    </button>
                </div>
            </div>
        `;
    }

    retryQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.startTime = Date.now();
        this.isComplete = false;
        this.renderCurrentQuestion();
    }

    reviewAnswers() {
        // Show detailed review of all answers
        const reviewHtml = this.quizData.questions.map((question, index) => {
            const answer = this.answers[index];
            if (!answer) return '';
            
            return `
                <div class="answer-review ${answer.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="review-header">
                        <span class="review-number">Question ${index + 1}</span>
                        <span class="review-status">${answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}</span>
                    </div>
                    <div class="review-question">${question.stem || question.question}</div>
                    <div class="review-answer">Your answer: ${answer.userAnswer}</div>
                    ${question.rationale ? `<div class="review-explanation">${question.rationale}</div>` : ''}
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="quiz-review">
                <div class="review-header">
                    <h3>Answer Review</h3>
                    <button class="btn btn-secondary" onclick="this.closest('.quiz-engine-container').quizEngine.renderResults()">
                        Back to Results
                    </button>
                </div>
                <div class="review-content">
                    ${reviewHtml}
                </div>
            </div>
        `;
    }
}

// Utility function to load quiz data from JSON files
export async function loadQuizData(chapterId) {
    try {
        const response = await fetch(`../data/quizzes/${chapterId}-quiz.json`);
        if (!response.ok) {
            console.warn(`Quiz data not found for ${chapterId}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading quiz data for ${chapterId}:`, error);
        return null;
    }
}

// Create default quiz data structure to prevent null errors
export function createDefaultQuizData(sectionId, title) {
    return {
        id: `${sectionId}-quiz`,
        title: title || 'Section Quiz',
        questions: [],
        meta: {
            created: new Date().toISOString(),
            version: '1.0'
        }
    };
}

console.log('Quiz Engine loaded successfully');
