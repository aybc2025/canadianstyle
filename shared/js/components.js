/**
 * Web Components for The Canadian Style Learning Platform
 * FIXED VERSION - Enhanced error handling and null-safe operations
 */

// Chapter Card Component
class CSCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        try {
            this.render();
        } catch (error) {
            console.error('Error in CSCard connectedCallback:', error);
            this.renderFallback();
        }
    }
    
    // Safe attribute getter with fallbacks
    getAttributeSafe(name, defaultValue = '') {
        try {
            return this.getAttribute(name) || defaultValue;
        } catch (error) {
            console.warn(`Error getting attribute ${name}:`, error);
            return defaultValue;
        }
    }
    
    render() {
        try {
            const chapterId = this.getAttributeSafe('chapter-id', 'ch00');
            const chapterNumber = this.getAttributeSafe('chapter-number', '00');
            const title = this.getAttributeSafe('title', 'Unknown Chapter');
            const completion = Math.max(0, Math.min(100, parseInt(this.getAttributeSafe('percentage', '0')) || 0));
            const sectionsCount = this.getAttributeSafe('sections-count', '0');
            const href = this.getAttributeSafe('href', '#');
            const ctaText = this.getAttributeSafe('cta-text', 'Start');
            const category = this.getAttributeSafe('category', 'typography');
            
            // Get description from inner content safely
            let description = 'Learn essential writing skills.';
            try {
                const descriptionElement = this.querySelector('.card-description');
                if (descriptionElement && descriptionElement.innerHTML) {
                    description = descriptionElement.innerHTML;
                }
            } catch (error) {
                console.warn('Error getting card description:', error);
            }
            
            // Calculate progress ring values
            const circumference = 2 * Math.PI * 25; // radius = 25
            const strokeDasharray = circumference;
            const strokeDashoffset = circumference - (completion / 100) * circumference;
            
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
                        position: relative;
                        overflow: hidden;
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
                        min-width: 60px;
                    }
                    
                    .progress-container {
                        position: relative;
                        width: 60px;
                        height: 60px;
                    }
                    
                    .progress-ring {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .progress-ring svg {
                        width: 100%;
                        height: 100%;
                        transform: rotate(-90deg);
                    }
                    
                    .progress-ring circle {
                        fill: none;
                        stroke-width: 6;
                        stroke-linecap: round;
                    }
                    
                    .progress-ring .background {
                        stroke: #e5e5e5;
                    }
                    
                    .progress-ring .progress {
                        stroke: #d71920;
                        stroke-dasharray: ${strokeDasharray};
                        stroke-dashoffset: ${strokeDashoffset};
                        transition: stroke-dashoffset 0.3s ease;
                    }
                    
                    .progress-text {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 12px;
                        font-weight: 700;
                        color: #d71920;
                        text-anchor: middle;
                    }
                    
                    .completion-badge {
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #4caf50;
                        color: white;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: bold;
                        opacity: ${completion === 100 ? '1' : '0'};
                        transition: opacity 0.3s ease;
                    }
                    
                    .card-title {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #333;
                        margin: 0 0 0.75rem 0;
                        line-height: 1.3;
                    }
                    
                    .card-description {
                        color: #666;
                        font-size: 0.9rem;
                        line-height: 1.5;
                        margin: 0 0 1.5rem 0;
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
                        color: #999;
                        font-weight: 500;
                    }
                    
                    .btn {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.5rem 1rem;
                        border: none;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        text-decoration: none;
                        transition: all 0.2s ease;
                        cursor: pointer;
                    }
                    
                    .btn-primary {
                        background: #d71920;
                        color: white;
                    }
                    
                    .btn-primary:hover {
                        background: #b71c1c;
                        transform: translateY(-1px);
                    }
                    
                    .category-badge {
                        position: absolute;
                        top: 12px;
                        left: 12px;
                        background: ${category === 'typography' ? '#e3f2fd' : '#f3e5f5'};
                        color: ${category === 'typography' ? '#1976d2' : '#7b1fa2'};
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .error-state {
                        border-color: #f44336;
                        background: #ffebee;
                    }
                    
                    .error-message {
                        color: #c62828;
                        font-size: 0.85rem;
                        text-align: center;
                        padding: 1rem;
                    }
                </style>
                
                <div class="card">
                    <div class="category-badge">${category}</div>
                    <div class="card-header">
                        <span class="chapter-number">${chapterNumber}</span>
                        <div class="progress-container">
                            <div class="progress-ring">
                                <svg width="60" height="60" viewBox="0 0 60 60">
                                    <circle class="background" cx="30" cy="30" r="25"></circle>
                                    <circle class="progress" cx="30" cy="30" r="25"></circle>
                                </svg>
                                <div class="progress-text">${completion}%</div>
                            </div>
                            <div class="completion-badge">✓</div>
                        </div>
                    </div>
                    <h3 class="card-title">${title}</h3>
                    <p class="card-description">${description}</p>
                    <div class="card-footer">
                        <span class="section-count">${sectionsCount} sections</span>
                        <a href="${href}" class="btn btn-primary">${ctaText}</a>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering CSCard:', error);
            this.renderFallback();
        }
    }
    
    renderFallback() {
        try {
            const title = this.getAttributeSafe('title', 'Chapter');
            const href = this.getAttributeSafe('href', '#');
            
            this.shadowRoot.innerHTML = `
                <style>
                    .fallback-card {
                        background: #ffebee;
                        border: 2px solid #f44336;
                        border-radius: 8px;
                        padding: 1rem;
                        text-align: center;
                        min-height: 200px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    
                    .fallback-title {
                        color: #c62828;
                        margin: 0 0 1rem 0;
                        font-size: 1.1rem;
                    }
                    
                    .fallback-btn {
                        background: #d71920;
                        color: white;
                        padding: 0.5rem 1rem;
                        text-decoration: none;
                        border-radius: 4px;
                        display: inline-block;
                    }
                </style>
                <div class="fallback-card">
                    <h3 class="fallback-title">${title}</h3>
                    <p>Unable to load chapter data</p>
                    <a href="${href}" class="fallback-btn">View Chapter</a>
                </div>
            `;
        } catch (fallbackError) {
            console.error('Error in fallback rendering:', fallbackError);
            this.shadowRoot.innerHTML = '<div style="padding: 1rem; border: 1px solid #ccc;">Error loading chapter</div>';
        }
    }
    
    // Update progress dynamically
    updateProgress(newPercentage) {
        try {
            const percentage = Math.max(0, Math.min(100, Number(newPercentage) || 0));
            const progressCircle = this.shadowRoot.querySelector('.progress');
            const progressText = this.shadowRoot.querySelector('.progress-text');
            const completionBadge = this.shadowRoot.querySelector('.completion-badge');
            
            if (progressCircle) {
                const circumference = 2 * Math.PI * 25;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                progressCircle.style.strokeDashoffset = strokeDashoffset;
            }
            
            if (progressText) {
                progressText.textContent = `${percentage}%`;
            }
            
            if (completionBadge) {
                completionBadge.style.opacity = percentage === 100 ? '1' : '0';
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }
}

// Progress Ring Component
class CSProgressRing extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        try {
            this.render();
        } catch (error) {
            console.error('Error in CSProgressRing connectedCallback:', error);
            this.renderFallback();
        }
    }
    
    getAttributeSafe(name, defaultValue = '') {
        try {
            return this.getAttribute(name) || defaultValue;
        } catch (error) {
            console.warn(`Error getting attribute ${name}:`, error);
            return defaultValue;
        }
    }
    
    render() {
        try {
            const percentage = Math.max(0, Math.min(100, parseInt(this.getAttributeSafe('percentage', '0')) || 0));
            const size = parseInt(this.getAttributeSafe('size', '60')) || 60;
            const strokeWidth = parseInt(this.getAttributeSafe('stroke-width', '6')) || 6;
            const color = this.getAttributeSafe('color', '#d71920');
            const backgroundColor = this.getAttributeSafe('background-color', '#e5e5e5');
            
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: inline-block;
                        width: ${size}px;
                        height: ${size}px;
                    }
                    
                    .progress-ring {
                        width: 100%;
                        height: 100%;
                        position: relative;
                    }
                    
                    .progress-ring svg {
                        width: 100%;
                        height: 100%;
                        transform: rotate(-90deg);
                    }
                    
                    .progress-ring circle {
                        fill: none;
                        stroke-linecap: round;
                    }
                    
                    .progress-text {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: ${Math.max(10, size * 0.2)}px;
                        font-weight: 700;
                        color: ${color};
                        text-align: center;
                        line-height: 1;
                    }
                </style>
                
                <div class="progress-ring">
                    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                        <circle 
                            cx="${size / 2}" 
                            cy="${size / 2}" 
                            r="${radius}"
                            stroke="${backgroundColor}" 
                            stroke-width="${strokeWidth}">
                        </circle>
                        <circle 
                            cx="${size / 2}" 
                            cy="${size / 2}" 
                            r="${radius}"
                            stroke="${color}" 
                            stroke-width="${strokeWidth}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${strokeDashoffset}"
                            style="transition: stroke-dashoffset 0.3s ease;">
                        </circle>
                    </svg>
                    <div class="progress-text">${percentage}%</div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering CSProgressRing:', error);
            this.renderFallback();
        }
    }
    
    renderFallback() {
        try {
            this.shadowRoot.innerHTML = `
                <style>
                    .fallback {
                        width: 60px;
                        height: 60px;
                        border: 2px solid #ccc;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #666;
                        font-size: 12px;
                    }
                </style>
                <div class="fallback">0%</div>
            `;
        } catch (fallbackError) {
            console.error('Error in fallback rendering:', fallbackError);
        }
    }
    
    updateProgress(newPercentage) {
        try {
            const percentage = Math.max(0, Math.min(100, Number(newPercentage) || 0));
            const progressCircle = this.shadowRoot.querySelector('circle:last-child');
            const progressText = this.shadowRoot.querySelector('.progress-text');
            
            if (progressCircle) {
                const size = parseInt(this.getAttributeSafe('size', '60')) || 60;
                const strokeWidth = parseInt(this.getAttributeSafe('stroke-width', '6')) || 6;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                
                progressCircle.style.strokeDashoffset = strokeDashoffset;
            }
            
            if (progressText) {
                progressText.textContent = `${percentage}%`;
            }
        } catch (error) {
            console.error('Error updating progress ring:', error);
        }
    }
}

