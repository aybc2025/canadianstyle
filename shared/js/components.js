/**
 * Canadian Style Components Library
 * Handles chapter initialization, navigation, and interactive elements
 */

import { getCurrentProgress, markSectionComplete, getDetailedChapterProgress } from './progress.js';
import { QuizEngine } from './quiz-engine.js';

/**
 * Initialize a chapter with sections and set up navigation
 * @param {string} chapterId - The chapter identifier (e.g., 'ch05')
 * @param {Array} sections - Array of section objects with id and title
 */
export function initializeChapter(chapterId, sections) {
    try {
        console.log(`[Components] Initializing chapter ${chapterId} with ${sections.length} sections`);
        
        // Set up section navigation
        setupSectionNavigation(chapterId, sections);
        
        // Initialize quiz engines for sections with quiz data
        initializeQuizEngines(chapterId, sections);
        
        // Set up progress tracking
        setupProgressTracking(chapterId, sections);
        
        // Set up keyboard navigation
        setupKeyboardNavigation(sections);
        
        // Initialize any interactive elements
        initializeInteractiveElements();
        
        // Show initial section based on URL hash or first section
        showInitialSection(sections);
        
        console.log(`[Components] Chapter ${chapterId} initialized successfully`);
        
    } catch (error) {
        console.error(`[Components] Error initializing chapter ${chapterId}:`, error);
    }
}

/**
 * Set up section navigation and tab switching
 * @param {string} chapterId - Chapter identifier
 * @param {Array} sections - Section configuration
 */
function setupSectionNavigation(chapterId, sections) {
    const sectionNav = document.getElementById('sectionNav');
    const tabLinks = document.querySelectorAll('.tab-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    if (!sectionNav) {
        console.warn('[Components] Section navigation element not found');
        return;
    }
    
    // Add click handlers for navigation
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId, sections);
                updateURL(sectionId);
            }
        });
    });
    
    console.log(`[Components] Set up navigation for ${tabLinks.length} tabs`);
}

/**
 * Show a specific section and update navigation
 * @param {string} sectionId - Section to show
 * @param {Array} sections - All available sections
 */
function showSection(sectionId, sections) {
    // Hide all sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation active state
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Scroll to top of content
    window.scrollTo(0, 0);
    
    console.log(`[Components] Switched to section: ${sectionId}`);
}

/**
 * Initialize quiz engines for sections that have quizzes
 * @param {string} chapterId - Chapter identifier
 * @param {Array} sections - Section configuration
 */
async function initializeQuizEngines(chapterId, sections) {
    const quizContainers = document.querySelectorAll('.quiz-engine-container');
    
    for (const container of quizContainers) {
        const sectionId = container.getAttribute('data-quiz-section');
        if (!sectionId) continue;
        
        try {
            const quizEngine = await QuizEngine.createFromSection(chapterId, sectionId);
            if (quizEngine) {
                quizEngine.render(container);
                console.log(`[Components] Initialized quiz for ${chapterId}-${sectionId}`);
            }
        } catch (error) {
            console.warn(`[Components] Could not initialize quiz for ${chapterId}-${sectionId}:`, error);
            // Show fallback message
            container.innerHTML = '<p class="text-muted">Quiz content is being prepared.</p>';
        }
    }
}

/**
 * Set up progress tracking for the chapter
 * @param {string} chapterId - Chapter identifier
 * @param {Array} sections - Section configuration
 */
function setupProgressTracking(chapterId, sections) {
    try {
        updateProgressBar(chapterId, sections);
        
        // Set up completion buttons
        window.completeSection = function(sectionId) {
            markSectionComplete(chapterId, sectionId, true);
            updateProgressBar(chapterId, sections);
            
            // Find next section
            const currentIndex = sections.findIndex(s => s.id === sectionId);
            if (currentIndex < sections.length - 1) {
                const nextSection = sections[currentIndex + 1];
                setTimeout(() => {
                    showSection(nextSection.id, sections);
                    updateURL(nextSection.id);
                }, 1000); // Small delay for user feedback
            }
        };
        
    } catch (error) {
        console.error('[Components] Error setting up progress tracking:', error);
    }
}

/**
 * Update the chapter progress bar
 * @param {string} chapterId - Chapter identifier
 * @param {Array} sections - Section configuration
 */
