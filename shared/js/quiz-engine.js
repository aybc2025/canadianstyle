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
                ${isMultiSelect ? 
                    '<p class="mcq-instructions">Select all correct answers:</p>' : 
                    '<p class="mcq-instructions">Select the best answer:</p>'
                }
                <div class="mcq-options">
                    ${question.options.map((option, index) => `
                        <label class="mcq-option">
                            <input type="${inputType}" name="question-${question.id}" value="${index}">
                            <span class="option-label">${option.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Fill in the Blank Question
     */
    /**
 * Render Fill in the Blank Question - FIXED VERSION
 */
renderFillBlank(question) {
    // Support both old and new data structures
    let questionText = question.text || question.stem;
    
    // Handle case where the text field is missing entirely
    if (!questionText) {
        console.error('Fill-blank question missing text/stem field:', question);
        return '<div class="error-message">Error: Question text not found</div>';
    }
    
    // Handle different fill-blank formats
    let parts;
    
    if (questionText.includes('______')) {
        // Multiple blanks format
        parts = questionText.split('______');
    } else if (questionText.includes('____')) {
        // Standard blank format
        parts = questionText.split('____');
    } else if (questionText.includes('___')) {
        // Alternative blank format
        parts = questionText.split('___');
    } else {
        // No blanks found - show error
        console.error('Fill-blank question has no blank markers:', question);
        return '<div class="error-message">Error: No blank spaces found in question</div>';
    }
    
    return `
        <div class="fill-blank-container">
            <div class="fill-blank-sentence">
                ${parts.map((part, index) => {
                    if (index === parts.length - 1) {
                        return part;
                    }
                    return `${part}<input type="text" class="blank-input" placeholder="?" data-blank="${index}">`;
                }).join('')}
            </div>
            ${question.hint ? `<p class="hint">💡 Hint: ${question.hint}</p>` : ''}
        </div>
    `;
}

    /**
     * Render Matching Question
     */
    renderMatching(question) {
        const leftItems = question.pairs.map(pair => pair.left);
        const rightItems = this.shuffleArray(question.pairs.map(pair => pair.right));
        
        return `
            <div class="matching-container">
                <div class="matching-instructions">
                    <p>Match each item on the left with the correct item on the right:</p>
                </div>
                <div class="matching-pairs">
                    ${question.pairs.map((pair, pairIndex) => `
                        <div class="matching-pair">
                            <div class="left-item">
                                <span>${pair.left}</span>
                            </div>
                            <div class="right-item">
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
     * Render Drag and Drop Question - FIXED VERSION
     */
    renderDragDrop(question) {
        // Handle different possible data structures
        let itemsToRender = [];
        
        if (question.items && Array.isArray(question.items)) {
            // Standard items array
            itemsToRender = [...question.items];
        } else if (question.options && Array.isArray(question.options)) {
            // Alternative: options array
            itemsToRender = question.options.map((opt, idx) => ({
                text: opt.label || opt,
                order: opt.order || idx + 1
            }));
        } else if (question.sequence && Array.isArray(question.sequence)) {
            // Alternative: sequence array
            itemsToRender = question.sequence.map((item, idx) => ({
                text: item,
                order: idx + 1
            }));
        } else {
            // Fallback: create from any available data
            console.warn('No suitable items found for drag-drop question, creating fallback');
            return `<div class="error-message">Error: Invalid drag-drop question data</div>`;
        }
        
        const shuffledItems = this.shuffleArray([...itemsToRender]);
        
        return `
            <div class="drag-drop-container">
                <div class="drag-drop-instructions">
                    <p>${question.instructions || 'Drag the items to arrange them in the correct order:'}</p>
                </div>
                <div class="sortable-list" id="sortable-${question.id}">
                    ${shuffledItems.map((item, index) => `
                        <div class="sortable-item" draggable="true" data-order="${item.order}" data-text="${item.text}">
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
        // Split text and make words clickable
        const words = question.text.split(/(\s+)/);
        
        return `
            <div class="error-spot-container">
                <div class="error-spot-instructions">
                    <p>Click on the error in the following text:</p>
                </div>
                <div class="error-spot-text">
                    ${words.map(word => {
                        if (word.trim() === '') return word; // preserve whitespace
                        return `<span class="clickable-word" data-word="${word.trim()}">${word}</span>`;
                    }).join('')}
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
     * Setup drag and drop functionality - IMPROVED VERSION
     */
    setupDragAndDrop(question) {
        const sortableList = this.container.querySelector(`#sortable-${question.id}`);
        if (!sortableList) return;
        
        let draggedElement = null;
        
        sortableList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('sortable-item')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
            }
        });
        
        sortableList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('sortable-item')) {
                e.target.style.opacity = '';
                draggedElement = null;
            }
        });
        
        sortableList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        sortableList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedElement) return;
            
            const targetElement = e.target.closest('.sortable-item');
            if (targetElement && targetElement !== draggedElement) {
                const allItems = Array.from(sortableList.children);
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(targetElement);
                
                if (draggedIndex < targetIndex) {
                    targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
                } else {
                    targetElement.parentNode.insertBefore(draggedElement, targetElement);
                }
            }
        });
    }

    /**
     * Setup error spotting functionality
     */
    setupErrorSpotting(question) {
        const clickableWords = this.container.querySelectorAll('.clickable-word');
        
        clickableWords.forEach(word => {
            word.addEventListener('click', () => {
                // Remove previous selections
                clickableWords.forEach(w => w.classList.remove('selected'));
                // Select clicked word
                word.classList.add('selected');
            });
        });
    }

    /**
     * Attach navigation event listeners
     */
    attachNavigationListeners() {
        const prevBtn = this.container.querySelector('.quiz-prev');
        const nextBtn = this.container.querySelector('.quiz-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousQuestion();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const answer = this.collectCurrentAnswer();
                if (answer) {
                    this.storeAnswer(this.questions[this.currentQuestionIndex].id, answer);
                }
                this.nextQuestion();
            });
        }
    }

    /**
     * Navigate to next question
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        this.renderCurrentQuestion();
    }

    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderCurrentQuestion();
        }
    }

    /**
     * Update progress indicators
     */
    updateProgress() {
        const progressFill = this.container.querySelector('.progress-fill');
        const currentQuestionSpan = this.container.querySelector('.current-question');
        
        if (progressFill) {
            const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = `Question ${this.currentQuestionIndex + 1}`;
        }
    }

    /**
     * Collect answer from current question
     */
    collectCurrentAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        
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
        const checkedInputs = this.container.querySelectorAll(`input[name="question-${question.id}"]:checked`);
        if (checkedInputs.length === 0) return null;
        
        const selectedIndices = Array.from(checkedInputs).map(input => parseInt(input.value));
        const correctIndices = question.options
            .map((option, index) => option.correct ? index : null)
            .filter(index => index !== null);
        
        const isCorrect = selectedIndices.length === correctIndices.length &&
                         selectedIndices.every(index => correctIndices.includes(index));
        
        return {
            questionId: question.id,
            selected: selectedIndices,
            isCorrect: isCorrect,
            type: 'mcq'
        };
    }

    /**
     * Collect fill-blank answer
     */
    collectFillBlankAnswer(question) {
    const blankInputs = this.container.querySelectorAll('.blank-input');
    if (blankInputs.length === 0) return null;
    
    const answers = Array.from(blankInputs).map(input => input.value.trim());
    if (answers.some(answer => answer === '')) return null;
    
    // Support different answer field structures
    let correctAnswers = [];
    
    if (Array.isArray(question.answers)) {
        // Multiple answers format: ["answer1", "answer2"]
        correctAnswers = question.answers;
    } else if (question.answer) {
        // Single answer format: "answer" 
        correctAnswers = [question.answer];
    } else if (question.blanks && Array.isArray(question.blanks)) {
        // Complex blanks format with answer arrays
        correctAnswers = question.blanks.map(blank => 
            Array.isArray(blank.answer) ? blank.answer : [blank.answer]
        );
    } else {
        console.error('Fill-blank question missing answer field:', question);
        return null;
    }
    
    // Check if answers are correct
    const isCorrect = answers.every((answer, index) => {
        const expectedAnswers = Array.isArray(correctAnswers[index]) 
            ? correctAnswers[index] 
            : [correctAnswers[index]];
        
        return expectedAnswers.some(expected => 
            expected && expected.toLowerCase().trim() === answer.toLowerCase().trim()
        );
    });
    
    return {
        questionId: question.id,
        answers: answers,
        isCorrect: isCorrect,
        type: 'fill-blank'
    };
}

    /**
     * Collect matching answer
     */
    collectMatchingAnswer(question) {
        const selects = this.container.querySelectorAll('.matching-select');
        const userMatches = {};
        let allAnswered = true;
        
        selects.forEach(select => {
            const leftItem = select.dataset.leftItem;
            const rightItem = select.value;
            if (!rightItem) {
                allAnswered = false;
                return;
            }
            userMatches[leftItem] = rightItem;
        });
        
        if (!allAnswered) return null;
        
        const isCorrect = question.pairs.every(pair => 
            userMatches[pair.left] === pair.right
        );
        
        return {
            questionId: question.id,
            matches: userMatches,
            isCorrect: isCorrect,
            type: 'matching'
        };
    }

    /**
     * Collect drag-drop answer - FIXED VERSION
     */
    collectDragDropAnswer(question) {
        const sortableItems = this.container.querySelectorAll('.sortable-item');
        if (sortableItems.length === 0) return null;
        
        const userOrder = Array.from(sortableItems).map(item => parseInt(item.dataset.order));
        const correctOrder = [];
        
        // Determine correct order based on available data structure
        if (question.items && Array.isArray(question.items)) {
            correctOrder.push(...question.items.map(item => item.order).sort((a, b) => a - b));
        } else if (question.correctOrder && Array.isArray(question.correctOrder)) {
            correctOrder.push(...question.correctOrder);
        } else {
            // Fallback: assume sequential order
            for (let i = 1; i <= sortableItems.length; i++) {
                correctOrder.push(i);
            }
        }
        
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
        const errorWord = question.errorWord || question.error || '';
        const isCorrect = selectedWord.toLowerCase().replace(/[.,!?;:]/g, '') === 
                         errorWord.toLowerCase().replace(/[.,!?;:]/g, '');
        
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
                        '<p class="pass-message">Excellent work! You have a strong understanding of this topic.</p>' :
                        '<p class="fail-message">Keep studying! Review the material and try again.</p>'
                    }
                </div>
                
                <div class="results-breakdown">
                    <h4>Question Breakdown:</h4>
                    <div class="question-results">
                        ${this.questions.map((question, index) => {
                            const answer = this.answers[index];
                            const status = answer && answer.isCorrect ? '✅' : '❌';
                            return `
                                <div class="question-result">
                                    <span class="question-number">Q${index + 1}</span>
                                    <span class="question-status">${status}</span>
                                    <span class="question-type">${question.type}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        quizActions.innerHTML = `
            <div class="quiz-final-actions">
                <button class="btn btn-outline quiz-restart">Try Again</button>
                <button class="btn btn-primary quiz-continue">Continue Learning</button>
            </div>
        `;
        
        // Attach final action listeners
        this.container.querySelector('.quiz-restart')?.addEventListener('click', () => {
            this.restartQuiz();
        });
        
        this.container.querySelector('.quiz-continue')?.addEventListener('click', () => {
            // This will be handled by the parent page
            this.container.dispatchEvent(new CustomEvent('quizComplete', {
                detail: { score: this.score, passed: isPassing }
            }));
        });
    }

    /**
     * Restart the quiz
     */
    restartQuiz() {
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
            const progressKey = `csProgress`;
            const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
            
            if (!currentProgress[this.chapterId]) {
                currentProgress[this.chapterId] = {};
            }
            
            currentProgress[this.chapterId][this.sectionId] = {
                completed: this.isComplete,
                score: this.score,
                timestamp: Date.now()
            };
            
            localStorage.setItem(progressKey, JSON.stringify(currentProgress));
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
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
     * Restore answer from previous attempt
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
                if (input && answer.answers) input.value = answer.answers[0];
                break;
            // Add other types as needed
        }
    }

    /**
     * Static method to load quiz data from JSON files
     */
    static async loadQuizData(chapterId) {
        try {
            console.log(`Loading quiz data for ${chapterId}...`);
            
            const response = await fetch(`../data/${chapterId}-quiz.json`);
            if (!response.ok) {
                console.warn(`Quiz file not found: ${chapterId}-quiz.json (${response.status})`);
                return null;
            }
            
            const data = await response.json();
            console.log(`Successfully loaded quiz data for ${chapterId}:`, data);
            return data;
            
        } catch (error) {
            console.error(`Error loading quiz data for ${chapterId}:`, error);
            return null;
        }
    }

    /**
     * Static method to create quiz engine from chapter and section
     */
   static async createFromSection(chapterId, sectionId) {
        try {
            console.log(`Creating quiz for ${chapterId} section ${sectionId}...`);
            
            const quizData = await QuizEngine.loadQuizData(chapterId);
            if (!quizData) {
                console.warn(`No quiz data available for ${chapterId}`);
                return null;
            }
            
            if (!quizData.sections || !quizData.sections[sectionId]) {
                console.warn(`No quiz found for ${chapterId} section ${sectionId}`);
                console.log('Available sections:', Object.keys(quizData.sections || {}));
                return null;
            }
            
            const sectionQuizData = quizData.sections[sectionId];
            if (!sectionQuizData.questions || sectionQuizData.questions.length === 0) {
                console.warn(`No questions found for ${chapterId} section ${sectionId}`);
                return null;
            }
            
            console.log(`Successfully created quiz engine for ${chapterId}-${sectionId}`);
            return new QuizEngine(sectionQuizData, chapterId, sectionId);
            
        } catch (error) {
            console.error(`Error creating quiz engine for ${chapterId}-${sectionId}:`, error);
            return null;
        }
    }
}


// Export for global use
window.QuizEngine = QuizEngine;
