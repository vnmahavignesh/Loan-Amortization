// Export functions for CSV generation
function exportAmortizationToCSV() {
    if (allTableRows.length === 0) {
        alert('Please generate the amortization table first.');
        return;
    }

    let csv = 'EMI Paid,Month,Opening Balance,Interest Rate (%),Interest,Principal,EMI,Pre-payment,Pre-payment Count,Other Charges,Other Charges Count,Closing Balance\n';

    allTableRows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const month = row.dataset.month;

        // Get raw numeric values without formatting for CSV
        const opening = parseFloat(row.querySelector('.opening').textContent.replace(/,/g, ''));
        const rate = row.querySelector('.rate-input').value;
        const interest = parseFloat(row.querySelector('.interest').textContent.replace(/,/g, ''));
        const principal = parseFloat(row.querySelector('.principal').textContent.replace(/,/g, ''));
        const emi = parseFloat(row.querySelector('.emi').textContent.replace(/,/g, ''));
        const prepayment = getTotalPrepaymentForMonth(month);
        const prepaymentCount = getPrepaymentCountForMonth(month);
        const charges = getTotalChargesForMonth(month);
        const chargesCount = getChargesCountForMonth(month);
        const closing = parseFloat(row.querySelector('.closing').textContent.replace(/,/g, ''));

        const emiPaid = checkbox.checked ? 'Yes' : 'No';

        // Use raw numeric values without formatting
        csv += `${emiPaid},${month},${opening.toFixed(2)},${rate},${interest.toFixed(2)},${principal.toFixed(2)},${emi.toFixed(2)},${prepayment.toFixed(2)},${prepaymentCount},${charges.toFixed(2)},${chargesCount},${closing.toFixed(2)}\n`;
    });

    downloadCSV(csv, 'loan_amortization.csv');
}

function exportPaymentDetailsToCSV() {
    let hasData = false;
    let csv = 'Month,Pre-payment Amount,Pre-payment Date,Pre-payment Description,Other Charges,Other Charges Date,Other Charges Description\n';

    // Iterate through all months
    for (let month = 1; month <= allTableRows.length; month++) {
        const hasPrepayments = prepaymentsData[month] && prepaymentsData[month].length > 0;
        const hasCharges = chargesData[month] && chargesData[month].length > 0;

        // Only export months that have either prepayments or charges
        if (hasPrepayments || hasCharges) {
            hasData = true;

            // Get the maximum number of entries for this month (prepayments or charges)
            const maxEntries = Math.max(
                hasPrepayments ? prepaymentsData[month].length : 0,
                hasCharges ? chargesData[month].length : 0
            );

            // Create CSV rows for each entry
            for (let i = 0; i < maxEntries; i++) {
                // Get prepayment data for this entry (if exists)
                const prepayment = hasPrepayments && i < prepaymentsData[month].length
                    ? prepaymentsData[month][i]
                    : null;

                // Get charges data for this entry (if exists)
                const charge = hasCharges && i < chargesData[month].length
                    ? chargesData[month][i]
                    : null;

                // Format CSV values
                const prepaymentAmount = prepayment ? prepayment.amount.toFixed(2) : '';
                const prepaymentDate = prepayment && prepayment.date ? prepayment.date : '';
                const prepaymentDescription = prepayment && prepayment.description ? prepayment.description : '';
                const chargeAmount = charge ? charge.amount.toFixed(2) : '';
                const chargeDate = charge && charge.date ? charge.date : '';
                const chargeDescription = charge && charge.description ? charge.description : '';

                csv += `${month},${prepaymentAmount},"${prepaymentDate}","${prepaymentDescription}",${chargeAmount},"${chargeDate}","${chargeDescription}"\n`;
            }
        }
    }

    if (!hasData) {
        alert('No payment details to export.');
        return;
    }

    downloadCSV(csv, 'payment_details.csv');
}

function exportPrepaymentDetailsToCSV() {
    let hasData = false;
    let csv = 'Month,Pre-payment Number,Pre-payment Amount,Pre-payment Date,Pre-payment Description\n';

    // Iterate through all months
    for (let month = 1; month <= allTableRows.length; month++) {
        if (prepaymentsData[month] && prepaymentsData[month].length > 0) {
            hasData = true;
            prepaymentsData[month].forEach((prepayment, index) => {
                const prepaymentNumber = index + 1;
                const prepaymentAmount = prepayment.amount.toFixed(2);
                const prepaymentDate = prepayment.date || '';
                const prepaymentDescription = prepayment.description || '';

                csv += `${month},${prepaymentNumber},${prepaymentAmount},"${prepaymentDate}","${prepaymentDescription}"\n`;
            });
        }
    }

    if (!hasData) {
        alert('No prepayment details to export.');
        return;
    }

    downloadCSV(csv, 'prepayment_details.csv');
}

function exportChargesDetailsToCSV() {
    let hasData = false;
    let csv = 'Month,Other Charges Number,Other Charges Amount,Other Charges Date,Other Charges Description\n';

    // Iterate through all months
    for (let month = 1; month <= allTableRows.length; month++) {
        if (chargesData[month] && chargesData[month].length > 0) {
            hasData = true;
            chargesData[month].forEach((charge, index) => {
                const chargeNumber = index + 1;
                const chargeAmount = charge.amount.toFixed(2);
                const chargeDate = charge.date || '';
                const chargeDescription = charge.description || '';

                csv += `${month},${chargeNumber},${chargeAmount},"${chargeDate}","${chargeDescription}"\n`;
            });
        }
    }

    if (!hasData) {
        alert('No charges details to export.');
        return;
    }

    downloadCSV(csv, 'other_charges_details.csv');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}