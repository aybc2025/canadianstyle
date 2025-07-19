/**
 * Progress Tracking System for The Canadian Style Learning Platform
 * Manages user progress using localStorage with fallback handling
 * FIXED VERSION - eliminates TypeError: Cannot read properties of undefined
 */

// Storage key for progress data
const STORAGE_KEY = 'csProgress';
const STORAGE_VERSION = '1.0';

// Chapter sections mapping - WITH VALIDATION
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
        console.warn(`Chapter ${chapterId} not found in CHAPTER_SECTIONS`);
        return false;
    }
    
    return true;
}

/**
 * Initialize progress tracking system
 */
function initializeProgress() {
    try {
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
        
        console.log('Progress system initialized successfully');
    } catch (error) {
        console.error('Error initializing progress system:', error);
        // Continue without crashing
    }
}

/**
 * Get raw progress data from localStorage
 * @returns {Object} - Progress data object with safe defaults
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
 * Get progress for a specific chapter and section
 * @param {string} chapterId - Chapter identifier (e.g., 'ch07')
 * @param {string} sectionId - Section identifier (e.g., 'comma')
 * @returns {boolean} - Whether the section is completed
 */
export function getProgress(chapterId, sectionId) {
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
        return data.chapters[chapterId]?.[sectionId] || false;
    } catch (error) {
        console.error('Error getting progress:', error);
        return false;
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
 * Get overall progress across all chapters
 * @returns {Object} - Overall progress statistics with safe defaults
 */
export function getOverallProgress() {
    try {
        const data = getProgressData();
        const stats = {
            totalChapters: Object.keys(CHAPTER_SECTIONS).length,
            completedChapters: 0,
            totalSections: 0,
            completedSections: 0,
            overallPercentage: 0
        };
        
        Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
            try {
                const sections = CHAPTER_SECTIONS[chapterId];
                const chapterData = data.chapters[chapterId] || {};
                
                stats.totalSections += sections.length;
                
                const completedInChapter = sections.filter(sectionId => {
                    return chapterData[sectionId] === true;
                }).length;
                
                stats.completedSections += completedInChapter;
                
                // Count chapter as completed if all sections are done
                if (completedInChapter === sections.length && sections.length > 0) {
                    stats.completedChapters++;
                }
            } catch (chapterError) {
                console.warn(`Error processing chapter ${chapterId}:`, chapterError);
            }
        });
        
        stats.overallPercentage = stats.totalSections > 0 ? 
            Math.round((stats.completedSections / stats.totalSections) * 100) : 0;
        
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
 * Get next recommended section for study
 * @returns {Object|null} - Next section info or null if all completed
 */
export function getNextRecommendedSection() {
    try {
        const data = getProgressData();
        
        // Check last visit first
        if (data.lastVisit) {
            const [chapterId, sectionId] = data.lastVisit.split('#');
            if (chapterId && sectionId && isValidChapterId(chapterId)) {
                const sections = CHAPTER_SECTIONS[chapterId];
                const currentIndex = sections.indexOf(sectionId);
                
                if (currentIndex >= 0 && currentIndex < sections.length - 1) {
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
    } catch (error) {
        console.error('Error getting next recommended section:', error);
        return null;
    }
}

/**
 * Get progress summary for debugging
 * @returns {Object} - Detailed progress information
 */
export function getProgressSummary() {
    try {
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
} catch (error) {
    console.error('Error during progress system initialization:', error);
}

// Make key functions available globally for compatibility
if (typeof window !== 'undefined') {
    window.getProgress = getProgress;
    window.setProgress = setProgress;
    window.getChapterProgress = getChapterProgress;
    window.calculateChapterProgress = calculateChapterProgress;
    window.getOverallProgress = getOverallProgress;
    
    // Signal that progress module is loaded
    window.progressModuleLoaded = true;
}

console.log('Progress tracking system loaded successfully');

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
