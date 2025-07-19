// Quiz Engine for The Canadian Style Learning Platform

import { setProgress } from './progress.js';

export class QuizEngine {
    constructor(containerId, quizData, options = {}) {
        this.container = document.getElementById(containerId);
        this.quizData = quizData;
        this.options = {
            randomize: false,
            showFeedback: true,
            allowRetry: true,
            passingScore: 80,
            ...options
        };
        
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.startTime = null;
        this.isComplete = false;
    }
    
    // Initialize and render quiz
    init() {
        if (!this.container || !this.quizData) {
            console.error('Quiz container or data not found');
            return;
        }
        
        this.startTime = Date.now();
        this.renderQuiz();
    }
    
    // Main render function
    renderQuiz() {
        if (this.isComplete) {
            this.renderResults();
            return;
        }
        
        const question = this.quizData.questions[this.currentQuestionIndex];
        
        this.container.innerHTML = `
            <div class="quiz-panel">
                <div class="quiz-header">
                    <h3 class="quiz-title">${this.quizData.title}</h3>
                    <div class="quiz-meta">
                        <span class="question-counter">
                            Question ${this.currentQuestionIndex + 1} of ${this.quizData.questions.length}
                        </span>
                    </div>
                </div>
                
                <div class="quiz-body">
                    ${this.renderQuestion(question)}
                </div>
                
                <div class="quiz-footer">
                    <button class="btn btn-secondary" onclick="window.quizEngine.previousQuestion()" 
                            ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                        Previous
                    </button>
                    <button class="btn btn-primary" id="nextBtn" onclick="window.quizEngine.nextQuestion()">
                        ${this.currentQuestionIndex === this.quizData.questions.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;
        
        // Store reference for event handlers
        window.quizEngine = this;
    }
    
    // Render different question types
    renderQuestion(question) {
        switch (question.type) {
            case 'mcq':
                return this.renderMCQ(question);
            case 'multi-select':
                return this.renderMultiSelect(question);
            case 'fill-blank':
                return this.renderFillBlank(question);
            case 'drag-drop':
                return this.renderDragDrop(question);
            case 'error-spot':
                return this.renderErrorSpot(question);
            default:
                return this.renderMCQ(question);
        }
    }
    
    // Multiple Choice Question
    renderMCQ(question) {
        const savedAnswer = this.answers[this.currentQuestionIndex];
        
        return `
            <div class="question-stem">${question.stem}</div>
            <div class="options-list">
                ${question.options.map((option, index) => `
                    <label class="option-label">
                        <input type="radio" 
                               name="q${this.currentQuestionIndex}" 
                               value="${index}"
                               ${savedAnswer === index ? 'checked' : ''}
                               onchange="window.quizEngine.selectAnswer(${index})">
                        <span class="option-text">${option.label}</span>
                    </label>
                `).join('')}
            </div>
            ${question.ref ? `<div class="question-ref">Reference: ${question.ref}</div>` : ''}
        `;
    }
    
    // Multi-select Question
    renderMultiSelect(question) {
        const savedAnswers = this.answers[this.currentQuestionIndex] || [];
        
        return `
            <div class="question-stem">${question.stem}</div>
            <div class="options-list">
                ${question.options.map((option, index) => `
                    <label class="option-label">
                        <input type="checkbox" 
                               name="q${this.currentQuestionIndex}" 
                               value="${index}"
                               ${savedAnswers.includes(index) ? 'checked' : ''}
                               onchange="window.quizEngine.selectMultiAnswer(${index})">
                        <span class="option-text">${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }
    
    // Fill in the Blank
    renderFillBlank(question) {
        const savedAnswer = this.answers[this.currentQuestionIndex] || '';
        const parts = question.stem.split('___');
        
        return `
            <div class="fill-blank-question">
                ${parts[0]}
                <input type="text" 
                       class="fill-blank-input" 
                       value="${savedAnswer}"
                       placeholder="Type your answer"
                       onchange="window.quizEngine.selectAnswer(this.value)">
                ${parts[1] || ''}
            </div>
        `;
    }
    
    // Drag and Drop Ordering
    renderDragDrop(question) {
        const items = question.options.map((opt, idx) => ({
            ...opt,
            id: `drag-${idx}`
        }));
        
        // Shuffle items if not already answered
        if (!this.answers[this.currentQuestionIndex]) {
            items.sort(() => Math.random() - 0.5);
        }
        
        return `
            <div class="question-stem">${question.stem}</div>
            <div class="drag-drop-container" id="dragContainer">
                ${items.map(item => `
                    <div class="drag-item" 
                         draggable="true" 
                         data-id="${item.id}"
                         ondragstart="window.quizEngine.handleDragStart(event)"
                         ondragover="window.quizEngine.handleDragOver(event)"
                         ondrop="window.quizEngine.handleDrop(event)"
                         ondragend="window.quizEngine.handleDragEnd(event)">
                        ${item.label}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Error Spotting
    renderErrorSpot(question) {
        return `
            <div class="question-stem">Click on the error in the following text:</div>
            <div class="error-spot-text" onclick="window.quizEngine.handleErrorClick(event)">
                ${question.text.split(' ').map((word, idx) => 
                    `<span class="error-word" data-index="${idx}">${word}</span>`
                ).join(' ')}
            </div>
        `;
    }
    
    // Answer selection handlers
    selectAnswer(answer) {
        this.answers[this.currentQuestionIndex] = answer;
        this.updateNextButton();
    }
    
    selectMultiAnswer(index) {
        if (!this.answers[this.currentQuestionIndex]) {
            this.answers[this.currentQuestionIndex] = [];
        }
        
        const answers = this.answers[this.currentQuestionIndex];
        const idx = answers.indexOf(index);
        
        if (idx > -1) {
            answers.splice(idx, 1);
        } else {
            answers.push(index);
        }
        
        this.updateNextButton();
    }
    
    // Drag and drop handlers
    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.target.classList.add('dragging');
        this.draggedElement = e.target;
    }
    
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(e.currentTarget.parentElement, e.clientY);
        if (afterElement == null) {
            e.currentTarget.parentElement.appendChild(this.draggedElement);
        } else {
            e.currentTarget.parentElement.insertBefore(this.draggedElement, afterElement);
        }
        
        return false;
    }
    
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        // Save the current order
        const container = document.getElementById('dragContainer');
        const order = Array.from(container.children).map(child => 
            child.getAttribute('data-id')
        );
        this.answers[this.currentQuestionIndex] = order;
        
        return false;
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
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
    
    // Error spotting handler
    handleErrorClick(e) {
        if (e.target.classList.contains('error-word')) {
            // Clear previous selections
            document.querySelectorAll('.error-word').forEach(word => 
                word.classList.remove('selected')
            );
            
            e.target.classList.add('selected');
            this.answers[this.currentQuestionIndex] = parseInt(e.target.dataset.index);
            this.updateNextButton();
        }
    }
    
    // Navigation
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuiz();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuiz();
        } else {
            this.finishQuiz();
        }
    }
    
    updateNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        const hasAnswer = this.answers[this.currentQuestionIndex] !== undefined;
        nextBtn.disabled = !hasAnswer;
    }
    
    // Calculate and show results
    finishQuiz() {
        this.isComplete = true;
        this.calculateScore();
        this.renderResults();
    }
    
    calculateScore() {
        this.score = 0;
        
        this.quizData.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            let isCorrect = false;
            
            switch (question.type) {
                case 'mcq':
                    isCorrect = question.options[userAnswer]?.correct === true;
                    break;
                    
                case 'multi-select':
                    const correctIndices = question.options
                        .map((opt, idx) => opt.correct ? idx : null)
                        .filter(idx => idx !== null);
                    isCorrect = JSON.stringify(userAnswer?.sort()) === JSON.stringify(correctIndices.sort());
                    break;
                    
                case 'fill-blank':
                    isCorrect = userAnswer?.toLowerCase().trim() === question.answer.toLowerCase().trim();
                    break;
                    
                case 'drag-drop':
                    const correctOrder = question.options.map((_, idx) => `drag-${idx}`);
                    isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctOrder);
                    break;
                    
                case 'error-spot':
                    isCorrect = userAnswer === question.errorIndex;
                    break;
            }
            
            if (isCorrect) this.score++;
        });
    }
    
    renderResults() {
        const percentage = Math.round((this.score / this.quizData.questions.length) * 100);
        const passed = percentage >= this.options.passingScore;
        const timeTaken = Math.round((Date.now() - this.startTime) / 1000);
        
        this.container.innerHTML = `
            <div class="quiz-results">
                <div class="results-header">
                    <h2>${passed ? '🎉 Quiz Passed!' : '📚 Keep Learning!'}</h2>
                </div>
                
                <div class="results-stats">
                    <div class="stat-item">
                        <div class="stat-value">${percentage}%</div>
                        <div class="stat-label">Score</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.score}/${this.quizData.questions.length}</div>
                        <div class="stat-label">Correct</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatTime(timeTaken)}</div>
                        <div class="stat-label">Time</div>
                    </div>
                </div>
                
                <div class="results-message">
                    ${passed 
                        ? `Great job! You've mastered this section.`
                        : `You need ${this.options.passingScore}% to pass. Review the material and try again.`
                    }
                </div>
                
                ${this.options.showFeedback ? this.renderDetailedFeedback() : ''}
                
                <div class="results-actions">
                    ${!passed && this.options.allowRetry ? `
                        <button class="btn btn-secondary" onclick="window.quizEngine.retryQuiz()">
                            Try Again
                        </button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="window.quizEngine.complete()">
                        Continue
                    </button>
                </div>
            </div>
        `;
        
        // Save progress if passed
        if (passed && this.quizData.chapterId && this.quizData.sectionId) {
            setProgress(this.quizData.chapterId, this.quizData.sectionId, true);
        }
    }
    
    renderDetailedFeedback() {
        return `
            <div class="detailed-feedback">
                <h3>Review Your Answers</h3>
                ${this.quizData.questions.map((question, index) => {
                    const userAnswer = this.answers[index];
                    const isCorrect = this.checkAnswer(question, userAnswer);
                    
                    return `
                        <div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                            <div class="feedback-question">
                                <span class="feedback-icon">${isCorrect ? '✓' : '✗'}</span>
                                ${question.stem}
                            </div>
                            ${!isCorrect ? `
                                <div class="feedback-explanation">
                                    ${question.rationale || 'Review this topic in the lesson.'}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    checkAnswer(question, userAnswer) {
        // Simplified check - implement full logic as in calculateScore
        if (question.type === 'mcq') {
            return question.options[userAnswer]?.correct === true;
        }
        return false;
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    retryQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.startTime = Date.now();
        this.isComplete = false;
        this.renderQuiz();
    }
    
    complete() {
        // Emit completion event
        window.dispatchEvent(new CustomEvent('quiz-completed', {
            detail: {
                quizId: this.quizData.id,
                passed: this.score / this.quizData.questions.length >= this.options.passingScore / 100
            }
        }));
    }
}

// Export function to load quiz data
export async function loadQuizData(chapterId, sectionId) {
    try {
        const response = await fetch(`../data/quizzes/${chapterId}.json`);
        const allQuizzes = await response.json();
        return allQuizzes[sectionId] || null;
    } catch (error) {
        console.error('Error loading quiz data:', error);
        return null;
    }
}