// simplified-import-export.js - Complete Loan Data Import/Export

/**
 * Export complete amortization table with all loan details
 * Includes: Loan name, type, parameters, monthly schedule, prepayments, and charges
 */
function exportAmortizationToCSV() {
    if (allTableRows.length === 0) {
        alert('Please generate the amortization table first.');
        return;
    }

    // Get loan parameters
    const loanAmount = parseFloat(document.getElementById('loanAmountInput').value) || 0;
    const annualRate = parseFloat(document.getElementById('rateInput').value) || 0;
    const tenure = parseInt(document.getElementById('tenureInput').value) || 0;
    const emi = parseFloat(document.getElementById('emiInput').value) || 0;

    // Get loan name and type from current loan
    let loanName = 'My Loan';
    let loanType = 'personal';
    let customLoanType = '';

    if (currentLoanId && loans && loans.length > 0) {
        const currentLoan = loans.find(l => l.id === currentLoanId);
        if (currentLoan) {
            loanName = currentLoan.name || 'My Loan';
            loanType = currentLoan.type || 'personal';
            customLoanType = currentLoan.customType || '';
        }
    }

    // Escape loan name for CSV
    const escapedLoanName = `"${loanName.replace(/"/g, '""')}"`;
    const escapedCustomType = customLoanType ? `"${customLoanType.replace(/"/g, '""')}"` : '';

    // Start CSV with loan identity and details header
    let csv = '### LOAN IDENTITY ###\n';
    csv += 'Loan Name,Loan Type,Custom Loan Type\n';
    csv += `${escapedLoanName},${loanType},${escapedCustomType}\n\n`;

    csv += '### LOAN DETAILS ###\n';
    csv += 'Loan Amount,Interest Rate (%),Total Tenure (months),Monthly EMI,Is EMI Auto Calculated\n';
    csv += `${loanAmount},${annualRate},${tenure},${emi},${isEMIAutoCalculated ? 'Yes' : 'No'}\n\n`;

    // Add monthly amortization data header
    csv += '### MONTHLY SCHEDULE ###\n';
    csv += 'EMI Paid,Month,Opening Balance,Interest Rate (%),Interest,Principal,EMI,Pre-payment,Pre-payment Date,Pre-payment Description,Other Charges,Other Charges Date,Other Charges Description,Closing Balance\n';

    // Add each month's data
    allTableRows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const month = row.dataset.month;

        // Get raw numeric values
        const opening = parseFloat(row.querySelector('.opening').textContent.replace(/,/g, ''));
        const rate = row.querySelector('.rate-input').value;
        const interest = parseFloat(row.querySelector('.interest').textContent.replace(/,/g, ''));
        const principal = parseFloat(row.querySelector('.principal').textContent.replace(/,/g, ''));
        const emiValue = parseFloat(row.querySelector('.emi').textContent.replace(/,/g, ''));
        const closing = parseFloat(row.querySelector('.closing').textContent.replace(/,/g, ''));

        const emiPaid = checkbox.checked ? 'Yes' : 'No';

        // Get prepayment data for this month
        let prepaymentAmount = 0;
        let prepaymentDate = '';
        let prepaymentDesc = '';

        if (prepaymentsData[month] && prepaymentsData[month].length > 0) {
            // If multiple prepayments, sum them up and concatenate details
            prepaymentAmount = prepaymentsData[month].reduce((sum, p) => sum + p.amount, 0);
            prepaymentDate = prepaymentsData[month].map(p => p.date || '').join('; ');
            prepaymentDesc = prepaymentsData[month].map(p => p.description || '').filter(d => d).join('; ');
        }

        // Get charges data for this month
        let chargesAmount = 0;
        let chargesDate = '';
        let chargesDesc = '';

        if (chargesData[month] && chargesData[month].length > 0) {
            // If multiple charges, sum them up and concatenate details
            chargesAmount = chargesData[month].reduce((sum, c) => sum + c.amount, 0);
            chargesDate = chargesData[month].map(c => c.date || '').join('; ');
            chargesDesc = chargesData[month].map(c => c.description || '').filter(d => d).join('; ');
        }

        // Escape and format fields that might contain commas
        const escapedPrepaymentDesc = `"${prepaymentDesc.replace(/"/g, '""')}"`;
        const escapedChargesDesc = `"${chargesDesc.replace(/"/g, '""')}"`;

        csv += `${emiPaid},${month},${opening.toFixed(2)},${rate},${interest.toFixed(2)},${principal.toFixed(2)},${emiValue.toFixed(2)},${prepaymentAmount.toFixed(2)},${prepaymentDate},${escapedPrepaymentDesc},${chargesAmount.toFixed(2)},${chargesDate},${escapedChargesDesc},${closing.toFixed(2)}\n`;
    });

    downloadCSV(csv, 'loan_amortization_complete.csv');
}

