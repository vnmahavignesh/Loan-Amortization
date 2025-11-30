// Export functions for CSV generation - Works for Both Web and Cordova/Android
// UPDATED: Saves to Downloads folder for ALL Android versions

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

// Universal CSV download function - Saves to Downloads folder
function downloadCSV(csv, filename) {
    // Check if running in Cordova environment
    const isCordova = typeof cordova !== 'undefined' && window.cordova;

    if (isCordova && window.device && window.device.platform === 'Android') {
        // Android: Save to Downloads folder
        saveToDownloadsFolder(csv, filename);
    } else {
        // Web browser: Use browser download
        saveCsvWithBrowser(csv, filename);
    }
}

// Save to Android Downloads folder: /storage/emulated/0/Download/
function saveToDownloadsFolder(csv, filename) {
    console.log('Saving to Android Downloads folder...');

    // Check if device is ready
    if (document.readyState === 'complete' && window.cordova) {
        executeDownloadsSave(csv, filename);
    } else {
        document.addEventListener('deviceready', function () {
            executeDownloadsSave(csv, filename);
        }, false);
    }
}

function executeDownloadsSave(csv, filename) {
    try {
        // Check if File plugin is available
        if (!window.cordova || !window.cordova.file) {
            console.error('Cordova File plugin not available');
            alert('⚠️ File plugin not available. Please install:\ncordova plugin add cordova-plugin-file');
            return;
        }

        // ALWAYS use Downloads folder: /storage/emulated/0/Download/
        const directory = cordova.file.externalRootDirectory + 'Download/';
        console.log('Using Downloads folder:', directory);

        window.resolveLocalFileSystemURL(directory, function (dirEntry) {
            console.log('Downloads folder accessed successfully');

            // Add timestamp to filename to avoid overwriting
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const uniqueFilename = filename.replace('.csv', `_${timestamp}.csv`);

            dirEntry.getFile(uniqueFilename, { create: true, exclusive: false }, function (fileEntry) {
                console.log('File entry created:', fileEntry.toURL());

                fileEntry.createWriter(function (fileWriter) {
                    console.log('File writer created');

                    fileWriter.onwriteend = function () {
                        console.log('CSV file written successfully to Downloads!');

                        const locationMsg = '✅ File saved successfully!\n\n' +
                            '📁 Location: Downloads Folder\n' +
                            '📱 Path: /storage/emulated/0/Download/\n' +
                            `📄 Filename: ${uniqueFilename}\n\n` +
                            '💡 Open your file manager and go to Downloads to access the file.';

                        alert(locationMsg);

                        // Try to open the file automatically
                        if (window.cordova.plugins && window.cordova.plugins.fileOpener2) {
                            cordova.plugins.fileOpener2.open(
                                fileEntry.toURL(),
                                'text/csv',
                                {
                                    error: function (e) {
                                        console.log('Could not auto-open file:', e);
                                    },
                                    success: function () {
                                        console.log('File opened successfully');
                                    }
                                }
                            );
                        }
                    };

                    fileWriter.onerror = function (e) {
                        console.error('Failed to write file:', e);
                        alert('❌ Error saving file to Downloads folder: ' + e.toString());
                    };

                    // Create a blob and write it
                    const blob = new Blob([csv], { type: 'text/csv' });
                    fileWriter.write(blob);

                }, function (error) {
                    console.error('Failed to create file writer:', error);
                    alert('❌ Error creating file writer: ' + error.code);
                });
            }, function (error) {
                console.error('Failed to get file:', error);
                alert('❌ Error accessing file in Downloads folder: ' + error.code);
            });
        }, function (error) {
            console.error('Failed to resolve Downloads directory:', error);
            alert('❌ Cannot access Downloads folder. Error code: ' + error.code + '\n\nPlease check storage permissions.');
        });

    } catch (error) {
        console.error('Download save error:', error);
        alert('❌ Unexpected error: ' + error.toString());
    }
}

// Save CSV using Browser method (for web browsers)
function saveCsvWithBrowser(csv, filename) {
    try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

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

        // Show success message
        setTimeout(() => {
            alert('✅ CSV export initiated! Check your Downloads folder.');
        }, 500);

    } catch (error) {
        console.error('Browser CSV Export Error:', error);
        alert('❌ Error downloading file: ' + error.toString());
    }
}