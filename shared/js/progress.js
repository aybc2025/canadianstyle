/**
 * Progress Tracking System for The Canadian Style Learning Platform
 * Manages user progress using localStorage with comprehensive validation and fallback handling
 * UPDATED VERSION - includes enhanced chapters with additional sections
 */

// Storage configuration
const STORAGE_KEY = 'csProgress';
const STORAGE_VERSION = '2.1';
const BACKUP_KEY = 'csProgressBackup';

// Chapter sections mapping - UPDATED WITH ALL ENHANCEMENTS
const CHAPTER_SECTIONS = {
    ch01: ['introduction', 'general-principles', 'sentence-capitals', 'proper-nouns', 'government-bodies', 'titles-positions', 'geographic-names', 'brand-names', 'academic-degrees'],
    ch02: ['introduction', 'compound-words', 'prefixes-suffixes', 'word-division', 'special-cases', 'technical-terms'],
    ch03: ['introduction', 'canadian-spelling', 'variants', 'word-endings', 'troublesome-words'],
    ch04: ['introduction', 'general-principles', 'proper-nouns', 'titles-positions', 'organizations', 'academic-subjects', 'special-cases'],
    // UPDATED: Chapter 5 with comprehensive SI/metric content
    ch05: ['basic-rules', 'sentence-beginning', 'money-measurements', 'dates-time', 'percentages-statistics', 'si-metric-system', 'conversion-tables', 'special-applications'],
    ch06: ['basic-principles', 'emphasis', 'foreign-words', 'titles-publications', 'technical-terms', 'legal-references', 'special-uses'],
    // UPDATED: Chapter 7 with advanced punctuation content
    ch07: ['introduction', 'periods', 'commas', 'semicolons', 'colons', 'question-marks', 'exclamation-marks', 'apostrophes', 'parentheses-brackets', 'ellipsis', 'quotation-marks', 'dashes', 'advanced-lists'],
    ch08: ['basic-rules', 'punctuation-with-quotes', 'block-quotations', 'nested-quotations', 'titles-special-uses', 'indirect-quotations'],
    // UPDATED: Chapter 9 with comprehensive reference and indexing content  
    ch09: ['introduction', 'footnotes', 'bibliography', 'citations', 'indexes', 'electronic-sources', 'legal-references', 'advanced-indexing'],
    // UPDATED: Chapter 10 with comprehensive letter templates and electronic correspondence
    ch10: ['introduction', 'business-letters', 'letter-templates', 'memos', 'formatting', 'addresses-titles', 'transmittal-letters', 'electronic-correspondence'],
    ch11: ['introduction', 'report-structure', 'headings', 'front-matter', 'appendices', 'tables-charts', 'minutes', 'formatting'],
    ch12: ['introduction', 'prepositions', 'affect-effect', 'compose-comprise', 'less-fewer', 'that-which', 'common-errors', 'idioms'],
    ch13: ['introduction', 'reader-focus', 'organization', 'vocabulary', 'sentences', 'layout', 'testing'], 
    ch14: ['introduction', 'gender-inclusive', 'racial-cultural', 'disabilities', 'age-related', 'general-principles'],
    ch15: ['introduction', 'canadian-places', 'foreign-places', 'provinces-territories', 'indigenous-names', 'abbreviations'],
    // UPDATED: Chapter 16 with comprehensive revision and proofreading content
    ch16: ['introduction', 'editing-levels', 'revision-strategies', 'proofreading-techniques', 'common-errors', 'technical-accuracy', 'master-checklist', 'final-review']
};

// Calculate total sections dynamically
const TOTAL_SECTIONS = Object.values(CHAPTER_SECTIONS).reduce((total, sections) => total + sections.length, 0);

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
        averageQuizScore: 0,
        lastStudyDate: null,
        studyStreak: 0
    },
    preferences: {
        theme: 'light',
        language: 'en',
        quizDifficulty: 'normal',
        showExplanations: true,
        autoSave: true
    },
    achievements: []
};

