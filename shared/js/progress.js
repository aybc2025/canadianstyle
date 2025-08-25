/**
 * Progress Tracking System for The Canadian Style Learning Platform
 * Manages user progress using localStorage with comprehensive validation and fallback handling
 * COMPLETELY FIXED VERSION - supports both old and new API calls with full compatibility
 */

// Storage configuration
const STORAGE_KEY = 'csProgress';
const STORAGE_VERSION = '2.0';
const BACKUP_KEY = 'csProgressBackup';

// Chapter sections mapping - UPDATED FOR FIXED CHAPTERS
const CHAPTER_SECTIONS = {
    ch01: ['introduction', 'general-principles', 'sentence-capitals', 'proper-nouns', 'government-bodies', 'titles-positions', 'geographic-names', 'brand-names', 'academic-degrees'],
    ch02: ['introduction', 'compound-words', 'prefixes-suffixes', 'word-division', 'special-cases', 'technical-terms'],
    ch03: ['introduction', 'canadian-spelling', 'variants', 'word-endings', 'troublesome-words'],
    ch04: ['introduction', 'general-principles', 'proper-nouns', 'titles-positions', 'organizations', 'academic-subjects', 'special-cases'],
    ch05: ['basic-rules', 'sentence-beginning', 'money-measurements', 'dates-time', 'percentages-statistics', 'special-applications'],
    ch06: ['basic-principles', 'emphasis', 'foreign-words', 'titles-publications', 'technical-terms', 'legal-references', 'special-uses'],
    ch07: ['introduction', 'periods', 'commas', 'semicolons', 'colons', 'question-marks', 'exclamation-marks', 'apostrophes', 'parentheses-brackets', 'ellipsis', 'quotation-marks', 'dashes'],
    ch08: ['basic-rules', 'punctuation-with-quotes', 'block-quotations', 'nested-quotations', 'titles-special-uses', 'indirect-quotations'],
    ch09: ['introduction', 'footnotes', 'bibliography', 'citations', 'indexes', 'electronic-sources'],
    ch10: ['introduction', 'letters', 'memorandums', 'email', 'forms', 'templates'],
    ch11: ['introduction', 'report-structure', 'formatting', 'headings', 'tables-figures', 'minutes', 'appendices'],
    ch12: ['introduction', 'prepositions', 'affect-effect', 'compose-comprise', 'less-fewer', 'that-which', 'common-errors', 'idioms'],
    ch13: ['introduction', 'clarity', 'conciseness', 'organization', 'tone', 'accessibility'], 
    ch14: ['introduction', 'gender-inclusive', 'racial-cultural', 'disabilities', 'age-related', 'general-principles'],
    ch15: ['introduction', 'canadian-places', 'foreign-places', 'provinces-territories', 'indigenous-names', 'abbreviations'],
    ch16: ['introduction', 'editing-levels', 'revision-strategies', 'proofreading-techniques', 'common-errors', 'final-checklist']
};

// Default progress structure
const DEFAULT_PROGRESS = {
    version: STORAGE_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: {},
    statistics: {
        totalSectionsCompleted: 0,
        totalQuizzesPassed: 0,
        totalTimeSpent: 0,
        lastActivity: null,
        streakDays: 0,
        achievements: []
    },
    settings: {
        showHints: true,
        autoSave: true,
        soundEnabled: false
    }
};

/**
 * Validate chapter ID format and existence
 * @param {string} chapterId - Chapter identifier to validate
 * @returns {boolean} - Whether the chapter ID is valid
 */
function isValidChapterId(chapterId) {
    if (!chapterId || typeof chapterId !== 'string') {
        console.warn('Invalid chapter ID provided:', chapterId);
        return false;
    }
    
    if (!CHAPTER_SECTIONS.hasOwnProperty(chapterId)) {
        console.warn('Unknown chapter ID:', chapterId);
        return false;
    }
    
    return true;
}

