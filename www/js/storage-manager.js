// Local storage management functions
function loadPrepaymentsData() {
    const saved = localStorage.getItem('loanPrepaymentsData_T1');
    if (saved) {
        prepaymentsData = JSON.parse(saved);
    }
}

function loadChargesData() {
    const saved = localStorage.getItem('loanChargesData_T1');
    if (saved) {
        chargesData = JSON.parse(saved);
    }
}

function savePrepaymentsData() {
    localStorage.setItem('loanPrepaymentsData_T1', JSON.stringify(prepaymentsData));
}

function saveChargesData() {
    localStorage.setItem('loanChargesData_T1', JSON.stringify(chargesData));
}

function loadSavedData() {
    const savedTableData = localStorage.getItem('loanTableData_T1');
    const savedLoanParams = localStorage.getItem('loanParameters_T1');

    if (savedLoanParams) {
        const params = JSON.parse(savedLoanParams);
        document.getElementById('loanAmountInput').value = params.loan;
        document.getElementById('rateInput').value = params.rate;
        document.getElementById('tenureInput').value = params.tenure;
        document.getElementById('emiInput').value = params.emi;

        // FIXED: Check if EMI was manually entered (isEMIManual flag)
        // Only auto-calculate if EMI was auto-calculated before
        if (params.isEMIManual === false && params.loan && params.rate && params.tenure) {
            autoCalculateEMI();
        } else if (params.isEMIManual === true) {
            // EMI was manually entered, so mark it as such
            document.getElementById('emiInput').classList.remove('auto-calculated');
            document.getElementById('emiAutoCalcIndicator').classList.remove('show');
            isEMIAutoCalculated = false;
        }
    }

    if (savedTableData) {
        const data = JSON.parse(savedTableData);
        restoreTable(data);
    }

    hasUnsavedChanges = false;
    updateUnsavedIndicator();
    validateAllInputs();
}

function saveData() {
    if (!validateAllInputs()) {
        alert('Please fix validation errors before saving.');
        return;
    }

    const loanAmount = parseFloat(document.getElementById('loanAmountInput').value);
    const rate = parseFloat(document.getElementById('rateInput').value);
    const tenure = parseInt(document.getElementById('tenureInput').value);
    const emi = parseFloat(document.getElementById('emiInput').value);

    // FIXED: Save whether EMI was manually entered or auto-calculated
    localStorage.setItem('loanParameters_T1', JSON.stringify({
        loan: loanAmount,
        rate: rate,
        tenure: tenure,
        emi: emi,
        isEMIManual: !isEMIAutoCalculated  // Save the EMI entry mode
    }));

    const tableBody = document.querySelector('#amortizationTable tbody');
    if (tableBody.children.length > 0) {
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
        localStorage.setItem('loanTableData_T1', JSON.stringify(tableData));
    }

    savePrepaymentsData();
    saveChargesData();

    hasUnsavedChanges = false;
    updateUnsavedIndicator();
    showSaveStatus();
}

function restoreTable(data) {
    if (data.length === 0) return;

    const loanAmount = parseFloat(document.getElementById('loanAmountInput').value);
    const tenure = parseInt(document.getElementById('tenureInput').value);
    const emi = parseFloat(document.getElementById('emiInput').value);

    generateTable();

    allTableRows.forEach((row, idx) => {
        const savedRow = data[idx];
        if (savedRow) {
            const rateInput = row.querySelector('.rate-input');
            const checkbox = row.querySelector('input[type="checkbox"]');

            rateInput.value = savedRow.rate;
            checkbox.checked = savedRow.emiPaid;
            toggleRowHighlight(row, checkbox.checked);
        }
    });

    recomputeTable();
    updateSavingsSummary();
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This will reset the amortization table and all inputs.')) {
        localStorage.removeItem('loanTableData_T1');
        localStorage.removeItem('loanParameters_T1');
        localStorage.removeItem('loanPrepaymentsData_T1');
        localStorage.removeItem('loanChargesData_T1');

        // Clear loan parameters and show placeholders
        document.getElementById('loanAmountInput').value = '';
        document.getElementById('rateInput').value = '';
        document.getElementById('tenureInput').value = '';
        document.getElementById('emiInput').value = '';

        document.getElementById('amortizationTableContainer').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('yearFilterContainer').style.display = 'none';
        document.getElementById('yearSummary').classList.remove('show');
        document.getElementById('paymentDetailsPage').style.display = 'none';
        document.getElementById('prepaymentDetailsPage').style.display = 'none';
        document.getElementById('chargesDetailsPage').style.display = 'none';

        document.querySelector('#amortizationTable tbody').innerHTML = '';
        allTableRows = [];
        prepaymentsData = {};
        chargesData = {};

        resetAllSummaryValues();

        hasUnsavedChanges = false;
        updateUnsavedIndicator();
        validateAllInputs();
    }
}

function resetAllSummaryValues() {
    document.getElementById('remainingTenure').textContent = '0';
    document.getElementById('interestSaved').textContent = '₹0.00';
    document.getElementById('totalPrepayment').textContent = '₹0.00';
    document.getElementById('timeSaved').textContent = '0';
    document.getElementById('totalInterestPaid').textContent = '₹0.00';
    document.getElementById('totalPrincipalPaid').textContent = '₹0.00';
    document.getElementById('totalEmiPaid').textContent = '₹0.00';
    document.getElementById('totalOtherCharges').textContent = '₹0.00';
    document.getElementById('prepaymentMonths').textContent = '0';
    document.getElementById('chargesMonths').textContent = '0';
    document.getElementById('newTotalInterest').textContent = '₹0.00';
}

// Format Indian number function
function formatIndianNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';

    const [integerPart, decimalPart] = num.toString().split('.');
    let lastThree = integerPart.substring(integerPart.length - 3);
    let otherNumbers = integerPart.substring(0, integerPart.length - 3);

    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }

    let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    if (decimalPart) {
        formatted += '.' + decimalPart;
    }

    return formatted;
}