// Enhanced error handling and logging
const ProgressLogger = {
    log: (message, data = null) => {
        if (typeof console !== 'undefined' && console.log) {
            console.log(`[Progress] ${message}`, data || '');
        }
    },
    warn: (message, data = null) => {
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(`[Progress] ${message}`, data || '');
        }
    },
    error: (message, error = null) => {
        if (typeof console !== 'undefined' && console.error) {
            console.error(`[Progress] ${message}`, error || '');
        }
    }
};

/**
 * Get current progress from localStorage with comprehensive validation
 * @returns {Object} Current progress object
 */
function getCurrentProgress() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            ProgressLogger.log('No stored progress found, creating new progress');
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
                
                // Migrate section completion data
                CHAPTER_SECTIONS[chapterId].forEach(sectionId => {
                    migratedProgress.chapters[chapterId].sectionsCompleted[sectionId] = 
                        (oldProgress.chapters[chapterId].sectionsCompleted && 
                         oldProgress.chapters[chapterId].sectionsCompleted[sectionId]) || false;
                });
            }
        });
    }
    
    // Preserve statistics where possible
    if (oldProgress.statistics) {
        migratedProgress.statistics = {
            ...migratedProgress.statistics,
            ...oldProgress.statistics
        };
    }
    
    // Preserve preferences where possible
    if (oldProgress.preferences) {
        migratedProgress.preferences = {
            ...migratedProgress.preferences,
            ...oldProgress.preferences
        };
    }
    
    // Preserve achievements
    if (oldProgress.achievements) {
        migratedProgress.achievements = oldProgress.achievements;
    }
    
    // Update version and timestamp
    migratedProgress.version = STORAGE_VERSION;
    migratedProgress.updatedAt = new Date().toISOString();
    
    return migratedProgress;
}

/**
 * Save progress to localStorage with error handling and backup
 * @param {Object} progress - Progress object to save
 * @returns {boolean} Success status
 */
function saveProgress(progress) {
    try {
        // Create backup before saving
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
            localStorage.setItem(BACKUP_KEY, existing);
        }
        
        // Update timestamp
        progress.updatedAt = new Date().toISOString();
        
        // Save new progress
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        ProgressLogger.log('Progress saved successfully');
        
        // Emit update event for UI components
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('progressUpdated', { detail: progress }));
        }
        
        return true;
        
    } catch (error) {
        ProgressLogger.error('Failed to save progress', error);
        
        // If quota exceeded, try to clean up old data
        if (error.name === 'QuotaExceededError') {
            ProgressLogger.log('Storage quota exceeded, attempting cleanup');
            try {
                localStorage.removeItem(BACKUP_KEY);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
                ProgressLogger.log('Progress saved after cleanup');
                return true;
            } catch (cleanupError) {
                ProgressLogger.error('Failed to save even after cleanup', cleanupError);
            }
        }
        
        return false;
    }
}

/**
 * Mark a section as completed
 * @param {string} chapterId - Chapter identifier
 * @param {string} sectionId - Section identifier
 * @returns {boolean} Success status
 */
function markSectionComplete(chapterId, sectionId) {
    try {
        const progress = getCurrentProgress();
        
        if (!progress.chapters[chapterId]) {
            ProgressLogger.warn(`Chapter ${chapterId} not found`);
            return false;
        }
        
        if (!CHAPTER_SECTIONS[chapterId].includes(sectionId)) {
            ProgressLogger.warn(`Section ${sectionId} not found in chapter ${chapterId}`);
            return false;
        }
        
        // Mark section complete
        progress.chapters[chapterId].sectionsCompleted[sectionId] = true;
        progress.chapters[chapterId].lastAccessed = new Date().toISOString();
        
        // Update statistics
        progress.statistics.totalSectionsCompleted = getTotalSectionsCompleted(progress);
        progress.statistics.lastStudyDate = new Date().toISOString();
        
        // Check if chapter is now complete
        const chapterComplete = CHAPTER_SECTIONS[chapterId].every(section => 
            progress.chapters[chapterId].sectionsCompleted[section]
        );
        
        if (chapterComplete && !progress.chapters[chapterId].completed) {
            progress.chapters[chapterId].completed = true;
            progress.chapters[chapterId].completionDate = new Date().toISOString();
            ProgressLogger.log(`Chapter ${chapterId} completed!`);
            
            // Check for achievements
            checkAchievements(progress, chapterId);
        }
        
        const saved = saveProgress(progress);
        if (saved) {
            ProgressLogger.log(`Section ${chapterId}.${sectionId} marked as complete`);
        }
        
        return saved;
        
    } catch (error) {
        ProgressLogger.error(`Error marking section complete: ${chapterId}.${sectionId}`, error);
        return false;
    }
}

