/**
 * Progress Tracking System for The Canadian Style Learning Platform
 * Manages user progress using localStorage with fallback handling
 */

// Storage key for progress data
const STORAGE_KEY = 'csProgress';
const STORAGE_VERSION = '1.0';

// Chapter sections mapping
const CHAPTER_SECTIONS = {
    ch01: ['introduction', 'sentence-capitals', 'proper-nouns', 'government-bodies', 'titles-positions', 'geographic-names', 'brand-names', 'academic-degrees'],
    ch02: ['introduction', 'compound-words', 'prefixes', 'word-division', 'special-cases', 'technical-terms'],
    ch03: ['introduction', 'canadian-spelling', 'variants', 'word-endings', 'troublesome-words'],
    ch04: ['introduction', 'periods', 'titles', 'organizations', 'scientific', 'postal', 'latin'],
    ch05: ['introduction', 'round-numbers', 'consistency', 'initial', 'quantities', 'money', 'percentages', 'time', 'dates'],
    ch06: ['introduction', 'emphasis', 'titles', 'foreign-words'],
    ch07: ['introduction', 'comma', 'semicolon', 'colon', 'dashes', 'parentheses', 'apostrophe', 'periods'],
    ch08: ['introduction', 'quotation-marks', 'dialogue', 'citations', 'block-quotes', 'punctuation'],
    ch09: ['introduction', 'footnotes', 'bibliography', 'citations', 'indexes'],
    ch10: ['introduction', 'business-letters', 'memos', 'formatting', 'addresses', 'signatures'],
    ch11: ['introduction', 'structure', 'headings', 'front-matter', 'appendices', 'minutes', 'formatting'],
    ch12: ['introduction', 'common-errors', 'word-choice'],
    ch13: ['introduction', 'principles', 'word-choice', 'sentence-structure', 'organization', 'testing', 'examples'],
    ch14: ['introduction', 'gender', 'race-ethnicity', 'disability'],
    ch15: ['introduction', 'canadian', 'foreign', 'adjectives', 'provinces'],
    ch16: ['introduction', 'process', 'techniques', 'proofreading', 'symbols', 'technology', 'final-check']
};

/**
 * Initialize progress tracking system
 */
function initializeProgress() {
    // Ensure storage exists with proper structure
    const progress = getProgressData();
    if (!progress.version || progress.version !== STORAGE_VERSION) {
        console.log('Initializing progress storage...');
        saveProgressData({
            version: STORAGE_VERSION,
            chapters: {},
            lastVisit: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    console.log('Progress system initialized');
}

/**
 * Get raw progress data from localStorage
 */
function getProgressData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { chapters: {}, version: STORAGE_VERSION };
    } catch (error) {
        console.warn('Error reading progress data:', error);
        return { chapters: {}, version: STORAGE_VERSION };
    }
}

/**
 * Save progress data to localStorage
 */
function saveProgressData(data) {
    try {
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Emit progress changed event
        window.dispatchEvent(new CustomEvent('progress-changed', {
            detail: { data }
        }));
        
        return true;
    } catch (error) {
        console.error('Error saving progress data:', error);
        return false;
    }
}

/**
 * Get progress for a specific chapter and section
 * @param {string} chapterId - Chapter identifier (e.g., 'ch07')
 * @param {string} sectionId - Section identifier (e.g., 'comma')
 * @returns {boolean} - Whether the section is completed
 */
export function getProgress(chapterId, sectionId) {
    const data = getProgressData();
    return data.chapters[chapterId]?.[sectionId] || false;
}

/**
 * Set progress for a specific chapter and section
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier
 * @param {boolean} completed - Whether the section is completed
 */
export function setProgress(chapterId, sectionId, completed = true) {
    const data = getProgressData();
    
    // Initialize chapter if it doesn't exist
    if (!data.chapters[chapterId]) {
        data.chapters[chapterId] = {};
    }
    
    // Set section progress
    data.chapters[chapterId][sectionId] = completed;
    
    // Update last visit
    data.lastVisit = `${chapterId}#${sectionId}`;
    
    // Save data
    const saved = saveProgressData(data);
    
    if (saved) {
        console.log(`Progress updated: ${chapterId}/${sectionId} = ${completed}`);
    }
    
    return saved;
}

/**
 * Get all progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {Object} - Object with section completion status
 */
export function getChapterProgress(chapterId) {
    const data = getProgressData();
    return data.chapters[chapterId] || {};
}

/**
 * Calculate completion percentage for a chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {number} - Completion percentage (0-100)
 */
export function calculateChapterProgress(chapterId) {
    const chapterData = getChapterProgress(chapterId);
    const sections = CHAPTER_SECTIONS[chapterId] || [];
    
    if (sections.length === 0) {
        return 0;
    }
    
    const completedSections = sections.filter(sectionId => chapterData[sectionId]).length;
    return Math.round((completedSections / sections.length) * 100);
}

/**
 * Get overall progress across all chapters
 * @returns {Object} - Overall progress statistics
 */
export function getOverallProgress() {
    const data = getProgressData();
    const stats = {
        totalChapters: Object.keys(CHAPTER_SECTIONS).length,
        completedChapters: 0,
        totalSections: 0,
        completedSections: 0,
        overallPercentage: 0
    };
    
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        const sections = CHAPTER_SECTIONS[chapterId];
        const chapterData = data.chapters[chapterId] || {};
        
        stats.totalSections += sections.length;
        
        const completedInChapter = sections.filter(sectionId => chapterData[sectionId]).length;
        stats.completedSections += completedInChapter;
        
        // Count chapter as completed if all sections are done
        if (completedInChapter === sections.length) {
            stats.completedChapters++;
        }
    });
    
    stats.overallPercentage = stats.totalSections > 0 ? 
        Math.round((stats.completedSections / stats.totalSections) * 100) : 0;
    
    return stats;
}

