// ==========================================
// THANAL PANAM - Complete JavaScript Logic
// ==========================================

// Configuration - REPLACE WITH YOUR APPS SCRIPT DEPLOYMENT URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUOh91TbNs3b4glrglw3t846EzCMyoD0cXWFMojiNx3XMe17ou5Jk1HX1HmTvdn5kkAw/exec";

// Admin Password - CHANGE THIS TO YOUR DESIRED PASSWORD
const ADMIN_PASSWORD = "admin123";

// Application State
let allResidents = [];
let allTransactions = [];
let donationPurposes = [];
let adminMode = false;
let currentTreasurerName = '';
let currentVerificationModal = {};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Thanal Panam Application...');
    loadInitialData();
    setupEventListeners();
    generateMonthYearOptions();
});

function setupEventListeners() {
    document.getElementById('paymentForm').addEventListener('submit', handlePaymentSubmit);
}

async function loadInitialData() {
    try {
        // Load residents
        await loadResidents();
        // Load donation purposes
        await loadDonationPurposes();
        // Load transactions
        await loadTransactions();
        updateLastUpdate();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showMessage('Error loading data. Please refresh the page.', 'error', 'formMessage');
    }
}

// ==========================================
// TAB MANAGEMENT
// ==========================================

function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.closest('.tab-btn').classList.add('active');

    // Load data for relevant tabs
    if (tabName === 'viewHistory') {
        loadTransactions();
    } else if (tabName === 'admin') {
        loadAdminDashboard();
    }
}

// ==========================================
// RESIDENTS MANAGEMENT
// ==========================================

async function loadResidents() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getResidents`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const residents = result.data || result;
        allResidents = residents;

        // Update resident select boxes
        populateResidentSelect('residentName', residents);
        populateResidentSelect('checkBalanceName', residents);

        console.log(`Loaded ${residents.length} residents`);
    } catch (error) {
        console.error('Error loading residents:', error);
        showMessage('Error loading resident list', 'error', 'formMessage');
    }
}

function populateResidentSelect(selectId, residents) {
    const select = document.getElementById(selectId);
    const currentValue = select.value;
    
    // Keep the first empty option
    while (select.options.length > 1) {
        select.remove(1);
    }

    residents.forEach(resident => {
        const option = document.createElement('option');
        option.value = resident.name;
        option.textContent = resident.name;
        if (resident.phone) {
            option.dataset.phone = resident.phone;
            option.dataset.email = resident.email || '';
            option.dataset.address = resident.address || '';
        }
        select.appendChild(option);
    });

    select.value = currentValue;
}

function onResidentSelected() {
    const select = document.getElementById('residentName');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const phone = selectedOption.dataset.phone || '';
        const email = selectedOption.dataset.email || '';
        const address = selectedOption.dataset.address || '';
        
        const infoText = document.getElementById('residentInfo');
        if (phone) {
            infoText.textContent = `📱 ${phone}`;
        }
        
        // Store phone for later use
        document.getElementById('residentPhone').value = phone;
    } else {
        document.getElementById('residentInfo').textContent = '';
    }
}

// ==========================================
// PAYMENT TYPE HANDLING
// ==========================================

function onPaymentTypeChanged() {
    const type = document.getElementById('paymentType').value;
    const monthYearGroup = document.getElementById('monthYearGroup');
    const purposeGroup = document.getElementById('purposeGroup');

    if (type === 'Monthly Fee') {
        monthYearGroup.classList.remove('hidden');
        purposeGroup.classList.add('hidden');
    } else if (type === 'Donation') {
        monthYearGroup.classList.add('hidden');
        purposeGroup.classList.remove('hidden');
    } else {
        monthYearGroup.classList.add('hidden');
        purposeGroup.classList.add('hidden');
    }
}

// ==========================================
// MONTH/YEAR GENERATION
// ==========================================

function generateMonthYearOptions() {
    const select = document.getElementById('monthYear');
    const today = new Date();
    
    // Generate options for past 12 months and next 3 months
    for (let i = -12; i <= 3; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const monthYear = `${month}/${year}`;
        
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        
        select.appendChild(option);
    }
}

// ==========================================
// DONATION PURPOSES
// ==========================================

async function loadDonationPurposes() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getDonationPurposes`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const purposes = result.data || result;

        const select = document.getElementById('donationPurpose');
        while (select.options.length > 1) {
            select.remove(1);
        }

        purposes.forEach(purpose => {
            const option = document.createElement('option');
            option.value = purpose;
            option.textContent = purpose;
            select.appendChild(option);
        });

        console.log(`Loaded ${purposes.length} donation purposes`);
    } catch (error) {
        console.error('Error loading donation purposes:', error);
    }
}

