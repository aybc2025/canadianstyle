// Web Components for The Canadian Style Learning Platform

// Chapter Card Component
class CSCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        // שימו לב: הפונקציות getChapterProgress ו-calculateChapterProgress יגיעו מ-window
        const chapterId = this.getAttribute('chapter-id');
        const chapterNumber = this.getAttribute('chapter-number');
        const title = this.getAttribute('title');
        // נתוני השלמה בתוך ה-HTML נבנים כבר עם progress מדויק
        const completion = parseInt(this.getAttribute('percentage') || '0'); 
        const href = this.getAttribute('href');
        const ctaText = this.getAttribute('cta-text') || 'Start';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .card {
                    background: #ffffff;
                    border: 1px solid #d4d4d4;
                    border-radius: 8px;
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                    border-color: #d71920; /* Canadian Red */
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                
                .chapter-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #d71920; /* Canadian Red */
                }
                
                .card-title {
                    font-size: 1.25rem;
                    margin-bottom: 0.5rem;
                    color: #333333;
                }
                
                .card-description {
                    font-size: 0.875rem;
                    color: #666666;
                    margin-bottom: 1rem;
                    flex-grow: 1; /* Pushes footer to bottom */
                }
                
                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid #eeeeee;
                    margin-top: 1rem; /* Adjust if needed */
                }
                
                .section-count {
                    font-size: 0.8rem;
                    color: #999999;
                }
                
                .btn {
                    display: inline-block;
                    padding: 0.6rem 1.2rem;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    transition: background-color 0.3s ease;
                    text-align: center;
                }
                
                .btn-primary {
                    background-color: #d71920; /* Canadian Red */
                    color: #ffffff;
                    border: 1px solid #d71920;
                }
                
                .btn-primary:hover {
                    background-color: #a31318;
                    border-color: #a31318;
                }
            </style>
            <div class="card" onclick="window.location.href='${href}'">
                <div class="card-header">
                    <span class="chapter-number">${chapterNumber}</span>
                    <cs-progress-ring percentage="${completion}" size="60"></cs-progress-ring>
                </div>
                <h3 class="card-title">${title}</h3>
                <p class="card-description">${this.innerHTML}</p> <div class="card-footer">
                    <span class="section-count">${this.getAttribute('sections-count')} sections</span>
                    <a href="${href}" class="btn btn-primary">${ctaText}</a>
                </div>
            </div>
        `;
        // ה-innerHTML ב-index.html מכיל כבר את התיאור
        this.shadowRoot.querySelector('.card-description').innerHTML = this.querySelector('p.card-description').innerHTML;

    }

    // Observe changes to attributes to update the card if needed
    static get observedAttributes() {
        return ['percentage', 'chapter-id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'percentage' && this.shadowRoot.querySelector('cs-progress-ring')) {
            this.shadowRoot.querySelector('cs-progress-ring').setAttribute('percentage', newValue);
        }
        // אם chapter-id משתנה, נצטרך לרענן הכל, אבל זה לא שימוש נפוץ לשינוי chapter-id
    }
}


// Progress Ring Component
class CSProgressRing extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.circleBackground = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.circleProgress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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
        const percentage = parseFloat(this.getAttribute('percentage') || '0');
        const size = parseFloat(this.getAttribute('size') || '100');
        const strokeWidth = parseFloat(this.getAttribute('stroke-width') || '10');
        const color = this.getAttribute('color') || '#d71920'; // Canadian Red

        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    vertical-align: middle;
                }
                svg {
                    transform: rotate(-90deg); /* Start at the top */
                    overflow: visible; /* Ensure text is visible if it goes slightly outside */
                }
                circle {
                    transition: stroke-dashoffset 0.35s;
                }
                text {
                    font-family: sans-serif;
                    font-weight: bold;
                    text-anchor: middle;
                    dominant-baseline: central;
                    fill: ${color};
                    font-size: ${size * 0.25}px; /* Dynamic font size */
                    transform: rotate(90deg); /* Counter-rotate text */
                    transform-origin: center;
                }
            </style>
        `;

        this.svg.setAttribute('width', size);
        this.svg.setAttribute('height', size);
        this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

        // Background circle
        this.circleBackground.setAttribute('cx', size / 2);
        this.circleBackground.setAttribute('cy', size / 2);
        this.circleBackground.setAttribute('r', radius);
        this.circleBackground.setAttribute('fill', 'transparent');
        this.circleBackground.setAttribute('stroke', '#e6e6e6');
        this.circleBackground.setAttribute('stroke-width', strokeWidth);

        // Progress circle
        this.circleProgress.setAttribute('cx', size / 2);
        this.circleProgress.setAttribute('cy', size / 2);
        this.circleProgress.setAttribute('r', radius);
        this.circleProgress.setAttribute('fill', 'transparent');
        this.circleProgress.setAttribute('stroke', color);
        this.circleProgress.setAttribute('stroke-width', strokeWidth);
        this.circleProgress.setAttribute('stroke-dasharray', circumference);
        this.circleProgress.setAttribute('stroke-dashoffset', offset);
        this.circleProgress.setAttribute('stroke-linecap', 'round');

        // Percentage text
        this.text.setAttribute('x', size / 2);
        this.text.setAttribute('y', size / 2);
        this.text.textContent = `${percentage}%`;

        this.svg.appendChild(this.circleBackground);
        this.svg.appendChild(this.circleProgress);
        this.svg.appendChild(this.text);

        this.shadowRoot.appendChild(this.svg);
    }
}