// Quiz Status Component
class CSQuizStatus extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        try {
            this.render();
        } catch (error) {
            console.error('Error in CSQuizStatus connectedCallback:', error);
            this.renderFallback();
        }
    }
    
    getAttributeSafe(name, defaultValue = '') {
        try {
            return this.getAttribute(name) || defaultValue;
        } catch (error) {
            console.warn(`Error getting attribute ${name}:`, error);
            return defaultValue;
        }
    }
    
    render() {
        try {
            const status = this.getAttributeSafe('status', 'not-started'); // not-started, in-progress, completed, failed
            const score = parseInt(this.getAttributeSafe('score', '0')) || 0;
            const total = parseInt(this.getAttributeSafe('total', '0')) || 0;
            const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
            
            let statusColor = '#999';
            let statusText = 'Not Started';
            let statusIcon = '○';
            
            switch (status) {
                case 'in-progress':
                    statusColor = '#ff9800';
                    statusText = 'In Progress';
                    statusIcon = '◐';
                    break;
                case 'completed':
                    statusColor = '#4caf50';
                    statusText = 'Completed';
                    statusIcon = '✓';
                    break;
                case 'failed':
                    statusColor = '#f44336';
                    statusText = 'Needs Review';
                    statusIcon = '✗';
                    break;
            }
            
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: inline-block;
                    }
                    
                    .quiz-status {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.25rem 0.75rem;
                        border-radius: 16px;
                        background: ${statusColor}20;
                        border: 1px solid ${statusColor}40;
                        font-size: 0.85rem;
                        font-weight: 500;
                    }
                    
                    .status-icon {
                        color: ${statusColor};
                        font-weight: bold;
                    }
                    
                    .status-text {
                        color: ${statusColor};
                    }
                    
                    .status-score {
                        color: ${statusColor};
                        font-weight: 600;
                        margin-left: 0.25rem;
                    }
                </style>
                
                <div class="quiz-status">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${statusText}</span>
                    ${status === 'completed' || status === 'failed' ? 
                        `<span class="status-score">${score}/${total} (${percentage}%)</span>` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Error rendering CSQuizStatus:', error);
            this.renderFallback();
        }
    }
    
    renderFallback() {
        try {
            this.shadowRoot.innerHTML = `
                <style>
                    .fallback {
                        padding: 0.25rem 0.5rem;
                        background: #f0f0f0;
                        border-radius: 4px;
                        font-size: 0.8rem;
                        color: #666;
                    }
                </style>
                <div class="fallback">Quiz Status</div>
            `;
        } catch (fallbackError) {
            console.error('Error in fallback rendering:', fallbackError);
        }
    }
    
    updateStatus(newStatus, score = 0, total = 0) {
        try {
            this.setAttribute('status', newStatus);
            if (score > 0) this.setAttribute('score', score.toString());
            if (total > 0) this.setAttribute('total', total.toString());
            this.render();
        } catch (error) {
            console.error('Error updating quiz status:', error);
        }
    }
}

// Register custom elements with error handling
function registerComponents() {
    try {
        // Check if elements are already defined to avoid errors
        if (!customElements.get('cs-card')) {
            customElements.define('cs-card', CSCard);
            console.log('CSCard component registered');
        }
        
        if (!customElements.get('cs-progress-ring')) {
            customElements.define('cs-progress-ring', CSProgressRing);
            console.log('CSProgressRing component registered');
        }
        
        if (!customElements.get('cs-quiz-status')) {
            customElements.define('cs-quiz-status', CSQuizStatus);
            console.log('CSQuizStatus component registered');
        }
        
        console.log('All components registered successfully');
    } catch (error) {
        console.error('Error registering components:', error);
    }
}

// Initialize components
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerComponents);
    } else {
        registerComponents();
    }
    
    // Make components available globally
    window.CSCard = CSCard;
    window.CSProgressRing = CSProgressRing;
    window.CSQuizStatus = CSQuizStatus;
}

// Export for module usage
export { CSCard, CSProgressRing, CSQuizStatus };

console.log('Canadian Style components module loaded successfully');
