// simplified-import-export.js - Complete Loan Data Import/Export
// Works on BOTH web browsers and mobile (Android)

/**
 * Export complete amortization table with all loan details
 * Includes: Loan name, type, parameters, monthly schedule, prepayments, and charges
 * WORKS: Web + Mobile
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
            prepaymentAmount = prepaymentsData[month].reduce((sum, p) => sum + p.amount, 0);
            prepaymentDate = prepaymentsData[month].map(p => p.date || '').join('; ');
            prepaymentDesc = prepaymentsData[month].map(p => p.description || '').filter(d => d).join('; ');
        }

        // Get charges data for this month
        let chargesAmount = 0;
        let chargesDate = '';
        let chargesDesc = '';

        if (chargesData[month] && chargesData[month].length > 0) {
            chargesAmount = chargesData[month].reduce((sum, c) => sum + c.amount, 0);
            chargesDate = chargesData[month].map(c => c.date || '').join('; ');
            chargesDesc = chargesData[month].map(c => c.description || '').filter(d => d).join('; ');
        }

        // Escape and format fields
        const escapedPrepaymentDesc = `"${prepaymentDesc.replace(/"/g, '""')}"`;
        const escapedChargesDesc = `"${chargesDesc.replace(/"/g, '""')}"`;

        csv += `${emiPaid},${month},${opening.toFixed(2)},${rate},${interest.toFixed(2)},${principal.toFixed(2)},${emiValue.toFixed(2)},${prepaymentAmount.toFixed(2)},${prepaymentDate},${escapedPrepaymentDesc},${chargesAmount.toFixed(2)},${chargesDate},${escapedChargesDesc},${closing.toFixed(2)}\n`;
    });

    downloadCSV(csv, 'loan_amortization_complete.csv');
}

/**
 * Import complete amortization table
 * WORKS: Web + Mobile
 */
function importAmortizationFromCSV() {
    const isCordova = typeof cordova !== 'undefined' && window.cordova;

    if (isCordova && window.device && window.device.platform === 'Android') {
        // Mobile: Use enhanced file handling
        importFromMobile();
    } else {
        // Web: Use standard file input
        importFromBrowser();
    }
}

/**
 * Import for mobile devices (Android)
 */
