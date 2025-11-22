// Main application initialization and global state
let hasUnsavedChanges = false;
let allTableRows = [];
let currentManagingMonth = null;
let prepaymentsData = {};
let chargesData = {};
let isEMIAutoCalculated = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    loadAllData();
    // Initial validation to set button state
    validateAllInputs();
});

function initializeEventListeners() {
    // Loan Amount - positive integers only
    document.getElementById('loanAmountInput').addEventListener('input', function () {
        validatePositiveInteger(this, document.getElementById('loanAmountError'));
        validateAllInputs();
        autoCalculateEMI();
        markAsUnsaved();
    });

    // Interest Rate - positive decimals allowed
    document.getElementById('rateInput').addEventListener('input', function () {
        validatePositiveDecimal(this, document.getElementById('rateInputError'));
        validateAllInputs();
        autoCalculateEMI();
        markAsUnsaved();
    });

    // Total Tenure - positive integers only
    document.getElementById('tenureInput').addEventListener('input', function () {
        validatePositiveInteger(this, document.getElementById('tenureInputError'));
        validateAllInputs();
        autoCalculateEMI();
        markAsUnsaved();
    });

    // Monthly EMI - positive integers only
    document.getElementById('emiInput').addEventListener('input', function () {
        validatePositiveInteger(this, document.getElementById('emiInputError'));
        validateAllInputs();
        resetAutoEMI();
        markAsUnsaved();
    });

    // Prepayment and charges validation
    document.getElementById('newPrepaymentAmount').addEventListener('input', validatePrepaymentAmount);
    document.getElementById('newChargesAmount').addEventListener('input', validateChargesAmount);

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function (e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

function loadAllData() {
    loadPrepaymentsData();
    loadChargesData();
    loadSavedData();
}

function markAsUnsaved() {
    hasUnsavedChanges = true;
    updateUnsavedIndicator();
}

function updateUnsavedIndicator() {
    const indicator = document.getElementById('unsavedIndicator');
    if (hasUnsavedChanges) {
        indicator.classList.add('show');
    } else {
        indicator.classList.remove('show');
    }
}

function showSaveStatus() {
    const status = document.getElementById('saveStatus');
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 3000);
}

// Helper functions
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '-';

    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
}

function formatTenure(months) {
    if (months === 0) return '0';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
        return `${remainingMonths} mth${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
        return `${years} Yr${years !== 1 ? 's' : ''}`;
    } else {
        return `${years} Yr${years !== 1 ? 's' : ''} ${remainingMonths} mth${remainingMonths !== 1 ? 's' : ''}`;
    }
}

function formatTenureWithMonths(months) {
    if (months === 0) return '0';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
        return `${months} mth${months !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
        return `${years} Yr${years !== 1 ? 's' : ''} (${months} mth${months !== 1 ? 's' : ''})`;
    } else {
        return `${years} Yr${years !== 1 ? 's' : ''} ${remainingMonths} mth${remainingMonths !== 1 ? 's' : ''} (${months} mth${months !== 1 ? 's' : ''})`;
    }
}