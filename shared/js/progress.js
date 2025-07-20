/**
 * Progress Tracking System for The Canadian Style Learning Platform
 * Manages user progress using localStorage with fallback handling
 * FIXED VERSION - supports both old and new API calls
 */

// Storage key for progress data
const STORAGE_KEY = 'csProgress';
const STORAGE_VERSION = '1.0';

// Chapter sections mapping - WITH VALIDATION
const CHAPTER_SECTIONS = {
    ch01: ['introduction', 'sentence-capitals', 'proper-nouns', 'government-bodies', 'titles-positions', 'geographic-names', 'brand-names', 'academic-degrees'],
    ch02: ['introduction', 'compound-words', 'prefixes', 'word-division', 'special-cases', 'technical-terms'],
    ch03: ['introduction', 'canadian-spelling', 'variants', 'word-endings', 'troublesome-words'],
    ch04: ['introduction', 'initial-words', 'personal-names', 'government', 'titles', 'geography', 'publications', 'headings'],
    ch05: ['introduction', 'round-numbers', 'consistency', 'initial', 'quantities', 'money', 'percentages', 'time', 'dates'],
    ch06: ['introduction', 'emphasis', 'titles', 'foreign-words'],
    ch07: ['introduction', 'comma', 'semicolon', 'colon', 'dashes', 'parentheses', 'apostrophe', 'periods'],
    ch08: ['introduction', 'quotation-marks', 'dialogue', 'citations', 'block-quotes', 'punctuation'],
    ch09: ['introduction', 'footnotes', 'bibliography', 'citations', 'indexes'],
    ch10: ['introduction', 'business-letters', 'memos', 'formatting', 'addresses', 'signatures'],
    ch11: ['introduction', 'structure', 'headings', 'front-matter', 'appendices', 'minutes', 'formatting'],
    ch12: ['introduction', 'prepositions', 'affect-effect', 'compose-comprise', 'less-fewer', 'that-which', 'common-errors', 'idioms'],
    ch13: ['introduction', 'reader-focus', 'organization', 'vocabulary', 'sentences', 'layout', 'testing'],
    ch14: ['introduction', 'sexual', 'racial', 'disabilities'],
    ch15: ['introduction', 'canadian', 'foreign', 'adjectives', 'provinces'],
    ch16: ['introduction', 'editing-levels', 'proofreading', 'symbols', 'checklists', 'technology', 'final-review']
};

/**
 * Validate chapter ID
 * @param {string} chapterId - Chapter identifier to validate
 * @returns {boolean} - Whether the chapter ID is valid
 */
function isValidChapterId(chapterId) {
    if (!chapterId || typeof chapterId !== 'string') {
        console.warn('Invalid chapter ID provided:', chapterId);
        return false;
    }
    
    if (!CHAPTER_SECTIONS[chapterId]) {
        console.warn(`Chapter ID not found in sections: ${chapterId}`);
        return false;
    }
    
    return true;
}

/**
 * Initialize progress system
 */
function initializeProgress() {
    try {
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available, progress will not be saved');
            return;
        }
        
        // Get existing data or create new
        const data = getProgressData();
        
        // Ensure data has proper structure
        if (!data.chapters) {
            data.chapters = {};
        }
        
        // Save back to ensure proper structure
        saveProgressData(data);
        
        console.log('Progress system initialized successfully');
    } catch (error) {
        console.error('Error initializing progress system:', error);
    }
}

/**
 * Get progress data from localStorage
 * @returns {Object} - Progress data with safe defaults
 */
function getProgressData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : { chapters: {}, version: STORAGE_VERSION };
        
        // Ensure required structure exists
        if (!parsed.chapters) {
            parsed.chapters = {};
        }
        
        return parsed;
    } catch (error) {
        console.warn('Error reading progress data:', error);
        return { 
            chapters: {}, 
            version: STORAGE_VERSION,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}

/**
 * Save progress data to localStorage
 * @param {Object} data - Progress data to save
 * @returns {boolean} - Whether save was successful
 */
function saveProgressData(data) {
    try {
        // Ensure data structure is valid
        if (!data || typeof data !== 'object') {
            console.error('Invalid data provided to saveProgressData');
            return false;
        }
        
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Emit progress changed event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('progress-changed', {
                detail: { data }
            }));
        }
        
        return true;
    } catch (error) {
        console.error('Error saving progress data:', error);
        return false;
    }
}

/**
 * Get progress - DUAL API SUPPORT
 * 
 * NEW API: getProgress(chapterId, sectionId) - returns boolean for specific section
 * OLD API: getProgress() - returns all progress data for backward compatibility
 * 
 * @param {string} [chapterId] - Chapter identifier (optional)
 * @param {string} [sectionId] - Section identifier (optional)
 * @returns {boolean|Object} - Section completion status or all progress data
 */