// ==========================================
// FILE UPLOAD HANDLING
// ==========================================

function previewFile() {
    const file = document.getElementById('paymentSlip').files[0];
    const preview = document.getElementById('filePreview');
    
    if (!file) {
        preview.innerHTML = '';
        return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showMessage('File size exceeds 5MB limit', 'error', 'formMessage');
        document.getElementById('paymentSlip').value = '';
        preview.innerHTML = '';
        return;
    }

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Payment Slip Preview">`;
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        preview.innerHTML = `<p>📄 ${file.name} (PDF)</p>`;
    } else {
        preview.innerHTML = `<p>📎 ${file.name}</p>`;
    }
}

// Add hidden phone field to form
const paymentForm = document.getElementById('paymentForm');
if (paymentForm) {
    const phoneInput = document.createElement('input');
    phoneInput.type = 'hidden';
    phoneInput.id = 'residentPhone';
    paymentForm.appendChild(phoneInput);
}

// ==========================================
// PAYMENT RECORDING
// ==========================================

async function handlePaymentSubmit(e) {
    e.preventDefault();

    const residentName = document.getElementById('residentName').value;
    const amount = document.getElementById('amount').value;
    const paymentType = document.getElementById('paymentType').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('notes').value;
    const residentPhone = document.getElementById('residentPhone').value;

    // Validation
    if (!residentName || !amount || !paymentType) {
        showMessage('Please fill all required fields', 'error', 'formMessage');
        return;
    }

    let monthYear = '';
    let purpose = '';

    if (paymentType === 'Monthly Fee') {
        monthYear = document.getElementById('monthYear').value;
        if (!monthYear) {
            showMessage('Please select month/year for monthly fee', 'error', 'formMessage');
            return;
        }
    } else if (paymentType === 'Donation') {
        purpose = document.getElementById('donationPurpose').value;
        if (!purpose) {
            showMessage('Please select donation purpose', 'error', 'formMessage');
            return;
        }
    }

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'addTransaction');
        formData.append('residentName', residentName);
        formData.append('amount', amount);
        formData.append('type', paymentType);
        formData.append('monthYear', monthYear);
        formData.append('purpose', purpose);
        formData.append('paymentMethod', paymentMethod);
        formData.append('notes', notes);
        formData.append('residentPhone', residentPhone);

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage(`✓ Payment recorded successfully! Transaction ID: ${result.data.transactionId}`, 'success', 'formMessage');
            document.getElementById('paymentForm').reset();
            document.getElementById('residentInfo').textContent = '';
            document.getElementById('filePreview').innerHTML = '';
            
            // Reload data
            await loadTransactions();
            updateLastUpdate();
        } else {
            showMessage('✗ ' + result.message, 'error', 'formMessage');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error: ' + error, 'error', 'formMessage');
    }
}

// ==========================================
// TRANSACTIONS MANAGEMENT
// ==========================================

