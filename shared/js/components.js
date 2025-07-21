/**
 * Web Components for The Canadian Style Learning Platform
 * Reusable UI components for consistent experience across chapters
 * FIXED VERSION - includes progress rings, cards, and interactive elements
 */

// Progress Ring Component
class ProgressRing extends HTMLElement {
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

    get percentage() {
        return parseFloat(this.getAttribute('percentage')) || 0;
    }

    get size() {
        return parseFloat(this.getAttribute('size')) || 60;
    }

    get strokeWidth() {
        return parseFloat(this.getAttribute('stroke-width')) || 4;
    }

    get color() {
        return this.getAttribute('color') || '#d71920';
    }

    render() {
        const radius = (this.size - this.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (this.percentage / 100) * circumference;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                .progress-ring {
                    transform: rotate(-90deg);
                }
                .progress-circle {
                    fill: none;
                    stroke: #e5e7eb;
                    stroke-width: ${this.strokeWidth};
                }
                .progress-circle.progress {
                    stroke: ${this.color};
                    stroke-linecap: round;
                    stroke-dasharray: ${circumference};
                    stroke-dashoffset: ${strokeDashoffset};
                    transition: stroke-dashoffset 0.5s ease-in-out;
                }
                .progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(90deg);
                    text-align: center;
                    font-size: ${this.size * 0.2}px;
                    font-weight: bold;
                    color: ${this.color};
                }
                .progress-container {
                    position: relative;
                    display: inline-block;
                }
            </style>
            <div class="progress-container">
                <svg class="progress-ring" width="${this.size}" height="${this.size}">
                    <circle class="progress-circle" 
                            cx="${this.size / 2}" 
                            cy="${this.size / 2}" 
                            r="${radius}">
                    </circle>
                    <circle class="progress-circle progress" 
                            cx="${this.size / 2}" 
                            cy="${this.size / 2}" 
                            r="${radius}">
                    </circle>
                </svg>
                <div class="progress-text">${Math.round(this.percentage)}%</div>
            </div>
        `;
    }
}

// Chapter Card Component
class ChapterCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['chapter-id', 'title', 'description', 'progress', 'category'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    get chapterId() {
        return this.getAttribute('chapter-id') || '';
    }

    get title() {
        return this.getAttribute('title') || '';
    }

    get description() {
        return this.getAttribute('description') || '';
    }

    get progress() {
        return parseFloat(this.getAttribute('progress')) || 0;
    }

    get category() {
        return this.getAttribute('category') || 'typography';
    }

    get isCompleted() {
        return this.progress >= 100;
    }

    get hasProgress() {
        return this.progress > 0;
    }

    render() {
        const chapterNumber = this.chapterId.replace('ch', '').padStart(2, '0');
        const categoryLabel = this.category === 'typography' ? 'Typography & Format' : 'Style & Usage';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .chapter-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 24px;
                    transition: all 0.15s ease-in-out;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    display: flex;
                    flex-direction: column;
                    min-height: 320px;
                    cursor: pointer;
                }
                .chapter-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    border-color: #d71920;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .chapter-number {
                    width: 60px;
                    height: 60px;
                    background: #d71920;
                    color: white;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                    flex-shrink: 0;
                }
                .card-title {
                    flex: 1;
                }
                .card-title h3 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    color: #111827;
                }
                .chapter-category {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .card-description {
                    flex: 1;
                    margin-bottom: 24px;
                }
                .card-description p {
                    color: #4b5563;
                    font-size: 14px;
                    line-height: 1.75;
                    margin: 0;
                }
                .card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: auto;
                }
                .progress-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .progress-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #4b5563;
                }
                .card-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .btn {
                    padding: 8px 16px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 14px;
                    text-align: center;
                    transition: all 0.15s ease-in-out;
                    border: 2px solid transparent;
                    min-height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-primary {
                    background: #d71920;
                    color: white;
                    border-color: #d71920;
                }
                .btn-primary:hover {
                    background: #b91c1c;
                    border-color: #b91c1c;
                }
                .btn-outline {
                    background: white;
                    color: #d71920;
                    border-color: #d71920;
                }
                .btn-outline:hover {
                    background: #d71920;
                    color: white;
                }
                .btn-sm {
                    padding: 4px 12px;
                    font-size: 12px;
                    min-height: 28px;
                }
                .completion-badge {
                    color: #10b981;
                    font-weight: 500;
                    font-size: 14px;
                }
            </style>
            <div class="chapter-card">
                <div class="card-header">
                    <div class="chapter-number">${chapterNumber}</div>
                    <div class="card-title">
                        <h3>${this.title}</h3>
                        <span class="chapter-category">${categoryLabel}</span>
                    </div>
                </div>
                
                <div class="card-description">
                    <p>${this.description}</p>
                </div>
                
                <div class="card-footer">
                    <div class="progress-container">
                        <cs-progress-ring percentage="${this.progress}" size="60"></cs-progress-ring>
                        <div class="progress-text">
                            <div>${Math.round(this.progress)}% Complete</div>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        ${this.isCompleted 
                            ? '<span class="completion-badge">✅ Complete</span>'
                            : this.hasProgress 
                                ? `<a href="chapters/${this.chapterId}.html" class="btn btn-primary">Continue</a>`
                                : `<a href="chapters/${this.chapterId}.html" class="btn btn-outline">Start Learning</a>`
                        }
                        ${this.isCompleted ? `<a href="chapters/${this.chapterId}.html" class="btn btn-outline btn-sm">Review</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const card = this.shadowRoot.querySelector('.chapter-card');
        card.addEventListener('click', (e) => {
            if (!e.target.closest('a')) {
                window.location.href = `chapters/${this.chapterId}.html`;
            }
        });
    }
}

