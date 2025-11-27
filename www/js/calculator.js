// EMI Calculation and validation functions
function calculateEMI(principal, annualRate, tenureMonths) {
    if (!principal || !annualRate || !tenureMonths) return 0;

    const monthlyRate = (annualRate / 100) / 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return Math.round(emi);
}

function autoCalculateEMI() {
    const loanAmountInput = document.getElementById('loanAmountInput');
    const rateInput = document.getElementById('rateInput');
    const tenureInput = document.getElementById('tenureInput');

    // Only auto-calculate if all inputs are valid
    if (loanAmountInput.classList.contains('error') ||
        rateInput.classList.contains('error') ||
        tenureInput.classList.contains('error')) {
        return;
    }

    const loanAmount = parseFloat(loanAmountInput.value) || 0;
    const annualRate = parseFloat(rateInput.value) || 0;
    const tenure = parseInt(tenureInput.value) || 0;

    if (loanAmount > 0 && annualRate > 0 && tenure > 0) {
        const emi = calculateEMI(loanAmount, annualRate, tenure);
        if (emi > 0) {
            document.getElementById('emiInput').value = emi;
            document.getElementById('emiInput').classList.add('auto-calculated');
            document.getElementById('emiAutoCalcIndicator').classList.add('show');
            isEMIAutoCalculated = true;
        }
    }
}

function resetAutoEMI() {
    document.getElementById('emiInput').classList.remove('auto-calculated');
    document.getElementById('emiAutoCalcIndicator').classList.remove('show');
    isEMIAutoCalculated = false;
}

// Check if value is a valid positive integer (only digits, no other characters)
function isValidPositiveInteger(value) {
    // Must contain only digits (0-9), nothing else
    const regex = /^[0-9]+$/;
    if (!regex.test(value)) return false;

    // Must be a positive number (greater than 0)
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) return false;

    return true;
}

// Check if value is a valid positive decimal (digits and optional single decimal point)
function isValidPositiveDecimal(value) {
    // Must contain only digits and at most one decimal point
    const regex = /^[0-9]*\.?[0-9]+$/;
    if (!regex.test(value)) return false;

    // Must be a positive number (greater than 0)
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return false;

    return true;
}

// Validate positive integer (for Loan Amount, Tenure, EMI)
function validatePositiveInteger(input, errorElement) {
    const value = input.value.trim();

    // Check if empty
    if (value === '') {
        input.classList.remove('error');
        errorElement.classList.remove('show');
        return true;
    }

    // Check if valid positive integer
    if (!isValidPositiveInteger(value)) {
        input.classList.add('error');
        errorElement.classList.add('show');

        // Determine the specific error message
        if (/[^0-9]/.test(value)) {
            errorElement.textContent = 'Only numbers are allowed. No special characters or symbols.';
        } else {
            errorElement.textContent = 'Please enter a positive integer only';
        }
        return false;
    }

    input.classList.remove('error');
    errorElement.classList.remove('show');
    return true;
}

// Validate positive decimal (for Interest Rate)
function validatePositiveDecimal(input, errorElement) {
    const value = input.value.trim();

    // Check if empty
    if (value === '') {
        input.classList.remove('error');
        errorElement.classList.remove('show');
        return true;
    }

    // Check if valid positive decimal
    if (!isValidPositiveDecimal(value)) {
        input.classList.add('error');
        errorElement.classList.add('show');

        // Determine the specific error message
        if (/[^0-9.]/.test(value)) {
            errorElement.textContent = 'Only numbers are allowed. No special characters or symbols.';
        } else if ((value.match(/\./g) || []).length > 1) {
            errorElement.textContent = 'Only one decimal point is allowed.';
        } else {
            errorElement.textContent = 'Please enter a positive number (e.g., 8.55 or 12.345)';
        }
        return false;
    }

    input.classList.remove('error');
    errorElement.classList.remove('show');
    return true;
}

// Legacy function for backward compatibility
function validatePositiveNumber(input, errorElement, requireInteger = false, isRate = false) {
    if (isRate || !requireInteger) {
        return validatePositiveDecimal(input, errorElement);
    } else {
        return validatePositiveInteger(input, errorElement);
    }
}