async function loadTransactions() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getTransactions`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const transactions = result.data || result;
        allTransactions = transactions;
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function displayTransactions(transactions) {
    const tbody = document.querySelector('#transactionTable tbody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No transactions yet</td></tr>';
        return;
    }

    transactions.forEach(trans => {
        const row = document.createElement('tr');
        const typeClass = trans.type === 'Monthly Fee' ? 'monthly' : 'donation';
        const statusClass = trans.status === 'Verified' ? 'verified' : 'pending';
        
        row.innerHTML = `
            <td>${trans.date}</td>
            <td>${trans.name}</td>
            <td>₹${parseFloat(trans.amount).toFixed(2)}</td>
            <td><span class="badge ${typeClass}">${trans.type}</span></td>
            <td><span class="badge ${statusClass}">${trans.status}</span></td>
            <td>
                <button class="btn-sm" onclick="viewTransactionDetails('${trans.transactionId}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterTable() {
    const filterName = document.getElementById('filterName').value.toUpperCase();
    const filterStatus = document.getElementById('filterStatus').value;
    const table = document.getElementById('transactionTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const nameCell = rows[i].getElementsByTagName('td')[1];
        const statusCell = rows[i].getElementsByTagName('td')[4];
        
        if (nameCell && statusCell) {
            const nameText = nameCell.textContent.toUpperCase();
            const statusText = statusCell.textContent;
            
            const nameMatch = nameText.includes(filterName);
            const statusMatch = !filterStatus || statusText.includes(filterStatus);
            
            rows[i].style.display = (nameMatch && statusMatch) ? '' : 'none';
        }
    }
}

// ==========================================
// BALANCE CHECKING
// ==========================================

async function getBalance() {
    const name = document.getElementById('checkBalanceName').value.trim();

    if (!name) {
        showMessage('Please select a resident', 'error');
        return;
    }

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getResidentBalance&name=${encodeURIComponent(name)}`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const data = result.data || result;

        if (data.name) {
            document.getElementById('balanceName').textContent = data.name;
            document.getElementById('balanceTotalFees').textContent = parseFloat(data.totalMonthlyFees).toFixed(2);
            document.getElementById('balanceVerifiedFees').textContent = parseFloat(data.verifiedMonthlyFees).toFixed(2);
            document.getElementById('balanceTotalDonations').textContent = parseFloat(data.totalDonations).toFixed(2);
            document.getElementById('balanceVerifiedDonations').textContent = parseFloat(data.verifiedDonations).toFixed(2);
            document.getElementById('balanceTotal').textContent = parseFloat(data.total).toFixed(2);
            document.getElementById('balanceResult').classList.remove('hidden');
        } else {
            showMessage('Resident not found', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error fetching balance', 'error');
    }
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

async function loadAdminDashboard() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getAdminDashboard`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const dashboard = result.data || result;

        document.getElementById('dashTotalAmount').textContent = '₹' + parseFloat(dashboard.totalAmount).toFixed(2);
        document.getElementById('dashVerifiedAmount').textContent = '₹' + parseFloat(dashboard.verifiedAmount).toFixed(2);
        document.getElementById('dashPendingAmount').textContent = '₹' + parseFloat(dashboard.pendingAmount).toFixed(2);

        document.getElementById('statTotalTxn').textContent = dashboard.totalTransactions;
        document.getElementById('statVerifiedTxn').textContent = dashboard.verifiedTransactions;
        document.getElementById('statPendingTxn').textContent = dashboard.pendingTransactions;

        displayPendingPayments();
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showMessage('Error loading dashboard', 'error');
    }
}

