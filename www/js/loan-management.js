// loan-management.js - Multi-Loan Management System

// Global state for loan management
let loans = [];
let currentLoanId = null;
let editingLoanId = null;
let deletingLoanId = null;

// Initialize loan management when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeLoanManagement();
});

/**
 * Initialize the loan management system
 */
function initializeLoanManagement() {
    loadAllLoans();
    renderLoansList();
    attachLoanManagementListeners();

    // Load the last active loan or show empty state
    const lastLoanId = localStorage.getItem('currentLoanId');
    if (lastLoanId && loans.find(l => l.id === lastLoanId)) {
        switchToLoan(lastLoanId);
    } else if (loans.length > 0) {
        switchToLoan(loans[0].id);
    } else {
        showEmptyLoanState();
    }
}

/**
 * Load all loans from localStorage
 */
function loadAllLoans() {
    const saved = localStorage.getItem('multipleLoans');
    if (saved) {
        try {
            loans = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading loans:', e);
            loans = [];
        }
    }
}

/**
 * Save all loans to localStorage
 */
function saveAllLoans() {
    localStorage.setItem('multipleLoans', JSON.stringify(loans));
}

/**
 * Render the loans list in the sidebar
 */
function renderLoansList() {
    const loansList = document.getElementById('loansList');

    if (!loansList) return;

    if (loans.length === 0) {
        loansList.innerHTML = `
            <div class="empty-loans-state">
                <p>No loans created yet</p>
            </div>
        `;
        return;
    }

    loansList.innerHTML = loans.map(loan => `
        <div class="loan-item ${loan.id === currentLoanId ? 'active' : ''}" 
             onclick="switchToLoan('${loan.id}')"
             data-loan-id="${loan.id}">
            <div class="loan-item-content">
                <div class="loan-item-name">${escapeHtml(loan.name)}</div>
                <div class="loan-item-type">Type - ${getLoanTypeLabel(loan.type)}</div>
            </div>
            <div class="loan-item-actions">
                <button class="loan-action-btn" 
                        onclick="event.stopPropagation(); editLoan('${loan.id}')" 
                        title="Edit Loan">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="loan-action-btn" 
                        onclick="event.stopPropagation(); showDeleteLoanModal('${loan.id}')" 
                        title="Delete Loan">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}


/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    const sidebar = document.getElementById('loanSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.toggle('minimized');

    // For desktop: toggle body class to adjust margin
    if (window.innerWidth > 768) {
        document.body.classList.toggle('sidebar-minimized');
    } else {
        // For mobile: toggle overlay
        overlay.classList.toggle('show');
    }
}

/**
 * Close sidebar on mobile when overlay is clicked
 */
function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('loanSidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar) {
            sidebar.classList.add('minimized');
        }
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
}

/**
 * Show create loan modal
 */
function showCreateLoanModal() {
    editingLoanId = null;
    const modal = document.getElementById('loanModal');
    const modalTitle = document.getElementById('loanModalTitle');
    const loanNameInput = document.getElementById('loanNameInput');
    const loanTypeSelect = document.getElementById('loanTypeSelect');
    const customLoanTypeGroup = document.getElementById('customLoanTypeGroup');
    const customLoanTypeInput = document.getElementById('customLoanTypeInput');

    if (modalTitle) modalTitle.textContent = 'Create New Loan';
    if (loanNameInput) loanNameInput.value = '';
    if (loanTypeSelect) loanTypeSelect.value = '';
    if (customLoanTypeGroup) customLoanTypeGroup.style.display = 'none';
    if (customLoanTypeInput) customLoanTypeInput.value = '';

    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Edit existing loan
 */
function editLoan(loanId) {
    editingLoanId = loanId;
    const loan = loans.find(l => l.id === loanId);

    if (!loan) return;

    const modal = document.getElementById('loanModal');
    const modalTitle = document.getElementById('loanModalTitle');
    const loanNameInput = document.getElementById('loanNameInput');
    const loanTypeSelect = document.getElementById('loanTypeSelect');
    const customLoanTypeGroup = document.getElementById('customLoanTypeGroup');
    const customLoanTypeInput = document.getElementById('customLoanTypeInput');

    if (modalTitle) modalTitle.textContent = 'Edit Loan';
    if (loanNameInput) loanNameInput.value = loan.name;
    if (loanTypeSelect) loanTypeSelect.value = loan.type;

    // Show custom loan type input if editing a loan with type 'other' and set value
    if (customLoanTypeGroup && customLoanTypeInput) {
        if (loan.type === 'other' && loan.customType) {
            customLoanTypeGroup.style.display = '';
            customLoanTypeInput.value = loan.customType;
        } else {
            customLoanTypeGroup.style.display = 'none';
            customLoanTypeInput.value = '';
        }
    }

    if (modal) {
        modal.classList.add('show');
    }
}



/**
 * Close loan modal
 */
function closeLoanModal() {
    const modal = document.getElementById('loanModal');
    if (modal) {
        modal.classList.remove('show');
    }
    editingLoanId = null;
}

/**
 * Save loan (create or update)
 */
function saveLoanFromModal() {
    const loanNameInput = document.getElementById('loanNameInput');
    const loanTypeSelect = document.getElementById('loanTypeSelect');
    const customLoanTypeInput = document.getElementById('customLoanTypeInput');

    const name = loanNameInput ? loanNameInput.value.trim() : '';
    const type = loanTypeSelect ? loanTypeSelect.value : '';
    const customType = (type === 'other' && customLoanTypeInput) ? customLoanTypeInput.value.trim() : '';

    if (!name || !type || (type === 'other' && !customType)) {
        alert('Please fill in all required fields');
        return;
    }

    if (editingLoanId) {
        // Update existing loan
        const loan = loans.find(l => l.id === editingLoanId);
        if (loan) {
            loan.name = name;
            loan.type = type;
            loan.customType = (type === 'other') ? customType : undefined;
            loan.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new loan
        const newLoan = {
            id: 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            type: type,
            customType: (type === 'other') ? customType : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        loans.push(newLoan);

        // Switch to the new loan immediately
        switchToLoan(newLoan.id);
    }

    saveAllLoans();
    renderLoansList();
    // Update header if editing current loan
    if (editingLoanId && editingLoanId === currentLoanId) {
        const updatedLoan = loans.find(l => l.id === editingLoanId);
        if (updatedLoan) updateLoanHeader(updatedLoan);
    } else if (!editingLoanId) {
        // If new loan was created and switched to, update header
        const newLoan = loans[loans.length - 1];
        if (newLoan && newLoan.id === currentLoanId) updateLoanHeader(newLoan);
    }
    closeLoanModal();
}



/**
 * Show delete loan confirmation modal
 */
function showDeleteLoanModal(loanId) {
    deletingLoanId = loanId;
    const loan = loans.find(l => l.id === loanId);
    const modal = document.getElementById('deleteLoanModal');
    const loanNameSpan = document.getElementById('deleteLoanName');
    // Ensure parent overlay is visible
    const parentOverlay = document.getElementById('loanModal');

    if (loanNameSpan && loan) {
        loanNameSpan.textContent = loan.name;
    }

    if (parentOverlay) {
        parentOverlay.classList.add('show');
    }
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Close delete loan modal
 */
function closeDeleteLoanModal() {
    const modal = document.getElementById('deleteLoanModal');
    if (modal) {
        modal.classList.remove('show');
    }
    // Hide parent overlay if only delete modal was open
    const parentOverlay = document.getElementById('loanModal');
    if (parentOverlay) {
        parentOverlay.classList.remove('show');
    }
    deletingLoanId = null;
}

/**
 * Confirm and delete loan
 */
function confirmDeleteLoan() {
    if (!deletingLoanId) return;

    const index = loans.findIndex(l => l.id === deletingLoanId);
    if (index === -1) return;

    // Delete all loan data from localStorage
    deleteLoanData(deletingLoanId);

    // Remove loan from array
    loans.splice(index, 1);
    saveAllLoans();

    // If deleting current loan, switch to another or show empty state
    if (deletingLoanId === currentLoanId) {
        if (loans.length > 0) {
            switchToLoan(loans[0].id);
        } else {
            currentLoanId = null;
            localStorage.removeItem('currentLoanId');
            showEmptyLoanState();
        }
    }

    renderLoansList();
    closeDeleteLoanModal();
}

/**
 * Delete all data associated with a loan
 */
function deleteLoanData(loanId) {
    localStorage.removeItem(`loanTableData_${loanId}`);
    localStorage.removeItem(`loanParameters_${loanId}`);
    localStorage.removeItem(`loanPrepaymentsData_${loanId}`);
    localStorage.removeItem(`loanChargesData_${loanId}`);
}

/**
 * Switch to a different loan
 */
function switchToLoan(loanId) {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // Save current loan data before switching
    if (currentLoanId && currentLoanId !== loanId) {
        saveLoanSpecificData(currentLoanId);
    }

    // Update current loan
    currentLoanId = loanId;
    localStorage.setItem('currentLoanId', loanId);

    // Clear current data
    clearCurrentLoanData();

    // Load the new loan's data
    loadLoanSpecificData(loanId);

    // Update UI
    renderLoansList();
    showLoanContent();

    // Close sidebar on mobile after switching
    closeSidebarOnMobile();

    // Update the loan header
    updateLoanHeader(loan);
}

/**
 * Save current loan data with loan-specific keys
 */
function saveLoanSpecificData(loanId) {
    if (!loanId) return;

    // Save loan parameters
    const loanAmount = document.getElementById('loanAmountInput');
    const rateInput = document.getElementById('rateInput');
    const tenureInput = document.getElementById('tenureInput');
    const emiInput = document.getElementById('emiInput');

    if (loanAmount && rateInput && tenureInput && emiInput) {
        localStorage.setItem(`loanParameters_${loanId}`, JSON.stringify({
            loan: loanAmount.value,
            rate: rateInput.value,
            tenure: tenureInput.value,
            emi: emiInput.value,
            isEMIManual: !isEMIAutoCalculated
        }));
    }

    // Save table data if exists
    if (allTableRows && allTableRows.length > 0) {
        const tableData = [];
        allTableRows.forEach(row => {
            const rateInput = row.querySelector('.rate-input');
            const checkbox = row.querySelector('input[type="checkbox"]');

            tableData.push({
                month: parseInt(row.dataset.month),
                rate: parseFloat(rateInput.value),
                emiPaid: checkbox.checked
            });
        });
        localStorage.setItem(`loanTableData_${loanId}`, JSON.stringify(tableData));
    }

    // Save prepayments and charges
    localStorage.setItem(`loanPrepaymentsData_${loanId}`, JSON.stringify(prepaymentsData));
    localStorage.setItem(`loanChargesData_${loanId}`, JSON.stringify(chargesData));
}

/**
 * Load loan-specific data
 */
function loadLoanSpecificData(loanId) {
    if (!loanId) return;

    // Load loan parameters
    const savedParams = localStorage.getItem(`loanParameters_${loanId}`);
    if (savedParams) {
        try {
            const params = JSON.parse(savedParams);

            const loanAmount = document.getElementById('loanAmountInput');
            const rateInput = document.getElementById('rateInput');
            const tenureInput = document.getElementById('tenureInput');
            const emiInput = document.getElementById('emiInput');

            if (loanAmount) loanAmount.value = params.loan || '';
            if (rateInput) rateInput.value = params.rate || '';
            if (tenureInput) tenureInput.value = params.tenure || '';
            if (emiInput) emiInput.value = params.emi || '';

            // Restore EMI calculation state
            if (params.isEMIManual === false && params.loan && params.rate && params.tenure) {
                autoCalculateEMI();
            } else if (params.isEMIManual === true) {
                if (emiInput) {
                    emiInput.classList.remove('auto-calculated');
                }
                const indicator = document.getElementById('emiAutoCalcIndicator');
                if (indicator) indicator.classList.remove('show');
                isEMIAutoCalculated = false;
            }
        } catch (e) {
            console.error('Error loading loan parameters:', e);
        }
    }

    // Load prepayments data
    const savedPrepayments = localStorage.getItem(`loanPrepaymentsData_${loanId}`);
    if (savedPrepayments) {
        try {
            prepaymentsData = JSON.parse(savedPrepayments);
        } catch (e) {
            console.error('Error loading prepayments:', e);
            prepaymentsData = {};
        }
    } else {
        prepaymentsData = {};
    }

    // Load charges data
    const savedCharges = localStorage.getItem(`loanChargesData_${loanId}`);
    if (savedCharges) {
        try {
            chargesData = JSON.parse(savedCharges);
        } catch (e) {
            console.error('Error loading charges:', e);
            chargesData = {};
        }
    } else {
        chargesData = {};
    }

    // Load and restore table data
    const savedTableData = localStorage.getItem(`loanTableData_${loanId}`);
    if (savedTableData) {
        try {
            const data = JSON.parse(savedTableData);
            restoreTable(data);
        } catch (e) {
            console.error('Error loading table data:', e);
        }
    }

    // Reset unsaved changes flag
    hasUnsavedChanges = false;
    updateUnsavedIndicator();
    validateAllInputs();
}

/**
 * Clear current loan data from UI
 */
function clearCurrentLoanData() {
    // Clear input fields
    const loanAmount = document.getElementById('loanAmountInput');
    const rateInput = document.getElementById('rateInput');
    const tenureInput = document.getElementById('tenureInput');
    const emiInput = document.getElementById('emiInput');

    if (loanAmount) loanAmount.value = '';
    if (rateInput) rateInput.value = '';
    if (tenureInput) tenureInput.value = '';
    if (emiInput) emiInput.value = '';

    // Clear table
    const tableBody = document.querySelector('#amortizationTable tbody');
    if (tableBody) tableBody.innerHTML = '';
    allTableRows = [];

    // Clear prepayments and charges
    prepaymentsData = {};
    chargesData = {};

    // Hide sections
    const amortizationContainer = document.getElementById('amortizationTableContainer');
    const summarySection = document.getElementById('summarySection');
    if (amortizationContainer) amortizationContainer.style.display = 'none';
    if (summarySection) summarySection.style.display = 'none';
}

/**
 * Show empty loan state
 */
function showEmptyLoanState() {
    const loanHeader = document.getElementById('currentLoanHeader');
    if (loanHeader) {
        loanHeader.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 3em; margin-bottom: 15px;">📊</div>
                <h2 style="color: #667eea; margin-bottom: 10px;">No Loan Selected</h2>
                <p style="color: #666;">Create a new loan to get started</p>
            </div>
        `;
    }

    clearCurrentLoanData();
}

