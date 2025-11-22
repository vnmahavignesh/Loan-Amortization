// Prepayment management functions
function showPrepaymentManager(month) {
    currentManagingMonth = month;
    document.getElementById('prepaymentManagerMonth').textContent = month;

    // Load existing prepayments for this month
    loadPrepaymentsForMonth(month);

    // Set default date to today
    document.getElementById('newPrepaymentDate').valueAsDate = new Date();

    // Show the manager
    document.getElementById('prepaymentManager').classList.add('show');
    document.getElementById('prepaymentManagerOverlay').classList.add('show');
}

function hidePrepaymentManager() {
    document.getElementById('prepaymentManager').classList.remove('show');
    document.getElementById('prepaymentManagerOverlay').classList.remove('show');
    currentManagingMonth = null;
}

function loadPrepaymentsForMonth(month) {
    const prepaymentList = document.getElementById('prepaymentList');
    prepaymentList.innerHTML = '';

    let total = 0;

    if (prepaymentsData[month] && prepaymentsData[month].length > 0) {
        prepaymentsData[month].forEach((prepayment, index) => {
            total += prepayment.amount;

            const item = document.createElement('div');
            item.className = 'prepayment-item';
            item.innerHTML = `
                <div class="prepayment-item-details">
                    <span class="prepayment-item-amount">₹${formatIndianNumber(prepayment.amount.toFixed(2))}</span>
                    <span class="prepayment-item-date">${prepayment.date ? formatDateToDDMMYYYY(prepayment.date) : 'No date'}</span>
                    ${prepayment.description ? `<span class="prepayment-item-description">${prepayment.description}</span>` : ''}
                </div>
                <div class="prepayment-item-actions">
                    <button class="btn-small btn-edit" onclick="editPrepayment(${month}, ${index})">Edit</button>
                    <button class="btn-small btn-delete" onclick="deletePrepayment(${month}, ${index})">Delete</button>
                </div>
            `;
            prepaymentList.appendChild(item);
        });
    } else {
        prepaymentList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No prepayments added yet.</div>';
    }

    // Update summary
    document.getElementById('prepaymentManagerSummary').textContent =
        `Total Prepayments: ₹${formatIndianNumber(total.toFixed(2))}`;
}

function addPrepayment() {
    if (!validatePrepaymentAmount()) {
        alert('Please enter a valid positive integer for prepayment amount.');
        return;
    }

    const amountInput = document.getElementById('newPrepaymentAmount');
    const dateInput = document.getElementById('newPrepaymentDate');
    const descriptionInput = document.getElementById('newPrepaymentDescription');

    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || amount <= 0) {
        alert('Please enter a valid prepayment amount.');
        return;
    }

    if (!prepaymentsData[currentManagingMonth]) {
        prepaymentsData[currentManagingMonth] = [];
    }

    prepaymentsData[currentManagingMonth].push({
        amount: amount,
        date: date,
        description: description || ''
    });

    // Reload the list
    loadPrepaymentsForMonth(currentManagingMonth);

    // Clear inputs
    amountInput.value = '';
    dateInput.valueAsDate = new Date();
    descriptionInput.value = '';

    markAsUnsaved();
}

function editPrepayment(month, index) {
    const prepaymentList = document.getElementById('prepaymentList');
    const prepaymentItem = prepaymentList.children[index];
    const prepayment = prepaymentsData[month][index];

    // Create inline editing form
    const editForm = document.createElement('div');
    editForm.className = 'edit-prepayment-form';
    editForm.innerHTML = `
        <div class="edit-form-grid">
            <div class="edit-form-field">
                <label>Amount (₹)</label>
                <input type="number" class="edit-prepayment-amount" value="${prepayment.amount}" step="1" min="1">
            </div>
            <div class="edit-form-field">
                <label>Date</label>
                <input type="date" class="edit-prepayment-date" value="${prepayment.date || ''}">
            </div>
            <div class="edit-form-field">
                <label>Description</label>
                <input type="text" class="edit-prepayment-description" value="${prepayment.description || ''}" placeholder="Description (optional)">
            </div>
            <div class="edit-form-actions">
                <button class="btn btn-save btn-small" onclick="saveEditedPrepayment(${month}, ${index})">Save</button>
                <button class="btn btn-clear btn-small" onclick="cancelEditPrepayment(${month}, ${index})">Cancel</button>
            </div>
        </div>
    `;

    // Replace the prepayment item with the edit form
    prepaymentItem.style.display = 'none';
    prepaymentItem.parentNode.insertBefore(editForm, prepaymentItem.nextSibling);
}

function saveEditedPrepayment(month, index) {
    const editForm = document.querySelector('.edit-prepayment-form');
    const amountInput = editForm.querySelector('.edit-prepayment-amount');
    const dateInput = editForm.querySelector('.edit-prepayment-date');
    const descriptionInput = editForm.querySelector('.edit-prepayment-description');

    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
        alert('Please enter a valid positive integer for prepayment amount.');
        return;
    }

    // Update the prepayment data
    prepaymentsData[month][index] = {
        amount: amount,
        date: date,
        description: description || ''
    };

    // Remove the edit form and reload the list
    editForm.remove();
    loadPrepaymentsForMonth(month);
    markAsUnsaved();
}

function cancelEditPrepayment(month, index) {
    const editForm = document.querySelector('.edit-prepayment-form');
    const prepaymentItem = document.querySelector(`.prepayment-item:nth-child(${index + 1})`);

    // Remove the edit form and show the original item
    editForm.remove();
    prepaymentItem.style.display = 'flex';
}

function deletePrepayment(month, index) {
    if (confirm('Are you sure you want to delete this prepayment?')) {
        prepaymentsData[month].splice(index, 1);

        // If no more prepayments for this month, remove the month entry
        if (prepaymentsData[month].length === 0) {
            delete prepaymentsData[month];
        }

        loadPrepaymentsForMonth(month);
        markAsUnsaved();
    }
}

function clearAllPrepayments() {
    if (confirm('Are you sure you want to clear all prepayments for this month?')) {
        delete prepaymentsData[currentManagingMonth];
        loadPrepaymentsForMonth(currentManagingMonth);
        markAsUnsaved();
    }
}

function savePrepayments() {
    updatePrepaymentInput(currentManagingMonth);
    savePrepaymentsData();
    recomputeTable();
    hidePrepaymentManager();
}

function updatePrepaymentInput(month) {
    const row = allTableRows[month - 1];
    if (row) {
        const total = getTotalPrepaymentForMonth(month);

        // Update the manage button text
        const manageBtn = row.querySelector('.manage-prepayments-btn');
        if (manageBtn) {
            const prepaymentCount = prepaymentsData[month] ? prepaymentsData[month].length : 0;

            // Update button HTML without icons
            if (total > 0) {
                manageBtn.innerHTML = `₹${formatIndianNumber(total.toFixed(2))} (${prepaymentCount})`;
                manageBtn.classList.add('has-prepayments');
            } else {
                manageBtn.innerHTML = `Add Prepayment`;
                manageBtn.classList.remove('has-prepayments');
            }
        }
    }
}

function getTotalPrepaymentForMonth(month) {
    if (!prepaymentsData[month] || prepaymentsData[month].length === 0) {
        return 0;
    }
    return prepaymentsData[month].reduce((total, prepayment) => total + prepayment.amount, 0);
}

function getPrepaymentCountForMonth(month) {
    if (!prepaymentsData[month]) {
        return 0;
    }
    return prepaymentsData[month].length;
}