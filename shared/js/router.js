// Hash-based router for in-page navigation

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }
    
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
        
        // Handle back button warning for unsaved quiz progress
        window.addEventListener('beforeunload', (e) => {
            const activeQuiz = document.querySelector('cs-quiz:not([completed])');
            if (activeQuiz) {
                e.preventDefault();
                e.returnValue = 'You have an unfinished quiz. Are you sure you want to leave?';
            }
        });
    }
    
    // Parse hash into chapter and section
    parseHash() {
        const hash = window.location.hash.slice(1); // Remove #
        if (!hash) return { chapter: null, section: null };
        
        const parts = hash.split('/');
        return {
            chapter: parts[0] || null,
            section: parts[1] || null
        };
    }
    
    // Navigate to a specific section
    navigateTo(chapter, section) {
        window.location.hash = section ? `${chapter}/${section}` : chapter;
    }
    
    // Handle route changes
    handleRoute() {
        const { chapter, section } = this.parseHash();
        
        if (!chapter) {
            this.showDefaultSection();
            return;
        }
        
        // Update active states
        this.updateActiveStates(chapter, section);
        
        // Scroll to section if specified
        if (section) {
            this.scrollToSection(section);
        }
        
        // Update browser title
        this.updateTitle(chapter, section);
        
        // Emit navigation event
        window.dispatchEvent(new CustomEvent('navigation', {
            detail: { chapter, section }
        }));
    }
    
    // Update active tab states
    updateActiveStates(chapter, section) {
        // Update section tabs
        document.querySelectorAll('.tab-link').forEach(tab => {
            const tabSection = tab.getAttribute('data-section');
            if (tabSection === section) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update any other navigation elements
        document.querySelectorAll('[data-route]').forEach(el => {
            const route = el.getAttribute('data-route');
            if (route === `${chapter}/${section}` || route === chapter) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }
    
    // Scroll to a specific section
    scrollToSection(sectionId) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
                const offset = 100; // Account for sticky header
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
    
    // Show default section (first one)
    showDefaultSection() {
        const firstSection = document.querySelector('.content-section');
        if (firstSection) {
            const sectionId = firstSection.id;
            const chapter = window.location.pathname.split('/').pop().replace('.html', '');
            this.navigateTo(chapter, sectionId);
        }
    }
    
    // Update browser title
    updateTitle(chapter, section) {
        const chapterTitle = document.querySelector('h1')?.textContent || 'Chapter';
        const sectionTitle = section ? document.getElementById(section)?.querySelector('h2')?.textContent : '';
        
        document.title = sectionTitle 
            ? `${sectionTitle} - ${chapterTitle} - The Canadian Style`
            : `${chapterTitle} - The Canadian Style`;
    }
    
    // Get current route
    getCurrentRoute() {
        return this.parseHash();
    }
    
    // Check if quiz is in progress
    hasActiveQuiz() {
        return document.querySelector('cs-quiz:not([completed])') !== null;
    }
}

// Export singleton instance
export const router = new Router();

// Helper function to generate section navigation
export function generateSectionNav(sections) {
    return `
        <nav class="section-tabs">
            <div class="tabs-list">
                ${sections.map(section => `
                    <a href="#${section.id}" 
                       class="tab-link" 
                       data-section="${section.id}">
                        ${section.title}
                    </a>
                `).join('')}
            </div>
        </nav>
    `;
}

// Helper to mark section as complete and navigate to next
export function completeAndNext(currentChapter, currentSection, sections) {
    // Import progress functions
    import('./progress.js').then(({ setProgress }) => {
        // Mark current section as complete
        setProgress(currentChapter, currentSection);
        
        // Find next section
        const currentIndex = sections.findIndex(s => s.id === currentSection);
        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            router.navigateTo(currentChapter, nextSection.id);
        } else {
            // Chapter complete - show completion message
            showChapterComplete();
        }
    });
}

// Show chapter completion message
function showChapterComplete() {
    const modal = document.createElement('div');
    modal.className = 'completion-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>🎉 Chapter Complete!</h2>
            <p>Congratulations on completing this chapter!</p>
            <div class="modal-actions">
                <a href="../index.html" class="btn btn-secondary">Back to Dashboard</a>
                <button class="btn btn-primary" onclick="this.closest('.completion-modal').remove()">
                    Review Chapter
                </button>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .completion-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
        }
        
        .modal-content h2 {
            color: #d71920;
            margin-bottom: 1rem;
        }
        
        .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1.5rem;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
}