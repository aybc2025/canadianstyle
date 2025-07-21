/**
 * Router System for The Canadian Style Learning Platform
 * Handles hash-based navigation, section switching, and state management
 * COMPLETELY FIXED VERSION - supports both old and new navigation patterns
 */

class Router {
    constructor() {
        this.currentChapter = null;
        this.currentSection = null;
        this.sections = [];
        this.isInitialized = false;
        this.scrollPositions = new Map();
        
        // Bind methods to preserve context
        this.handleHashChange = this.handleHashChange.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Initialize router for a specific chapter
     * @param {string} chapterId - Chapter identifier (e.g., 'ch01')
     * @param {Array} sections - Array of section objects with id and title
     */
    init(chapterId, sections = []) {
        if (!chapterId) {
            console.error('Router: Chapter ID is required for initialization');
            return;
        }

        this.currentChapter = chapterId;
        this.sections = sections;
        this.isInitialized = true;

        // Validate sections
        if (!Array.isArray(sections) || sections.length === 0) {
            console.warn('Router: No sections provided, navigation may not work properly');
        }

        // Initialize navigation UI
        this.setupSectionNavigation();
        
        // Handle initial hash or show first section
        const initialHash = window.location.hash;
        if (initialHash) {
            this.handleHashChange();
        } else {
            // Show first section by default
            if (sections.length > 0) {
                this.navigateToSection(sections[0].id, false);
            }
        }

        console.log(`Router initialized for ${chapterId} with ${sections.length} sections`);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle hash changes (forward/back navigation)
        window.addEventListener('hashchange', this.handleHashChange);
        
        // Handle browser navigation
        window.addEventListener('popstate', this.handlePopState);
        
        // Warn about unsaved quiz progress
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveScrollPosition();
            }
        });
    }

    /**
     * Set up section navigation tabs
     */
    setupSectionNavigation() {
        const navContainer = document.getElementById('sectionNav');
        if (!navContainer) {
            console.warn('Router: Section navigation container not found');
            return;
        }

        const tabsList = navContainer.querySelector('.tabs-list');
        if (!tabsList) {
            console.warn('Router: Tabs list not found in navigation container');
            return;
        }

        // Update existing tabs with click handlers
        tabsList.querySelectorAll('.tab-link').forEach(tab => {
            const sectionId = tab.dataset.section;
            if (sectionId) {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateToSection(sectionId);
                });
            }
        });
    }

    /**
     * Navigate to a specific section
     * @param {string} sectionId - Section identifier
     * @param {boolean} updateHistory - Whether to update browser history
     */
    navigateToSection(sectionId, updateHistory = true) {
        if (!this.isInitialized) {
            console.error('Router: Not initialized. Call init() first.');
            return;
        }

        if (!sectionId) {
            console.error('Router: Section ID is required');
            return;
        }

        // Validate section exists
        const sectionExists = this.sections.some(s => s.id === sectionId);
        if (!sectionExists) {
            console.warn(`Router: Section "${sectionId}" not found in chapter "${this.currentChapter}"`);
            return;
        }

        // Save scroll position of current section
        this.saveScrollPosition();

        // Update current section
        const previousSection = this.currentSection;
        this.currentSection = sectionId;

        // Show/hide sections
        this.updateSectionVisibility(sectionId);

        // Update navigation state
        this.updateNavigationState(sectionId);

        // Update URL hash if requested
        if (updateHistory) {
            const newHash = `#${sectionId}`;
            if (window.location.hash !== newHash) {
                history.pushState({ 
                    chapter: this.currentChapter, 
                    section: sectionId 
                }, '', newHash);
            }
        }

        // Scroll to top of new section or restore position
        this.handleSectionScroll(sectionId);

        // Emit navigation event
        this.emitNavigationEvent(previousSection, sectionId);

        console.log(`Router: Navigated to section "${sectionId}"`);
    }

    /**
     * Navigate to specific chapter and section
     * @param {string} chapterId - Chapter identifier
     * @param {string} sectionId - Section identifier
     */
    navigateTo(chapterId, sectionId) {
        if (chapterId !== this.currentChapter) {
            // Navigate to different chapter
            const chapterUrl = `../chapters/${chapterId}.html${sectionId ? `#${sectionId}` : ''}`;
            window.location.href = chapterUrl;
        } else {
            // Navigate within current chapter
            this.navigateToSection(sectionId);
        }
    }

    /**
     * Update section visibility
     * @param {string} activeSectionId - ID of section to show
     */
    updateSectionVisibility(activeSectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Show active section
        const activeSection = document.getElementById(activeSectionId);
        if (activeSection) {
            activeSection.classList.add('active');
            activeSection.style.display = 'block';
        } else {
            console.error(`Router: Section element "${activeSectionId}" not found in DOM`);
        }
    }

    /**
     * Update navigation tabs state
     * @param {string} activeSectionId - ID of active section
     */
    updateNavigationState(activeSectionId) {
        // Update tab states
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.section === activeSectionId) {
                tab.classList.add('active');
                // Scroll tab into view if needed
                this.scrollTabIntoView(tab);
            }
        });

        // Update page title
        const section = this.sections.find(s => s.id === activeSectionId);
        if (section) {
            document.title = `${section.title} - The Canadian Style`;
        }
    }

    /**
     * Scroll navigation tab into view
     * @param {Element} tab - Tab element to scroll into view
     */
    scrollTabIntoView(tab) {
        const tabsList = tab.closest('.tabs-list');
        if (tabsList) {
            const tabRect = tab.getBoundingClientRect();
            const containerRect = tabsList.getBoundingClientRect();
            
            if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
                tab.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest', 
                    inline: 'center' 
                });
            }
        }
    }

    /**
     * Handle section scrolling
     * @param {string} sectionId - ID of section to scroll to
     */
    handleSectionScroll(sectionId) {
        // Try to restore saved scroll position
        const savedPosition = this.scrollPositions.get(sectionId);
        if (savedPosition) {
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: savedPosition,
                    behavior: 'smooth'
                });
            });
        } else {
            // Scroll to section header with offset for fixed navigation
            const section = document.getElementById(sectionId);
            if (section) {
                const headerOffset = this.calculateHeaderOffset();
                const sectionTop = section.offsetTop - headerOffset;
                
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: Math.max(0, sectionTop),
                        behavior: 'smooth'
                    });
                });
            }
        }
    }

    /**
     * Calculate offset for fixed headers
     * @returns {number} - Offset in pixels
     */
    calculateHeaderOffset() {
        let offset = 0;
        
        const siteHeader = document.querySelector('.site-header');
        if (siteHeader) {
            offset += siteHeader.offsetHeight;
        }
        
        const sectionTabs = document.querySelector('.section-tabs');
        if (sectionTabs) {
            offset += sectionTabs.offsetHeight;
        }
        
        return offset + 20; // Add some padding
    }

    /**
     * Save current scroll position
     */
    saveScrollPosition() {
        if (this.currentSection) {
            this.scrollPositions.set(this.currentSection, window.pageYOffset);
        }
    }

    /**
     * Restore scroll position for a section
     * @param {string} sectionId - Section to restore position for
     */
    restoreScrollPosition(sectionId) {
        const savedPosition = this.scrollPositions.get(sectionId);
        if (savedPosition !== undefined) {
            window.scrollTo(0, savedPosition);
        }
    }

    /**
     * Handle hash change events
     */
    handleHashChange() {
        if (!this.isInitialized) return;

        const hash = window.location.hash.substring(1); // Remove #
        if (hash && hash !== this.currentSection) {
            this.navigateToSection(hash, false);
        } else if (!hash && this.sections.length > 0) {
            // No hash, show first section
            this.navigateToSection(this.sections[0].id, false);
        }
    }

    /**
     * Handle browser back/forward navigation
     * @param {PopStateEvent} event - Popstate event
     */
    handlePopState(event) {
        if (event.state && event.state.section) {
            this.navigateToSection(event.state.section, false);
        } else {
            this.handleHashChange();
        }
    }

    /**
     * Handle page unload (warn about unsaved progress)
     * @param {BeforeUnloadEvent} event - Before unload event
     */
    handleBeforeUnload(event) {
        // Check for active quiz
        const activeQuiz = document.querySelector('.quiz-engine-container .quiz-in-progress');
        if (activeQuiz) {
            const message = 'You have a quiz in progress. Are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }

        // Save current state
        this.saveScrollPosition();
    }

    /**
     * Emit navigation event for other components to listen
     * @param {string} fromSection - Previous section ID
     * @param {string} toSection - New section ID
     */
    emitNavigationEvent(fromSection, toSection) {
        const event = new CustomEvent('section-navigation', {
            detail: {
                from: fromSection,
                to: toSection,
                chapter: this.currentChapter,
                sections: this.sections
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get current navigation state
     * @returns {Object} - Current state information
     */
    getCurrentState() {
        return {
            chapter: this.currentChapter,
            section: this.currentSection,
            isInitialized: this.isInitialized,
            totalSections: this.sections.length,
            currentIndex: this.sections.findIndex(s => s.id === this.currentSection)
        };
    }

    /**
     * Get next section ID
     * @returns {string|null} - Next section ID or null if at end
     */
    getNextSection() {
        const currentIndex = this.sections.findIndex(s => s.id === this.currentSection);
        if (currentIndex !== -1 && currentIndex < this.sections.length - 1) {
            return this.sections[currentIndex + 1].id;
        }
        return null;
    }

    /**
     * Get previous section ID
     * @returns {string|null} - Previous section ID or null if at beginning
     */
    getPreviousSection() {
        const currentIndex = this.sections.findIndex(s => s.id === this.currentSection);
        if (currentIndex > 0) {
            return this.sections[currentIndex - 1].id;
        }
        return null;
    }

    /**
     * Navigate to next section
     * @returns {boolean} - Whether navigation was successful
     */
    goToNextSection() {
        const nextSection = this.getNextSection();
        if (nextSection) {
            this.navigateToSection(nextSection);
            return true;
        }
        return false;
    }

    /**
     * Navigate to previous section
     * @returns {boolean} - Whether navigation was successful
     */
    goToPreviousSection() {
        const previousSection = this.getPreviousSection();
        if (previousSection) {
            this.navigateToSection(previousSection);
            return true;
        }
        return false;
    }

    /**
     * Check if section exists
     * @param {string} sectionId - Section ID to check
     * @returns {boolean} - Whether section exists
     */
    sectionExists(sectionId) {
        return this.sections.some(s => s.id === sectionId);
    }

    /**
     * Get section information
     * @param {string} sectionId - Section ID
     * @returns {Object|null} - Section object or null if not found
     */
    getSection(sectionId) {
        return this.sections.find(s => s.id === sectionId) || null;
    }

    /**
     * Add keyboard navigation support
     */
    enableKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Only handle if no input is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.goToPreviousSection();
                    }
                    break;
                case 'ArrowRight':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.goToNextSection();
                    }
                    break;
                case 'Home':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        if (this.sections.length > 0) {
                            this.navigateToSection(this.sections[0].id);
                        }
                    }
                    break;
                case 'End':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        if (this.sections.length > 0) {
                            this.navigateToSection(this.sections[this.sections.length - 1].id);
                        }
                    }
                    break;
            }
        });
    }

    /**
     * Clean up router (remove event listeners)
     */
    destroy() {
        window.removeEventListener('hashchange', this.handleHashChange);
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        
        this.isInitialized = false;
        this.currentChapter = null;
        this.currentSection = null;
        this.sections = [];
        this.scrollPositions.clear();
        
        console.log('Router: Destroyed and cleaned up');
    }

    /**
     * Update browser history without triggering navigation
     * @param {string} sectionId - Section ID to update in history
     */
    updateHistory(sectionId) {
        const newHash = `#${sectionId}`;
        if (window.location.hash !== newHash) {
            history.replaceState({ 
                chapter: this.currentChapter, 
                section: sectionId 
            }, '', newHash);
        }
    }

    /**
     * Get navigation breadcrumb
     * @returns {Array} - Array of breadcrumb items
     */
    getBreadcrumb() {
        const breadcrumb = [
            { title: 'Home', url: '../index.html' }
        ];

        if (this.currentChapter) {
            breadcrumb.push({
                title: `Chapter ${this.currentChapter.replace('ch', '')}`,
                url: window.location.pathname
            });
        }

        if (this.currentSection) {
            const section = this.getSection(this.currentSection);
            if (section) {
                breadcrumb.push({
                    title: section.title,
                    url: `#${this.currentSection}`
                });
            }
        }

        return breadcrumb;
    }
}

// Create and export router instance
const router = new Router();

// Enable keyboard navigation by default
router.enableKeyboardNavigation();

// Export for use in other modules
export { router };

// Also make available globally for legacy support
window.router = router;

// Debug helper (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.routerDebug = {
        getState: () => router.getCurrentState(),
        getSections: () => router.sections,
        getScrollPositions: () => router.scrollPositions,
        navigateToSection: (id) => router.navigateToSection(id),
        router: router
    };
}