export function getProgress(chapterId, sectionId) {
    try {
        const data = getProgressData();
        
        // OLD API: If no parameters provided, return all progress data (backward compatibility)
        if (!chapterId && !sectionId) {
            return data.chapters;
        }
        
        // NEW API: If both parameters provided, return specific section status
        if (chapterId && sectionId) {
            // Validate inputs
            if (!isValidChapterId(chapterId)) {
                return false;
            }
            
            if (!sectionId || typeof sectionId !== 'string') {
                console.warn('Invalid section ID provided:', sectionId);
                return false;
            }
            
            return data.chapters[chapterId]?.[sectionId] || false;
        }
        
        // If only chapterId provided, return chapter data
        if (chapterId) {
            if (!isValidChapterId(chapterId)) {
                return {};
            }
            return data.chapters[chapterId] || {};
        }
        
        // Default fallback
        return data.chapters;
    } catch (error) {
        console.error('Error getting progress:', error);
        return arguments.length === 0 ? {} : false;
    }
}

/**
 * Set progress for a specific chapter and section
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier
 * @param {boolean} completed - Whether the section is completed
 * @returns {boolean} - Whether the operation was successful
 */
export function setProgress(chapterId, sectionId, completed = true) {
    try {
        // Validate inputs
        if (!isValidChapterId(chapterId)) {
            return false;
        }
        
        if (!sectionId || typeof sectionId !== 'string') {
            console.warn('Invalid section ID provided:', sectionId);
            return false;
        }
        
        const data = getProgressData();
        
        // Initialize chapter if it doesn't exist
        if (!data.chapters[chapterId]) {
            data.chapters[chapterId] = {};
        }
        
        // Set section progress
        data.chapters[chapterId][sectionId] = Boolean(completed);
        
        // Update last visit
        data.lastVisit = `${chapterId}#${sectionId}`;
        
        // Save data
        const saved = saveProgressData(data);
        
        if (saved) {
            console.log(`Progress updated: ${chapterId}/${sectionId} = ${completed}`);
        }
        
        return saved;
    } catch (error) {
        console.error('Error setting progress:', error);
        return false;
    }
}

/**
 * Get all progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {Object} - Object with section completion status (safe defaults)
 */
export function getChapterProgress(chapterId) {
    try {
        // Validate chapter ID
        if (!isValidChapterId(chapterId)) {
            return {};
        }
        
        const data = getProgressData();
        return data.chapters[chapterId] || {};
    } catch (error) {
        console.error('Error getting chapter progress:', error);
        return {};
    }
}

/**
 * Calculate completion percentage for a chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {number} - Completion percentage (0-100) with safe defaults
 */
export function calculateChapterProgress(chapterId) {
    try {
        // Validate chapter ID first
        if (!isValidChapterId(chapterId)) {
            return 0;
        }
        
        const chapterData = getChapterProgress(chapterId);
        const sections = CHAPTER_SECTIONS[chapterId] || [];
        
        if (sections.length === 0) {
            console.warn(`No sections found for chapter ${chapterId}`);
            return 0;
        }
        
        const completedSections = sections.filter(sectionId => {
            return chapterData[sectionId] === true;
        }).length;
        
        const percentage = Math.round((completedSections / sections.length) * 100);
        
        return Math.max(0, Math.min(100, percentage)); // Ensure 0-100 range
    } catch (error) {
        console.error('Error calculating chapter progress:', error);
        return 0;
    }
}

/**
 * Get overall progress statistics
 * @returns {Object} - Overall progress statistics
 */
export function getOverallProgress() {
    try {
        const chapters = Object.keys(CHAPTER_SECTIONS);
        let totalSections = 0;
        let completedSections = 0;
        let completedChapters = 0;
        
        chapters.forEach(chapterId => {
            const sections = CHAPTER_SECTIONS[chapterId];
            const chapterData = getChapterProgress(chapterId);
            
            totalSections += sections.length;
            
            const completed = sections.filter(sectionId => chapterData[sectionId] === true).length;
            completedSections += completed;
            
            // Chapter is complete if all sections are complete
            if (completed === sections.length) {
                completedChapters++;
            }
        });
        
        const stats = {
            totalChapters: chapters.length,
            completedChapters,
            totalSections,
            completedSections,
            overallPercentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0
        };
        
        return stats;
    } catch (error) {
        console.error('Error calculating overall progress:', error);
        return {
            totalChapters: 0,
            completedChapters: 0,
            totalSections: 0,
            completedSections: 0,
            overallPercentage: 0
        };
    }
}

/**
 * Get next suggested chapter/section
 * @returns {Object|null} - Next chapter/section or null if all complete
 */
export function getNextSuggestion() {
    try {
        const data = getProgressData();
        
        // Check each chapter in order
        for (const chapterId of Object.keys(CHAPTER_SECTIONS)) {
            const sections = CHAPTER_SECTIONS[chapterId];
            const chapterData = data.chapters[chapterId] || {};
            
            // Find first incomplete section in this chapter
            for (const sectionId of sections) {
                if (!chapterData[sectionId]) {
                    return {
                        chapterId,
                        sectionId,
                        chapterNumber: chapterId.replace('ch', ''),
                        sectionTitle: sectionId
                    };
                }
            }
        }
        
        // All sections complete
        return null;
    } catch (error) {
        console.error('Error getting next suggestion:', error);
        return null;
    }
}