/**
 * Record quiz result
 * @param {string} chapterId - Chapter identifier  
 * @param {string} sectionId - Section identifier
 * @param {Object} quizResult - Quiz result object
 * @returns {boolean} Success status
 */
function recordQuizResult(chapterId, sectionId, quizResult) {
    try {
        const progress = getCurrentProgress();
        
        if (!progress.chapters[chapterId]) {
            ProgressLogger.warn(`Chapter ${chapterId} not found`);
            return false;
        }
        
        // Initialize quiz results if needed
        if (!progress.chapters[chapterId].quizResults[sectionId]) {
            progress.chapters[chapterId].quizResults[sectionId] = [];
        }
        
        // Add timestamp to result
        const timestampedResult = {
            ...quizResult,
            timestamp: new Date().toISOString()
        };
        
        // Store result
        progress.chapters[chapterId].quizResults[sectionId].push(timestampedResult);
        
        // Update statistics
        if (quizResult.passed) {
            progress.statistics.totalQuizzesPassed++;
        }
        
        progress.statistics.averageQuizScore = calculateAverageQuizScore(progress);
        progress.statistics.lastStudyDate = new Date().toISOString();
        
        const saved = saveProgress(progress);
        if (saved) {
            ProgressLogger.log(`Quiz result recorded for ${chapterId}.${sectionId}: ${quizResult.score}%`);
        }
        
        return saved;
        
    } catch (error) {
        ProgressLogger.error(`Error recording quiz result: ${chapterId}.${sectionId}`, error);
        return false;
    }
}

/**
 * Get detailed progress for a specific chapter
 * @param {string} chapterId - Chapter identifier
 * @returns {Object|null} Chapter progress details
 */
function getDetailedChapterProgress(chapterId) {
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
            sectionsCompleted: chapterData.sectionsCompleted,
            quizResults: chapterData.quizResults,
            passedQuizzes,
            totalQuizzes: quizResults.length,
            averageScore,
            timeSpent: chapterData.timeSpent || 0,
            lastAccessed: chapterData.lastAccessed,
            completionDate: chapterData.completionDate
        };
        
    } catch (error) {
        ProgressLogger.error(`Error getting chapter progress: ${chapterId}`, error);
        return null;
    }
}

/**
 * Get overall progress statistics
 * @returns {Object} Overall progress summary
 */
function getOverallProgress() {
    try {
        const progress = getCurrentProgress();
        
        const totalSections = TOTAL_SECTIONS;
        const completedSections = getTotalSectionsCompleted(progress);
        const percentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
        
        const completedChapters = Object.keys(progress.chapters).filter(chapterId => 
            progress.chapters[chapterId].completed
        ).length;
        
        const totalChapters = Object.keys(CHAPTER_SECTIONS).length;
        
        return {
            totalSections,
            completedSections,
            percentage,
            totalChapters,
            completedChapters,
            chaptersPercentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
            statistics: progress.statistics,
            lastUpdated: progress.updatedAt
        };
        
    } catch (error) {
        ProgressLogger.error('Error getting overall progress', error);
        return {
            totalSections: TOTAL_SECTIONS,
            completedSections: 0,
            percentage: 0,
            totalChapters: Object.keys(CHAPTER_SECTIONS).length,
            completedChapters: 0,
            chaptersPercentage: 0,
            statistics: DEFAULT_PROGRESS.statistics,
            lastUpdated: new Date().toISOString()
        };
    }
}