function displayPendingPayments() {
    const pending = allTransactions.filter(t => t.status === 'Pending');
    const container = document.getElementById('pendingPaymentsContent');
    
    console.log('Pending transactions:', pending);
    
    if (pending.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">✓ All payments verified!</p>';
        return;
    }

    let html = '<div class="pending-list">';
    pending.forEach(trans => {
        html += `
            <div class="pending-item">
                <div class="pending-info">
                    <p><strong>${trans.name}</strong> - ₹${parseFloat(trans.amount).toFixed(2)}</p>
                    <p style="font-size: 12px; color: #666;">${trans.type} • ${trans.date}</p>
                </div>
                <button class="btn-success" onclick="openVerificationModal('${trans.transactionId}', '${trans.name}', '${trans.amount}', '${trans.type}', '${trans.date}', '${trans.phone}')">
                    ✓ Verify
                </button>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ==========================================
// VERIFICATION MODAL
// ==========================================

function openVerificationModal(txnId, name, amount, type, date, phone) {
    document.getElementById('modalTxnId').textContent = txnId;
    document.getElementById('modalTxnName').textContent = name;
    document.getElementById('modalTxnAmount').textContent = amount;
    document.getElementById('modalTxnType').textContent = type;
    document.getElementById('modalTxnDate').textContent = date;

    currentVerificationModal = {
        transactionId: txnId,
        residentName: name,
        amount: amount,
        phone: phone
    };

    document.getElementById('verificationModal').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeVerificationModal() {
    document.getElementById('verificationModal').classList.add('hidden');
    document.getElementById('modalOverlay').classList.add('hidden');
    currentVerificationModal = {};
}

async function confirmVerification() {
    if (!currentVerificationModal.transactionId) {
        showMessage('Error: Transaction not found', 'error');
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'verifyPayment');
        formData.append('transactionId', currentVerificationModal.transactionId);
        formData.append('treasurerName', currentTreasurerName);

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('✓ Payment verified successfully!', 'success');
            closeVerificationModal();
            
            // Reload data
            await loadTransactions();
            await loadAdminDashboard();
            updateLastUpdate();

            // Send WhatsApp notification
            if (result.data && result.data.phone) {
                showWhatsAppOption(result.data);
            }
        } else {
            showMessage('✗ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error verifying payment', 'error');
    }
}

function showWhatsAppOption(data) {
    const message = `Hello ${data.residentName}, your payment of ₹${data.amount} has been verified and received. Thank you!`;
    const phoneNumber = data.phone.replace(/[^0-9]/g, '');
    
    // Add country code if not present (assumes India +91)
    const fullPhoneNumber = phoneNumber.length === 10 ? '91' + phoneNumber : phoneNumber;
    
    const whatsappLink = `https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Show WhatsApp confirmation dialog
    const confirmed = confirm(`Send WhatsApp confirmation to ${data.residentName}?\n\nPhone: ${data.phone}\n\nMessage: ${message}`);
    if (confirmed) {
        window.open(whatsappLink, '_blank');
    }
}

// ==========================================
// ADMIN UNLOCK WITH PASSWORD
// ==========================================

function unlockAdmin() {
    const treasurerName = document.getElementById('treasurerName').value.trim();
    const treasurerPassword = document.getElementById('treasurerPassword').value.trim();
    
    // Validation
    if (!treasurerName) {
        showMessage('Please enter your name', 'error');
        return;
    }
    
    if (!treasurerPassword) {
        showMessage('Please enter password', 'error');
        return;
    }
    
    // Check password
    if (treasurerPassword !== ADMIN_PASSWORD) {
        showMessage('❌ Invalid password! Access denied.', 'error');
        document.getElementById('treasurerPassword').value = '';
        return;
    }

    // Password correct - Unlock admin
    currentTreasurerName = treasurerName;
    document.getElementById('adminAuthSection').style.display = 'none';
    document.getElementById('adminContent').classList.remove('hidden');
    loadAdminDashboard();
    showMessage(`✓ Welcome, ${treasurerName}! Admin Panel Unlocked.`, 'success');
}

// ==========================================
// REPORT FUNCTIONS
// ==========================================

function showReport(reportType) {
    // Hide all reports
    document.querySelectorAll('.report-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected report
    document.getElementById(reportType + 'Report').classList.add('active');
    event.target.classList.add('active');

    // Load report data
    if (reportType === 'datewise') {
        // Set default dates
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('reportStartDate').valueAsDate = firstDay;
        document.getElementById('reportEndDate').valueAsDate = today;
    }
}

async function loadDatewiseReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        showMessage('Please select date range', 'error');
        return;
    }

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getDatewiseReport&startDate=${startDate}&endDate=${endDate}`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const report = result.data || result;

        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th>Date</th><th>Total (₹)</th><th>Count</th><th>Verified</th></tr></thead><tbody>';
        
        let totalSum = 0;
        let totalCount = 0;
        let totalVerified = 0;

        for (const [date, data] of Object.entries(report)) {
            html += `<tr><td>${date}</td><td>₹${parseFloat(data.total).toFixed(2)}</td><td>${data.count}</td><td>${data.verified}</td></tr>`;
            totalSum += data.total;
            totalCount += data.count;
            totalVerified += data.verified;
        }

        html += `<tr style="font-weight: bold; border-top: 2px solid #ccc;"><td>TOTAL</td><td>₹${totalSum.toFixed(2)}</td><td>${totalCount}</td><td>${totalVerified}</td></tr>`;
        html += '</tbody></table>';

        document.getElementById('datewiseReportContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading date-wise report:', error);
        showMessage('Error loading report', 'error');
    }
}

async function loadMonthwiseReport() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getMonthwiseReport`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const report = result.data || result;

        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th>Month</th><th>Total (₹)</th><th>Count</th></tr></thead><tbody>';
        
        let totalSum = 0;
        let totalCount = 0;

        for (const [month, data] of Object.entries(report)) {
            html += `<tr><td>${month}</td><td>₹${parseFloat(data.total).toFixed(2)}</td><td>${data.count}</td></tr>`;
            totalSum += data.total;
            totalCount += data.count;
        }

        html += `<tr style="font-weight: bold; border-top: 2px solid #ccc;"><td>TOTAL</td><td>₹${totalSum.toFixed(2)}</td><td>${totalCount}</td></tr>`;
        html += '</tbody></table>';

        document.getElementById('monthwiseReportContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading month-wise report:', error);
        showMessage('Error loading report', 'error');
    }
}

