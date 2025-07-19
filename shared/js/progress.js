// Progress tracking module using localStorage

const STORAGE_KEY = 'csProgress';

// Get all progress data
window.getProgress = function() { // הפכנו לפונקציה גלובלית
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading progress:', error);
        return {};
    }
}

// Set progress for a specific chapter and section
window.setProgress = function(chapterId, sectionId, completed = true) { // הפכנו לפונקציה גלובלית
    try {
        const progress = window.getProgress(); // קוראים לפונקציה הגלובלית
        
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
}

// Get progress for a specific chapter
window.getChapterProgress = function(chapterId) { // הפכנו לפונקציה גלובלית
    const progress = window.getProgress(); // קוראים לפונקציה הגלובלית
    return progress[chapterId] || {};
}

// Calculate completion percentage for a chapter
// (זהו השם ששימש ב-index.html עבור הפונקציה שחישבה אחוז השלמה לפרק)
window.calculateChapterProgress = function(chapterId) { // הפכנו לפונקציה גלובלית
    // מפת טוטאל סקשנים לכל פרק (כדי לא להיות תלוי ב-chapters.json)
    const totalSectionsMap = {
        ch01: 8, ch02: 9, ch03: 9, ch04: 10,
        ch05: 9, ch06: 8, ch07: 10, ch08: 7,
        ch09: 6, ch10: 8, ch11: 7, ch12: 3,
        ch13: 7, ch14: 4, ch15: 5, ch16: 7
    };
    
    const chapterProgress = window.getChapterProgress(chapterId); // קוראים לפונקציה הגלובלית
    const completedSections = Object.values(chapterProgress).filter(Boolean).length;
    const total = totalSectionsMap[chapterId] || 0;
    
    return total > 0 ? Math.round((completedSections / total) * 100) : 0;
}

// Get the last visited location
window.getLastVisit = function() { // הפכנו לפונקציה גלובלית
    const progress = window.getProgress(); // קוראים לפונקציה הגלובלית
    return progress.lastVisit || null;
}

// Clear all progress (with confirmation)
window.clearProgress = function() { // הפכנו לפונקציה גלובלית
    if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('progress-cleared'));
        return true;
    }
    return false;
}

// Check if a specific section is completed
window.isSectionCompleted = function(chapterId, sectionId) { // הפכנו לפונקציה גלובלית
    const chapterProgress = window.getChapterProgress(chapterId); // קוראים לפונקציה הגלובלית
    return chapterProgress[sectionId] === true;
}

// Mark entire chapter as complete
window.completeChapter = function(chapterId, sections) { // הפכנו לפונקציה גלובלית
    try {
        const progress = window.getProgress(); // קוראים לפונקציה הגלובלית
        
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
}

// Get overall course completion (פונקציה קצת מיותרת כשיש updateOverallProgress ב-index.html)
window.getOverallCompletion = function(totalChapters, sectionsPerChapter) { // הפכנו לפונקציה גלובלית
    const progress = window.getProgress(); // קוראים לפונקציה הגלובלית
    let totalSections = 0;
    let completedSections = 0;
    
    // זהות המפה ששימשה ב-index.html
    const totalSectionsMap = {
        ch01: 8, ch02: 9, ch03: 9, ch04: 10,
        ch05: 9, ch06: 8, ch07: 10, ch08: 7,
        ch09: 6, ch10: 8, ch11: 7, ch12: 3,
        ch13: 7, ch14: 4, ch15: 5, ch16: 7
    };

    Object.keys(totalSectionsMap).forEach(chapterId => {
        const chapterSections = totalSectionsMap[chapterId];
        totalSections += chapterSections;
        
        if (progress[chapterId]) {
            completedSections += Object.values(progress[chapterId]).filter(Boolean).length;
        }
    });
    
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
}

// Export progress data (for backup/sharing)
window.exportProgress = function() { // הפכנו לפונקציה גלובלית
    const progress = window.getProgress(); // קוראים לפונקציה הגלובלית
    const dataStr = JSON.stringify(progress, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `canadian-style-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Import progress data
window.importProgress = function(file) { // הפכנו לפונקציה גלובלית
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
        
        reader.onerror = (error) => {
            console.error('File reader error:', reader.error);
            reject(new Error('Failed to read file.'));
        };
        reader.readAsText(file);
    });
}