// Quiz Question Component
class QuizQuestion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['question-data'];
    }

    connectedCallback() {
        this.render();
    }

    get questionData() {
        try {
            return JSON.parse(this.getAttribute('question-data'));
        } catch {
            return {};
        }
    }

    render() {
        const question = this.questionData;
        if (!question) return;

        let questionContent = '';
        
        switch (question.type) {
            case 'mcq':
                questionContent = this.renderMCQ(question);
                break;
            case 'fill-blank':
                questionContent = this.renderFillBlank(question);
                break;
            default:
                questionContent = '<p>Question type not supported</p>';
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin: 16px 0;
                }
                .question-container {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                }
                .question-stem {
                    font-weight: 500;
                    margin-bottom: 16px;
                    color: #111827;
                }
                .question-number {
                    background: #d71920;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-right: 8px;
                }
                .mcq-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .option-label {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 8px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                }
                .option-label:hover {
                    background: #f9fafb;
                    border-color: #d71920;
                }
                .option-input {
                    margin: 0;
                    flex-shrink: 0;
                }
                .option-text {
                    flex: 1;
                }
                .fill-blank-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    font-size: 16px;
                    transition: border-color 0.15s ease-in-out;
                }
                .fill-blank-input:focus {
                    outline: none;
                    border-color: #d71920;
                }
            </style>
            <div class="question-container">
                <div class="question-stem">
                    <span class="question-number">Q${question.id}</span>
                    ${question.stem}
                </div>
                <div class="question-content">
                    ${questionContent}
                </div>
            </div>
        `;
    }

    renderMCQ(question) {
        const isMultiSelect = question.options.filter(opt => opt.correct).length > 1;
        const inputType = isMultiSelect ? 'checkbox' : 'radio';
        const inputName = `question-${question.id}`;
        
        return `
            <div class="mcq-options">
                ${isMultiSelect ? '<p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">Select all that apply:</p>' : ''}
                ${question.options.map((option, index) => `
                    <label class="option-label">
                        <input type="${inputType}" name="${inputName}" value="${index}" class="option-input">
                        <span class="option-text">${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    renderFillBlank(question) {
        return `
            <div class="fill-blank-container">
                <input type="text" class="fill-blank-input" placeholder="Type your answer here..." autocomplete="off">
                ${question.acceptableAnswers ? 
                    '<p style="font-size: 14px; color: #6b7280; margin: 8px 0 0 0;">💡 Multiple acceptable answers possible</p>' : ''}
            </div>
        `;
    }
}

// Tooltip Component
class Tooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['text', 'position'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    get text() {
        return this.getAttribute('text') || '';
    }

    get position() {
        return this.getAttribute('position') || 'top';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: relative;
                    display: inline-block;
                }
                .tooltip {
                    position: absolute;
                    background: #111827;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    white-space: nowrap;
                    z-index: 1000;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.15s ease-in-out;
                }
                .tooltip.show {
                    opacity: 1;
                }
                .tooltip.top {
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 8px;
                }
                .tooltip.bottom {
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-top: 8px;
                }
                .tooltip.left {
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    margin-right: 8px;
                }
                .tooltip.right {
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    margin-left: 8px;
                }
                .tooltip::after {
                    content: '';
                    position: absolute;
                    border: 5px solid transparent;
                }
                .tooltip.top::after {
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-top-color: #111827;
                }
                .tooltip.bottom::after {
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-bottom-color: #111827;
                }
                .tooltip.left::after {
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border-left-color: #111827;
                }
                .tooltip.right::after {
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border-right-color: #111827;
                }
            </style>
            <slot></slot>
            <div class="tooltip ${this.position}">${this.text}</div>
        `;
    }

    setupEventListeners() {
        const host = this;
        const tooltip = this.shadowRoot.querySelector('.tooltip');

        host.addEventListener('mouseenter', () => {
            tooltip.classList.add('show');
        });

        host.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
    }
}