/**
 * Show loan content (hide empty state)
 */
function showLoanContent() {
    const loanHeader = document.getElementById('currentLoanHeader');
    if (loanHeader) {
        loanHeader.innerHTML = '';
    }
}

/**
 * Update loan header with current loan info
 */
function updateLoanHeader(loan) {
    const loanHeader = document.getElementById('currentLoanHeader');
    if (loanHeader) {
        loanHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <h2 style="color: #667eea; margin: 0;">${escapeHtml(loan.name)}</h2>
                <span style="background: #e3f2fd; color: #667eea; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
                    Type: ${getLoanTypeLabel(loan.type, loan.customType)}
                </span>
            </div>
        `;
    }
    // Also update the main heading area
    const mainHeading = document.querySelector('.loan-inputs-banner h1');
    const subHeading = document.querySelector('.loan-inputs-banner .section-subtitle');
    if (mainHeading && subHeading && loan) {
        mainHeading.innerHTML = `💰 Loan Amortization Calculator`;
        subHeading.innerHTML = `📝 Loan Details<br><span style='color:#667eea;font-size:1em;'>${escapeHtml(loan.name)} | Type - ${getLoanTypeLabel(loan.type, loan.customType)}</span>`;
    }
}

/**
 * Get loan type label
 */
function getLoanTypeLabel(type, customType) {
    const labels = {
        'home': 'Home Loan',
        'payday': 'Plot Loan',
        'gold': 'Gold Loan',
        'personal': 'Personal Loan',
        'education': 'Education Loan',
        'mortgage': 'Mortgage Loan',
        'car': 'Car Loan',
        'business': 'Business Loan',
        'other': 'Other'
    };
    if (type === 'other') {
        if (customType) {
            return escapeHtml(customType);
        }
        return 'Other';
    }
    return labels[type] || type;
}

/**
 * Attach event listeners for loan management
 */
function attachLoanManagementListeners() {
    // Modal overlay clicks
    const loanModal = document.getElementById('loanModal');
    if (loanModal) {
        loanModal.addEventListener('click', function (e) {
            if (e.target === this) closeLoanModal();
        });
    }

    const deleteLoanModal = document.getElementById('deleteLoanModal');
    if (deleteLoanModal) {
        deleteLoanModal.addEventListener('click', function (e) {
            if (e.target === this) closeDeleteLoanModal();
        });
    }

    // Sidebar overlay click (mobile)
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebarOnMobile);
    }

    // Show/hide custom loan type input based on selection
    const loanTypeSelect = document.getElementById('loanTypeSelect');
    const customLoanTypeGroup = document.getElementById('customLoanTypeGroup');
    if (loanTypeSelect && customLoanTypeGroup) {
        loanTypeSelect.addEventListener('change', function () {
            if (loanTypeSelect.value === 'other') {
                customLoanTypeGroup.style.display = '';
            } else {
                customLoanTypeGroup.style.display = 'none';
            }
        });
    }

    // Save loan data when switching away or closing
    window.addEventListener('beforeunload', function () {
        if (currentLoanId) {
            saveLoanSpecificData(currentLoanId);
        }
    });
}

/**
 * Override the existing saveData function to save with loan ID
 */
const originalSaveData = typeof saveData !== 'undefined' ? saveData : null;
function saveData() {
    if (!currentLoanId) {
        alert('Please create or select a loan first.');
        return;
    }

    if (!validateAllInputs()) {
        alert('Please fix validation errors before saving.');
        return;
    }

    saveLoanSpecificData(currentLoanId);

    hasUnsavedChanges = false;
    updateUnsavedIndicator();
    showSaveStatus();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}