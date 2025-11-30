// Export functions for CSV generation - Works for Both Web and Cordova/Android

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

// FIXED: Save CSV using Cordova File Plugin (for Android/iOS app)
function saveCsvWithCordova(csv, filename) {
    console.log('Starting Cordova CSV save...');

    // Check if device is ready
    if (document.readyState === 'complete' && window.cordova) {
        executeCordovaSave(csv, filename);
    } else {
        document.addEventListener('deviceready', function () {
            executeCordovaSave(csv, filename);
        }, false);
    }
}

function executeCordovaSave(csv, filename) {
    try {
        console.log('Executing Cordova save...');

        // Check if File plugin is available
        if (!window.cordova || !window.cordova.file) {
            console.error('Cordova File plugin not available');
            alert('⚠️ File plugin not available. Please install:\ncordova plugin add cordova-plugin-file');
            saveCsvWithBrowser(csv, filename);
            return;
        }

        // For Android - Use the correct directory
        let directory;

        if (window.device && window.device.platform === 'Android') {
            // Android 10+ (API 29+) - Use app-specific external directory (no permissions needed)
            // This is the safest option for modern Android
            if (parseInt(window.device.version) >= 10) {
                directory = cordova.file.externalDataDirectory;
                console.log('Using external data directory for Android 10+:', directory);
            } else {
                // Android 9 and below - Use Downloads folder
                directory = cordova.file.externalRootDirectory + 'Download/';
                console.log('Using Downloads folder for Android 9 and below:', directory);
            }
        } else if (window.device && window.device.platform === 'iOS') {
            // iOS - use documents directory
            directory = cordova.file.documentsDirectory;
            console.log('Using documents directory for iOS:', directory);
        } else {
            // Fallback
            directory = cordova.file.dataDirectory || cordova.file.externalDataDirectory;
            console.log('Using fallback directory:', directory);
        }

        console.log('Resolving directory:', directory);

        window.resolveLocalFileSystemURL(directory, function (dirEntry) {
            console.log('Directory resolved successfully');

            dirEntry.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                console.log('File entry created:', fileEntry.toURL());

                fileEntry.createWriter(function (fileWriter) {
                    console.log('File writer created');

                    fileWriter.onwriteend = function () {
                        console.log('CSV file written successfully!');

                        let locationMsg = 'File saved successfully!\n\n';

                        if (window.device && window.device.platform === 'Android') {
                            if (parseInt(window.device.version) >= 10) {
                                locationMsg += 'Location: App Data Folder\n';
                                locationMsg += 'Path: Android/data/com.yourcompany.loanapp/files/\n\n';
                                locationMsg += 'To access: Use a File Manager app and navigate to the path above.';
                            } else {
                                locationMsg += 'Location: Downloads Folder\n';
                                locationMsg += 'You can find it in your Downloads folder.';
                            }
                        } else if (window.device && window.device.platform === 'iOS') {
                            locationMsg += 'Location: App Documents Folder\n';
                            locationMsg += 'You can access it via Files app.';
                        }

                        locationMsg += `\n\nFilename: ${filename}`;

                        alert('✅ ' + locationMsg);

                        // Try to open the file (Android only)
                        if (window.device && window.device.platform === 'Android' && window.cordova.plugins && window.cordova.plugins.fileOpener2) {
                            openCsvFile(fileEntry);
                        }
                    };

                    fileWriter.onerror = function (e) {
                        console.error('Failed to write file:', e);
                        alert('❌ Error saving file: ' + e.toString() + '\n\nTrying alternative method...');
                        saveCsvWithBrowser(csv, filename);
                    };

                    // Create a blob and write it
                    const blob = new Blob([csv], { type: 'text/csv' });
                    fileWriter.write(blob);

                }, function (error) {
                    console.error('Failed to create file writer:', error);
                    alert('❌ Error creating file writer: ' + error.code + '\n\nTrying alternative method...');
                    saveCsvWithBrowser(csv, filename);
                });
            }, function (error) {
                console.error('Failed to get file:', error);
                alert('❌ Error accessing file: ' + error.code + '\n\nTrying alternative method...');
                saveCsvWithBrowser(csv, filename);
            });
        }, function (error) {
            console.error('Failed to resolve directory:', error);
            alert('❌ Error accessing directory: ' + error.code + '\n\nTrying alternative method...');
            saveCsvWithBrowser(csv, filename);
        });

    } catch (error) {
        console.error('Cordova save error:', error);
        alert('❌ Unexpected error: ' + error.toString() + '\n\nTrying alternative method...');
        saveCsvWithBrowser(csv, filename);
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