async function loadNamewiseReport() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getNamewiseReport`);
        const result = await response.json();
        
        // FIX: Extract data from the response object
        const report = result.data || result;

        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th>Name</th><th>Monthly Fees (₹)</th><th>Donations (₹)</th><th>Total (₹)</th></tr></thead><tbody>';
        
        let totalFees = 0;
        let totalDonations = 0;
        let totalSum = 0;

        for (const [name, data] of Object.entries(report)) {
            html += `<tr><td>${name}</td><td>₹${parseFloat(data.monthlyFees).toFixed(2)}</td><td>₹${parseFloat(data.donations).toFixed(2)}</td><td>₹${parseFloat(data.total).toFixed(2)}</td></tr>`;
            totalFees += data.monthlyFees;
            totalDonations += data.donations;
            totalSum += data.total;
        }

        html += `<tr style="font-weight: bold; border-top: 2px solid #ccc;"><td>TOTAL</td><td>₹${totalFees.toFixed(2)}</td><td>₹${totalDonations.toFixed(2)}</td><td>₹${totalSum.toFixed(2)}</td></tr>`;
        html += '</tbody></table>';

        document.getElementById('namewiseReportContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading name-wise report:', error);
        showMessage('Error loading report', 'error');
    }
}

// ==========================================
// CSV DOWNLOAD
// ==========================================

function downloadCSV() {
    let csv = 'Date,Name,Amount,Type,Payment Method,Notes,Status\n';
    
    allTransactions.forEach(trans => {
        csv += `"${trans.date}","${trans.name}","${trans.amount}","${trans.type}","${trans.method}","${trans.notes || ''}","${trans.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Thanal_Panam_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showMessage(message, type, elementId = 'formMessage') {
    const msgElement = document.getElementById(elementId);
    if (!msgElement) return;
    
    msgElement.textContent = message;
    msgElement.className = `message show ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            msgElement.classList.remove('show');
        }, 4000);
    }
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleString('en-IN');
}

function viewTransactionDetails(txnId) {
    const trans = allTransactions.find(t => t.transactionId === txnId);
    if (trans) {
        alert(`Transaction Details:\n\nID: ${trans.transactionId}\nName: ${trans.name}\nAmount: ₹${trans.amount}\nType: ${trans.type}\nStatus: ${trans.status}\nDate: ${trans.date}`);
    }
}

// Button styling for small buttons
const style = document.createElement('style');
style.textContent = `
    .btn-sm {
        padding: 4px 12px;
        font-size: 11px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .btn-sm:hover {
        background: #1e40af;
    }
    .pending-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .pending-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #f59e0b;
    }
    .pending-info {
        flex: 1;
    }
    .pending-info p {
        margin: 5px 0;
    }
    .btn-success {
        padding: 8px 16px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
    }
    .btn-success:hover {
        background: #059669;
    }
`;
document.head.appendChild(style);