/**
 * Validate section ID for a given chapter
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier to validate
 * @returns {boolean} - Whether the section ID is valid for this chapter
 */
function isValidSectionId(chapterId, sectionId) {
    if (!isValidChapterId(chapterId)) {
        return false;
    }
    
    if (!sectionId || typeof sectionId !== 'string') {
        console.warn('Invalid section ID provided:', sectionId);
        return false;
    }
    
    const validSections = CHAPTER_SECTIONS[chapterId];
    if (!validSections.includes(sectionId)) {
        console.warn(`Invalid section "${sectionId}" for chapter "${chapterId}". Valid sections:`, validSections);
        return false;
    }
    
    return true;
}

/**
 * Get current progress data from storage with validation and migration
 * @returns {Object} - Current progress data
 */
function getProgressData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            console.log('No existing progress found, creating new progress data');
            return createNewProgressData();
        }
        
        const data = JSON.parse(stored);
        
        // Validate and migrate if necessary
        if (!data.version || data.version !== STORAGE_VERSION) {
            console.log('Migrating progress data to new version');
            return migrateProgressData(data);
        }
        
        // Ensure all required properties exist
        return validateAndRepairProgressData(data);
        
    } catch (error) {
        console.error('Error reading progress data:', error);
        console.log('Creating new progress data due to error');
        return createNewProgressData();
    }
}

/**
 * Create new progress data structure
 * @returns {Object} - New progress data
 */
function createNewProgressData() {
    const newData = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
    
    // Initialize chapter progress
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        newData.chapters[chapterId] = {
            sections: {},
            quizzes: {},
            completedAt: null,
            totalSections: CHAPTER_SECTIONS[chapterId].length,
            completedSections: 0,
            lastVisited: null,
            timeSpent: 0
        };
        
        // Initialize section progress
        CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
            newData.chapters[chapterId].sections[sectionId] = {
                completed: false,
                visitedAt: null,
                timeSpent: 0
            };
        });
    });
    
    saveProgressData(newData);
    return newData;
}

/**
 * Migrate old progress data to new structure
 * @param {Object} oldData - Old progress data
 * @returns {Object} - Migrated progress data
 */
function migrateProgressData(oldData) {
    console.log('Migrating progress data from version', oldData.version || 'unknown', 'to', STORAGE_VERSION);
    
    const newData = createNewProgressData();
    
    // Preserve old chapter progress if it exists
    if (oldData.chapters || oldData) {
        const oldChapters = oldData.chapters || oldData;
        
        Object.keys(oldChapters).forEach(chapterId => {
            if (isValidChapterId(chapterId) && newData.chapters[chapterId]) {
                const oldChapter = oldChapters[chapterId];
                
                // Handle different old data formats
                if (typeof oldChapter === 'object' && oldChapter.sections) {
                    // New-ish format
                    Object.keys(oldChapter.sections).forEach(sectionId => {
                        if (isValidSectionId(chapterId, sectionId)) {
                            newData.chapters[chapterId].sections[sectionId].completed = 
                                Boolean(oldChapter.sections[sectionId] || oldChapter.sections[sectionId]?.completed);
                        }
                    });
                } else if (typeof oldChapter === 'object') {
                    // Very old format - sections directly on chapter
                    Object.keys(oldChapter).forEach(sectionId => {
                        if (isValidSectionId(chapterId, sectionId)) {
                            newData.chapters[chapterId].sections[sectionId].completed = Boolean(oldChapter[sectionId]);
                        }
                    });
                }
                
                // Update completion count
                updateChapterCompletionCount(newData, chapterId);
            }
        });
    }
    
    // Preserve statistics if they exist
    if (oldData.statistics) {
        newData.statistics = { ...newData.statistics, ...oldData.statistics };
    }
    
    saveProgressData(newData);
    return newData;
}

/**
 * Validate and repair progress data structure
 * @param {Object} data - Progress data to validate
 * @returns {Object} - Validated and repaired data
 */
