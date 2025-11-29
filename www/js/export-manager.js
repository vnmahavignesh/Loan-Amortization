// Export functions for CSV generation - Works for Both Web and Cordova/Android
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

        csv += `${emiPaid},${month},${opening.toFixed(2)},${rate},${interest.toFixed(2)},${principal.toFixed(2)},${emi.toFixed(2)},${prepayment.toFixed(2)},${prepaymentCount},${charges.toFixed(2)},${chargesCount},${closing.toFixed(2)}\n`;
    });

    downloadCSV(csv, 'loan_amortization.csv');
}

function exportPaymentDetailsToCSV() {
    let hasData = false;
    let csv = 'Month,Pre-payment Amount,Pre-payment Date,Pre-payment Description,Other Charges,Other Charges Date,Other Charges Description\n';

    for (let month = 1; month <= allTableRows.length; month++) {
        const hasPrepayments = prepaymentsData[month] && prepaymentsData[month].length > 0;
        const hasCharges = chargesData[month] && chargesData[month].length > 0;

        if (hasPrepayments || hasCharges) {
            hasData = true;

            const maxEntries = Math.max(
                hasPrepayments ? prepaymentsData[month].length : 0,
                hasCharges ? chargesData[month].length : 0
            );

            for (let i = 0; i < maxEntries; i++) {
                const prepayment = hasPrepayments && i < prepaymentsData[month].length
                    ? prepaymentsData[month][i]
                    : null;

                const charge = hasCharges && i < chargesData[month].length
                    ? chargesData[month][i]
                    : null;

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

// Universal CSV download function - Works for Web and Cordova/Android
function downloadCSV(csv, filename) {
    // Check if running in Cordova environment
    const isCordova = typeof cordova !== 'undefined' && window.cordova;

    if (isCordova) {
        // Use Cordova method for mobile app
        saveCsvWithCordova(csv, filename);
    } else {
        // Use browser method for web
        saveCsvWithBrowser(csv, filename);
    }
}

// Save CSV using Cordova File Plugin (for Android/iOS app)
function saveCsvWithCordova(csv, filename) {
    // Wait for deviceready event
    const executeSave = function () {
        try {
            // Check if File plugin is available
            if (!window.cordova.file) {
                console.error('Cordova File plugin not available');
                saveCsvWithBrowser(csv, filename); // Fallback to browser method
                return;
            }

            // Determine the correct directory based on platform
            let directory;

            if (window.device && window.device.platform === 'Android') {
                // For Android - use external storage Downloads folder
                directory = cordova.file.externalRootDirectory + 'Download/';
            } else if (window.device && window.device.platform === 'iOS') {
                // For iOS - use documents directory
                directory = cordova.file.documentsDirectory;
            } else {
                // Fallback
                directory = cordova.file.dataDirectory || cordova.file.documentsDirectory;
            }

            window.resolveLocalFileSystemURL(directory, function (dirEntry) {
                dirEntry.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function () {
                            console.log("CSV file saved successfully!");

                            // Show success message with file location
                            let location = 'Downloads';
                            if (window.device) {
                                location = window.device.platform === 'Android' ? 'Downloads' : 'Documents';
                            }
                            alert(`✅ CSV file saved successfully!\n\nLocation: ${location}/${filename}`);

                            // Optional: Try to open the file (Android only)
                            if (window.device && window.device.platform === 'Android') {
                                openCsvFile(fileEntry);
                            }
                        };

                        fileWriter.onerror = function (e) {
                            console.error("Failed to write file:", e);
                            alert('❌ Error saving file. Trying browser method...');
                            saveCsvWithBrowser(csv, filename);
                        };

                        // Create a blob and write it
                        const blob = new Blob([csv], { type: 'text/csv' });
                        fileWriter.write(blob);

                    }, function (error) {
                        console.error("Failed to create file writer:", error);
                        alert('❌ Error creating file. Trying browser method...');
                        saveCsvWithBrowser(csv, filename);
                    });
                }, function (error) {
                    console.error("Failed to get file:", error);
                    alert('❌ Error accessing file. Trying browser method...');
                    saveCsvWithBrowser(csv, filename);
                });
            }, function (error) {
                console.error("Failed to resolve directory:", error);
                alert('❌ Error accessing directory. Trying browser method...');
                saveCsvWithBrowser(csv, filename);
            });
        } catch (error) {
            console.error("Cordova save error:", error);
            saveCsvWithBrowser(csv, filename);
        }
    };

    // Check if device is already ready
    if (document.readyState === 'complete' && window.cordova) {
        executeSave();
    } else {
        document.addEventListener('deviceready', executeSave, false);
    }
}

// Optional: Open CSV file after saving (Android only)
function openCsvFile(fileEntry) {
    try {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.fileOpener2) {
            cordova.plugins.fileOpener2.open(
                fileEntry.toURL(),
                'text/csv',
                {
                    error: function (e) {
                        console.log('Error opening file:', e);
                    },
                    success: function () {
                        console.log('File opened successfully');
                    }
                }
            );
        }
    } catch (error) {
        console.log('File opener not available:', error);
    }
}

// Save CSV using Browser method (for web browsers)
function saveCsvWithBrowser(csv, filename) {
    try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        // IE/Edge support
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
            alert('✅ CSV file downloaded successfully!');
            return;
        }

        // Modern browsers
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        // Show success message for mobile browsers
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            setTimeout(() => {
                alert('✅ CSV export initiated! Check your Downloads folder.');
            }, 500);
        }

    } catch (error) {
        console.error('Browser CSV Export Error:', error);
        fallbackCopyToClipboard(csv, filename);
    }
}

// Fallback: Copy to clipboard
function fallbackCopyToClipboard(csv, filename) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(csv).then(() => {
                alert(`📋 CSV content copied to clipboard!\n\nYou can paste it into a file named "${filename}"`);
            }).catch(() => {
                showCSVModal(csv, filename);
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = csv;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert(`📋 CSV content copied to clipboard!\n\nYou can paste it into a file named "${filename}"`);
            } catch (err) {
                document.body.removeChild(textArea);
                showCSVModal(csv, filename);
            }
        }
    } catch (error) {
        showCSVModal(csv, filename);
    }
}

// Show CSV content in modal (last resort)

function showCSVModal(csv, filename) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 90%;
        max-height: 80%;
        overflow: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #333;">CSV Export - ${filename}</h3>
        <p style="margin-bottom: 10px; color: #666;">Copy the content below and save it as "${filename}":</p>
        <textarea readonly style="
            width: 100%;
            height: 300px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
        ">${csv}</textarea>
        <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="copyCSVContent(this)" style="
                padding: 10px 20px;
                background: #4caf50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
            ">Copy to Clipboard</button>
            <button onclick="closeCSVModal(this)" style="
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
            ">Close</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);
}

function copyCSVContent(button) {
    const modal = button.closest('div').parentElement.parentElement;
    const textarea = modal.querySelector('textarea');
    textarea.select();

    try {
        document.execCommand('copy');
        button.textContent = '✓ Copied!';
        button.style.background = '#27ae60';
        setTimeout(() => {
            button.textContent = 'Copy to Clipboard';
            button.style.background = '#4caf50';
        }, 2000);
    } catch (err) {
        alert('Please manually select and copy the text');
    }
}

function closeCSVModal(button) {
    const modal = button.closest('div').parentElement.parentElement;
    document.body.removeChild(modal);
}