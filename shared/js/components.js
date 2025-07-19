// Web Components for The Canadian Style Learning Platform
// Fixed version - eliminates null values and improves error handling

// Chapter Card Component
class CSCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        const chapterId = this.getAttribute('chapter-id') || '';
        const chapterNumber = this.getAttribute('chapter-number') || '00';
        const title = this.getAttribute('title') || 'Unknown Chapter';
        const completion = parseInt(this.getAttribute('percentage') || '0');
        const sectionsCount = this.getAttribute('sections-count') || '0';
        const href = this.getAttribute('href') || '#';
        const ctaText = this.getAttribute('cta-text') || 'Start';
        
        // Get description from inner content
        const descriptionElement = this.querySelector('.card-description');
        const description = descriptionElement ? descriptionElement.innerHTML : 'Learn essential writing skills.';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .card {
                    background: #ffffff;
                    border: 2px solid #e5e5e5;
                    border-radius: 12px;
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 280px;
                }
                
                .card:hover {
                    box-shadow: 0 8px 24px rgba(215, 25, 32, 0.15);
                    transform: translateY(-4px);
                    border-color: #d71920;
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                
                .chapter-number {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #d71920;
                    line-height: 1;
                }
                
                .progress-container {
                    position: relative;
                }
                
                .card-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0 0 0.5rem 0;
                    line-height: 1.3;
                }
                
                .card-description {
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin-bottom: 1.5rem;
                    flex-grow: 1;
                }
                
                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid #f0f0f0;
                }
                
                .section-count {
                    font-size: 0.85rem;
                    color: #888;
                    font-weight: 500;
                }
                
                .btn {
                    display: inline-block;
                    padding: 0.6rem 1.2rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-decoration: none;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: #d71920;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #b41419;
                    transform: translateY(-1px);
                }
                
                .completion-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #28a745;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    opacity: ${completion === 100 ? '1' : '0'};
                }
            </style>
            
            <div class="card">
                <div class="card-header">
                    <span class="chapter-number">${chapterNumber}</span>
                    <div class="progress-container">
                        <cs-progress-ring percentage="${completion}" size="60"></cs-progress-ring>
                        <div class="completion-badge">✓</div>
                    </div>
                </div>
                <h3 class="card-title">${title}</h3>
                <div class="card-description">${description}</div>
                <div class="card-footer">
                    <span class="section-count">${sectionsCount} sections</span>
                    <a href="${href}" class="btn btn-primary">${ctaText}</a>
                </div>
            </div>
        `;
    }

    // Observe changes to attributes to update the card if needed
    static get observedAttributes() {
        return ['percentage', 'chapter-id', 'title', 'sections-count'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }
}

// Progress Ring Component
class CSProgressRing extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['percentage', 'size', 'stroke-width', 'color'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const percentage = Math.max(0, Math.min(100, parseInt(this.getAttribute('percentage') || '0')));
        const size = parseInt(this.getAttribute('size') || '80');
        const strokeWidth = parseInt(this.getAttribute('stroke-width') || '6');
        const color = this.getAttribute('color') || '#d71920';

        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                
                .progress-ring {
                    transform: rotate(-90deg);
                }
                
                .progress-ring-circle {
                    transition: stroke-dashoffset 0.5s ease;
                }
                
                .progress-text {
                    font-size: ${size * 0.18}px;
                    font-weight: 600;
                    text-anchor: middle;
                    dominant-baseline: middle;
                    fill: #333;
                }
                
                .progress-container {
                    position: relative;
                    display: inline-block;
                }
            </style>
            
            <div class="progress-container">
                <svg class="progress-ring" width="${size}" height="${size}">
                    <!-- Background circle -->
                    <circle
                        cx="${size / 2}"
                        cy="${size / 2}"
                        r="${radius}"
                        fill="transparent"
                        stroke="#e6e6e6"
                        stroke-width="${strokeWidth}"
                    />
                    <!-- Progress circle -->
                    <circle
                        class="progress-ring-circle"
                        cx="${size / 2}"
                        cy="${size / 2}"
                        r="${radius}"
                        fill="transparent"
                        stroke="${color}"
                        stroke-width="${strokeWidth}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}"
                        stroke-linecap="round"
                    />
                    <!-- Percentage text -->
                    <text
                        class="progress-text"
                        x="${size / 2}"
                        y="${size / 2}"
                        transform="rotate(90 ${size / 2} ${size / 2})"
                    >${percentage}%</text>
                </svg>
            </div>
        `;
    }
}