function validateTableRateInput(input) {
    const value = input.value.trim();

    // Check if empty
    if (value === '') {
        input.classList.remove('error');
        return true;
    }

    // Check if valid positive decimal
    if (!isValidPositiveDecimal(value)) {
        input.classList.add('error');
        return false;
    }

    input.classList.remove('error');
    return true;
}

function validateAllInputs() {
    const loanAmountInput = document.getElementById('loanAmountInput');
    const rateInput = document.getElementById('rateInput');
    const tenureInput = document.getElementById('tenureInput');
    const emiInput = document.getElementById('emiInput');

    const loanAmountError = document.getElementById('loanAmountError');
    const rateInputError = document.getElementById('rateInputError');
    const tenureInputError = document.getElementById('tenureInputError');
    const emiInputError = document.getElementById('emiInputError');

    // Validate each field with appropriate validation type
    const loanValid = validatePositiveInteger(loanAmountInput, loanAmountError);
    const rateValid = validatePositiveDecimal(rateInput, rateInputError);
    const tenureValid = validatePositiveInteger(tenureInput, tenureInputError);
    const emiValid = validatePositiveInteger(emiInput, emiInputError);

    // Check if all required fields have values
    const loanHasValue = loanAmountInput.value.trim() !== '';
    const rateHasValue = rateInput.value.trim() !== '';
    const tenureHasValue = tenureInput.value.trim() !== '';
    const emiHasValue = emiInput.value.trim() !== '';

    // Enable/disable generate button based on validation AND having values
    const generateBtn = document.getElementById('generateTableBtn');
    const allValid = loanValid && rateValid && tenureValid && emiValid;
    const allHaveValues = loanHasValue && rateHasValue && tenureHasValue && emiHasValue;

    if (allValid && allHaveValues) {
        generateBtn.disabled = false;
    } else {
        generateBtn.disabled = true;
    }

    return allValid;
}

function validatePrepaymentAmount() {
    const amountInput = document.getElementById('newPrepaymentAmount');
    const value = amountInput.value.trim();

    if (value === '' || !isValidPositiveInteger(value)) {
        amountInput.classList.add('error');
        return false;
    }

    amountInput.classList.remove('error');
    return true;
}

function validateChargesAmount() {
    const amountInput = document.getElementById('newChargesAmount');
    const value = amountInput.value.trim();

    if (value === '' || !isValidPositiveInteger(value)) {
        amountInput.classList.add('error');
        return false;
    }

    amountInput.classList.remove('error');
    return true;
}

// NEW: Payment Details Page Functions (for the main button)
function showPaymentDetailsPage() {
    // Hide other sections
    document.getElementById('amortizationTableContainer').style.display = 'none';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('prepaymentDetailsPage').style.display = 'none';
    document.getElementById('chargesDetailsPage').style.display = 'none';

    // Show payment details page
    document.getElementById('paymentDetailsPage').style.display = 'block';

    // Populate payment details
    populatePaymentDetails();
}

function hidePaymentDetailsPage() {
    // Hide payment details page
    document.getElementById('paymentDetailsPage').style.display = 'none';

    // Show main sections
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('amortizationTableContainer').style.display = 'block';
}