/**
 * Calculate total completed sections across all chapters
 * @param {Object} progress - Progress object
 * @returns {number} Total completed sections
 */
function getTotalSectionsCompleted(progress) {
    let total = 0;
    
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        if (progress.chapters[chapterId]) {
            const completedInChapter = CHAPTER_SECTIONS[chapterId].filter(sectionId =>
                progress.chapters[chapterId].sectionsCompleted[sectionId]
            ).length;
            total += completedInChapter;
        }
    });
    
    return total;
}

/**
 * Calculate average quiz score across all quizzes
 * @param {Object} progress - Progress object
 * @returns {number} Average quiz score
 */
function calculateAverageQuizScore(progress) {
    let totalScore = 0;
    let totalQuizzes = 0;
    
    Object.values(progress.chapters).forEach(chapterData => {
        Object.values(chapterData.quizResults).forEach(sectionResults => {
            if (Array.isArray(sectionResults)) {
                sectionResults.forEach(result => {
                    totalScore += result.score || 0;
                    totalQuizzes++;
                });
            }
        });
    });
    
    return totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
}

/**
 * Check and award achievements
 * @param {Object} progress - Progress object
 * @param {string} triggeredBy - What triggered the check
 */
function checkAchievements(progress, triggeredBy = '') {
    const achievements = [];
    
    // First chapter completed
    const completedChapters = Object.keys(progress.chapters).filter(chapterId => 
        progress.chapters[chapterId].completed
    ).length;
    
    if (completedChapters === 1 && !hasAchievement(progress, 'first-chapter')) {
        achievements.push({
            id: 'first-chapter',
            title: 'Getting Started',
            description: 'Completed your first chapter',
            icon: '🎯',
            earnedDate: new Date().toISOString()
        });
    }
    
    // Half chapters completed
    const totalChapters = Object.keys(CHAPTER_SECTIONS).length;
    if (completedChapters >= Math.floor(totalChapters / 2) && !hasAchievement(progress, 'halfway-there')) {
        achievements.push({
            id: 'halfway-there',
            title: 'Halfway There',
            description: 'Completed half of all chapters',
            icon: '⚡',
            earnedDate: new Date().toISOString()
        });
    }
    
    // All chapters completed
    if (completedChapters === totalChapters && !hasAchievement(progress, 'completionist')) {
        achievements.push({
            id: 'completionist',
            title: 'Completionist',
            description: 'Completed all chapters in The Canadian Style',
            icon: '🏆',
            earnedDate: new Date().toISOString()
        });
    }
    
    // Quiz achievements
    const averageScore = progress.statistics.averageQuizScore;
    if (averageScore >= 90 && progress.statistics.totalQuizzesPassed >= 10 && !hasAchievement(progress, 'quiz-master')) {
        achievements.push({
            id: 'quiz-master',
            title: 'Quiz Master',
            description: 'Maintained 90%+ average on 10+ quizzes',
            icon: '🧠',
            earnedDate: new Date().toISOString()
        });
    }
    
    // Add new achievements to progress
    if (achievements.length > 0) {
        progress.achievements = progress.achievements || [];
        progress.achievements.push(...achievements);
        ProgressLogger.log(`Earned ${achievements.length} new achievement(s)`, achievements);
    }
}

/**
 * Check if user has a specific achievement
 * @param {Object} progress - Progress object
 * @param {string} achievementId - Achievement identifier
 * @returns {boolean} Whether user has the achievement
 */
function hasAchievement(progress, achievementId) {
    return progress.achievements && progress.achievements.some(achievement => achievement.id === achievementId);
}

/**
 * Reset all progress data
 * @returns {boolean} Success status
 */