/**
 * Import complete amortization table with all loan details
 * Restores: Loan parameters, monthly schedule, prepayments, and charges
 */
function importAmortizationFromCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            parseAndRestoreCompleteData(text);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('❌ Error reading CSV file. Please try again.');
        }
    };

    input.click();
}

/**
 * Parse and restore complete loan data from CSV
 */
function parseAndRestoreCompleteData(csvText) {
    try {
        const lines = csvText.trim().split('\n');

        if (lines.length < 5) {
            alert('❌ Invalid CSV file. File appears to be incomplete.');
            return;
        }

        // Find sections
        let loanIdentityIndex = -1;
        let loanDetailsIndex = -1;
        let monthlyScheduleIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('### LOAN IDENTITY ###')) {
                loanIdentityIndex = i;
            }
            if (lines[i].includes('### LOAN DETAILS ###')) {
                loanDetailsIndex = i;
            }
            if (lines[i].includes('### MONTHLY SCHEDULE ###')) {
                monthlyScheduleIndex = i;
            }
        }

        // Parse loan identity (name and type) - if available
        let loanName = null;
        let loanType = null;
        let customLoanType = null;

        if (loanIdentityIndex !== -1) {
            const identityDataLine = lines[loanIdentityIndex + 2];
            const identityValues = parseCSVLine(identityDataLine);

            if (identityValues.length >= 2) {
                loanName = identityValues[0] || null;
                loanType = identityValues[1] || null;
                customLoanType = identityValues[2] || null;
            }
        }

        // Parse loan details
        if (loanDetailsIndex === -1 || monthlyScheduleIndex === -1) {
            alert('❌ Invalid CSV format. This does not appear to be a valid loan export file.');
            return;
        }

        const loanDataLine = lines[loanDetailsIndex + 2].split(',');

        if (loanDataLine.length < 4) {
            alert('❌ Invalid loan details format.');
            return;
        }

        const loanAmount = parseFloat(loanDataLine[0]);
        const annualRate = parseFloat(loanDataLine[1]);
        const tenure = parseInt(loanDataLine[2]);
        const emi = parseFloat(loanDataLine[3]);
        const isEMIAuto = loanDataLine[4] ? loanDataLine[4].trim().toLowerCase() === 'yes' : false;

        // Validate loan details
        if (isNaN(loanAmount) || isNaN(annualRate) || isNaN(tenure) || isNaN(emi)) {
            alert('❌ Invalid loan parameters in CSV file.');
            return;
        }

        // Parse monthly schedule data
        const monthlyDataStart = monthlyScheduleIndex + 2;
        const monthlyRows = [];
        const importedPrepaymentsData = {};
        const importedChargesData = {};

        for (let i = monthlyDataStart; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line handling quoted fields
            const values = parseCSVLine(line);

            if (values.length < 14) continue;

            const month = parseInt(values[1]);

            const rowData = {
                emiPaid: values[0].toLowerCase() === 'yes',
                month: month,
                rate: parseFloat(values[3]),
                prepaymentAmount: parseFloat(values[7]),
                prepaymentDate: values[8],
                prepaymentDesc: values[9],
                chargesAmount: parseFloat(values[10]),
                chargesDate: values[11],
                chargesDesc: values[12]
            };

            monthlyRows.push(rowData);

            // Build prepayments data structure
            if (rowData.prepaymentAmount > 0) {
                if (!importedPrepaymentsData[month]) {
                    importedPrepaymentsData[month] = [];
                }

                // Split multiple prepayments if they were concatenated
                const dates = rowData.prepaymentDate.split(';').map(d => d.trim());
                const descs = rowData.prepaymentDesc.split(';').map(d => d.trim());

                // If we have multiple entries, create separate prepayment objects
                if (dates.length > 1) {
                    const amountPerEntry = rowData.prepaymentAmount / dates.length;
                    dates.forEach((date, idx) => {
                        importedPrepaymentsData[month].push({
                            amount: amountPerEntry,
                            date: date || '',
                            description: descs[idx] || ''
                        });
                    });
                } else {
                    importedPrepaymentsData[month].push({
                        amount: rowData.prepaymentAmount,
                        date: rowData.prepaymentDate || '',
                        description: rowData.prepaymentDesc || ''
                    });
                }
            }

            // Build charges data structure
            if (rowData.chargesAmount > 0) {
                if (!importedChargesData[month]) {
                    importedChargesData[month] = [];
                }

                // Split multiple charges if they were concatenated
                const dates = rowData.chargesDate.split(';').map(d => d.trim());
                const descs = rowData.chargesDesc.split(';').map(d => d.trim());

                // If we have multiple entries, create separate charge objects
                if (dates.length > 1) {
                    const amountPerEntry = rowData.chargesAmount / dates.length;
                    dates.forEach((date, idx) => {
                        importedChargesData[month].push({
                            amount: amountPerEntry,
                            date: date || '',
                            description: descs[idx] || ''
                        });
                    });
                } else {
                    importedChargesData[month].push({
                        amount: rowData.chargesAmount,
                        date: rowData.chargesDate || '',
                        description: rowData.chargesDesc || ''
                    });
                }
            }
        }

        if (monthlyRows.length === 0) {
            alert('❌ No valid monthly data found in CSV file.');
            return;
        }

        // Build confirmation message
        let confirmMsg = `Import complete loan data?\n\n`;

        // Add loan identity if available
        if (loanName) {
            confirmMsg += `📋 Loan Name: ${loanName}\n`;
            if (loanType === 'other' && customLoanType) {
                confirmMsg += `📂 Loan Type: ${customLoanType}\n`;
            } else {
                const typeLabels = {
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
                confirmMsg += `📂 Loan Type: ${typeLabels[loanType] || loanType}\n`;
            }
            confirmMsg += `\n`;
        }

        confirmMsg += `📊 Loan Amount: ₹${formatIndianNumber(loanAmount.toFixed(2))}\n` +
            `📈 Interest Rate: ${annualRate.toFixed(2)}% p.a.\n` +
            `📅 Tenure: ${tenure} months\n` +
            `💰 Monthly EMI: ₹${formatIndianNumber(emi.toFixed(2))}\n` +
            `📝 Monthly Records: ${monthlyRows.length}\n` +
            `💵 Prepayment Months: ${Object.keys(importedPrepaymentsData).length}\n` +
            `📊 Charges Months: ${Object.keys(importedChargesData).length}\n\n`;

        // Check if importing into multi-loan system
        if (typeof currentLoanId !== 'undefined' && currentLoanId) {
            confirmMsg += `⚠️ This will update the current loan data.\n\n`;
            confirmMsg += `Would you like to:\n`;
            confirmMsg += `• OK - Update current loan\n`;
            confirmMsg += `• Cancel - Create as new loan (use "Create New Loan" button first)`;
        } else {
            confirmMsg += `⚠️ This will replace your current data.`;
        }

        if (!confirm(confirmMsg)) return;

        // Show progress message
        const progressMsg = document.createElement('div');
        progressMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
        `;
        progressMsg.innerHTML = `
            <h3 style="color: #667eea; margin-bottom: 15px;">🔄 Importing Data...</h3>
            <p style="color: #666;">Please wait while we restore your loan data.</p>
        `;
        document.body.appendChild(progressMsg);

        // Small delay to show progress message
        setTimeout(() => {
            try {
                // If loan name and type provided, update current loan info (if multi-loan system is active)
                if (loanName && typeof currentLoanId !== 'undefined' && currentLoanId && typeof loans !== 'undefined' && loans.length > 0) {
                    const currentLoan = loans.find(l => l.id === currentLoanId);
                    if (currentLoan) {
                        currentLoan.name = loanName;
                        currentLoan.type = loanType || 'personal';
                        if (loanType === 'other' && customLoanType) {
                            currentLoan.customType = customLoanType;
                        }
                        currentLoan.updatedAt = new Date().toISOString();

                        // Save updated loan info
                        if (typeof saveAllLoans === 'function') {
                            saveAllLoans();
                        }

                        // Update loan header
                        if (typeof updateLoanHeader === 'function') {
                            updateLoanHeader(currentLoan);
                        }

                        // Re-render loans list
                        if (typeof renderLoansList === 'function') {
                            renderLoansList();
                        }
                    }
                }

                // Clear existing data
                clearCurrentLoanData();

                // Set loan parameters
                document.getElementById('loanAmountInput').value = Math.round(loanAmount);
                document.getElementById('rateInput').value = annualRate;
                document.getElementById('tenureInput').value = tenure;
                document.getElementById('emiInput').value = Math.round(emi);

                // Set EMI calculation mode
                isEMIAutoCalculated = isEMIAuto;
                if (isEMIAuto) {
                    document.getElementById('emiInput').classList.add('auto-calculated');
                    document.getElementById('emiAutoCalcIndicator').classList.add('show');
                } else {
                    document.getElementById('emiInput').classList.remove('auto-calculated');
                    document.getElementById('emiAutoCalcIndicator').classList.remove('show');
                }

                // Update global prepayments and charges data
                prepaymentsData = importedPrepaymentsData;
                chargesData = importedChargesData;

                // Generate table
                generateTable();

                // Restore rates and EMI paid status
                allTableRows.forEach((row, idx) => {
                    if (idx < monthlyRows.length) {
                        const data = monthlyRows[idx];

                        const rateInput = row.querySelector('.rate-input');
                        const checkbox = row.querySelector('input[type="checkbox"]');

                        if (rateInput) rateInput.value = data.rate;
                        if (checkbox) {
                            checkbox.checked = data.emiPaid;
                            toggleRowHighlight(row, data.emiPaid);
                        }

                        // Update prepayment and charges buttons
                        const month = parseInt(row.dataset.month);
                        updatePrepaymentInput(month);
                        updateChargesInput(month);
                    }
                });

                // Recompute with restored data
                recomputeTable();
                updateSavingsSummary();

                // Save everything
                saveData();
                savePrepaymentsData();
                saveChargesData();

                // Remove progress message
                document.body.removeChild(progressMsg);

                // Show success message
                let successMsg = `✅ Complete loan data imported successfully!\n\n`;

                if (loanName) {
                    successMsg += `📋 Loan: ${loanName}\n`;
                    if (loanType === 'other' && customLoanType) {
                        successMsg += `📂 Type: ${customLoanType}\n\n`;
                    } else {
                        const typeLabels = {
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
                        successMsg += `📂 Type: ${typeLabels[loanType] || loanType}\n\n`;
                    }
                }

                successMsg += `📊 Loan Details: Restored\n` +
                    `📅 Monthly Schedule: ${monthlyRows.length} months\n` +
                    `💵 Prepayments: ${Object.keys(importedPrepaymentsData).length} months\n` +
                    `📊 Other Charges: ${Object.keys(importedChargesData).length} months\n\n` +
                    `All pages (Payment Details, Prepayment Details, Charges Details) are now automatically updated! 🎉`;

                alert(successMsg);

            } catch (error) {
                document.body.removeChild(progressMsg);
                throw error;
            }
        }, 100);

    } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('❌ Error parsing CSV file. Please check the file format.\n\nError: ' + error.message);
    }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Handle escaped quotes ""
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());

    return values;
}

/**
 * Clear current loan data from UI (helper function if not exists)
 */
if (typeof clearCurrentLoanData === 'undefined') {
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
}