/**
 * Reset progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 */
export function resetChapterProgress(chapterId) {
    const data = getProgressData();
    
    if (data.chapters[chapterId]) {
        data.chapters[chapterId] = {};
        saveProgressData(data);
        console.log(`Progress reset for chapter: ${chapterId}`);
    }
}

/**
 * Reset all progress (use with caution)
 */
export function resetAllProgress() {
    const confirmed = confirm('Are you sure you want to reset all progress? This cannot be undone.');
    
    if (confirmed) {
        const data = {
            version: STORAGE_VERSION,
            chapters: {},
            lastVisit: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        saveProgressData(data);
        console.log('All progress has been reset');
        return true;
    }
    
    return false;
}

/**
 * Export progress data for backup
 * @returns {string} - JSON string of progress data
 */
export function exportProgress() {
    const data = getProgressData();
    return JSON.stringify(data, null, 2);
}

/**
 * Import progress data from backup
 * @param {string} jsonData - JSON string of progress data
 * @returns {boolean} - Whether import was successful
 */
export function importProgress(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // Validate data structure
        if (!data.chapters || typeof data.chapters !== 'object') {
            throw new Error('Invalid progress data format');
        }
        
        // Ensure version info
        data.version = STORAGE_VERSION;
        data.updatedAt = new Date().toISOString();
        
        const saved = saveProgressData(data);
        
        if (saved) {
            console.log('Progress data imported successfully');
        }
        
        return saved;
    } catch (error) {
        console.error('Error importing progress data:', error);
        return false;
    }
}

/**
 * Get next recommended section based on progress
 * @returns {Object|null} - Next section info or null if all completed
 */
export function getNextRecommendedSection() {
    const data = getProgressData();
    
    // Check last visit first
    if (data.lastVisit) {
        const [chapterId, sectionId] = data.lastVisit.split('#');
        if (chapterId && sectionId) {
            const sections = CHAPTER_SECTIONS[chapterId] || [];
            const currentIndex = sections.indexOf(sectionId);
            
            if (currentIndex < sections.length - 1) {
                return {
                    chapterId,
                    sectionId: sections[currentIndex + 1],
                    reason: 'continue-chapter'
                };
            }
        }
    }
    
    // Find first incomplete section
    for (const chapterId of Object.keys(CHAPTER_SECTIONS)) {
        const sections = CHAPTER_SECTIONS[chapterId];
        const chapterData = data.chapters[chapterId] || {};
        
        for (const sectionId of sections) {
            if (!chapterData[sectionId]) {
                return {
                    chapterId,
                    sectionId,
                    reason: 'first-incomplete'
                };
            }
        }
    }
    
    return null; // All completed
}

/**
 * Get progress summary for debugging
 * @returns {Object} - Detailed progress information
 */
export function getProgressSummary() {
    const data = getProgressData();
    const overall = getOverallProgress();
    const next = getNextRecommendedSection();
    
    return {
        storage: {
            version: data.version,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastVisit: data.lastVisit
        },
        overall,
        next,
        chapters: Object.keys(CHAPTER_SECTIONS).map(chapterId => ({
            id: chapterId,
            progress: calculateChapterProgress(chapterId),
            sections: getChapterProgress(chapterId)
        }))
    };
}

/**
 * Update progress ring visual elements
 * @param {string} elementId - ID of progress ring element
 * @param {number} percentage - Progress percentage (0-100)
 */
export function updateProgressRing(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const circle = element.querySelector('circle[stroke="#d71920"]');
    const text = element.querySelector('text');
    
    if (circle) {
        const circumference = 2 * Math.PI * 25; // radius = 25
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${offset}`;
    }
    
    if (text) {
        text.textContent = `${percentage}%`;
    }
}

/**
 * Setup progress event listeners
 */
function setupProgressListeners() {
    // Listen for quiz completions
    window.addEventListener('quiz-completed', (event) => {
        const { chapterId, sectionId, percentage } = event.detail;
        
        // Mark section as complete if quiz score is good enough
        if (percentage >= 80) {
            setProgress(chapterId, sectionId, true);
        }
    });
    
    // Listen for section completions
    window.addEventListener('section-completed', (event) => {
        const { chapterId, sectionId } = event.detail;
        setProgress(chapterId, sectionId, true);
    });
    
    console.log('Progress event listeners initialized');
}

// Initialize progress system when module loads
initializeProgress();
setupProgressListeners();

// Make key functions available globally for compatibility
window.getProgress = getProgress;
window.setProgress = setProgress;
window.getChapterProgress = getChapterProgress;
window.calculateChapterProgress = calculateChapterProgress;
window.getOverallProgress = getOverallProgress;

console.log('Progress tracking system loaded successfully');

// Development helper functions (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.progressDebug = {
        summary: getProgressSummary,
        reset: resetAllProgress,
        export: exportProgress,
        import: importProgress,
        sections: CHAPTER_SECTIONS
    };
    
    console.log('Progress debug functions available at window.progressDebug');
}