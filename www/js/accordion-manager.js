// accordion-manager.js - Accordion functionality for summary sections

/**
 * Toggle accordion section expand/collapse
 * @param {HTMLElement} header - The accordion header element that was clicked
 */
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = header.classList.contains('active');

    // Toggle the clicked section
    if (isActive) {
        // Collapse
        header.classList.remove('active');
        content.classList.remove('expanded');
    } else {
        // Expand
        header.classList.add('active');
        content.classList.add('expanded');
    }
}

/**
 * Expand a specific accordion section by ID
 * @param {string} sectionClass - The class name of the section to expand
 */
function expandAccordionSection(sectionClass) {
    const section = document.querySelector(`.${sectionClass}`);
    if (!section) return;

    const header = section.querySelector('.accordion-header');
    const content = section.querySelector('.accordion-content');

    if (header && content) {
        header.classList.add('active');
        content.classList.add('expanded');
    }
}

/**
 * Collapse a specific accordion section by ID
 * @param {string} sectionClass - The class name of the section to collapse
 */
function collapseAccordionSection(sectionClass) {
    const section = document.querySelector(`.${sectionClass}`);
    if (!section) return;

    const header = section.querySelector('.accordion-header');
    const content = section.querySelector('.accordion-content');

    if (header && content) {
        header.classList.remove('active');
        content.classList.remove('expanded');
    }
}

/**
 * Expand all accordion sections
 */
function expandAllAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        const content = header.nextElementSibling;
        header.classList.add('active');
        content.classList.add('expanded');
    });
}

/**
 * Collapse all accordion sections
 */
function collapseAllAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        const content = header.nextElementSibling;
        header.classList.remove('active');
        content.classList.remove('expanded');
    });
}

/**
 * Initialize accordion state based on user preference or default
 */
function initializeAccordionState() {
    // Check if there's a saved state in localStorage
    const savedState = localStorage.getItem('accordionState');

    if (savedState) {
        try {
            const state = JSON.parse(savedState);

            // Apply saved state to each section
            if (state.loanSummary) {
                expandAccordionSection('loan-summary-section');
            }
            if (state.savingsSummary) {
                expandAccordionSection('savings-summary-section');
            }
            if (state.paymentSummary) {
                expandAccordionSection('payment-summary-section');
            }
        } catch (e) {
            console.error('Error loading accordion state:', e);
            // Default: Expand all sections on first load
            expandAllAccordions();
        }
    } else {
        // Default: Expand all sections on first load
        expandAllAccordions();
    }
}

/**
 * Save accordion state to localStorage
 */
function saveAccordionState() {
    const loanHeader = document.querySelector('.loan-summary-section .accordion-header');
    const savingsHeader = document.querySelector('.savings-summary-section .accordion-header');
    const paymentHeader = document.querySelector('.payment-summary-section .accordion-header');

    const state = {
        loanSummary: loanHeader ? loanHeader.classList.contains('active') : false,
        savingsSummary: savingsHeader ? savingsHeader.classList.contains('active') : false,
        paymentSummary: paymentHeader ? paymentHeader.classList.contains('active') : false
    };

    localStorage.setItem('accordionState', JSON.stringify(state));
}

/**
 * Enhanced toggleAccordion with state saving
 */
const originalToggleAccordion = toggleAccordion;
toggleAccordion = function (header) {
    originalToggleAccordion(header);
    // Check if this is the year summary accordion
    if (header.closest('.year-details-section')) {
        saveYearSummaryAccordionState();
    } else {
        // Save main accordion state
        saveAccordionState();
    }
    saveAccordionState();
};

/**
 * Initialize accordion functionality when summary section is displayed
 */
function initializeAccordions() {
    const summarySection = document.getElementById('summarySection');
    if (!summarySection) return;

    // Wait for the section to be visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style') {
                const display = summarySection.style.display;
                if (display === 'block' || display === '') {
                    // Initialize accordion state when summary becomes visible
                    setTimeout(initializeAccordionState, 100);
                }
            }
        });
    });

    observer.observe(summarySection, {
        attributes: true,
        attributeFilter: ['style']
    });
}

// Initialize accordions when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeAccordions();

    // Add keyboard accessibility
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        // Make headers focusable
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'false');

        // Add keyboard support
        header.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAccordion(this);
            }
        });
    });
    // Watch for year summary visibility changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const yearSummary = document.getElementById('yearSummary');
                if (yearSummary && yearSummary.classList.contains('show')) {
                    const yearHeader = yearSummary.querySelector('.accordion-header');
                    if (yearHeader && !yearHeader.hasAttribute('tabindex')) {
                        yearHeader.setAttribute('tabindex', '0');
                        yearHeader.setAttribute('role', 'button');
                        yearHeader.setAttribute('aria-expanded', 'false');
                        
                        yearHeader.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleAccordion(this);
                            }
                        });
                    }
                }
            }
        });
    });
    
    const yearSummary = document.getElementById('yearSummary');
    if (yearSummary) {
        observer.observe(yearSummary, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});

/**
 * Update aria-expanded attribute when accordion state changes
 */
const accordionObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const header = mutation.target;
            const isExpanded = header.classList.contains('active');
            header.setAttribute('aria-expanded', isExpanded.toString());
        }
    });
});

// Observe all accordion headers for class changes
document.addEventListener('DOMContentLoaded', function () {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        accordionObserver.observe(header, {
            attributes: true,
            attributeFilter: ['class']
        });
    });
});

/**
 * Initialize year summary accordion state
 */
function initializeYearSummaryAccordion() {
    const savedState = localStorage.getItem('yearSummaryAccordionState');

    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.expanded) {
                expandAccordionSection('year-details-section');
            }
        } catch (e) {
            console.error('Error loading year summary accordion state:', e);
            expandAccordionSection('year-details-section');
        }
    } else {
        // Default: Expand on first load
        expandAccordionSection('year-details-section');
    }
}

/**
 * Save year summary accordion state
 */
function saveYearSummaryAccordionState() {
    const header = document.querySelector('.year-details-section .accordion-header');

    if (header) {
        const state = {
            expanded: header.classList.contains('active')
        };
        localStorage.setItem('yearSummaryAccordionState', JSON.stringify(state));
    }
}