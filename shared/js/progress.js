/**
 * Canadian Style Progress Tracking System
 * Handles user progress tracking across chapters and sections
 */

// Storage configuration
const STORAGE_KEY = 'canadian_style_progress';
const STORAGE_VERSION = '2.1';

// Chapter configuration - maps chapter IDs to their sections
const CHAPTER_SECTIONS = {
    'ch01': ['introduction', 'general-principles', 'sentence-capitals', 'proper-nouns', 'government-bodies', 'titles-forms', 'geographic-names', 'organizations'],
    'ch02': ['introduction', 'compound-words', 'prefixes-suffixes', 'word-division', 'special-cases', 'technical-terms', 'numbers-hyphens'],
    'ch03': ['introduction', 'canadian-spelling', 'variant-spellings', 'common-errors', 'technical-spelling', 'proper-names'],
    'ch04': ['introduction', 'general-principles', 'sentence-capitals', 'proper-nouns', 'government-bodies', 'geographic-names', 'titles-works'],
    'ch05': ['basic-rules', 'sentence-beginning', 'money-measurements', 'dates-time', 'percentages-statistics', 'si-metric-system', 'conversion-tables', 'special-applications'],
    'ch06': ['basic-principles', 'emphasis', 'foreign-words', 'titles-publications', 'technical-terms', 'legal-references', 'special-uses'],
    'ch07': ['introduction', 'periods', 'commas', 'semicolons', 'colons', 'dashes', 'parentheses', 'brackets'],
    'ch08': ['introduction', 'direct-quotes', 'indirect-quotes', 'quotation-marks', 'dialogue', 'special-uses'],
    'ch09': ['introduction', 'footnotes-endnotes', 'bibliographies', 'citations', 'legal-references', 'electronic-sources'],
    'ch10': ['introduction', 'business-letters', 'letter-templates', 'memos', 'formatting', 'addresses-titles', 'transmittal-letters', 'electronic-correspondence'],
    'ch11': ['introduction', 'report-structure', 'executive-summaries', 'headings', 'lists', 'tables-figures', 'appendices'],
    'ch12': ['introduction', 'word-choice', 'commonly-confused', 'idiomatic-expressions', 'regional-variations'],
    'ch13': ['introduction', 'inclusive-language', 'gender-neutral', 'accessibility', 'cultural-sensitivity'],
    'ch14': ['introduction', 'bias-free-language', 'inclusive-practices', 'respectful-communication'],
    'ch15': ['introduction', 'canadian-places', 'foreign-places', 'provinces-territories', 'indigenous-names'],
    'ch16': ['introduction', 'editing-levels', 'revision-strategies', 'proofreading-techniques', 'common-errors', 'technical-accuracy', 'master-checklist', 'final-review']
};

// Default progress structure
const DEFAULT_PROGRESS = {
    version: STORAGE_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: {},
    statistics: {
        totalSectionsCompleted: 0,
        totalTimeSpent: 0,
        averageQuizScore: 0,
        totalQuizzesTaken: 0,
        totalQuizzesPassed: 0,
        lastStudyDate: null,
        streakDays: 0,
        longestStreak: 0
    },
    preferences: {
        theme: 'light',
        fontSize: 'medium',
        autoProgressToNext: true,
        showQuizFeedback: true,
        emailReminders: false
    },
    achievements: []
};