function updateProgressBar(chapterId, sections) {
    try {
        const chapterProgress = getDetailedChapterProgress(chapterId);
        if (!chapterProgress) return;
        
        const progressBar = document.getElementById('chapterProgress');
        if (progressBar) {
            const percentage = chapterProgress.percentage || 0;
            progressBar.style.width = percentage + '%';
        }
        
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = `${chapterProgress.percentage || 0}% Complete`;
        }
        
    } catch (error) {
        console.error('[Components] Error updating progress bar:', error);
    }
}

/**
 * Set up keyboard navigation
 * @param {Array} sections - Section configuration
 */
function setupKeyboardNavigation(sections) {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            const currentActiveTab = document.querySelector('.tab-link.active');
            if (!currentActiveTab) return;
            
            const currentSectionId = currentActiveTab.getAttribute('data-section');
            const currentIndex = sections.findIndex(s => s.id === currentSectionId);
            
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                e.preventDefault();
                const prevSection = sections[currentIndex - 1];
                showSection(prevSection.id, sections);
                updateURL(prevSection.id);
            } else if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
                e.preventDefault();
                const nextSection = sections[currentIndex + 1];
                showSection(nextSection.id, sections);
                updateURL(nextSection.id);
            }
        }
    });
}

/**
 * Initialize interactive elements like collapsible content
 */
function initializeInteractiveElements() {
    // Set up collapsible content
    const collapsibleTriggers = document.querySelectorAll('[data-toggle="collapse"]');
    collapsibleTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = trigger.getAttribute('data-target');
            const target = document.querySelector(targetId);
            if (target) {
                target.classList.toggle('show');
                trigger.classList.toggle('expanded');
            }
        });
    });
    
    // Set up tooltips
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

/**
 * Show initial section based on URL or default to first
 * @param {Array} sections - Section configuration
 */
function showInitialSection(sections) {
    const hash = window.location.hash.substring(1);
    const initialSection = hash && sections.find(s => s.id === hash) 
        ? hash 
        : sections[0].id;
    
    showSection(initialSection, sections);
}

/**
 * Update URL with current section
 * @param {string} sectionId - Current section ID
 */
function updateURL(sectionId) {
    history.replaceState(null, null, `#${sectionId}`);
}

/**
 * Show tooltip
 * @param {Event} e - Mouse event
 */
function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '0.5rem';
    tooltip.style.borderRadius = '0.25rem';
    tooltip.style.fontSize = '0.875rem';
    tooltip.style.zIndex = '1000';
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY + 10 + 'px';
    
    document.body.appendChild(tooltip);
    e.target.tooltipElement = tooltip;
}

/**
 * Hide tooltip
 * @param {Event} e - Mouse event
 */
function hideTooltip(e) {
    if (e.target.tooltipElement) {
        e.target.tooltipElement.remove();
        e.target.tooltipElement = null;
    }
}

/**
 * Smooth scroll to element
 * @param {string} targetId - ID of target element
 * @param {number} offset - Offset from top (default: 80)
 */
export function smoothScrollTo(targetId, offset = 80) {
    const target = document.getElementById(targetId);
    if (target) {
        const targetPosition = target.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Create a notification/alert
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, warning, error, info)
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 0.5rem;
        background: var(--cs-white);
        border: 1px solid var(--cs-grey-300);
        box-shadow: var(--cs-shadow-lg);
        z-index: 1050;
        min-width: 250px;
        font-weight: 500;
    `;
    
    // Set color based on type
    const colors = {
        success: { border: '#10b981', background: '#d1fae5', color: '#065f46' },
        warning: { border: '#f59e0b', background: '#fef3c7', color: '#92400e' },
        error: { border: '#ef4444', background: '#fee2e2', color: '#991b1b' },
        info: { border: '#3b82f6', background: '#dbeafe', color: '#1e40af' }
    };
    
    if (colors[type]) {
        notification.style.borderColor = colors[type].border;
        notification.style.backgroundColor = colors[type].background;
        notification.style.color = colors[type].color;
    }
    
    document.body.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Components] Canadian Style components library loaded');
});

// Export for debugging
window.CanadianStyleComponents = {
    initializeChapter,
    showNotification,
    smoothScrollTo
};

console.log('[Components] Canadian Style components loaded successfully');
