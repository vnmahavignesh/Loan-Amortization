// Enhanced table-manager.js - Table generation with year accordions for "All Years" view

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

        const totalPrepayment = getTotalPrepaymentForMonth(month);
        const prepaymentCount = getPrepaymentCountForMonth(month);
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

        if (totalPrepayment > 0) {
            const manageBtn = row.querySelector('.manage-prepayments-btn');
            manageBtn.classList.add('has-prepayments');
        }

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

    const mainTableHeader = document.querySelector('#amortizationTable thead');

    if (mainTableHeader) mainTableHeader.style.display = 'none';

    // Show with year accordions by default
    renderTableWithYearAccordions();

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
        // Hide main table header for All Years view
        const mainTableHeader = document.querySelector('#amortizationTable thead');
        if (mainTableHeader) mainTableHeader.style.display = 'none';

        // Show all years with accordion view
        renderTableWithYearAccordions();
        yearSummary.classList.remove('show');
    } else {
        // Show main table header for single year view
        const mainTableHeader = document.querySelector('#amortizationTable thead');
        if (mainTableHeader) mainTableHeader.style.display = '';
        // Show specific year with table header
        const year = parseInt(selectedYear);
        const startMonth = (year - 1) * 12 + 1;
        const endMonth = Math.min(year * 12, allTableRows.length);

        // Do not add extra table header; main table header is already present

        allTableRows.forEach(row => {
            const month = parseInt(row.dataset.month);
            if (month >= startMonth && month <= endMonth) {
                row.style.display = '';
                tableBody.appendChild(row);
            } else {
                row.style.display = 'none';
            }
        });

        calculateYearTotals(selectedYear);
        yearSummary.classList.add('show');

        setTimeout(() => {
            initializeYearSummaryAccordion();
        }, 100);
    }
}

/**
 * NEW: Render table with year accordion headers
 */
function renderTableWithYearAccordions() {
    const tableBody = document.querySelector('#amortizationTable tbody');
    tableBody.innerHTML = '';

    const totalYears = Math.ceil(allTableRows.length / 12);

    for (let year = 1; year <= totalYears; year++) {
        const startMonth = (year - 1) * 12 + 1;
        const endMonth = Math.min(year * 12, allTableRows.length);

        // Calculate year totals
        const yearTotals = calculateYearTotalsForAccordion(startMonth, endMonth);

        // Create year header row (accordion header)
        const yearHeaderRow = createYearAccordionHeader(year, yearTotals);
        tableBody.appendChild(yearHeaderRow);

        // Add table header for this year (will be hidden/shown with accordion)
        const yearTableHeaderRow = createYearTableHeaderRow();
        yearTableHeaderRow.classList.add('year-content-row');
        yearTableHeaderRow.dataset.year = year;
        tableBody.appendChild(yearTableHeaderRow);

        // Add all months for this year
        allTableRows.forEach(row => {
            const month = parseInt(row.dataset.month);
            if (month >= startMonth && month <= endMonth) {
                row.classList.add('year-content-row');
                row.dataset.year = year;
                tableBody.appendChild(row);
            }
        });
    }

    // Initialize accordion functionality
    initializeYearAccordions();
}

// Helper: Create table header row for each year
function createYearTableHeaderRow() {
    const headerRow = document.createElement('tr');
    headerRow.className = 'year-table-header-row';
    headerRow.innerHTML = `        
        <th style="text-align:center;">EMI Paid</th>
        <th style="text-align:center;">Month</th>
        <th style="text-align:right;padding-right:12px;">Opening Balance</th>
        <th style="text-align:center;">Rate (%)</th>
        <th style="text-align:right;padding-right:12px;">Interest</th>
        <th style="text-align:right;padding-right:12px;">Principal</th>
        <th style="text-align:right;padding-right:12px;">EMI</th>
        <th style="text-align:center;">Prepayment</th>
        <th style="text-align:center;">Charges</th>
        <th style="text-align:right;padding-right:12px;">Closing Balance</th>
    `;
    return headerRow;
}

/**
 * NEW: Create year accordion header row
 */
function createYearAccordionHeader(year, totals) {
    const headerRow = document.createElement('tr');
    headerRow.className = 'year-accordion-header';
    headerRow.dataset.year = year;

    headerRow.innerHTML = `
        <td colspan="10" style="cursor: pointer; user-select: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    <svg class="year-accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s;">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                    <span style="font-size: 1.1em; font-weight: 700;">📅 Year ${year}</span>
                </div>
                <div style="display: flex; gap: 25px; font-size: 0.9em;">
                    <span>💰 Principal: ₹${formatIndianNumber(totals.principal.toFixed(2))}</span>
                    <span>📈 Interest: ₹${formatIndianNumber(totals.interest.toFixed(2))}</span>
                    <span>💵 Pre-payments: ₹${formatIndianNumber(totals.prepayments.toFixed(2))}</span>
                    <span>📊 Charges: ₹${formatIndianNumber(totals.charges.toFixed(2))}</span>
                    <span>💼 Closing: ₹${formatIndianNumber(totals.closing.toFixed(2))}</span>
                </div>
            </div>
        </td>
    `;

    return headerRow;
}