function validateAndRepairProgressData(data) {
    const repaired = { ...DEFAULT_PROGRESS, ...data };
    
    // Ensure all chapters exist
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        if (!repaired.chapters[chapterId]) {
            repaired.chapters[chapterId] = {
                sections: {},
                quizzes: {},
                completedAt: null,
                totalSections: CHAPTER_SECTIONS[chapterId].length,
                completedSections: 0,
                lastVisited: null,
                timeSpent: 0
            };
        }
        
        // Ensure all sections exist
        CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
            if (!repaired.chapters[chapterId].sections[sectionId]) {
                repaired.chapters[chapterId].sections[sectionId] = {
                    completed: false,
                    visitedAt: null,
                    timeSpent: 0
                };
            }
        });
        
        // Update completion count
        updateChapterCompletionCount(repaired, chapterId);
    });
    
    return repaired;
}

/**
 * Update chapter completion count
 * @param {Object} data - Progress data
 * @param {string} chapterId - Chapter to update
 */
function updateChapterCompletionCount(data, chapterId) {
    if (!data.chapters[chapterId]) return;
    
    const completedSections = Object.values(data.chapters[chapterId].sections)
        .filter(section => section.completed).length;
    
    data.chapters[chapterId].completedSections = completedSections;
    
    // Mark chapter as completed if all sections are done
    if (completedSections === data.chapters[chapterId].totalSections && !data.chapters[chapterId].completedAt) {
        data.chapters[chapterId].completedAt = new Date().toISOString();
    }
}

/**
 * Save progress data to localStorage with backup
 * @param {Object} data - Progress data to save
 * @returns {boolean} - Whether save was successful
 */
function saveProgressData(data) {
    try {
        // Create backup of current data
        const currentData = localStorage.getItem(STORAGE_KEY);
        if (currentData) {
            localStorage.setItem(BACKUP_KEY, currentData);
        }
        
        // Update timestamp
        data.updatedAt = new Date().toISOString();
        
        // Save new data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Emit progress changed event
        window.dispatchEvent(new CustomEvent('progress-changed', {
            detail: { data: data }
        }));
        
        return true;
    } catch (error) {
        console.error('Error saving progress data:', error);
        return false;
    }
}

/**
 * Get progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {Object} - Chapter progress object
 */
export function getChapterProgress(chapterId) {
    if (!isValidChapterId(chapterId)) {
        return {};
    }
    
    try {
        const data = getProgressData();
        const chapterData = data.chapters[chapterId];
        
        if (!chapterData) {
            console.warn(`No progress data found for chapter ${chapterId}`);
            return {};
        }
        
        // Convert to simple boolean object for backward compatibility
        const progress = {};
        Object.keys(chapterData.sections).forEach(sectionId => {
            progress[sectionId] = chapterData.sections[sectionId].completed;
        });
        
        return progress;
    } catch (error) {
        console.error('Error getting chapter progress:', error);
        return {};
    }
}

/**
 * Get detailed chapter progress with metadata
 * @param {string} chapterId - Chapter identifier
 * @returns {Object} - Detailed chapter progress
 */
export function getDetailedChapterProgress(chapterId) {
    if (!isValidChapterId(chapterId)) {
        return null;
    }
    
    try {
        const data = getProgressData();
        return data.chapters[chapterId] || null;
    } catch (error) {
        console.error('Error getting detailed chapter progress:', error);
        return null;
    }
}

/**
 * Set progress for a specific section
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier
 * @param {boolean} completed - Whether section is completed
 * @param {Object} metadata - Additional metadata (timeSpent, score, etc.)
 * @returns {boolean} - Whether update was successful
 */