function populatePaymentDetails() {
    const paymentDetailsBody = document.getElementById('paymentDetailsBody');
    paymentDetailsBody.innerHTML = '';

    let hasData = false;
    let totalPrepaymentAmount = 0;
    let totalPrepaymentMonths = 0;
    let totalChargesAmount = 0;
    let totalChargesMonths = 0;

    // Iterate through all months
    for (let month = 1; month <= allTableRows.length; month++) {
        const hasPrepayments = prepaymentsData[month] && prepaymentsData[month].length > 0;
        const hasCharges = chargesData[month] && chargesData[month].length > 0;

        // Only show months that have either prepayments or charges
        if (hasPrepayments || hasCharges) {
            hasData = true;

            // Count months
            if (hasPrepayments) totalPrepaymentMonths++;
            if (hasCharges) totalChargesMonths++;

            // Get the maximum number of entries for this month (prepayments or charges)
            const maxEntries = Math.max(
                hasPrepayments ? prepaymentsData[month].length : 0,
                hasCharges ? chargesData[month].length : 0
            );

            // Create rows for each entry
            for (let i = 0; i < maxEntries; i++) {
                const newRow = document.createElement('tr');

                // Get prepayment data for this entry (if exists)
                const prepayment = hasPrepayments && i < prepaymentsData[month].length
                    ? prepaymentsData[month][i]
                    : null;

                // Get charges data for this entry (if exists)
                const charge = hasCharges && i < chargesData[month].length
                    ? chargesData[month][i]
                    : null;

                // Add to totals
                if (prepayment) totalPrepaymentAmount += prepayment.amount;
                if (charge) totalChargesAmount += charge.amount;

                // Format display values
                const prepaymentDisplay = prepayment
                    ? '₹' + formatIndianNumber(prepayment.amount.toFixed(2))
                    : '-';
                const prepaymentDateDisplay = prepayment && prepayment.date ? formatDateToDDMMYYYY(prepayment.date) : '-';
                const prepaymentDescriptionDisplay = prepayment && prepayment.description
                    ? prepayment.description
                    : '-';
                const chargeDisplay = charge
                    ? '₹' + formatIndianNumber(charge.amount.toFixed(2))
                    : '-';
                const chargeDateDisplay = charge && charge.date ? formatDateToDDMMYYYY(charge.date) : '-';
                const chargeDescriptionDisplay = charge && charge.description
                    ? charge.description
                    : '-';

                // Determine if this is the first row for this month
                const isFirstRow = i === 0;
                const monthDisplay = isFirstRow ? month : '';

                newRow.innerHTML = `
                            <td>${monthDisplay}</td>
                            <td style="color: #f39c12; font-weight: 700;">${prepaymentDisplay}</td>
                            <td>${prepaymentDateDisplay}</td>
                            <td>${prepaymentDescriptionDisplay}</td>
                            <td style="color: #9b59b6; font-weight: 700;">${chargeDisplay}</td>
                            <td>${chargeDateDisplay}</td>
                            <td>${chargeDescriptionDisplay}</td>
                        `;

                paymentDetailsBody.appendChild(newRow);
            }
        }
    }

    // Update summary totals
    document.getElementById('paymentPrepaymentTotalAmount').textContent = '₹' + formatIndianNumber(totalPrepaymentAmount.toFixed(2));
    document.getElementById('paymentPrepaymentTotalMonths').textContent = totalPrepaymentMonths;
    document.getElementById('paymentChargesTotalAmount').textContent = '₹' + formatIndianNumber(totalChargesAmount.toFixed(2));
    document.getElementById('paymentChargesTotalMonths').textContent = totalChargesMonths;

    // If no data, show message
    if (!hasData) {
        paymentDetailsBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                            No payment details recorded yet.
                        </td>
                    </tr>
                `;
    }
}



// KEEP: Prepayment Details Page Functions (for Prepayment Months link)
function showPrepaymentDetailsPage() {
    // Hide other sections
    document.getElementById('amortizationTableContainer').style.display = 'none';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('paymentDetailsPage').style.display = 'none';
    document.getElementById('chargesDetailsPage').style.display = 'none';

    // Show prepayment details page
    document.getElementById('prepaymentDetailsPage').style.display = 'block';

    // Populate prepayment details
    populatePrepaymentDetails();
}

function hidePrepaymentDetailsPage() {
    // Hide prepayment details page
    document.getElementById('prepaymentDetailsPage').style.display = 'none';

    // Show main sections
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('amortizationTableContainer').style.display = 'block';
}

function populatePrepaymentDetails() {
    const prepaymentDetailsBody = document.getElementById('prepaymentDetailsBody');
    prepaymentDetailsBody.innerHTML = '';

    let hasData = false;
    let totalPrepaymentAmount = 0;
    let totalMonths = 0;

    // Iterate through all months
    for (let month = 1; month <= allTableRows.length; month++) {
        if (prepaymentsData[month] && prepaymentsData[month].length > 0) {
            hasData = true;
            totalMonths++;

            prepaymentsData[month].forEach((prepayment, index) => {
                totalPrepaymentAmount += prepayment.amount;

                const newRow = document.createElement('tr');

                // Format prepayment amount
                const prepaymentDisplay = '₹' + formatIndianNumber(prepayment.amount.toFixed(2));
                const prepaymentDateDisplay = prepayment.date ? formatDateToDDMMYYYY(prepayment.date) : '-';
                const prepaymentDescriptionDisplay = prepayment.description || '-';
                const prepaymentNumber = index + 1;

                newRow.innerHTML = `
                            <td>${month} (Payment ${prepaymentNumber})</td>
                            <td style="color: #f39c12; font-weight: 700;">${prepaymentDisplay}</td>
                            <td>${prepaymentDateDisplay}</td>
                            <td>${prepaymentDescriptionDisplay}</td>
                        `;

                prepaymentDetailsBody.appendChild(newRow);
            });
        }
    }

    // Update summary totals
    document.getElementById('prepaymentTotalAmount').textContent = '₹' + formatIndianNumber(totalPrepaymentAmount.toFixed(2));
    document.getElementById('prepaymentTotalMonths').textContent = totalMonths;

    // If no prepayments, show message
    if (!hasData) {
        prepaymentDetailsBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                            No prepayments recorded yet.
                        </td>
                    </tr>
                `;
    }
}