/**
 * NEW: Calculate year totals for accordion display
 */
function calculateYearTotalsForAccordion(startMonth, endMonth) {
    let principal = 0;
    let interest = 0;
    let prepayments = 0;
    let charges = 0;
    let closing = 0;

    allTableRows.forEach(row => {
        const month = parseInt(row.dataset.month);
        if (month >= startMonth && month <= endMonth) {
            principal += parseFloat(row.querySelector('.principal').textContent.replace(/,/g, '')) || 0;
            interest += parseFloat(row.querySelector('.interest').textContent.replace(/,/g, '')) || 0;
            prepayments += getTotalPrepaymentForMonth(month);
            charges += getTotalChargesForMonth(month);

            if (month === endMonth) {
                closing = parseFloat(row.querySelector('.closing').textContent.replace(/,/g, '')) || 0;
            }
        }
    });

    return { principal, interest, prepayments, charges, closing };
}

/**
 * NEW: Initialize year accordion functionality
 */
function initializeYearAccordions() {
    const headers = document.querySelectorAll('.year-accordion-header');

    headers.forEach(header => {
        const year = header.dataset.year;

        // Check saved state
        const savedState = localStorage.getItem(`yearAccordion_${year}`);
        const isExpanded = savedState === null ? true : savedState === 'expanded';

        // Set initial state
        if (isExpanded) {
            expandYearAccordion(year);
        } else {
            collapseYearAccordion(year);
        }

        // Add click handler
        header.addEventListener('click', function () {
            toggleYearAccordion(year);
        });

        // Add keyboard support
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleYearAccordion(year);
            }
        });
    });
}

/**
 * NEW: Toggle year accordion
 */
function toggleYearAccordion(year) {
    const header = document.querySelector(`.year-accordion-header[data-year="${year}"]`);
    const icon = header.querySelector('.year-accordion-icon');
    const contentRows = document.querySelectorAll(`.year-content-row[data-year="${year}"]`);

    const isExpanded = icon.style.transform === 'rotate(180deg)';

    if (isExpanded) {
        collapseYearAccordion(year);
    } else {
        expandYearAccordion(year);
    }
}

/**
 * NEW: Expand year accordion
 */
function expandYearAccordion(year) {
    const header = document.querySelector(`.year-accordion-header[data-year="${year}"]`);
    const icon = header.querySelector('.year-accordion-icon');
    const contentRows = document.querySelectorAll(`.year-content-row[data-year="${year}"]`);

    icon.style.transform = 'rotate(180deg)';
    contentRows.forEach(row => {
        row.style.display = '';
    });

    localStorage.setItem(`yearAccordion_${year}`, 'expanded');
}

/**
 * NEW: Collapse year accordion
 */
function collapseYearAccordion(year) {
    const header = document.querySelector(`.year-accordion-header[data-year="${year}"]`);
    const icon = header.querySelector('.year-accordion-icon');
    const contentRows = document.querySelectorAll(`.year-content-row[data-year="${year}"]`);

    icon.style.transform = 'rotate(0deg)';
    contentRows.forEach(row => {
        row.style.display = 'none';
    });

    localStorage.setItem(`yearAccordion_${year}`, 'collapsed');
}

/**
 * NEW: Expand all year accordions
 */
function expandAllYearAccordions() {
    const headers = document.querySelectorAll('.year-accordion-header');
    headers.forEach(header => {
        const year = header.dataset.year;
        expandYearAccordion(year);
    });
}

/**
 * NEW: Collapse all year accordions
 */
function collapseAllYearAccordions() {
    const headers = document.querySelectorAll('.year-accordion-header');
    headers.forEach(header => {
        const year = header.dataset.year;
        collapseYearAccordion(year);
    });
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
            const principal = parseFloat(row.querySelector('.principal').textContent.replace(/,/g, '')) || 0;
            const interest = parseFloat(row.querySelector('.interest').textContent.replace(/,/g, '')) || 0;
            const prepayment = getTotalPrepaymentForMonth(month);
            const charges = getTotalChargesForMonth(month);

            yearPrincipalPaid += principal;
            yearInterestPaid += interest;
            yearPrepayments += prepayment;
            yearCharges += charges;

            if (month === endMonth) {
                yearClosingBalance = parseFloat(row.querySelector('.closing').textContent.replace(/,/g, '')) || 0;
            }
        }
    });

    document.getElementById('yearSummaryTitle').textContent = `Year ${year} Summary`;
    document.getElementById('yearPrincipalPaid').textContent = '₹' + formatIndianNumber(yearPrincipalPaid.toFixed(2));
    document.getElementById('yearInterestPaid').textContent = '₹' + formatIndianNumber(yearInterestPaid.toFixed(2));
    document.getElementById('yearPrepayments').textContent = '₹' + formatIndianNumber(yearPrepayments.toFixed(2));
    document.getElementById('yearCharges').textContent = '₹' + formatIndianNumber(yearCharges.toFixed(2));
    document.getElementById('yearClosingBalance').textContent = '₹' + formatIndianNumber(yearClosingBalance.toFixed(2));
}