// Charges management functions
function showChargesManager(month) {
    currentManagingMonth = month;
    document.getElementById('chargesManagerMonth').textContent = month;

    // Load existing charges for this month
    loadChargesForMonth(month);

    // Set default date to today
    document.getElementById('newChargesDate').valueAsDate = new Date();

    // Show the manager
    document.getElementById('chargesManager').classList.add('show');
    document.getElementById('chargesManagerOverlay').classList.add('show');
}

function hideChargesManager() {
    document.getElementById('chargesManager').classList.remove('show');
    document.getElementById('chargesManagerOverlay').classList.remove('show');
    currentManagingMonth = null;
}

function loadChargesForMonth(month) {
    const chargesList = document.getElementById('chargesList');
    chargesList.innerHTML = '';

    let total = 0;

    if (chargesData[month] && chargesData[month].length > 0) {
        chargesData[month].forEach((charge, index) => {
            total += charge.amount;

            const item = document.createElement('div');
            item.className = 'charges-item';
            item.innerHTML = `
                <div class="charges-item-details">
                    <span class="charges-item-amount">₹${formatIndianNumber(charge.amount.toFixed(2))}</span>
                    <span class="charges-item-date">${charge.date ? formatDateToDDMMYYYY(charge.date) : 'No date'}</span>
                    ${charge.description ? `<span class="charges-item-description">${charge.description}</span>` : ''}
                </div>
                <div class="charges-item-actions">
                    <button class="btn-small btn-edit" onclick="editCharges(${month}, ${index})">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteCharges(${month}, ${index})">Delete</button>
                </div>
            `;
            chargesList.appendChild(item);
        });
    } else {
        chargesList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No charges added yet.</div>';
    }

    // Update summary
    document.getElementById('chargesManagerSummary').textContent =
        `Total Other Charges: ₹${formatIndianNumber(total.toFixed(2))}`;
}

function addCharges() {
    if (!validateChargesAmount()) {
        alert('Please enter a valid positive integer for charge amount.');
        return;
    }

    const amountInput = document.getElementById('newChargesAmount');
    const dateInput = document.getElementById('newChargesDate');
    const descriptionInput = document.getElementById('newChargesDescription');

    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || amount <= 0) {
        alert('Please enter a valid charge amount.');
        return;
    }

    if (!chargesData[currentManagingMonth]) {
        chargesData[currentManagingMonth] = [];
    }

    chargesData[currentManagingMonth].push({
        amount: amount,
        date: date,
        description: description || ''
    });

    // Reload the list
    loadChargesForMonth(currentManagingMonth);

    // Clear inputs
    amountInput.value = '';
    dateInput.valueAsDate = new Date();
    descriptionInput.value = '';

    markAsUnsaved();
}

function editCharges(month, index) {
    const chargesList = document.getElementById('chargesList');
    const chargesItem = chargesList.children[index];
    const charge = chargesData[month][index];

    // Create inline editing form
    const editForm = document.createElement('div');
    editForm.className = 'edit-charges-form';
    editForm.innerHTML = `
        <div class="edit-form-grid">
            <div class="edit-form-field">
                <label>Amount (₹)</label>
                <input type="number" class="edit-charges-amount" value="${charge.amount}" step="1" min="1">
            </div>
            <div class="edit-form-field">
                <label>Date</label>
                <input type="date" class="edit-charges-date" value="${charge.date || ''}">
            </div>
            <div class="edit-form-field">
                <label>Description</label>
                <input type="text" class="edit-charges-description" value="${charge.description || ''}" placeholder="Description (optional)">
            </div>
            <div class="edit-form-actions">
                <button class="btn btn-save btn-small" onclick="saveEditedCharges(${month}, ${index})">Save</button>
                <button class="btn btn-clear btn-small" onclick="cancelEditCharges(${month}, ${index})">Cancel</button>
            </div>
        </div>
    `;

    // Replace the charges item with the edit form
    chargesItem.style.display = 'none';
    chargesItem.parentNode.insertBefore(editForm, chargesItem.nextSibling);
}

function saveEditedCharges(month, index) {
    const editForm = document.querySelector('.edit-charges-form');
    const amountInput = editForm.querySelector('.edit-charges-amount');
    const dateInput = editForm.querySelector('.edit-charges-date');
    const descriptionInput = editForm.querySelector('.edit-charges-description');

    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
        alert('Please enter a valid positive integer for charge amount.');
        return;
    }

    // Update the charges data
    chargesData[month][index] = {
        amount: amount,
        date: date,
        description: description || ''
    };

    // Remove the edit form and reload the list
    editForm.remove();
    loadChargesForMonth(month);
    markAsUnsaved();
}

function cancelEditCharges(month, index) {
    const editForm = document.querySelector('.edit-charges-form');
    const chargesItem = document.querySelector(`.charges-item:nth-child(${index + 1})`);

    // Remove the edit form and show the original item
    editForm.remove();
    chargesItem.style.display = 'flex';
}

function deleteCharges(month, index) {
    if (confirm('Are you sure you want to delete this charge?')) {
        chargesData[month].splice(index, 1);

        // If no more charges for this month, remove the month entry
        if (chargesData[month].length === 0) {
            delete chargesData[month];
        }

        loadChargesForMonth(month);
        markAsUnsaved();
    }
}

function clearAllCharges() {
    if (confirm('Are you sure you want to clear all charges for this month?')) {
        delete chargesData[currentManagingMonth];
        loadChargesForMonth(currentManagingMonth);
        markAsUnsaved();
    }
}

function saveCharges() {
    updateChargesInput(currentManagingMonth);
    saveChargesData();
    recomputeTable();
    hideChargesManager();
}

function updateChargesInput(month) {
    const row = allTableRows[month - 1];
    if (row) {
        const total = getTotalChargesForMonth(month);

        // Update the manage button text
        const manageBtn = row.querySelector('.manage-charges-btn');
        if (manageBtn) {
            const chargesCount = chargesData[month] ? chargesData[month].length : 0;

            // Update button HTML without icons
            if (total > 0) {
                manageBtn.innerHTML = `₹${formatIndianNumber(total.toFixed(2))} (${chargesCount})`;
                manageBtn.classList.add('has-charges');
            } else {
                manageBtn.innerHTML = `Add Charges`;
                manageBtn.classList.remove('has-charges');
            }
        }
    }
}

function getTotalChargesForMonth(month) {
    if (!chargesData[month] || chargesData[month].length === 0) {
        return 0;
    }
    return chargesData[month].reduce((total, charge) => total + charge.amount, 0);
}

function getChargesCountForMonth(month) {
    if (!chargesData[month]) {
        return 0;
    }
    return chargesData[month].length;
}