/**
 * Get progress summary for dashboard
 * @returns {Object} - Complete progress summary
 */
export function getProgressSummary() {
    try {
        const data = getProgressData();
        const overall = getOverallProgress();
        const next = getNextSuggestion();
        
        return {
            storage: {
                version: data.version,
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
    } catch (error) {
        console.error('Error getting progress summary:', error);
        return {
            storage: {},
            overall: getOverallProgress(),
            next: null,
            chapters: []
        };
    }
}

/**
 * Update progress ring visual elements
 * @param {string} elementId - ID of progress ring element
 * @param {number} percentage - Progress percentage (0-100)
 */
export function updateProgressRing(elementId, percentage) {
    try {
        if (!elementId || typeof elementId !== 'string') {
            console.warn('Invalid element ID for progress ring');
            return;
        }
        
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Progress ring element not found: ${elementId}`);
            return;
        }
        
        const circle = element.querySelector('circle[stroke="#d71920"]');
        const text = element.querySelector('text');
        
        const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0));
        
        if (circle) {
            const circumference = 2 * Math.PI * 25; // radius = 25
            const offset = circumference - (safePercentage / 100) * circumference;
            circle.style.strokeDasharray = `${circumference}`;
            circle.style.strokeDashoffset = `${offset}`;
        }
        
        if (text) {
            text.textContent = `${safePercentage}%`;
        }
    } catch (error) {
        console.error('Error updating progress ring:', error);
    }
}

/**
 * Reset all progress data
 * @returns {boolean} - Whether reset was successful
 */
export function resetAllProgress() {
    try {
        const freshData = {
            version: STORAGE_VERSION,
            chapters: {},
            lastVisit: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const success = saveProgressData(freshData);
        
        if (success) {
            console.log('All progress data has been reset');
        }
        
        return success;
    } catch (error) {
        console.error('Error resetting progress:', error);
        return false;
    }
}

/**
 * Export progress data for backup
 * @returns {string|null} - JSON string of progress data or null if error
 */
export function exportProgress() {
    try {
        const data = getProgressData();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error exporting progress:', error);
        return null;
    }
}

/**
 * Import progress data from backup
 * @param {string} jsonString - JSON string of progress data
 * @returns {boolean} - Whether import was successful
 */
export function importProgress(jsonString) {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            console.error('Invalid JSON string provided for import');
            return false;
        }
        
        const data = JSON.parse(jsonString);
        
        // Validate data structure
        if (!data.chapters || typeof data.chapters !== 'object') {
            console.error('Invalid progress data structure');
            return false;
        }
        
        // Update version and timestamp
        data.version = STORAGE_VERSION;
        data.updatedAt = new Date().toISOString();
        
        return saveProgressData(data);
    } catch (error) {
        console.error('Error importing progress:', error);
        return false;
    }
}

/**
 * Setup progress event listeners
 */
function setupProgressListeners() {
    try {
        if (typeof window === 'undefined') {
            return;
        }
        
        // Listen for quiz completions
        window.addEventListener('quiz-completed', (event) => {
            try {
                const { chapterId, sectionId, percentage } = event.detail || {};
                
                // Mark section as complete if quiz score is good enough
                if (percentage >= 80 && chapterId && sectionId) {
                    setProgress(chapterId, sectionId, true);
                }
            } catch (error) {
                console.error('Error handling quiz completion:', error);
            }
        });
        
        // Listen for section completions
        window.addEventListener('section-completed', (event) => {
            try {
                const { chapterId, sectionId } = event.detail || {};
                if (chapterId && sectionId) {
                    setProgress(chapterId, sectionId, true);
                }
            } catch (error) {
                console.error('Error handling section completion:', error);
            }
        });
        
        console.log('Progress event listeners initialized successfully');
    } catch (error) {
        console.error('Error setting up progress listeners:', error);
    }
}

// Initialize progress system when module loads
try {
    initializeProgress();
    setupProgressListeners();
    console.log('Progress tracking system loaded successfully');
} catch (error) {
    console.error('Error during progress system initialization:', error);
}

// Make key functions available globally for compatibility with old code
if (typeof window !== 'undefined') {
    window.getProgress = getProgress;
    window.setProgress = setProgress;
    window.getChapterProgress = getChapterProgress;
    window.calculateChapterProgress = calculateChapterProgress;
    window.getOverallProgress = getOverallProgress;
    
    // Signal that progress module is loaded
    window.progressModuleLoaded = true;
}

// Development helper functions (only in development)
if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    window.progressDebug = {
        summary: getProgressSummary,
        reset: resetAllProgress,
        export: exportProgress,
        import: importProgress,
        sections: CHAPTER_SECTIONS,
        validate: isValidChapterId
    };
    
    console.log('Progress debug functions available at window.progressDebug');
}