// KEEP: Charges Details Page Functions (for Other Charges Months link)
function showChargesDetailsPage() {
    // Hide other sections
    document.getElementById('amortizationTableContainer').style.display = 'none';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('paymentDetailsPage').style.display = 'none';
    document.getElementById('prepaymentDetailsPage').style.display = 'none';

    // Show charges details page
    document.getElementById('chargesDetailsPage').style.display = 'block';

    // Populate charges details
    populateChargesDetails();
}

function hideChargesDetailsPage() {
    // Hide charges details page
    document.getElementById('chargesDetailsPage').style.display = 'none';

    // Show main sections
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('amortizationTableContainer').style.display = 'block';
}

function populateChargesDetails() {
    const chargesDetailsBody = document.getElementById('chargesDetailsBody');
    chargesDetailsBody.innerHTML = '';

    let hasData = false;
    let totalChargesAmount = 0;
    let totalMonths = 0;

    // Iterate through all months
    for (let month = 1; month <= allTableRows.length; month++) {
        if (chargesData[month] && chargesData[month].length > 0) {
            hasData = true;
            totalMonths++;

            chargesData[month].forEach((charge, index) => {
                totalChargesAmount += charge.amount;

                const newRow = document.createElement('tr');

                // Format charge amount
                const chargeDisplay = '₹' + formatIndianNumber(charge.amount.toFixed(2));
                const chargeDateDisplay = charge.date ? formatDateToDDMMYYYY(charge.date) : '-';
                const chargeDescriptionDisplay = charge.description || '-';
                const chargeNumber = index + 1;

                newRow.innerHTML = `
                            <td>${month} (Payment ${chargeNumber})</td>
                            <td style="color: #9b59b6; font-weight: 700;">${chargeDisplay}</td>
                            <td>${chargeDateDisplay}</td>
                            <td>${chargeDescriptionDisplay}</td>
                        `;

                chargesDetailsBody.appendChild(newRow);
            });
        }
    }

    // Update summary totals
    document.getElementById('chargesTotalAmount').textContent = '₹' + formatIndianNumber(totalChargesAmount.toFixed(2));
    document.getElementById('chargesTotalMonths').textContent = totalMonths;

    // If no charges, show message
    if (!hasData) {
        chargesDetailsBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                            No other charges recorded yet.
                        </td>
                    </tr>
                `;
    }
}

// Load prepayments and charges data when the page loads
loadPrepaymentsData();
loadChargesData();
loadSavedData();