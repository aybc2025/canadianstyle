// Router module for The Canadian Style Learning Platform
// Fixed version - prevents null values and improves navigation

export const router = {
    currentChapter: null,
    currentSection: null,
    
    // Initialize router
    init() {
        this.handleHashChange();
        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('popstate', () => this.handleHashChange());
    },
    
    // Handle hash changes in URL
    handleHashChange() {
        const hash = window.location.hash.slice(1); // Remove #
        if (hash) {
            this.parseAndNavigate(hash);
        }
    },
    
    // Parse hash and navigate to section
    parseAndNavigate(hash) {
        // Expected format: ch01#section-id or just ch01
        const [chapterPart, sectionPart] = hash.split('#');
        
        if (this.isValidChapter(chapterPart)) {
            this.currentChapter = chapterPart;
            this.currentSection = sectionPart || 'introduction';
            this.navigateToSection(this.currentSection);
        }
    },
    
    // Navigate to a specific chapter and section
    navigateTo(chapterId, sectionId = 'introduction') {
        if (!this.isValidChapter(chapterId)) {
            console.error('Invalid chapter ID:', chapterId);
            return false;
        }
        
        this.currentChapter = chapterId;
        this.currentSection = sectionId;
        
        // Update URL without triggering hashchange
        const newHash = sectionId ? `${chapterId}#${sectionId}` : chapterId;
        if (window.location.hash.slice(1) !== newHash) {
            window.history.pushState(null, null, `#${newHash}`);
        }
        
        this.navigateToSection(sectionId);
        return true;
    },
    
    // Navigate to a specific section within current chapter
    navigateToSection(sectionId) {
        if (!sectionId || sectionId === 'null' || sectionId === 'undefined') {
            sectionId = 'introduction';
        }
        
        this.currentSection = sectionId;
        this.updateActiveSection(sectionId);
        this.scrollToSection(sectionId);
        this.updateProgressBar();
    },
    
    // Update active section in navigation
    updateActiveSection(sectionId) {
        // Remove active class from all section tabs
        document.querySelectorAll('.section-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to current section tab
        const activeTab = document.querySelector(`.section-tab[href="#${sectionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Show/hide content sections
        document.querySelectorAll('.content-section').forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
                section.setAttribute('aria-hidden', 'false');
            } else {
                section.style.display = 'none';
                section.setAttribute('aria-hidden', 'true');
            }
        });
    },
    
    // Scroll to section smoothly
    scrollToSection(sectionId) {
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            // Small delay to ensure content is visible
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        } else {
            // Scroll to top if section not found
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },
    
    // Update progress bar based on current position
    updateProgressBar() {
        const progressBar = document.querySelector('.progress-fill');
        if (!progressBar || !this.currentChapter) return;
        
        try {
            const chapterProgress = window.calculateChapterProgress ? 
                window.calculateChapterProgress(this.currentChapter) : 0;
            progressBar.style.width = `${chapterProgress}%`;
        } catch (error) {
            console.error('Error updating progress bar:', error);
            progressBar.style.width = '0%';
        }
    },
    
    // Validate chapter ID
    isValidChapter(chapterId) {
        if (!chapterId || typeof chapterId !== 'string') {
            return false;
        }
        
        // Check if it matches expected pattern (ch01, ch02, etc.)
        const chapterPattern = /^ch(0[1-9]|1[0-6])$/;
        return chapterPattern.test(chapterId);
    },
    
    // Get next section
    getNextSection() {
        if (!this.currentChapter || !this.currentSection) return null;
        
        const sections = this.getChapterSections(this.currentChapter);
        const currentIndex = sections.findIndex(s => s.id === this.currentSection);
        
        if (currentIndex >= 0 && currentIndex < sections.length - 1) {
            return sections[currentIndex + 1];
        }
        
        return null;
    },
    
    // Get previous section
    getPreviousSection() {
        if (!this.currentChapter || !this.currentSection) return null;
        
        const sections = this.getChapterSections(this.currentChapter);
        const currentIndex = sections.findIndex(s => s.id === this.currentSection);
        
        if (currentIndex > 0) {
            return sections[currentIndex - 1];
        }
        
        return null;
    },
    
    // Navigate to next section
    goToNextSection() {
        const nextSection = this.getNextSection();
        if (nextSection) {
            this.navigateTo(this.currentChapter, nextSection.id);
            return true;
        }
        
        // Try to go to next chapter
        const nextChapter = this.getNextChapter();
        if (nextChapter) {
            window.location.href = `${nextChapter.id}.html`;
            return true;
        }
        
        return false;
    },
    
    // Navigate to previous section
    goToPreviousSection() {
        const prevSection = this.getPreviousSection();
        if (prevSection) {
            this.navigateTo(this.currentChapter, prevSection.id);
            return true;
        }
        
        // Try to go to previous chapter
        const prevChapter = this.getPreviousChapter();
        if (prevChapter) {
            window.location.href = `${prevChapter.id}.html`;
            return true;
        }
        
        return false;
    },
    
    // Get chapter sections (fallback data to prevent null errors)
    getChapterSections(chapterId) {
        // Default sections structure to prevent null errors
        const defaultSections = [
            { id: 'introduction', title: 'Introduction' }
        ];
        
        // Chapter-specific sections (simplified mapping)
        const chapterSections = {
            ch01: [
                { id: 'introduction', title: '1.01 Introduction' },
                { id: 'sentence-capitals', title: '1.02 Sentence Capitals' },
                { id: 'proper-nouns', title: '1.03 Proper Nouns' },
                { id: 'government-bodies', title: '1.04 Government Bodies' },
                { id: 'titles-positions', title: '1.05 Titles and Positions' },
                { id: 'geographic-names', title: '1.06 Geographic Names' },
                { id: 'brand-names', title: '1.07 Brand Names' },
                { id: 'academic-degrees', title: '1.08 Academic Degrees' }
            ],
            ch02: [
                { id: 'introduction', title: '2.01 Introduction' },
                { id: 'closed-compounds', title: '2.02 Closed Compounds' },
                { id: 'open-compounds', title: '2.03 Open Compounds' },
                { id: 'hyphenated-compounds', title: '2.04 Hyphenated Compounds' },
                { id: 'compound-adjectives', title: '2.05 Compound Adjectives' },
                { id: 'temporary-compounds', title: '2.06 Temporary Compounds' },
                { id: 'prefixes-suffixes', title: '2.07 Prefixes and Suffixes' },
                { id: 'numbers-compounds', title: '2.08 Numbers in Compounds' },
                { id: 'troublesome-compounds', title: '2.09 Troublesome Compounds' }
            ],
            ch03: [
                { id: 'introduction', title: '3.01 Introduction' },
                { id: 'word-division', title: '3.02 Word Division' },
                { id: 'compound-modifiers', title: '3.03 Compound Modifiers' },
                { id: 'prefixes', title: '3.04 Prefixes' },
                { id: 'numbers', title: '3.05 Numbers' },
                { id: 'suspended-hyphens', title: '3.06 Suspended Hyphens' },
                { id: 'en-em-dashes', title: '3.07 En Dashes and Em Dashes' },
                { id: 'special-cases', title: '3.08 Special Cases' },
                { id: 'hyphen-guidelines', title: '3.09 General Guidelines' }
            ]
            // Add more chapters as needed
        };
        
        return chapterSections[chapterId] || defaultSections;
    },
    
    // Get next chapter
    getNextChapter() {
        if (!this.currentChapter) return null;
        
        const chapterNum = parseInt(this.currentChapter.slice(2));
        const nextNum = chapterNum + 1;
        
        if (nextNum <= 16) {
            const nextId = `ch${nextNum.toString().padStart(2, '0')}`;
            return { id: nextId, number: nextNum };
        }
        
        return null;
    },
    
    // Get previous chapter
    getPreviousChapter() {
        if (!this.currentChapter) return null;
        
        const chapterNum = parseInt(this.currentChapter.slice(2));
        const prevNum = chapterNum - 1;
        
        if (prevNum >= 1) {
            const prevId = `ch${prevNum.toString().padStart(2, '0')}`;
            return { id: prevId, number: prevNum };
        }
        
        return null;
    },
    
    // Mark section as complete and navigate to next
    completeSection(sectionId) {
        if (!this.currentChapter || !sectionId) return false;
        
        // Mark as complete in progress system
        if (window.setProgress) {
            window.setProgress(this.currentChapter, sectionId, true);
        }
        
        // Auto-navigate to next section after a short delay
        setTimeout(() => {
            if (!this.goToNextSection()) {
                // If no next section, show completion message
                this.showSectionComplete();
            }
        }, 1000);
        
        return true;
    },
    
    // Show section completion message
    showSectionComplete() {
        const message = document.createElement('div');
        message.className = 'section-complete-message';
        message.innerHTML = `
            <div class="message-content">
                <span class="message-icon">✅</span>
                <span class="message-text">Section completed!</span>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    },
    
    // Setup section navigation links
    setupSectionLinks() {
        document.querySelectorAll('.section-tab').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').slice(1); // Remove #
                this.navigateTo(this.currentChapter, sectionId);
            });
        });
        
        // Setup next/previous buttons
        document.querySelectorAll('.btn-next-section').forEach(btn => {
            btn.addEventListener('click', () => this.goToNextSection());
        });
        
        document.querySelectorAll('.btn-prev-section').forEach(btn => {
            btn.addEventListener('click', () => this.goToPreviousSection());
        });
    },
    
    // Get current location info
    getCurrentLocation() {
        return {
            chapter: this.currentChapter,
            section: this.currentSection,
            chapterTitle: this.getChapterTitle(this.currentChapter),
            sectionTitle: this.getSectionTitle(this.currentChapter, this.currentSection)
        };
    },
    
    // Get chapter title (fallback to prevent null)
    getChapterTitle(chapterId) {
        const titles = {
            ch01: 'Capitalization',
            ch02: 'Compounds',
            ch03: 'Hyphens',
            ch04: 'Abbreviations',
            ch05: 'Numbers',
            ch06: 'Italics',
            ch07: 'Punctuation',
            ch08: 'Quotations',
            ch09: 'Reference Matter',
            ch10: 'Letters',
            ch11: 'Reports',
            ch12: 'Usage',
            ch13: 'Plain Language',
            ch14: 'Bias-Free Writing',
            ch15: 'Geographical Names',
            ch16: 'Revision'
        };
        
        return titles[chapterId] || 'Unknown Chapter';
    },
    
    // Get section title (fallback to prevent null)
    getSectionTitle(chapterId, sectionId) {
        const sections = this.getChapterSections(chapterId);
        const section = sections.find(s => s.id === sectionId);
        return section ? section.title : 'Unknown Section';
    }
};

// Initialize router when module loads
if (typeof window !== 'undefined') {
    // Auto-initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => router.init());
    } else {
        router.init();
    }
}

// Export for use in chapter pages
window.router = router;

console.log('Router system initialized');