// Quiz Component (Enhanced)
class CSQuiz extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentQuestion = 0;
        this.answers = [];
        this.score = 0;
    }

    static get observedAttributes() {
        return ['quiz-data', 'chapter-id', 'section-id'];
    }

    connectedCallback() {
        this.render();
    }

    setQuizData(data) {
        this.quizData = data || { questions: [], title: 'Quiz' };
        this.render();
    }

    render() {
        if (!this.quizData || !this.quizData.questions || this.quizData.questions.length === 0) {
            this.shadowRoot.innerHTML = `
                <style>
                    .no-quiz {
                        padding: 2rem;
                        text-align: center;
                        background: #f8f9fa;
                        border-radius: 8px;
                        color: #666;
                    }
                </style>
                <div class="no-quiz">
                    <p>No quiz questions available for this section.</p>
                </div>
            `;
            return;
        }

        const question = this.quizData.questions[this.currentQuestion];
        
        this.shadowRoot.innerHTML = `
            <style>
                .quiz-container {
                    background: white;
                    border: 2px solid #e5e5e5;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                }
                
                .quiz-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                }
                
                .quiz-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #d71920;
                    margin: 0;
                }
                
                .question-counter {
                    font-size: 0.9rem;
                    color: #666;
                    font-weight: 500;
                }
                
                .question-stem {
                    font-size: 1.1rem;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                    color: #333;
                }
                
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }
                
                .option-label {
                    display: flex;
                    align-items: center;
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .option-label:hover {
                    border-color: #d71920;
                    background: #fff5f5;
                }
                
                .option-label.selected {
                    border-color: #d71920;
                    background: #fff5f5;
                }
                
                .option-input {
                    margin-right: 0.75rem;
                    accent-color: #d71920;
                }
                
                .quiz-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .btn {
                    padding: 0.6rem 1.2rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: #d71920;
                    color: white;
                }
                
                .btn-primary:hover:not(:disabled) {
                    background: #b41419;
                }
                
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-secondary:hover:not(:disabled) {
                    background: #545b62;
                }
                
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .feedback {
                    margin-top: 1rem;
                    padding: 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                }
                
                .feedback.correct {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .feedback.incorrect {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            </style>
            
            <div class="quiz-container">
                <div class="quiz-header">
                    <h3 class="quiz-title">${this.quizData.title}</h3>
                    <span class="question-counter">
                        Question ${this.currentQuestion + 1} of ${this.quizData.questions.length}
                    </span>
                </div>
                
                <div class="quiz-body">
                    <div class="question-stem">${question.stem || question.question}</div>
                    
                    ${this.renderQuestion(question)}
                </div>
                
                <div class="quiz-footer">
                    <button class="btn btn-secondary" 
                            ${this.currentQuestion === 0 ? 'disabled' : ''} 
                            onclick="this.getRootNode().host.previousQuestion()">
                        Previous
                    </button>
                    <button class="btn btn-primary" onclick="this.getRootNode().host.nextQuestion()">
                        ${this.currentQuestion === this.quizData.questions.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
                
                <div id="feedback" class="feedback" style="display: none;"></div>
            </div>
        `;
    }
    
    renderQuestion(question) {
        const type = question.type || 'mcq';
        
        switch (type) {
            case 'mcq':
                return `
                    <div class="options-list">
                        ${question.options.map((option, index) => `
                            <label class="option-label" onclick="this.classList.toggle('selected')">
                                <input type="radio" name="answer" value="${index}" class="option-input">
                                <span>${option.label || option}</span>
                            </label>
                        `).join('')}
                    </div>
                `;
            
            case 'fill-blank':
                return `
                    <div class="fill-blank-container">
                        <input type="text" class="fill-blank-input" placeholder="Enter your answer...">
                    </div>
                `;
                
            default:
                return '<p>Question type not supported</p>';
        }
    }
    
    nextQuestion() {
        if (this.currentQuestion < this.quizData.questions.length - 1) {
            this.currentQuestion++;
            this.render();
        } else {
            this.finishQuiz();
        }
    }
    
    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.render();
        }
    }
    
    finishQuiz() {
        // Emit quiz completion event
        this.dispatchEvent(new CustomEvent('quiz-completed', {
            detail: {
                score: this.score,
                answers: this.answers,
                chapterId: this.getAttribute('chapter-id'),
                sectionId: this.getAttribute('section-id')
            }
        }));
    }
}

// Register custom elements
customElements.define('cs-card', CSCard);
customElements.define('cs-progress-ring', CSProgressRing);
customElements.define('cs-quiz', CSQuiz);

console.log('Custom components registered successfully');