// Loading Spinner Component
class LoadingSpinner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['size', 'color'];
    }

    connectedCallback() {
        this.render();
    }

    get size() {
        return this.getAttribute('size') || '24';
    }

    get color() {
        return this.getAttribute('color') || '#d71920';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                .spinner {
                    width: ${this.size}px;
                    height: ${this.size}px;
                    border: 2px solid #e5e7eb;
                    border-radius: 50%;
                    border-top-color: ${this.color};
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            </style>
            <div class="spinner"></div>
        `;
    }
}

// Toast Notification Component
class ToastNotification extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['message', 'type', 'duration'];
    }

    connectedCallback() {
        this.render();
        this.show();
    }

    get message() {
        return this.getAttribute('message') || '';
    }

    get type() {
        return this.getAttribute('type') || 'info';
    }

    get duration() {
        return parseInt(this.getAttribute('duration')) || 3000;
    }

    render() {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .toast {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-left: 4px solid ${colors[this.type]};
                    border-radius: 6px;
                    padding: 16px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 300px;
                    transform: translateX(100%);
                    transition: transform 0.3s ease-in-out;
                }
                .toast.show {
                    transform: translateX(0);
                }
                .toast-icon {
                    font-size: 20px;
                }
                .toast-message {
                    flex: 1;
                    font-size: 14px;
                    color: #111827;
                }
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                    color: #6b7280;
                }
                .toast-close:hover {
                    color: #111827;
                }
            </style>
            <div class="toast">
                <span class="toast-icon">${icons[this.type]}</span>
                <span class="toast-message">${this.message}</span>
                <button class="toast-close" onclick="this.closest('cs-toast').remove()">×</button>
            </div>
        `;
    }

    show() {
        requestAnimationFrame(() => {
            const toast = this.shadowRoot.querySelector('.toast');
            toast.classList.add('show');
        });

        if (this.duration > 0) {
            setTimeout(() => {
                this.remove();
            }, this.duration);
        }
    }
}

// Register all custom elements
customElements.define('cs-progress-ring', ProgressRing);
customElements.define('cs-chapter-card', ChapterCard);
customElements.define('cs-quiz-question', QuizQuestion);
customElements.define('cs-tooltip', Tooltip);
customElements.define('cs-loading-spinner', LoadingSpinner);
customElements.define('cs-toast', ToastNotification);

// Utility functions for creating components programmatically
export function createProgressRing(percentage, size = 60) {
    const ring = document.createElement('cs-progress-ring');
    ring.setAttribute('percentage', percentage);
    ring.setAttribute('size', size);
    return ring;
}

export function createChapterCard(chapterId, title, description, progress, category) {
    const card = document.createElement('cs-chapter-card');
    card.setAttribute('chapter-id', chapterId);
    card.setAttribute('title', title);
    card.setAttribute('description', description);
    card.setAttribute('progress', progress);
    card.setAttribute('category', category);
    return card;
}

export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('cs-toast');
    toast.setAttribute('message', message);
    toast.setAttribute('type', type);
    toast.setAttribute('duration', duration);
    document.body.appendChild(toast);
    return toast;
}

export function createLoadingSpinner(size = 24, color = '#d71920') {
    const spinner = document.createElement('cs-loading-spinner');
    spinner.setAttribute('size', size);
    spinner.setAttribute('color', color);
    return spinner;
}

// Global utility functions
window.CS = {
    showToast,
    createProgressRing,
    createChapterCard,
    createLoadingSpinner
};

console.log('Canadian Style components loaded successfully');