function importFromMobile() {
    console.log('Mobile import initiated...');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv,application/csv,text/comma-separated-values';

    // Mobile-specific styling for better visibility
    input.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        z-index: 99999;
    `;

    document.body.appendChild(input);

    input.onchange = function (e) {
        const file = e.target.files[0];

        // Remove input element
        setTimeout(() => {
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        }, 100);

        if (!file) {
            alert('❌ No file selected.');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('❌ Please select a CSV file.');
            return;
        }

        // Read file using FileReader (works on mobile)
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const csvText = event.target.result;
                parseAndRestoreCompleteData(csvText);
            } catch (error) {
                console.error('Error processing file:', error);
                alert('❌ Error reading CSV file: ' + error.message);
            }
        };

        reader.onerror = function (error) {
            console.error('FileReader error:', error);
            alert('❌ Error reading file. Please try again.');
        };

        reader.readAsText(file);
    };

    input.oncancel = function () {
        setTimeout(() => {
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        }, 100);
    };

    // Trigger file picker
    setTimeout(() => {
        input.click();
    }, 100);
}

/**
 * Import for web browsers
 */
function importFromBrowser() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv,application/csv';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('❌ Please select a CSV file.');
            return;
        }

        try {
            const text = await file.text();
            parseAndRestoreCompleteData(text);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('❌ Error reading CSV file: ' + error.message);
        }
    };

    input.click();
}

/**
 * Alternative: Import by filename from Downloads folder (Mobile only)
 */
function importFromDownloadsFolder() {
    // Check if running in Cordova
    if (!window.cordova || !window.cordova.file) {
        alert('⚠️ This feature is only available in the mobile app.\n\nFor web browsers, use "Import from CSV" button.');
        return;
    }

    const filename = prompt(
        '📁 Import from Downloads Folder\n\n' +
        'Enter the exact filename (including .csv extension):\n\n' +
        'Example: loan_amortization_complete_2024-01-15.csv'
    );

    if (!filename || !filename.trim()) {
        return;
    }

    if (!filename.toLowerCase().endsWith('.csv')) {
        alert('❌ Filename must end with .csv extension.');
        return;
    }

    const directory = cordova.file.externalRootDirectory + 'Download/';

    window.resolveLocalFileSystemURL(directory, function (dirEntry) {
        dirEntry.getFile(filename.trim(), { create: false }, function (fileEntry) {
            fileEntry.file(function (file) {
                const reader = new FileReader();

                reader.onloadend = function () {
                    try {
                        const csvText = this.result;
                        parseAndRestoreCompleteData(csvText);
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        alert('❌ Error reading CSV: ' + error.message);
                    }
                };

                reader.onerror = function (error) {
                    console.error('FileReader error:', error);
                    alert('❌ Error reading file. Please try again.');
                };

                reader.readAsText(file);
            }, function (error) {
                console.error('Error getting file:', error);
                alert('❌ Could not read file. Error code: ' + error.code);
            });
        }, function (error) {
            console.error('File not found:', error);
            alert('❌ File not found in Downloads folder.\n\n' +
                'Please check:\n' +
                '• File exists in Downloads\n' +
                '• Filename is spelled correctly\n' +
                '• File has .csv extension');
        });
    }, function (error) {
        console.error('Downloads folder error:', error);
        alert('❌ Cannot access Downloads folder.\nError code: ' + error.code);
    });
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

        // Parse loan identity (name and type)
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
            alert('❌ Invalid CSV format.');
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

        if (isNaN(loanAmount) || isNaN(annualRate) || isNaN(tenure) || isNaN(emi)) {
            alert('❌ Invalid loan parameters.');
            return;
        }

        // Parse monthly schedule
        const monthlyDataStart = monthlyScheduleIndex + 2;
        const monthlyRows = [];
        const importedPrepaymentsData = {};
        const importedChargesData = {};

        for (let i = monthlyDataStart; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

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

            // Build prepayments data
            if (rowData.prepaymentAmount > 0) {
                if (!importedPrepaymentsData[month]) {
                    importedPrepaymentsData[month] = [];
                }

                const dates = rowData.prepaymentDate.split(';').map(d => d.trim());
                const descs = rowData.prepaymentDesc.split(';').map(d => d.trim());

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

            // Build charges data
            if (rowData.chargesAmount > 0) {
                if (!importedChargesData[month]) {
                    importedChargesData[month] = [];
                }

                const dates = rowData.chargesDate.split(';').map(d => d.trim());
                const descs = rowData.chargesDesc.split(';').map(d => d.trim());

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
            alert('❌ No valid monthly data found.');
            return;
        }

        // Build confirmation message
        let confirmMsg = `Import loan data?\n\n`;

        if (loanName) {
            confirmMsg += `📋 Loan: ${loanName}\n`;
            confirmMsg += `📂 Type: ${loanType === 'other' && customLoanType ? customLoanType : loanType}\n\n`;
        }

        confirmMsg += `📊 Amount: ₹${formatIndianNumber(loanAmount.toFixed(2))}\n` +
            `📈 Rate: ${annualRate.toFixed(2)}%\n` +
            `📅 Tenure: ${tenure} months\n` +
            `💰 EMI: ₹${formatIndianNumber(emi.toFixed(2))}\n` +
            `📝 Records: ${monthlyRows.length}\n\n` +
            `⚠️ This will replace current data.`;

        if (!confirm(confirmMsg)) return;

        // Show progress
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
            <h3 style="color: #667eea; margin-bottom: 15px;">🔄 Importing...</h3>
            <p style="color: #666;">Please wait...</p>
        `;
        document.body.appendChild(progressMsg);

        setTimeout(() => {
            try {
                // Update loan info if multi-loan system active
                if (loanName && typeof currentLoanId !== 'undefined' && currentLoanId && typeof loans !== 'undefined') {
                    const currentLoan = loans.find(l => l.id === currentLoanId);
                    if (currentLoan) {
                        currentLoan.name = loanName;
                        currentLoan.type = loanType || 'personal';
                        if (loanType === 'other' && customLoanType) {
                            currentLoan.customType = customLoanType;
                        }
                        currentLoan.updatedAt = new Date().toISOString();

                        if (typeof saveAllLoans === 'function') saveAllLoans();
                        if (typeof updateLoanHeader === 'function') updateLoanHeader(currentLoan);
                        if (typeof renderLoansList === 'function') renderLoansList();
                    }
                }

                // Clear and restore data
                clearCurrentLoanData();

                document.getElementById('loanAmountInput').value = Math.round(loanAmount);
                document.getElementById('rateInput').value = annualRate;
                document.getElementById('tenureInput').value = tenure;
                document.getElementById('emiInput').value = Math.round(emi);

                isEMIAutoCalculated = isEMIAuto;
                if (isEMIAuto) {
                    document.getElementById('emiInput').classList.add('auto-calculated');
                    document.getElementById('emiAutoCalcIndicator').classList.add('show');
                } else {
                    document.getElementById('emiInput').classList.remove('auto-calculated');
                    document.getElementById('emiAutoCalcIndicator').classList.remove('show');
                }

                prepaymentsData = importedPrepaymentsData;
                chargesData = importedChargesData;

                generateTable();

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

                        const month = parseInt(row.dataset.month);
                        updatePrepaymentInput(month);
                        updateChargesInput(month);
                    }
                });

                recomputeTable();
                updateSavingsSummary();
                saveData();
                savePrepaymentsData();
                saveChargesData();

                document.body.removeChild(progressMsg);

                alert('✅ Import successful!\n\n' +
                    `📋 ${loanName || 'Loan'}\n` +
                    `📅 ${monthlyRows.length} months restored`);

            } catch (error) {
                document.body.removeChild(progressMsg);
                throw error;
            }
        }, 100);

    } catch (error) {
        console.error('Parse error:', error);
        alert('❌ Error parsing CSV: ' + error.message);
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
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
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
 * Clear current loan data (helper)
 */
if (typeof clearCurrentLoanData === 'undefined') {
    function clearCurrentLoanData() {
        const loanAmount = document.getElementById('loanAmountInput');
        const rateInput = document.getElementById('rateInput');
        const tenureInput = document.getElementById('tenureInput');
        const emiInput = document.getElementById('emiInput');

        if (loanAmount) loanAmount.value = '';
        if (rateInput) rateInput.value = '';
        if (tenureInput) tenureInput.value = '';
        if (emiInput) emiInput.value = '';

        const tableBody = document.querySelector('#amortizationTable tbody');
        if (tableBody) tableBody.innerHTML = '';
        allTableRows = [];

        prepaymentsData = {};
        chargesData = {};

        const amortizationContainer = document.getElementById('amortizationTableContainer');
        const summarySection = document.getElementById('summarySection');
        if (amortizationContainer) amortizationContainer.style.display = 'none';
        if (summarySection) summarySection.style.display = 'none';
    }
}