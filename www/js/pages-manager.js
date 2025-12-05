// Page navigation and details management
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