function resetAllProgress() {
    try {
        const confirmed = confirm('Are you sure you want to reset all progress? This action cannot be undone.');
        
        if (!confirmed) {
            return false;
        }
        
        // Create backup before reset
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
            localStorage.setItem(`${BACKUP_KEY}-${Date.now()}`, current);
        }
        
        // Remove current progress
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        
        ProgressLogger.log('All progress reset successfully');
        
        // Emit reset event
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('progressReset'));
        }
        
        return true;
        
    } catch (error) {
        ProgressLogger.error('Error resetting progress', error);
        return false;
    }
}

/**
 * Export progress data for backup
 * @returns {string|null} JSON string of progress data
 */
function exportProgress() {
    try {
        const progress = getCurrentProgress();
        const exportData = {
            ...progress,
            exportDate: new Date().toISOString(),
            exportVersion: STORAGE_VERSION
        };
        
        return JSON.stringify(exportData, null, 2);
        
    } catch (error) {
        ProgressLogger.error('Error exporting progress', error);
        return null;
    }
}

/**
 * Import progress data from backup
 * @param {string} progressData - JSON string of progress data
 * @returns {boolean} Success status
 */
function importProgress(progressData) {
    try {
        const imported = JSON.parse(progressData);
        
        // Validate imported data
        if (!imported.version) {
            throw new Error('Invalid progress data: missing version');
        }
        
        // Create current backup before import
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
            localStorage.setItem(`${BACKUP_KEY}-import-${Date.now()}`, current);
        }
        
        // Validate and migrate imported data
        const validatedProgress = validateAndMigrateProgress(imported);
        
        // Save imported progress
        const saved = saveProgress(validatedProgress);
        
        if (saved) {
            ProgressLogger.log('Progress imported successfully');
            
            // Emit import event
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('progressImported', { detail: validatedProgress }));
            }
        }
        
        return saved;
        
    } catch (error) {
        ProgressLogger.error('Error importing progress', error);
        return false;
    }
}

/**
 * Get storage usage statistics
 * @returns {Object} Storage usage information
 */
function getStorageInfo() {
    try {
        const progress = localStorage.getItem(STORAGE_KEY);
        const backup = localStorage.getItem(BACKUP_KEY);
        
        const progressSize = progress ? new Blob([progress]).size : 0;
        const backupSize = backup ? new Blob([backup]).size : 0;
        const totalSize = progressSize + backupSize;
        
        return {
            progressSize,
            backupSize,
            totalSize,
            formattedSize: formatBytes(totalSize),
            lastUpdated: getCurrentProgress().updatedAt
        };
        
    } catch (error) {
        ProgressLogger.error('Error getting storage info', error);
        return {
            progressSize: 0,
            backupSize: 0,
            totalSize: 0,
            formattedSize: '0 B',
            lastUpdated: null
        };
    }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        getCurrentProgress,
        markSectionComplete,
        recordQuizResult,
        getDetailedChapterProgress,
        getOverallProgress,
        resetAllProgress,
        exportProgress,
        importProgress,
        getStorageInfo,
        CHAPTER_SECTIONS,
        TOTAL_SECTIONS
    };
} else {
    // Browser environment - attach to window
    if (typeof window !== 'undefined') {
        window.ProgressTracker = {
            getCurrentProgress,
            markSectionComplete,
            recordQuizResult,
            getDetailedChapterProgress,
            getOverallProgress,
            resetAllProgress,
            exportProgress,
            importProgress,
            getStorageInfo,
            CHAPTER_SECTIONS,
            TOTAL_SECTIONS
        };
        
        // Initialize progress tracking
        ProgressLogger.log('Progress tracking system initialized');
        ProgressLogger.log(`Tracking ${TOTAL_SECTIONS} sections across ${Object.keys(CHAPTER_SECTIONS).length} chapters`);
        
        // Perform initial progress load to trigger any necessary migrations
        getCurrentProgress();
    }
}
