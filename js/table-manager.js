// Table generation and management functions
function generateTable() {
    if (!validateAllInputs()) {
        alert('Please fix validation errors before generating the table.');
        return;
    }

    const loanAmount = parseFloat(document.getElementById('loanAmountInput').value) || 0;
    const annualRate = parseFloat(document.getElementById('rateInput').value) || 0;
    const tenure = parseInt(document.getElementById('tenureInput').value) || 0;
    const emi = parseFloat(document.getElementById('emiInput').value) || 0;

    let openingBalance = loanAmount;
    let totalInterest = 0;
    const tableBody = document.querySelector('#amortizationTable tbody');
    tableBody.innerHTML = '';
    allTableRows = [];

    for (let month = 1; month <= tenure; month++) {
        const monthlyRate = (annualRate) / 100;
        const interest = openingBalance * (monthlyRate / 12);
        const principal = emi - interest;
        const closingBalance = openingBalance - principal;

        totalInterest += interest;

        // Get total prepayment for this month
        const totalPrepayment = getTotalPrepaymentForMonth(month);
        const prepaymentCount = getPrepaymentCountForMonth(month);

        // Get total charges for this month
        const totalCharges = getTotalChargesForMonth(month);
        const chargesCount = getChargesCountForMonth(month);

        const row = document.createElement('tr');
        row.dataset.month = month;

        row.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" style="margin: auto;"></td>
        <td style="text-align:center;">${month}</td>
        <td class="opening" style="text-align:right;padding-right:12px;">${formatIndianNumber(openingBalance.toFixed(2))}</td>
        <td style="text-align:center;">
            <input type="number" step="0.01" class="rate-input" style="width: 80px;" value="${annualRate.toFixed(2)}" min="0.01">
        </td>
        <td class="interest" style="text-align:right;padding-right:12px;">${formatIndianNumber(interest.toFixed(2))}</td>
        <td class="principal" style="text-align:right;padding-right:12px;">${formatIndianNumber(principal.toFixed(2))}</td>
        <td class="emi" style="text-align:right;padding-right:12px;">${formatIndianNumber(emi.toFixed(2))}</td>
        <td style="text-align:center;">
            <button type="button" class="manage-prepayments-btn" onclick="showPrepaymentManager(${month})" style="width: 100%;">
                ${totalPrepayment > 0 ? `₹${formatIndianNumber(totalPrepayment.toFixed(2))} (${prepaymentCount})` : `Add Prepayment`}
            </button>
        </td>
        <td style="text-align:center;">
            <button type="button" class="manage-charges-btn" onclick="showChargesManager(${month})" style="width: 100%;">
                ${totalCharges > 0 ? `₹${formatIndianNumber(totalCharges.toFixed(2))} (${chargesCount})` : `Add Charges`}
            </button>
        </td>
        <td class="closing" style="text-align:right;padding-right:12px;">${formatIndianNumber(closingBalance.toFixed(2))}</td>
    `;
        allTableRows.push(row);
        tableBody.appendChild(row);

        // Update the prepayment button styling
        if (totalPrepayment > 0) {
            const manageBtn = row.querySelector('.manage-prepayments-btn');
            manageBtn.classList.add('has-prepayments');
        }

        // Update the charges button styling
        if (totalCharges > 0) {
            const manageBtn = row.querySelector('.manage-charges-btn');
            manageBtn.classList.add('has-charges');
        }

        openingBalance = closingBalance;
    }

    const totalAmount = loanAmount + totalInterest;
    document.getElementById('summaryLoanAmount').textContent = '₹' + formatIndianNumber(loanAmount.toFixed(2));
    document.getElementById('summaryTenure').textContent = formatTenureWithMonths(tenure);
    document.getElementById('summaryTotalInterest').textContent = '₹' + formatIndianNumber(totalInterest.toFixed(2));
    document.getElementById('summaryTotalAmount').textContent = '₹' + formatIndianNumber(totalAmount.toFixed(2));
    document.getElementById('summarySection').style.display = 'block';

    createYearDropdown(tenure);
    attachRowListeners();
    document.getElementById('amortizationTableContainer').style.display = 'block';

    updateSavingsSummary();

    markAsUnsaved();
}

function recomputeTable() {
    const loanAmount = parseFloat(document.getElementById('loanAmountInput').value) || 0;
    const globalAnnualRate = parseFloat(document.getElementById('rateInput').value) || 0;
    const emi = parseFloat(document.getElementById('emiInput').value) || 0;

    let openingBalance = loanAmount;

    allTableRows.forEach(row => {
        const month = parseInt(row.dataset.month);
        const rateInput = row.querySelector('.rate-input');

        const annualRate = parseFloat(rateInput.value);
        const usedAnnualRate = isNaN(annualRate) ? globalAnnualRate : annualRate;
        const monthlyRate = (usedAnnualRate / 100) / 12;

        const interest = openingBalance * monthlyRate;
        let principal = emi - interest;
        if (principal < 0) principal = 0;

        const prepayment = getTotalPrepaymentForMonth(month);
        const otherCharges = getTotalChargesForMonth(month);

        let closingBalance = openingBalance - principal - prepayment + otherCharges;
        if (closingBalance < 0) closingBalance = 0;

        row.querySelector('.opening').textContent = formatIndianNumber(openingBalance.toFixed(2));
        row.querySelector('.interest').textContent = formatIndianNumber(interest.toFixed(2));
        row.querySelector('.principal').textContent = formatIndianNumber(principal.toFixed(2));
        row.querySelector('.emi').textContent = formatIndianNumber((interest + principal).toFixed(2));
        row.querySelector('.closing').textContent = formatIndianNumber(closingBalance.toFixed(2));

        openingBalance = closingBalance;
    });

    updateSavingsSummary();

    // Recalculate year totals if a specific year is selected
    const selectedYear = document.getElementById('yearFilterSelect').value;
    if (selectedYear !== 'all') {
        calculateYearTotals(selectedYear);
    }
}

function attachRowListeners() {
    allTableRows.forEach(row => {
        const inputs = row.querySelectorAll('.rate-input');
        inputs.forEach(input => {
            input.removeEventListener('input', handleTableChange);
            input.addEventListener('input', function () {
                if (!validateTableRateInput(this)) {
                    alert('Please enter a valid positive number for interest rate.');
                    return;
                }
                handleTableChange();
            });
        });

        const checkbox = row.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        checkbox.onchange = function () {
            markAsUnsaved();
            toggleRowHighlight(row, checkbox.checked);
            updateSavingsSummary();

            // Recalculate year totals if a specific year is selected
            const selectedYear = document.getElementById('yearFilterSelect').value;
            if (selectedYear !== 'all') {
                calculateYearTotals(selectedYear);
            }
        };

        toggleRowHighlight(row, checkbox.checked);
    });
}

function handleTableChange() {
    markAsUnsaved();
    recomputeTable();
}

function toggleRowHighlight(row, checked) {
    if (checked) {
        row.classList.add('paid-row');
    } else {
        row.classList.remove('paid-row');
    }
}

// Year filtering functions
function createYearDropdown(tenure) {
    const yearFilterSelect = document.getElementById('yearFilterSelect');
    yearFilterSelect.innerHTML = '<option value="all">All Years</option>';

    const totalYears = Math.ceil(tenure / 12);

    for (let year = 1; year <= totalYears; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `Year ${year}`;
        yearFilterSelect.appendChild(option);
    }

    document.getElementById('yearFilterContainer').style.display = 'flex';
}

function filterByYear() {
    const selectedYear = document.getElementById('yearFilterSelect').value;
    const tableBody = document.querySelector('#amortizationTable tbody');
    const yearSummary = document.getElementById('yearSummary');

    tableBody.innerHTML = '';

    if (selectedYear === 'all') {
        allTableRows.forEach(row => {
            tableBody.appendChild(row);
        });
        yearSummary.classList.remove('show');
    } else {
        const year = parseInt(selectedYear);
        const startMonth = (year - 1) * 12 + 1;
        const endMonth = Math.min(year * 12, allTableRows.length);

        allTableRows.forEach(row => {
            const month = parseInt(row.dataset.month);
            if (month >= startMonth && month <= endMonth) {
                tableBody.appendChild(row);
            }
        });

        // Calculate and display year totals
        calculateYearTotals(selectedYear);
        yearSummary.classList.add('show');
    }
}

function calculateYearTotals(selectedYear) {
    const year = parseInt(selectedYear);
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = Math.min(year * 12, allTableRows.length);

    let yearPrincipalPaid = 0;
    let yearInterestPaid = 0;
    let yearPrepayments = 0;
    let yearCharges = 0;
    let yearClosingBalance = 0;

    allTableRows.forEach(row => {
        const month = parseInt(row.dataset.month);
        if (month >= startMonth && month <= endMonth) {
            // Calculate year totals
            const principal = parseFloat(row.querySelector('.principal').textContent.replace(/,/g, '')) || 0;
            const interest = parseFloat(row.querySelector('.interest').textContent.replace(/,/g, '')) || 0;
            const prepayment = getTotalPrepaymentForMonth(month);
            const charges = getTotalChargesForMonth(month);

            yearPrincipalPaid += principal;
            yearInterestPaid += interest;
            yearPrepayments += prepayment;
            yearCharges += charges;

            // Get closing balance from the last month of the year
            if (month === endMonth) {
                yearClosingBalance = parseFloat(row.querySelector('.closing').textContent.replace(/,/g, '')) || 0;
            }
        }
    });

    // Update year summary
    document.getElementById('yearSummaryTitle').textContent = `Year ${year} Summary`;
    document.getElementById('yearPrincipalPaid').textContent = '₹' + formatIndianNumber(yearPrincipalPaid.toFixed(2));
    document.getElementById('yearInterestPaid').textContent = '₹' + formatIndianNumber(yearInterestPaid.toFixed(2));
    document.getElementById('yearPrepayments').textContent = '₹' + formatIndianNumber(yearPrepayments.toFixed(2));
    document.getElementById('yearCharges').textContent = '₹' + formatIndianNumber(yearCharges.toFixed(2));
    document.getElementById('yearClosingBalance').textContent = '₹' + formatIndianNumber(yearClosingBalance.toFixed(2));
}