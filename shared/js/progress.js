// Progress tracking module using localStorage
// Fixed version - eliminates null values and Hebrew comments

const STORAGE_KEY = 'csProgress';

// Chapter sections mapping - prevents null values from missing data
const CHAPTER_SECTIONS = {
    ch01: 8,  // Capitalization
    ch02: 9,  // Compounds 
    ch03: 9,  // Hyphens
    ch04: 10, // Abbreviations
    ch05: 9,  // Numbers
    ch06: 8,  // Italics
    ch07: 10, // Punctuation
    ch08: 7,  // Quotations
    ch09: 6,  // Reference Matter
    ch10: 8,  // Letters
    ch11: 7,  // Reports
    ch12: 3,  // Usage
    ch13: 7,  // Plain Language
    ch14: 4,  // Bias-Free Writing
    ch15: 5,  // Geographical Names
    ch16: 7   // Revision
};

// Get all progress data
window.getProgress = function() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading progress:', error);
        return {};
    }
};

// Set progress for a specific chapter and section
window.setProgress = function(chapterId, sectionId, completed = true) {
    try {
        const progress = window.getProgress();
        
        if (!progress[chapterId]) {
            progress[chapterId] = {};
        }
        
        progress[chapterId][sectionId] = completed;
        progress.lastVisit = `${chapterId}#${sectionId}`;
        progress.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        
        // Emit custom event for real-time updates
        window.dispatchEvent(new CustomEvent('progress-changed', {
            detail: { chapterId, sectionId, completed }
        }));
        
        return true;
    } catch (error) {
        console.error('Error saving progress:', error);
        return false;
    }
};

// Get progress for a specific chapter
window.getChapterProgress = function(chapterId) {
    const progress = window.getProgress();
    return progress[chapterId] || {};
};

// Calculate completion percentage for a chapter (FIXED - no more null values)
window.calculateChapterProgress = function(chapterId) {
    const chapterProgress = window.getChapterProgress(chapterId);
    const completedSections = Object.values(chapterProgress).filter(Boolean).length;
    const totalSections = CHAPTER_SECTIONS[chapterId] || 0;
    
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
};

// Get the last visited location
window.getLastVisit = function() {
    const progress = window.getProgress();
    return progress.lastVisit || null;
};

// Clear all progress (with confirmation)
window.clearProgress = function() {
    if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('progress-cleared'));
        return true;
    }
    return false;
};

// Check if a specific section is completed
window.isSectionCompleted = function(chapterId, sectionId) {
    const chapterProgress = window.getChapterProgress(chapterId);
    return chapterProgress[sectionId] === true;
};

// Mark entire chapter as complete
window.completeChapter = function(chapterId, sections) {
    try {
        const progress = window.getProgress();
        
        if (!progress[chapterId]) {
            progress[chapterId] = {};
        }
        
        sections.forEach(sectionId => {
            progress[chapterId][sectionId] = true;
        });
        
        progress.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        
        window.dispatchEvent(new CustomEvent('chapter-completed', {
            detail: { chapterId }
        }));
        
        return true;
    } catch (error) {
        console.error('Error completing chapter:', error);
        return false;
    }
};

// Get overall course completion
window.getOverallCompletion = function() {
    const progress = window.getProgress();
    let totalSections = 0;
    let completedSections = 0;
    
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        const chapterSections = CHAPTER_SECTIONS[chapterId];
        totalSections += chapterSections;
        
        if (progress[chapterId]) {
            completedSections += Object.values(progress[chapterId]).filter(Boolean).length;
        }
    });
    
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
};

// Export progress data (for backup/sharing)
window.exportProgress = function() {
    const progress = window.getProgress();
    const dataStr = JSON.stringify(progress, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `canadian-style-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
};

// Import progress data
window.importProgress = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedProgress = JSON.parse(e.target.result);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(importedProgress));
                window.dispatchEvent(new CustomEvent('progress-imported'));
                resolve(true);
            } catch (error) {
                console.error('Error parsing imported progress:', error);
                reject(new Error('Invalid progress file. Please ensure it is a valid JSON.'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file.'));
        };
        
        reader.readAsText(file);
    });
};

// Get stats for dashboard
window.getProgressStats = function() {
    const progress = window.getProgress();
    let completedChapters = 0;
    let totalSections = 0;
    let completedSections = 0;
    
    Object.keys(CHAPTER_SECTIONS).forEach(chapterId => {
        const chapterSections = CHAPTER_SECTIONS[chapterId];
        totalSections += chapterSections;
        
        if (progress[chapterId]) {
            const completed = Object.values(progress[chapterId]).filter(Boolean).length;
            completedSections += completed;
            
            if (completed === chapterSections) {
                completedChapters++;
            }
        }
    });
    
    return {
        totalChapters: Object.keys(CHAPTER_SECTIONS).length,
        completedChapters,
        totalSections,
        completedSections,
        overallPercentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0
    };
};

// Initialize progress system
window.initProgress = function() {
    // Ensure localStorage is available
    if (!window.localStorage) {
        console.warn('localStorage is not available. Progress will not be saved.');
        return false;
    }
    
    // Check if progress exists, if not create empty structure
    const progress = window.getProgress();
    if (Object.keys(progress).length === 0) {
        const initialProgress = {
            created: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProgress));
    }
    
    return true;
};

// Validate chapter and section IDs to prevent null values
window.validateChapterSection = function(chapterId, sectionId) {
    if (!chapterId || !CHAPTER_SECTIONS[chapterId]) {
        console.error('Invalid chapter ID:', chapterId);
        return false;
    }
    
    if (!sectionId) {
        console.error('Invalid section ID:', sectionId);
        return false;
    }
    
    return true;
};

// Auto-initialize when script loads
window.initProgress();

console.log('Progress system initialized successfully');