export function setProgress(chapterId, sectionId, completed = true, metadata = {}) {
    if (!isValidChapterId(chapterId)) {
        console.error('Invalid chapter ID:', chapterId);
        return false;
    }
    
    if (!isValidSectionId(chapterId, sectionId)) {
        console.error('Invalid section ID:', sectionId, 'for chapter:', chapterId);
        return false;
    }
    
    try {
        const data = getProgressData();
        const now = new Date().toISOString();
        
        // Update section progress
        data.chapters[chapterId].sections[sectionId] = {
            ...data.chapters[chapterId].sections[sectionId],
            completed: Boolean(completed),
            visitedAt: now,
            ...metadata
        };
        
        // Update chapter metadata
        data.chapters[chapterId].lastVisited = sectionId;
        
        // Update completion counts
        updateChapterCompletionCount(data, chapterId);
        
        // Update global statistics
        updateGlobalStatistics(data);
        
        return saveProgressData(data);
    } catch (error) {
        console.error('Error setting progress:', error);
        return false;
    }
}

/**
 * Update global statistics
 * @param {Object} data - Progress data
 */
function updateGlobalStatistics(data) {
    let totalCompleted = 0;
    let totalQuizzes = 0;
    
    Object.values(data.chapters).forEach(chapter => {
        totalCompleted += chapter.completedSections;
        if (chapter.quizzes) {
            totalQuizzes += Object.values(chapter.quizzes).filter(quiz => quiz.passed).length;
        }
    });
    
    data.statistics.totalSectionsCompleted = totalCompleted;
    data.statistics.totalQuizzesPassed = totalQuizzes;
    data.statistics.lastActivity = new Date().toISOString();
}

/**
 * Get overall progress statistics
 * @returns {Object} - Progress statistics
 */
export function getOverallProgress() {
    try {
        const data = getProgressData();
        const totalSections = Object.values(CHAPTER_SECTIONS).reduce((sum, sections) => sum + sections.length, 0);
        const completedSections = data.statistics.totalSectionsCompleted;
        
        return {
            totalSections,
            completedSections,
            percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
            chaptersCompleted: Object.values(data.chapters).filter(ch => ch.completedAt).length,
            totalChapters: Object.keys(CHAPTER_SECTIONS).length,
            lastActivity: data.statistics.lastActivity,
            streakDays: data.statistics.streakDays
        };
    } catch (error) {
        console.error('Error getting overall progress:', error);
        return {
            totalSections: 0,
            completedSections: 0,
            percentage: 0,
            chaptersCompleted: 0,
            totalChapters: 16,
            lastActivity: null,
            streakDays: 0
        };
    }
}

/**
 * Mark quiz as completed with score
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier
 * @param {number} score - Quiz score (0-100)
 * @param {Object} quizData - Additional quiz data
 * @returns {boolean} - Whether update was successful
 */
export function setQuizProgress(chapterId, sectionId, score, quizData = {}) {
    if (!isValidChapterId(chapterId) || !isValidSectionId(chapterId, sectionId)) {
        return false;
    }
    
    try {
        const data = getProgressData();
        const passed = score >= 80;
        
        if (!data.chapters[chapterId].quizzes) {
            data.chapters[chapterId].quizzes = {};
        }
        
        // Store quiz progress
        data.chapters[chapterId].quizzes[sectionId] = {
            score: score,
            passed: passed,
            completedAt: new Date().toISOString(),
            attempts: (data.chapters[chapterId].quizzes[sectionId]?.attempts || 0) + 1,
            ...quizData
        };
        
        // If quiz passed, mark section as completed
        if (passed) {
            setProgress(chapterId, sectionId, true, { quizPassed: true, quizScore: score });
        }
        
        return saveProgressData(data);
    } catch (error) {
        console.error('Error setting quiz progress:', error);
        return false;
    }
}

/**
 * Get quiz progress for a section
 * @param {string} chapterId - Chapter identifier  
 * @param {string} sectionId - Section identifier
 * @returns {Object|null} - Quiz progress data
 */