// Quiz Component
class CSQuiz extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.quizData = {};
    }

    static get observedAttributes() {
        return ['quiz-id', 'question', 'answer', 'type', 'choices', 'timer'];
    }

    connectedCallback() {
        this.quizData = {
            id: this.getAttribute('quiz-id'),
            question: this.getAttribute('question'),
            answer: this.getAttribute('answer'),
            type: this.getAttribute('type') || 'text', // 'text', 'mc' (multiple choice)
            choices: this.getAttribute('choices') ? JSON.parse(this.getAttribute('choices')) : [],
            timer: parseInt(this.getAttribute('timer') || '0')
        };
        this.render();
    }

    attributeChangedCallback() {
        // Re-render if attributes change
        this.connectedCallback();
    }

    render() {
        const { question, type, choices, timer } = this.quizData;

        let inputHtml = '';
        if (type === 'text') {
            inputHtml = `<div id="answerInput" class="answer-input" contenteditable="true" placeholder="Type your answer..."></div>`;
        } else if (type === 'mc') {
            inputHtml = `<div class="choices-container">
                ${choices.map((choice, index) => `
                    <button class="choice-btn" data-choice="${choice.toLowerCase()}">${choice}</button>
                `).join('')}
            </div>`;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .quiz-question {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    color: #333333;
                }
                .answer-input {
                    border: 1px solid #cccccc;
                    border-radius: 5px;
                    padding: 0.8rem;
                    min-height: 40px;
                    margin-bottom: 1rem;
                    background: #ffffff;
                    color: #333333;
                }
                .answer-input:focus {
                    outline: none;
                    border-color: #d71920;
                    box-shadow: 0 0 0 2px rgba(215, 25, 32, 0.2);
                }
                .choices-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 1rem;
                }
                .choice-btn {
                    background-color: #e0e0e0;
                    border: 1px solid #cccccc;
                    border-radius: 5px;
                    padding: 0.8rem 1.2rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background-color 0.2s ease, border-color 0.2s ease;
                }
                .choice-btn:hover {
                    background-color: #d4d4d4;
                }
                .choice-btn.selected {
                    background-color: #d71920;
                    color: #ffffff;
                    border-color: #d71920;
                }
                .submit-btn {
                    background-color: #d71920;
                    color: #ffffff;
                    border: none;
                    border-radius: 5px;
                    padding: 0.8rem 1.5rem;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background-color 0.2s ease;
                }
                .submit-btn:hover:not(:disabled) {
                    background-color: #a31318;
                }
                .submit-btn:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                .feedback {
                    margin-top: 1rem;
                    padding: 0.8rem;
                    border-radius: 5px;
                    font-weight: bold;
                }
                .feedback.correct {
                    background-color: #d4edda;
                    color: #28a745;
                }
                .feedback.incorrect {
                    background-color: #f8d7da;
                    color: #dc3545;
                }
                .timer {
                    font-size: 0.9rem;
                    color: #999999;
                    margin-bottom: 1rem;
                    text-align: right;
                }
            </style>
            <div class="quiz-container">
                <div class="quiz-question">${question}</div>
                ${timer > 0 ? `<div id="timer" class="timer">${timer}s</div>` : ''}
                ${inputHtml}
                <button class="submit-btn">Submit Answer</button>
                <div id="feedback" class="feedback"></div>
            </div>
        `;

        const submitBtn = this.shadowRoot.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => this.submitAnswer());

        if (type === 'mc') {
            this.shadowRoot.querySelectorAll('.choice-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.shadowRoot.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('selected'));
                    e.target.classList.add('selected');
                });
            });
        }

        if (timer > 0) {
            this.startTimer(timer);
        }
    }

    submitAnswer() {
        const type = this.quizData.type;
        let userAnswer = '';

        if (type === 'text') {
            const input = this.shadowRoot.getElementById('answerInput');
            userAnswer = input.textContent.trim().toLowerCase();
            input.contentEditable = false;
        } else if (type === 'mc') {
            const selectedButton = this.shadowRoot.querySelector('.choice-btn.selected');
            if (!selectedButton) {
                alert('Please select an answer.');
                return;
            }
            userAnswer = selectedButton.dataset.choice.toLowerCase();
            this.shadowRoot.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);
        }

        const correctAnswer = this.quizData.answer.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;
        
        const feedbackEl = this.shadowRoot.getElementById('feedback');
        const submitBtn = this.shadowRoot.querySelector('.submit-btn');
        
        if (type === 'text') {
            const input = this.shadowRoot.getElementById('answerInput');
            input.style.borderColor = isCorrect ? '#28a745' : '#dc3545';
        }
        
        feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackEl.textContent = isCorrect 
            ? '✓ Correct!'
            : `✗ Incorrect. The correct answer is "${this.quizData.answer}"`;
        
        submitBtn.disabled = true;
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('quiz-completed', {
            detail: { correct: isCorrect, quizId: this.quizData.id }
        }));
    }
    
    startTimer(seconds) {
        let timeLeft = seconds;
        const timerEl = this.shadowRoot.getElementById('timer');
        
        const interval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                this.submitAnswer();
            }
        }, 1000);
    }
}

// Register custom elements
customElements.define('cs-card', CSCard);
customElements.define('cs-progress-ring', CSProgressRing);
customElements.define('cs-quiz', CSQuiz);