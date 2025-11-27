// Savings calculation and summary functions
function updateSavingsSummary() {
    const loanAmount = parseFloat(document.getElementById('loanAmountInput').value) || 0;
    const globalAnnualRate = parseFloat(document.getElementById('rateInput').value) || 0;
    const emi = parseFloat(document.getElementById('emiInput').value) || 0;
    const totalTenure = parseInt(document.getElementById('tenureInput').value) || 0;

    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalEmiPaid = 0;
    let totalPrepayment = 0;
    let totalOtherCharges = 0;
    let prepaymentMonthsCount = 0;
    let chargesMonthsCount = 0;
    let paidMonths = 0;
    let currentBalance = loanAmount;

    for (let i = 0; i < allTableRows.length; i++) {
        const row = allTableRows[i];
        const checkbox = row.querySelector('input[type="checkbox"]');

        if (checkbox.checked) {
            paidMonths++;

            const month = parseInt(row.dataset.month);
            const rateInput = row.querySelector('.rate-input');

            const annualRate = parseFloat(rateInput.value);
            const usedAnnualRate = isNaN(annualRate) ? globalAnnualRate : annualRate;
            const monthlyRate = (usedAnnualRate / 100) / 12;

            const interest = currentBalance * monthlyRate;
            let principal = emi - interest;
            if (principal < 0) principal = 0;

            const prepayment = getTotalPrepaymentForMonth(month);
            const otherCharges = getTotalChargesForMonth(month);

            totalInterestPaid += interest;
            totalPrincipalPaid += principal;
            totalEmiPaid += emi;
            totalPrepayment += prepayment;
            totalOtherCharges += otherCharges;

            if (prepayment > 0) {
                prepaymentMonthsCount++;
            }

            if (otherCharges > 0) {
                chargesMonthsCount++;
            }

            currentBalance = currentBalance - principal - prepayment + otherCharges;
            if (currentBalance < 0) currentBalance = 0;
        } else {
            break;
        }
    }

    let remainingTenure = 0;
    let interestSaved = 0;
    let timeSaved = 0;
    let projectedInterest = 0;

    if (currentBalance > 0 && paidMonths < allTableRows.length) {
        let projectedBalance = currentBalance;

        const monthlyRate = (globalAnnualRate / 100) / 12;
        if (emi > currentBalance * monthlyRate) {
            remainingTenure = Math.ceil(-Math.log(1 - (currentBalance * monthlyRate) / emi) / Math.log(1 + monthlyRate));
        } else {
            remainingTenure = totalTenure - paidMonths;
        }

        for (let i = paidMonths; i < Math.min(paidMonths + remainingTenure, allTableRows.length); i++) {
            const row = allTableRows[i];
            const month = parseInt(row.dataset.month);
            const rateInput = row.querySelector('.rate-input');

            const annualRate = parseFloat(rateInput.value);
            const usedAnnualRate = isNaN(annualRate) ? globalAnnualRate : annualRate;
            const monthlyRate = (usedAnnualRate / 100) / 12;

            const interest = projectedBalance * monthlyRate;
            projectedInterest += interest;

            let principal = emi - interest;
            if (principal < 0) principal = 0;

            const prepayment = getTotalPrepaymentForMonth(month);
            const charges = getTotalChargesForMonth(month);

            projectedBalance = projectedBalance - principal - prepayment + charges;
            if (projectedBalance <= 0) break;
        }
    }

    const newTotalInterest = projectedInterest;

    const originalScenario = calculateAmortizationSchedule(loanAmount, globalAnnualRate, totalTenure, emi, [], []);

    const originalRemainingInterest = calculateRemainingInterest(loanAmount, globalAnnualRate, totalTenure, emi, paidMonths);
    interestSaved = originalRemainingInterest - projectedInterest;

    timeSaved = (totalTenure - paidMonths) - remainingTenure;

    document.getElementById('remainingTenure').textContent = remainingTenure === Infinity ? '∞' : formatTenureWithMonths(remainingTenure);
    document.getElementById('interestSaved').textContent = '₹' + formatIndianNumber(Math.max(0, interestSaved).toFixed(2));
    document.getElementById('totalPrepayment').textContent = '₹' + formatIndianNumber(totalPrepayment.toFixed(2));
    document.getElementById('timeSaved').textContent = formatTenureWithMonths(Math.max(0, timeSaved));

    document.getElementById('totalInterestPaid').textContent = '₹' + formatIndianNumber(totalInterestPaid.toFixed(2));
    document.getElementById('totalPrincipalPaid').textContent = '₹' + formatIndianNumber(totalPrincipalPaid.toFixed(2));
    document.getElementById('totalEmiPaid').textContent = '₹' + formatIndianNumber(totalEmiPaid.toFixed(2));
    document.getElementById('totalOtherCharges').textContent = '₹' + formatIndianNumber(totalOtherCharges.toFixed(2));
    document.getElementById('prepaymentMonths').textContent = prepaymentMonthsCount;
    document.getElementById('chargesMonths').textContent = chargesMonthsCount;
    document.getElementById('newTotalInterest').textContent = '₹' + formatIndianNumber(newTotalInterest.toFixed(2));
}

function calculateRemainingInterest(principal, annualRate, tenure, emi, paidMonths) {
    const monthlyRate = (annualRate / 100) / 12;
    let balance = principal;
    let remainingInterest = 0;

    for (let i = 0; i < paidMonths; i++) {
        const interest = balance * monthlyRate;
        const principalPaid = emi - interest;
        balance -= principalPaid;
        if (balance < 0) balance = 0;
    }

    for (let i = paidMonths; i < tenure; i++) {
        if (balance <= 0.01) break;

        const interest = balance * monthlyRate;
        remainingInterest += interest;

        const principalPaid = emi - interest;
        balance -= principalPaid;
        if (balance < 0) balance = 0;
    }

    return remainingInterest;
}

function calculateAmortizationSchedule(principal, annualRate, tenure, emi, prepayments, otherCharges) {
    const monthlyRate = (annualRate / 100) / 12;
    let balance = principal;
    let totalInterest = 0;
    let actualTenure = 0;

    if (!otherCharges) {
        otherCharges = [];
    }

    for (let i = 0; i < tenure; i++) {
        if (balance <= 0.01) break;

        const interest = balance * monthlyRate;
        totalInterest += interest;

        let principalPaid = emi - interest;
        if (principalPaid < 0) principalPaid = 0;

        const prepayment = prepayments[i] || 0;
        principalPaid += prepayment;

        const charges = otherCharges[i] || 0;

        balance = balance - principalPaid + charges;
        actualTenure++;

        if (balance < 0) {
            balance = 0;
        }
    }

    return {
        totalInterest: totalInterest,
        actualTenure: actualTenure,
        finalBalance: balance
    };
}