// Logging utility
const ProgressLogger = {
    log: (message, data = null) => {
        console.log(`[Progress] ${message}`, data || '');
    },
    warn: (message, data = null) => {
        console.warn(`[Progress] ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`[Progress] ${message}`, error || '');
    }
};

/**
 * Initialize the progress tracking system
 * @returns {Object} Current progress object
 */
export function initializeProgressTracking() {
    try {
        ProgressLogger.log('Progress tracking system initialized');
        ProgressLogger.log(`Tracking ${getTotalSectionCount()} sections across ${Object.keys(CHAPTER_SECTIONS).length} chapters`);
        
        const progress = getCurrentProgress();
        
        // Update statistics
        updateGlobalStatistics(progress);
        
        return progress;
        
    } catch (error) {
        ProgressLogger.error('Error initializing progress tracking', error);
        return createDefaultProgress();
    }
}

/**
 * Get current progress from storage or create new
 * @returns {Object} Progress object
 */
export function getCurrentProgress() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            ProgressLogger.log('No existing progress found, creating new');
            return createDefaultProgress();
        }
        
        const progress = JSON.parse(stored);
        
        // Validate and migrate if necessary
        const validatedProgress = validateAndMigrateProgress(progress);
        return validatedProgress;
        
    } catch (error) {
        ProgressLogger.error('Error loading progress, creating new', error);
        return createDefaultProgress();
    }
}

/**
 * Create default progress structure
 * @returns {Object} Default progress object
 */
function createDefaultProgress() {
    const progress = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
    
    // Initialize chapter progress
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        progress.chapters[chapterId] = {
            completed: false,
            sectionsCompleted: {},
            quizResults: {},
            timeSpent: 0,
            lastAccessed: null,
            completionDate: null
        };
        
        // Initialize sections
        CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
            progress.chapters[chapterId].sectionsCompleted[sectionId] = false;
        });
    });
    
    saveProgress(progress);
    return progress;
}

/**
 * Validate and migrate progress data to current version
 * @param {Object} progress - Progress object to validate
 * @returns {Object} Validated and migrated progress
 */
function validateAndMigrateProgress(progress) {
    let needsSave = false;
    
    // Check version and migrate if necessary
    if (!progress.version || progress.version !== STORAGE_VERSION) {
        ProgressLogger.log(`Migrating progress from version ${progress.version || 'unknown'} to ${STORAGE_VERSION}`);
        progress = migrateProgress(progress);
        needsSave = true;
    }
    
    // Ensure all required properties exist
    if (!progress.chapters) {
        progress.chapters = {};
        needsSave = true;
    }
    
    if (!progress.statistics) {
        progress.statistics = JSON.parse(JSON.stringify(DEFAULT_PROGRESS.statistics));
        needsSave = true;
    }
    
    if (!progress.preferences) {
        progress.preferences = JSON.parse(JSON.stringify(DEFAULT_PROGRESS.preferences));
        needsSave = true;
    }
    
    if (!progress.achievements) {
        progress.achievements = [];
        needsSave = true;
    }
    
    // Ensure all chapters and sections exist
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        if (!progress.chapters[chapterId]) {
            progress.chapters[chapterId] = {
                completed: false,
                sectionsCompleted: {},
                quizResults: {},
                timeSpent: 0,
                lastAccessed: null,
                completionDate: null
            };
            needsSave = true;
        }
        
        // Ensure all sections exist for this chapter
        CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
            if (progress.chapters[chapterId].sectionsCompleted[sectionId] === undefined) {
                progress.chapters[chapterId].sectionsCompleted[sectionId] = false;
                needsSave = true;
            }
        });
        
        // Remove sections that no longer exist
        Object.keys(progress.chapters[chapterId].sectionsCompleted).forEach(sectionId => {
            if (!CHAPTER_SECTIONS[chapterId].includes(sectionId)) {
                delete progress.chapters[chapterId].sectionsCompleted[sectionId];
                needsSave = true;
                ProgressLogger.log(`Removed obsolete section: ${chapterId}.${sectionId}`);
            }
        });
    });
    
    // Remove chapters that no longer exist
    Object.keys(progress.chapters).forEach(chapterId => {
        if (!CHAPTER_SECTIONS[chapterId]) {
            delete progress.chapters[chapterId];
            needsSave = true;
            ProgressLogger.log(`Removed obsolete chapter: ${chapterId}`);
        }
    });
    
    // Update timestamp
    progress.updatedAt = new Date().toISOString();
    
    if (needsSave) {
        saveProgress(progress);
        ProgressLogger.log('Progress updated and saved during validation');
    }
    
    return progress;
}

/**
 * Migrate progress data from older versions
 * @param {Object} oldProgress - Progress object to migrate
 * @returns {Object} Migrated progress object
 */
function migrateProgress(oldProgress) {
    const migratedProgress = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
    
    // Preserve existing chapter progress where possible
    if (oldProgress.chapters) {
        Object.keys(oldProgress.chapters).forEach(chapterId => {
            if (CHAPTER_SECTIONS[chapterId]) {
                migratedProgress.chapters[chapterId] = {
                    completed: oldProgress.chapters[chapterId].completed || false,
                    sectionsCompleted: {},
                    quizResults: oldProgress.chapters[chapterId].quizResults || {},
                    timeSpent: oldProgress.chapters[chapterId].timeSpent || 0,
                    lastAccessed: oldProgress.chapters[chapterId].lastAccessed || null,
                    completionDate: oldProgress.chapters[chapterId].completionDate || null
                };
                
                // Migrate section progress
                const oldSections = oldProgress.chapters[chapterId].sectionsCompleted || {};
                CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
                    migratedProgress.chapters[chapterId].sectionsCompleted[sectionId] = 
                        oldSections[sectionId] || false;
                });
            }
        });
    }
    
    // Preserve statistics if available
    if (oldProgress.statistics) {
        migratedProgress.statistics = { ...migratedProgress.statistics, ...oldProgress.statistics };
    }
    
    // Preserve preferences if available
    if (oldProgress.preferences) {
        migratedProgress.preferences = { ...migratedProgress.preferences, ...oldProgress.preferences };
    }
    
    // Preserve achievements if available
    if (oldProgress.achievements) {
        migratedProgress.achievements = oldProgress.achievements;
    }
    
    migratedProgress.version = STORAGE_VERSION;
    return migratedProgress;
}

/**
 * Save progress to storage
 * @param {Object} progress - Progress object to save
 * @returns {boolean} Success status
 */
export function saveProgress(progress) {
    try {
        progress.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        ProgressLogger.log('Progress saved successfully');
        return true;
    } catch (error) {
        ProgressLogger.error('Error saving progress', error);
        return false;
    }
}

/**
 * Mark a section as complete or incomplete
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier
 * @param {boolean} completed - Completion status
 * @returns {boolean} Success status
 */
export function markSectionComplete(chapterId, sectionId, completed = true) {
    try {
        const progress = getCurrentProgress();
        
        if (!progress.chapters[chapterId]) {
            ProgressLogger.warn(`Chapter ${chapterId} not found`);
            return false;
        }
        
        // Update section status
        progress.chapters[chapterId].sectionsCompleted[sectionId] = completed;
        progress.chapters[chapterId].lastAccessed = new Date().toISOString();
        
        // Check if chapter is now complete
        const chapterSections = CHAPTER_SECTIONS[chapterId];
        const completedSections = chapterSections.filter(secId => 
            progress.chapters[chapterId].sectionsCompleted[secId]
        );
        
        const wasCompleted = progress.chapters[chapterId].completed;
        progress.chapters[chapterId].completed = completedSections.length === chapterSections.length;
        
        // Set completion date if newly completed
        if (progress.chapters[chapterId].completed && !wasCompleted) {
            progress.chapters[chapterId].completionDate = new Date().toISOString();
        }
        
        // Update global statistics
        updateGlobalStatistics(progress);
        
        const saved = saveProgress(progress);
        if (saved) {
            ProgressLogger.log(`Section marked as ${completed ? 'complete' : 'incomplete'}: ${chapterId}.${sectionId}`);
        }
        
        return saved;
        
    } catch (error) {
        ProgressLogger.error(`Error marking section complete: ${chapterId}.${sectionId}`, error);
        return false;
    }
}

/**
 * Get basic chapter progress (sectionsCompleted object) - for backward compatibility
 * @param {string} chapterId - Chapter identifier
 * @returns {Object} Object with section completion status
 */
export function getChapterProgress(chapterId) {
    try {
        const progress = getCurrentProgress();
        
        if (!progress.chapters[chapterId]) {
            ProgressLogger.warn(`Chapter ${chapterId} not found, returning empty progress`);
            // Return empty progress object for this chapter
            const emptyProgress = {};
            if (CHAPTER_SECTIONS[chapterId]) {
                CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
                    emptyProgress[sectionId] = false;
                });
            }
            return emptyProgress;
        }
        
        return progress.chapters[chapterId].sectionsCompleted || {};
        
    } catch (error) {
        ProgressLogger.error(`Error getting chapter progress: ${chapterId}`, error);
        return {};
    }
}

/**
 * Set progress for a specific section - for backward compatibility
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier  
 * @param {boolean} completed - Completion status
 * @returns {boolean} Success status
 */
export function setProgress(chapterId, sectionId, completed = true) {
    return markSectionComplete(chapterId, sectionId, completed);
}

/**
 * Get detailed progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {Object|null} Chapter progress details
 */
export function getDetailedChapterProgress(chapterId) {
    try {
        const progress = getCurrentProgress();
        
        if (!progress.chapters[chapterId] || !CHAPTER_SECTIONS[chapterId]) {
            return null;
        }
        
        const chapterData = progress.chapters[chapterId];
        const sections = CHAPTER_SECTIONS[chapterId];
        
        const completedSections = sections.filter(sectionId => 
            chapterData.sectionsCompleted[sectionId]
        ).length;
        
        const totalSections = sections.length;
        const percentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
        
        // Get quiz statistics
        const quizResults = Object.values(chapterData.quizResults).flat();
        const passedQuizzes = quizResults.filter(result => result.passed).length;
        const averageScore = quizResults.length > 0 
            ? Math.round(quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length)
            : 0;
        
        return {
            chapterId,
            completed: chapterData.completed,
            completedSections,
            totalSections,
            percentage,
            timeSpent: chapterData.timeSpent,
            lastAccessed: chapterData.lastAccessed,
            completionDate: chapterData.completionDate,
            quizStatistics: {
                totalQuizzes: quizResults.length,
                passedQuizzes,
                averageScore
            }
        };
        
    } catch (error) {
        ProgressLogger.error(`Error getting chapter progress: ${chapterId}`, error);
        return null;
    }
}

/**
 * Get overall progress statistics
 * @returns {Object} Overall progress statistics
 */
export function getOverallProgress() {
    try {
        const progress = getCurrentProgress();
        const totalSections = getTotalSectionCount();
        let completedSections = 0;
        let completedChapters = 0;
        
        Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
            if (progress.chapters[chapterId]) {
                const chapterSections = CHAPTER_SECTIONS[chapterId];
                const completed = chapterSections.filter(sectionId => 
                    progress.chapters[chapterId].sectionsCompleted[sectionId]
                );
                completedSections += completed.length;
                
                if (progress.chapters[chapterId].completed) {
                    completedChapters++;
                }
            }
        });
        
        const overallPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
        
        return {
            totalChapters: Object.keys(CHAPTER_SECTIONS).length,
            completedChapters,
            totalSections,
            completedSections,
            overallPercentage,
            statistics: progress.statistics
        };
        
    } catch (error) {
        ProgressLogger.error('Error getting overall progress', error);
        return null;
    }
}

/**
 * Export progress data for backup
 * @returns {Object} Exportable progress data
 */
export function exportProgress() {
    try {
        const progress = getCurrentProgress();
        const exportData = {
            exportDate: new Date().toISOString(),
            version: STORAGE_VERSION,
            data: progress
        };
        
        ProgressLogger.log('Progress data exported successfully');
        return exportData;
        
    } catch (error) {
        ProgressLogger.error('Error exporting progress', error);
        return null;
    }
}

/**
 * Import progress data from backup
 * @param {Object} importData - Progress data to import
 * @returns {boolean} Success status
 */
export function importProgress(importData) {
    try {
        if (!importData || !importData.data) {
            ProgressLogger.warn('Invalid import data');
            return false;
        }
        
        const validatedProgress = validateAndMigrateProgress(importData.data);
        const saved = saveProgress(validatedProgress);
        
        if (saved) {
            ProgressLogger.log('Progress data imported successfully');
        }
        
        return saved;
        
    } catch (error) {
        ProgressLogger.error('Error importing progress', error);
        return false;
    }
}

/**
 * Reset all progress data
 * @returns {boolean} Success status
 */
export function resetAllProgress() {
    try {
        const confirmed = confirm('Are you sure you want to reset all progress? This action cannot be undone.');
        if (!confirmed) return false;
        
        const newProgress = createDefaultProgress();
        ProgressLogger.log('Progress data reset successfully');
        return true;
        
    } catch (error) {
        ProgressLogger.error('Error resetting progress', error);
        return false;
    }
}

// Helper functions
function getTotalSectionCount() {
    return Object.values(CHAPTER_SECTIONS).reduce((total, sections) => total + sections.length, 0);
}

function updateGlobalStatistics(progress) {
    try {
        const overall = getOverallProgress();
        if (overall) {
            progress.statistics.totalSectionsCompleted = overall.completedSections;
        }
        
        // Update last study date
        progress.statistics.lastStudyDate = new Date().toISOString();
        
        // Calculate average quiz score
        let totalScore = 0;
        let totalQuizzes = 0;
        
        Object.values(progress.chapters).forEach(chapter => {
            Object.values(chapter.quizResults).forEach(sectionQuizzes => {
                sectionQuizzes.forEach(quiz => {
                    totalScore += quiz.score || 0;
                    totalQuizzes++;
                });
            });
        });
        
        progress.statistics.totalQuizzesTaken = totalQuizzes;
        progress.statistics.averageQuizScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
        
    } catch (error) {
        ProgressLogger.error('Error updating global statistics', error);
    }
}

// Initialize when module loads
document.addEventListener('DOMContentLoaded', () => {
    initializeProgressTracking();
});

// For debugging - expose functions globally
if (typeof window !== 'undefined') {
    window.CanadianStyleProgress = {
        getCurrentProgress,
        exportProgress,
        importProgress,
        resetAllProgress,
        getOverallProgress,
        getDetailedChapterProgress
    };
}
