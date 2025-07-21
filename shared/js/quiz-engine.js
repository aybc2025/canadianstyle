/**
 * Quiz Engine for The Canadian Style Learning Platform
 * Handles all quiz functionality including multiple question types,
 * scoring, progress tracking, and integration with JSON data files
 */

export class QuizEngine {
    constructor(quizData, chapterId, sectionId) {
        this.quizData = quizData;
        this.chapterId = chapterId;
        this.sectionId = sectionId;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.isComplete = false;
        this.startTime = Date.now();
        this.timer = null;
        this.container = null;
        
        // Validate quiz data
        if (!this.quizData || !this.quizData.questions || !Array.isArray(this.quizData.questions)) {
            console.error('Invalid quiz data provided:', this.quizData);
            return;
        }
        
        // Shuffle questions for variety
        this.questions = this.shuffleArray([...this.quizData.questions]);
    }

    /**
     * Render the quiz in the specified container
     */
    render(container) {
        if (!container) {
            console.error('No container provided for quiz rendering');
            return;
        }
        
        this.container = container;
        this.container.innerHTML = `
            <div class="quiz-engine-container" id="quiz-${this.chapterId}-${this.sectionId}">
                <div class="quiz-header">
                    <h3>📝 Quiz: ${this.quizData.title}</h3>
                    <div class="quiz-progress">
                        <span class="current-question">Question 1</span>
                        <span class="total-questions">of ${this.questions.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
                <div class="quiz-content">
                    <!-- Quiz content will be rendered here -->
                </div>
                <div class="quiz-actions">
                    <!-- Quiz actions will be rendered here -->
                </div>
            </div>
        `;
        
        // Store reference to quiz engine on container for external access
        this.container.quizEngine = this;
        
        this.renderCurrentQuestion();
    }

    /**
     * Render the current question
     */
    renderCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.completeQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const quizContent = this.container.querySelector('.quiz-content');
        const quizActions = this.container.querySelector('.quiz-actions');

        // Render question based on type
        let questionHTML = '';
        switch (question.type) {
            case 'mcq':
                questionHTML = this.renderMCQ(question);
                break;
            case 'fill-blank':
                questionHTML = this.renderFillBlank(question);
                break;
            case 'matching':
                questionHTML = this.renderMatching(question);
                break;
            case 'drag-drop':
                questionHTML = this.renderDragDrop(question);
                break;
            case 'error-spot':
                questionHTML = this.renderErrorSpot(question);
                break;
            default:
                questionHTML = `<p>Unsupported question type: ${question.type}</p>`;
        }

        quizContent.innerHTML = `
            <div class="question-container">
                <div class="question-header">
                    <span class="question-number">Question ${this.currentQuestionIndex + 1}</span>
                    ${question.ref ? `<span class="question-ref">${question.ref}</span>` : ''}
                </div>
                <div class="question-stem">${question.stem}</div>
                <div class="question-content">
                    ${questionHTML}
                </div>
            </div>
        `;

        // Render action buttons
        quizActions.innerHTML = `
            <div class="quiz-navigation">
                ${this.currentQuestionIndex > 0 ? 
                    '<button class="btn btn-outline quiz-prev">Previous</button>' : 
                    '<div></div>'
                }
                <button class="btn btn-primary quiz-next">
                    ${this.currentQuestionIndex === this.questions.length - 1 ? 'Finish Quiz' : 'Next'}
                </button>
            </div>
        `;

        // Update progress indicator
        this.updateProgress();