export function getQuizProgress(chapterId, sectionId) {
    if (!isValidChapterId(chapterId) || !isValidSectionId(chapterId, sectionId)) {
        return null;
    }
    
    try {
        const data = getProgressData();
        return data.chapters[chapterId].quizzes?.[sectionId] || null;
    } catch (error) {
        console.error('Error getting quiz progress:', error);
        return null;
    }
}

/**
 * Reset progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {boolean} - Whether reset was successful
 */
export function resetChapterProgress(chapterId) {
    if (!isValidChapterId(chapterId)) {
        return false;
    }
    
    try {
        const data = getProgressData();
        
        // Reset all sections
        CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
            data.chapters[chapterId].sections[sectionId] = {
                completed: false,
                visitedAt: null,
                timeSpent: 0
            };
        });
        
        // Reset chapter metadata
        data.chapters[chapterId].quizzes = {};
        data.chapters[chapterId].completedAt = null;
        data.chapters[chapterId].completedSections = 0;
        data.chapters[chapterId].lastVisited = null;
        data.chapters[chapterId].timeSpent = 0;
        
        // Update global statistics
        updateGlobalStatistics(data);
        
        return saveProgressData(data);
    } catch (error) {
        console.error('Error resetting chapter progress:', error);
        return false;
    }
}

/**
 * Reset all progress data
 * @returns {boolean} - Whether reset was successful
 */
export function resetAllProgress() {
    try {
        const newData = createNewProgressData();
        console.log('All progress data has been reset');
        return true;
    } catch (error) {
        console.error('Error resetting all progress:', error);
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
        if (!data || typeof data !== 'object') {
            console.error('Invalid progress data structure');
            return false;
        }
        
        // Migrate and repair the imported data
        const repairedData = validateAndRepairProgressData(data);
        
        return saveProgressData(repairedData);
    } catch (error) {
        console.error('Error importing progress:', error);
        return false;
    }
}

/**
 * Get learning streak information
 * @returns {Object} - Streak data
 */
export function getStreakData() {
    try {
        const data = getProgressData();
        // Simple streak calculation - could be enhanced with daily tracking
        return {
            currentStreak: data.statistics.streakDays || 0,
            longestStreak: data.statistics.longestStreak || 0,
            lastActivity: data.statistics.lastActivity
        };
    } catch (error) {
        console.error('Error getting streak data:', error);
        return { currentStreak: 0, longestStreak: 0, lastActivity: null };
    }
}

/**
 * Setup progress event listeners and automatic saves
 */
function setupProgressListeners() {
    try {
        if (typeof window === 'undefined') {
            return;
        }
        
        // Listen for quiz completions
        window.addEventListener('quiz-completed', (event) => {
            try {
                const { chapterId, sectionId, score, passed } = event.detail || {};
                
                if (chapterId && sectionId && typeof score === 'number') {
                    setQuizProgress(chapterId, sectionId, score, { passed });
                }
            } catch (error) {
                console.error('Error handling quiz completion event:', error);
            }
        });
        
        // Listen for section completions
        window.addEventListener('section-completed', (event) => {
            try {
                const { chapterId, sectionId, metadata } = event.detail || {};
                
                if (chapterId && sectionId) {
                    setProgress(chapterId, sectionId, true, metadata);
                }
            } catch (error) {
                console.error('Error handling section completion event:', error);
            }
        });
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            try {
                const data = getProgressData();
                if (data) {
                    saveProgressData(data);
                }
            } catch (error) {
                console.warn('Error auto-saving progress on unload:', error);
            }
        });
        
    } catch (error) {
        console.error('Error setting up progress listeners:', error);
    }
}

// Initialize progress system when module loads
setupProgressListeners();

// Backward compatibility - legacy function names
export const getProgress = getChapterProgress;
export const updateProgress = setProgress;

// Export utility functions
export {
    isValidChapterId,
    isValidSectionId,
    CHAPTER_SECTIONS
};