        // Attach event listeners
        this.attachEventListeners(question);
        this.attachNavigationListeners();
    }

    /**
     * Render Multiple Choice Question
     */
    renderMCQ(question) {
        const isMultiSelect = question.options.filter(opt => opt.correct).length > 1;
        const inputType = isMultiSelect ? 'checkbox' : 'radio';
        
        return `
            <div class="mcq-container">
                ${isMultiSelect ? '<p class="instruction">Select all correct answers:</p>' : ''}
                <div class="options-list">
                    ${question.options.map((option, index) => `
                        <label class="option-label">
                            <input type="${inputType}" 
                                   name="question-${question.id}" 
                                   value="${index}"
                                   class="option-input">
                            <span class="option-text">${option.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Fill in the Blank Question
     */
    renderFillBlank(question) {
        return `
            <div class="fill-blank-container">
                <div class="blank-sentence">
                    ${question.stem.replace('___', '<input type="text" class="blank-input" placeholder="Enter your answer">')}
                </div>
            </div>
        `;
    }

    /**
     * Render Matching Question
     */
    renderMatching(question) {
        const rightItems = this.shuffleArray([...question.pairs.map(pair => pair.right)]);
        
        return `
            <div class="matching-container">
                <div class="matching-instructions">
                    <p>Match each item on the left with the correct item on the right:</p>
                </div>
                <div class="matching-pairs">
                    ${question.pairs.map((pair, index) => `
                        <div class="matching-row">
                            <div class="matching-left">${pair.left}</div>
                            <div class="matching-arrow">→</div>
                            <div class="matching-right">
                                <select class="matching-select" data-left-item="${pair.left}">
                                    <option value="">Choose...</option>
                                    ${rightItems.map((item, itemIndex) => `
                                        <option value="${item}">${item}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Drag and Drop Question
     */
    renderDragDrop(question) {
        const shuffledItems = this.shuffleArray([...question.items]);
        
        return `
            <div class="drag-drop-container">
                <div class="drag-drop-instructions">
                    <p>${question.instructions || 'Drag the items to arrange them in the correct order:'}</p>
                </div>
                <div class="sortable-list" id="sortable-${question.id}">
                    ${shuffledItems.map((item, index) => `
                        <div class="sortable-item" data-order="${item.order}" data-text="${item.text}">
                            <span class="drag-handle">⋮⋮</span>
                            <span class="item-text">${item.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Error Spotting Question
     */
    renderErrorSpot(question) {
        // Split text and highlight the error position
        const text = question.text;
        const errorPosition = question.errorPosition;
        
        let highlightedText = text;
        if (errorPosition && text.includes(errorPosition)) {
            highlightedText = text.replace(
                errorPosition,
                `<span class="error-spot-target" data-error="${errorPosition}">${errorPosition}</span>`
            );
        }
        
        return `
            <div class="error-spot-container">
                <div class="error-spot-instructions">
                    <p>Click on the error in the following text:</p>
                </div>
                <div class="error-spot-text">
                    ${highlightedText}
                </div>
                <div class="error-spot-feedback" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Attach event listeners for interactive elements
     */
    attachEventListeners(question) {
        switch (question.type) {
            case 'drag-drop':
                this.setupDragAndDrop(question);
                break;
            case 'error-spot':
                this.setupErrorSpotting(question);
                break;
        }
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop(question) {
        const sortableList = this.container.querySelector(`#sortable-${question.id}`);
        if (!sortableList) return;
        
        // Simple drag and drop implementation
        let draggedElement = null;
        
        sortableList.addEventListener('dragstart', (e) => {
            draggedElement = e.target.closest('.sortable-item');
            e.target.style.opacity = '0.5';
        });
        
        sortableList.addEventListener('dragend', (e) => {
            e.target.style.opacity = '';
            draggedElement = null;
        });
        
        sortableList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        sortableList.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest('.sortable-item');
            if (dropTarget && draggedElement && dropTarget !== draggedElement) {
                const rect = dropTarget.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    sortableList.insertBefore(draggedElement, dropTarget);
                } else {
                    sortableList.insertBefore(draggedElement, dropTarget.nextSibling);
                }
            }
        });
        
        // Make items draggable
        sortableList.querySelectorAll('.sortable-item').forEach(item => {
            item.draggable = true;
        });
    }

    /**
     * Setup error spotting functionality - FIXED VERSION
     */
    setupErrorSpotting(question) {
        const feedbackDiv = this.container.querySelector('.error-spot-feedback');
        
        // Validate that we have the required data
        if (!question.errorPosition) {
            console.warn('Error spotting question missing errorPosition:', question);
            return;
        }
        
        // Make all words clickable for error spotting
        const textContainer = this.container.querySelector('.error-spot-text');
        if (!textContainer) {
            console.warn('Error spotting container not found');
            return;
        }
        
        const words = textContainer.textContent.split(/(\s+)/);
        
        textContainer.innerHTML = words.map(word => {
            if (word.trim()) {
                // Safe comparison with proper null checking
                const errorPosition = question.errorPosition ? question.errorPosition.trim() : '';
                const isError = word.trim() === errorPosition;
                return `<span class="clickable-word ${isError ? 'error-word' : ''}" data-word="${word.trim()}">${word}</span>`;
            }
            return word;
        }).join('');
        
        // Add click listeners
        textContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('clickable-word')) {
                const clickedWord = e.target.dataset.word;
                const errorPosition = question.errorPosition ? question.errorPosition.trim() : '';
                const isCorrect = clickedWord === errorPosition;
                
                // Remove previous selections
                textContainer.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                textContainer.querySelectorAll('.incorrect-selection').forEach(el => el.classList.remove('incorrect-selection'));
                
                // Mark selection
                e.target.classList.add(isCorrect ? 'selected' : 'incorrect-selection');
                
                // Show feedback
                if (feedbackDiv) {
                    feedbackDiv.style.display = 'block';
                    const correction = question.correction || 'the correct form';
                    feedbackDiv.innerHTML = isCorrect ? 
                        `<div class="feedback correct">✅ Correct! "${clickedWord}" should be "${correction}"</div>` :
                        `<div class="feedback incorrect">❌ Incorrect. Try again!</div>`;
                }
            }
        });
    }

    /**
     * Attach navigation event listeners
     */
    attachNavigationListeners() {
        const nextBtn = this.container.querySelector('.quiz-next');
        const prevBtn = this.container.querySelector('.quiz-prev');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousQuestion();
            });
        }
    }

    /**
     * Move to next question
     */
    nextQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const answer = this.collectAnswer(question);
        
        if (!answer) {
            this.showError('Please answer the question before continuing.');
            return;
        }

        // Store the answer
        this.answers[this.currentQuestionIndex] = answer;

        // Move to next question or complete quiz
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderCurrentQuestion();
        } else {
            this.completeQuiz();
        }
    }

    /**
     * Move to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderCurrentQuestion();
            
            // Restore previous answer if exists
            const previousAnswer = this.answers[this.currentQuestionIndex];
            if (previousAnswer) {
                this.restoreAnswer(this.questions[this.currentQuestionIndex], previousAnswer);
            }
        }
    }

    /**
     * Collect answer from current question
     */
    collectAnswer(question) {
        switch (question.type) {
            case 'mcq':
                return this.collectMCQAnswer(question);
            case 'fill-blank':
                return this.collectFillBlankAnswer(question);
            case 'matching':
                return this.collectMatchingAnswer(question);
            case 'drag-drop':
                return this.collectDragDropAnswer(question);
            case 'error-spot':
                return this.collectErrorSpotAnswer(question);
            default:
                return null;
        }
    }

    /**
     * Collect MCQ answer
     */
    collectMCQAnswer(question) {
        const inputs = this.container.querySelectorAll(`input[name="question-${question.id}"]:checked`);
        if (inputs.length === 0) return null;
        
        const selectedIndices = Array.from(inputs).map(input => parseInt(input.value));
        const isMultiSelect = question.options.filter(opt => opt.correct).length > 1;
        
        let isCorrect;
        if (isMultiSelect) {
            const correctIndices = question.options.map((opt, idx) => opt.correct ? idx : null).filter(idx => idx !== null);
            isCorrect = selectedIndices.length === correctIndices.length && 
                       selectedIndices.every(idx => correctIndices.includes(idx));
        } else {
            isCorrect = selectedIndices.length === 1 && question.options[selectedIndices[0]].correct;
        }
        
        return {
            questionId: question.id,
            selected: selectedIndices,
            isCorrect: isCorrect,
            type: 'mcq'
        };
    }

    /**
     * Collect fill-in-the-blank answer
     */
    collectFillBlankAnswer(question) {
        const input = this.container.querySelector('.blank-input');
        if (!input || !input.value.trim()) return null;
        
        const userAnswer = input.value.trim();
        const correctAnswers = question.acceptableAnswers || [question.answer];
        const isCorrect = correctAnswers.some(answer => 
            answer.toLowerCase() === userAnswer.toLowerCase()
        );
        
        return {
            questionId: question.id,
            answer: userAnswer,
            isCorrect: isCorrect,
            type: 'fill-blank'
        };
    }

    /**
     * Collect matching answer
     */
    collectMatchingAnswer(question) {
        const selects = this.container.querySelectorAll('.matching-select');
        const answers = {};
        let allAnswered = true;
        
        selects.forEach(select => {
            const leftItem = select.dataset.leftItem;
            const selectedRight = select.value;
            
            if (!selectedRight) {
                allAnswered = false;
                return;
            }
            
            answers[leftItem] = selectedRight;
        });
        
        if (!allAnswered) return null;
        
        // Check correctness
        const isCorrect = question.pairs.every(pair => 
            answers[pair.left] === pair.right
        );
        
        return {
            questionId: question.id,
            answers: answers,
            isCorrect: isCorrect,
            type: 'matching'
        };
    }

    /**
     * Collect drag-drop answer
     */
    collectDragDropAnswer(question) {
        const sortableItems = this.container.querySelectorAll('.sortable-item');
        const userOrder = Array.from(sortableItems).map(item => parseInt(item.dataset.order));
        const correctOrder = question.items.map(item => item.order).sort((a, b) => a - b);
        
        const isCorrect = userOrder.every((order, index) => order === correctOrder[index]);
        
        return {
            questionId: question.id,
            order: userOrder,
            isCorrect: isCorrect,
            type: 'drag-drop'
        };
    }

    /**
     * Collect error-spot answer
     */
    collectErrorSpotAnswer(question) {
        const selected = this.container.querySelector('.clickable-word.selected');
        if (!selected) return null;
        
        const selectedWord = selected.dataset.word;
        const errorPosition = question.errorPosition ? question.errorPosition.trim() : '';
        const isCorrect = selectedWord === errorPosition;
        
        return {
            questionId: question.id,
            selected: selectedWord,
            isCorrect: isCorrect,
            type: 'error-spot'
        };
    }

    /**
     * Store answer for later retrieval
     */
    storeAnswer(questionId, answer) {
        const questionIndex = this.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            this.answers[questionIndex] = answer;
        }
    }

    /**
     * Complete the quiz and show results
     */
    completeQuiz() {
        this.isComplete = true;
        this.calculateScore();
        this.renderResults();
        this.saveProgress();
    }

    /**
     * Calculate final score
     */
    calculateScore() {
        const correctAnswers = this.answers.filter(answer => answer && answer.isCorrect).length;
        this.score = Math.round((correctAnswers / this.questions.length) * 100);
    }

    /**
     * Render quiz results
     */
    renderResults() {
        const quizContent = this.container.querySelector('.quiz-content');
        const quizActions = this.container.querySelector('.quiz-actions');
        const isPassing = this.score >= 80;
        
        quizContent.innerHTML = `
            <div class="quiz-results">
                <div class="results-header">
                    <h3>${isPassing ? '🎉' : '📚'} Quiz Complete!</h3>
                    <div class="score-display ${isPassing ? 'passing' : 'failing'}">
                        <span class="score-number">${this.score}%</span>
                        <span class="score-label">(${this.answers.filter(a => a && a.isCorrect).length}/${this.questions.length} correct)</span>
                    </div>
                </div>
                
                <div class="results-message">
                    ${isPassing ? 
                        '<p class="success-message">Excellent work! You\'ve mastered this section.</p>' :
                        '<p class="retry-message">Keep studying! You need 80% to pass. Review the material and try again.</p>'
                    }
                </div>
                
                <div class="results-breakdown">
                    <h4>Question Breakdown:</h4>
                    ${this.answers.map((answer, index) => {
                        const question = this.questions[index];
                        return `
                            <div class="result-item ${answer && answer.isCorrect ? 'correct' : 'incorrect'}">
                                <span class="question-num">Q${index + 1}</span>
                                <span class="result-icon">${answer && answer.isCorrect ? '✅' : '❌'}</span>
                                <span class="result-text">${question.stem.substring(0, 50)}...</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        quizActions.innerHTML = `
            <div class="quiz-final-actions">
                <button class="btn btn-outline quiz-restart">Try Again</button>
                ${isPassing ? '<button class="btn btn-primary quiz-continue">Continue</button>' : ''}
            </div>
        `;
        
        // Attach final action listeners
        const restartBtn = this.container.querySelector('.quiz-restart');
        const continueBtn = this.container.querySelector('.quiz-continue');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restart();
            });
        }
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.emitCompletionEvent();
            });
        }
    }

    /**
     * Restart the quiz
     */
    restart() {
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.isComplete = false;
        this.startTime = Date.now();
        this.questions = this.shuffleArray([...this.quizData.questions]);
        this.renderCurrentQuestion();
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        try {
            const progressKey = `quiz-progress-${this.chapterId}-${this.sectionId}`;
            const progressData = {
                score: this.score,
                passed: this.score >= 80,
                completedAt: new Date().toISOString(),
                attempts: (JSON.parse(localStorage.getItem(progressKey))?.attempts || 0) + 1
            };
            
            localStorage.setItem(progressKey, JSON.stringify(progressData));
        } catch (error) {
            console.warn('Could not save quiz progress:', error);
        }
    }

    /**
     * Emit completion event for progress tracking
     */
    emitCompletionEvent() {
        const event = new CustomEvent('quiz-completed', {
            detail: {
                chapterId: this.chapterId,
                sectionId: this.sectionId,
                score: this.score,
                percentage: this.score,
                passed: this.score >= 80,
                answers: this.answers,
                timeSpent: Date.now() - this.startTime
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Update progress indicator
     */
    updateProgress() {
        const currentQuestionSpan = this.container.querySelector('.current-question');
        const progressFill = this.container.querySelector('.progress-fill');
        
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = `Question ${this.currentQuestionIndex + 1}`;
        }
        
        if (progressFill) {
            const percentage = ((this.currentQuestionIndex) / this.questions.length) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const existingError = this.container.querySelector('.quiz-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'quiz-error';
        errorDiv.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
        
        const quizActions = this.container.querySelector('.quiz-actions');
        quizActions.parentNode.insertBefore(errorDiv, quizActions);
        
        // Remove error after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }

    /**
     * Utility function to shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Restore answer to question (for navigation)
     */
    restoreAnswer(question, answer) {
        if (!answer) return;
        
        switch (question.type) {
            case 'mcq':
                answer.selected.forEach(index => {
                    const input = this.container.querySelector(`input[name="question-${question.id}"][value="${index}"]`);
                    if (input) input.checked = true;
                });
                break;
            case 'fill-blank':
                const input = this.container.querySelector('.blank-input');
                if (input) input.value = answer.answer;
                break;
            // Add other types as needed
        }
    }

    /**
     * Static method to load quiz data from JSON files
     */
    static async loadQuizData(chapterId) {
        try {
            const response = await fetch(`../data/quizzes/${chapterId}-quiz.json`);
            if (!response.ok) {
                throw new Error(`Quiz data not found for ${chapterId}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not load quiz data:', error);
            return null;
        }
    }

    /**
     * Static method to create quiz engine from chapter and section
     */
    static async createFromSection(chapterId, sectionId) {
        try {
            const quizData = await QuizEngine.loadQuizData(chapterId);
            if (!quizData || !quizData.sections || !quizData.sections[sectionId]) {
                console.warn(`No quiz data found for ${chapterId} section ${sectionId}`);
                return null;
            }
            
            const sectionQuizData = quizData.sections[sectionId];
            return new QuizEngine(sectionQuizData, chapterId, sectionId);
        } catch (error) {
            console.error('Error creating quiz engine:', error);
            return null;
        }
    }
}

// Export for global use
window.QuizEngine = QuizEngine;
