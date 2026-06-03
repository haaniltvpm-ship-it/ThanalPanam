// ==========================================
// THANAL PANAM - Complete JavaScript Logic
// ==========================================

// Configuration - REPLACE WITH YOUR APPS SCRIPT DEPLOYMENT URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz54khRUfJddJKPq5GC_lif9yM9IVIOXZMJ0upXhgVgkHOs5EYtajfxxoUgEuJfSbKPYg/exec";

// Admin Password
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
    setupReportTabListeners();
});

function setupEventListeners() {
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    // Add hidden phone field to form
    if (paymentForm) {
        const phoneInput = document.createElement('input');
        phoneInput.type = 'hidden';
        phoneInput.id = 'residentPhone';
        paymentForm.appendChild(phoneInput);
    }
}

function setupReportTabListeners() {
    const reportButtons = document.querySelectorAll('.report-tab-btn');
    reportButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const reportType = this.getAttribute('data-report');
            showReport(reportType);
        });
    });
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
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
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
        
        // Extract data from the response object
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
    if (!select) return;
    
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
    if (!select) return;
    
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const phone = selectedOption.dataset.phone || '';
        const email = selectedOption.dataset.email || '';
        const address = selectedOption.dataset.address || '';
        
        const infoText = document.getElementById('residentInfo');
        if (infoText && phone) {
            infoText.textContent = `📱 ${phone}`;
        }
        
        // Store phone for later use
        const phoneField = document.getElementById('residentPhone');
        if (phoneField) {
            phoneField.value = phone;
        }
    } else {
        const infoText = document.getElementById('residentInfo');
        if (infoText) {
            infoText.textContent = '';
        }
    }
}

// ==========================================
// PAYMENT TYPE HANDLING
// ==========================================

function onPaymentTypeChanged() {
    const type = document.getElementById('paymentType').value;
    const monthYearGroup = document.getElementById('monthYearGroup');
    const purposeGroup = document.getElementById('purposeGroup');

    if (!monthYearGroup || !purposeGroup) return;

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
    if (!select) return;
    
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
        
        // Extract data from the response object
        const purposes = result.data || result;

        const select = document.getElementById('donationPurpose');
        if (!select) return;
        
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
    
    if (!preview) return;
    
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

        // Handle file upload if present
        const fileInput = document.getElementById('paymentSlip');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async function(event) {
                const base64Data = event.target.result.split(',')[1];
                formData.append('receiptData', base64Data);
                formData.append('receiptFileName', file.name);
                formData.append('receiptMimeType', file.type);
                
                await submitTransaction(formData);
            };
            reader.readAsDataURL(file);
        } else {
            await submitTransaction(formData);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error: ' + error, 'error', 'formMessage');
    }
}

async function submitTransaction(formData) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage(`✓ Payment recorded successfully! Transaction ID: ${result.data.transactionId}`, 'success', 'formMessage');
            document.getElementById('paymentForm').reset();
            
            const infoText = document.getElementById('residentInfo');
            if (infoText) infoText.textContent = '';
            
            const filePreview = document.getElementById('filePreview');
            if (filePreview) filePreview.innerHTML = '';
            
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
        
        // Extract data from the response object
        const transactions = result.data || result;
        allTransactions = transactions;
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function displayTransactions(transactions) {
    const tbody = document.querySelector('#transactionTable tbody');
    if (!tbody) return;
    
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
    
    if (!table) return;
    
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
        
        // Extract data from the response object
        const data = result.data || result;

        if (data.name) {
            const balanceName = document.getElementById('balanceName');
            if (balanceName) balanceName.textContent = data.name;
            
            const balanceTotalFees = document.getElementById('balanceTotalFees');
            if (balanceTotalFees) balanceTotalFees.textContent = parseFloat(data.totalMonthlyFees).toFixed(2);
            
            const balanceVerifiedFees = document.getElementById('balanceVerifiedFees');
            if (balanceVerifiedFees) balanceVerifiedFees.textContent = parseFloat(data.verifiedMonthlyFees).toFixed(2);
            
            const balanceTotalDonations = document.getElementById('balanceTotalDonations');
            if (balanceTotalDonations) balanceTotalDonations.textContent = parseFloat(data.totalDonations).toFixed(2);
            
            const balanceVerifiedDonations = document.getElementById('balanceVerifiedDonations');
            if (balanceVerifiedDonations) balanceVerifiedDonations.textContent = parseFloat(data.verifiedDonations).toFixed(2);
            
            const balanceTotal = document.getElementById('balanceTotal');
            if (balanceTotal) balanceTotal.textContent = parseFloat(data.total).toFixed(2);
            
            const balanceResult = document.getElementById('balanceResult');
            if (balanceResult) balanceResult.classList.remove('hidden');
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
        
        // Extract data from the response object
        const dashboard = result.data || result;

        const dashTotalAmount = document.getElementById('dashTotalAmount');
        if (dashTotalAmount) dashTotalAmount.textContent = '₹' + parseFloat(dashboard.totalAmount).toFixed(2);
        
        const dashVerifiedAmount = document.getElementById('dashVerifiedAmount');
        if (dashVerifiedAmount) dashVerifiedAmount.textContent = '₹' + parseFloat(dashboard.verifiedAmount).toFixed(2);
        
        const dashPendingAmount = document.getElementById('dashPendingAmount');
        if (dashPendingAmount) dashPendingAmount.textContent = '₹' + parseFloat(dashboard.pendingAmount).toFixed(2);

        const statTotalTxn = document.getElementById('statTotalTxn');
        if (statTotalTxn) statTotalTxn.textContent = dashboard.totalTransactions;
        
        const statVerifiedTxn = document.getElementById('statVerifiedTxn');
        if (statVerifiedTxn) statVerifiedTxn.textContent = dashboard.verifiedTransactions;
        
        const statPendingTxn = document.getElementById('statPendingTxn');
        if (statPendingTxn) statPendingTxn.textContent = dashboard.pendingTransactions;

        displayPendingPayments();
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showMessage('Error loading dashboard', 'error');
    }
}

function displayPendingPayments() {
    const pending = allTransactions.filter(t => t.status === 'Pending');
    const container = document.getElementById('pendingPaymentsContent');
    
    if (!container) return;
    
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
                    ${trans.receiptUrl ? `<p style="font-size: 11px;"><a href="${trans.receiptUrl}" target="_blank">📎 View Receipt</a></p>` : ''}
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
// VERIFICATION MODAL - FIXED
// ==========================================

function openVerificationModal(txnId, name, amount, type, date, phone) {
    console.log('Opening verification modal for:', txnId);
    
    // Ensure modal elements exist and set their values safely
    const modalTxnId = document.getElementById('modalTxnId');
    const modalTxnName = document.getElementById('modalTxnName');
    const modalTxnAmount = document.getElementById('modalTxnAmount');
    const modalTxnType = document.getElementById('modalTxnType');
    const modalTxnDate = document.getElementById('modalTxnDate');
    
    if (!modalTxnId || !modalTxnName || !modalTxnAmount || !modalTxnType || !modalTxnDate) {
        console.error('Modal elements not found in DOM');
        showMessage('Error: Modal elements not initialized', 'error');
        return;
    }
    
    modalTxnId.textContent = txnId || '';
    modalTxnName.textContent = name || '';
    modalTxnAmount.textContent = amount || '0';
    modalTxnType.textContent = type || '';
    modalTxnDate.textContent = date || '';

    currentVerificationModal = {
        transactionId: txnId,
        residentName: name,
        amount: amount,
        phone: phone
    };

    const modal = document.getElementById('verificationModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        console.log('Modal opened successfully');
    } else {
        console.error('Modal or overlay element not found');
        showMessage('Error: Modal not found', 'error');
    }
}

function closeVerificationModal() {
    const modal = document.getElementById('verificationModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    
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

            // Send WhatsApp notification option
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
    const whatsappLink = `https://wa.me/${data.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Optional: Show WhatsApp button
    const confirmed = confirm(`Send WhatsApp confirmation to ${data.residentName}?\n\nMessage: ${message}`);
    if (confirmed) {
        window.open(whatsappLink, '_blank');
    }
}

// ==========================================
// ADMIN UNLOCK & LOGOUT - FIXED
// ==========================================

function unlockAdmin() {
    const treasurerName = document.getElementById('treasurerName').value.trim();
    const treasurerPassword = document.getElementById('treasurerPassword').value.trim();
    
    if (!treasurerName) {
        showMessage('Please enter your name', 'error');
        return;
    }

    if (!treasurerPassword) {
        showMessage('Please enter password', 'error');
        return;
    }

    if (treasurerPassword !== ADMIN_PASSWORD) {
        showMessage('✗ Invalid password', 'error');
        return;
    }

    currentTreasurerName = treasurerName;
    adminMode = true;
    
    const authSection = document.getElementById('adminAuthSection');
    const adminContent = document.getElementById('adminContent');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (authSection) authSection.style.display = 'none';
    if (adminContent) adminContent.classList.remove('hidden');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    loadAdminDashboard();
    showMessage(`✓ Welcome, ${treasurerName}!`, 'success');
}

function logoutAdmin() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) return;

    adminMode = false;
    currentTreasurerName = '';
    
    // Reset form
    const treasurerName = document.getElementById('treasurerName');
    if (treasurerName) treasurerName.value = '';
    
    const treasurerPassword = document.getElementById('treasurerPassword');
    if (treasurerPassword) treasurerPassword.value = '';
    
    // Hide admin content
    const adminContent = document.getElementById('adminContent');
    const authSection = document.getElementById('adminAuthSection');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (adminContent) adminContent.classList.add('hidden');
    if (authSection) authSection.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    showMessage('✓ Logged out successfully', 'success');
}

// ==========================================
// REPORT FUNCTIONS
// ==========================================

function showReport(reportType) {
    console.log('Showing report:', reportType);
    
    // Hide all reports
    const allReports = document.querySelectorAll('.report-section');
    allReports.forEach(section => {
        section.classList.add('hidden');
    });

    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.report-tab-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected report
    const reportSection = document.getElementById(reportType + 'Report');
    if (reportSection) {
        reportSection.classList.remove('hidden');
    }

    // Add active class to clicked button
    const activeButton = document.querySelector(`.report-tab-btn[data-report="${reportType}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Load report data if needed
    if (reportType === 'datewise') {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const reportStartDate = document.getElementById('reportStartDate');
        const reportEndDate = document.getElementById('reportEndDate');
        if (reportStartDate) reportStartDate.valueAsDate = firstDay;
        if (reportEndDate) reportEndDate.valueAsDate = today;
    } else if (reportType === 'pending') {
        displayPendingPayments();
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
        
        // Extract data from the response object
        const report = result.data || result;

        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th>Date</th><th>Total (₹)</th><th>Count</th><th>Verified</th><th>Details</th></tr></thead><tbody>';
        
        let totalSum = 0;
        let totalCount = 0;
        let totalVerified = 0;

        for (const [date, data] of Object.entries(report)) {
            html += `<tr>
                <td>${date}</td>
                <td>₹${parseFloat(data.total).toFixed(2)}</td>
                <td>${data.count}</td>
                <td>${data.verified}</td>
                <td><button class="btn-sm" onclick="showDatewiseDetails('${date}', '${startDate}', '${endDate}')">View</button></td>
            </tr>`;
            totalSum += data.total;
            totalCount += data.count;
            totalVerified += data.verified;
        }

        html += `<tr style="font-weight: bold; border-top: 2px solid #ccc;"><td>TOTAL</td><td>₹${totalSum.toFixed(2)}</td><td>${totalCount}</td><td>${totalVerified}</td><td></td></tr>`;
        html += '</tbody></table>';

        const datewiseReportContent = document.getElementById('datewiseReportContent');
        if (datewiseReportContent) datewiseReportContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading date-wise report:', error);
        showMessage('Error loading report', 'error');
    }
}

function showDatewiseDetails(date, startDate, endDate) {
    const detailsArray = allTransactions.filter(t => {
        const txnDate = new Date(t.date.split('-').reverse().join('-'));
        const targetDate = new Date(date.split('-').reverse().join('-'));
        return txnDate.toDateString() === targetDate.toDateString();
    });

    let html = `<h4>Transactions on ${date}</h4>`;
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr><th>Name</th><th>Amount</th><th>Type</th><th>Status</th><th>Receipt</th></tr></thead><tbody>';

    detailsArray.forEach(trans => {
        html += `<tr>
            <td>${trans.name}</td>
            <td>₹${parseFloat(trans.amount).toFixed(2)}</td>
            <td>${trans.type}</td>
            <td>${trans.status}</td>
            <td>${trans.receiptUrl ? `<a href="${trans.receiptUrl}" target="_blank">📎 View</a>` : '-'}</td>
        </tr>`;
    });

    html += '</tbody></table>';

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.backgroundColor = '#f9fafb';
    container.style.padding = '15px';
    container.style.borderRadius = '8px';
    container.style.marginTop = '15px';

    const datewiseReportContent = document.getElementById('datewiseReportContent');
    if (datewiseReportContent) {
        datewiseReportContent.appendChild(container);
    }
}

async function loadMonthwiseReport() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getMonthwiseReport`);
        const result = await response.json();
        
        // Extract data from the response object
        const report = result.data || result;

        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th>Month</th><th>Total (₹)</th><th>Count</th><th>Details</th></tr></thead><tbody>';
        
        let totalSum = 0;
        let totalCount = 0;

        for (const [month, data] of Object.entries(report)) {
            html += `<tr>
                <td>${month}</td>
                <td>₹${parseFloat(data.total).toFixed(2)}</td>
                <td>${data.count}</td>
                <td><button class="btn-sm" onclick="showMonthwiseDetails('${month}')">View</button></td>
            </tr>`;
            totalSum += data.total;
            totalCount += data.count;
        }

        html += `<tr style="font-weight: bold; border-top: 2px solid #ccc;"><td>TOTAL</td><td>₹${totalSum.toFixed(2)}</td><td>${totalCount}</td><td></td></tr>`;
        html += '</tbody></table>';

        const monthwiseReportContent = document.getElementById('monthwiseReportContent');
        if (monthwiseReportContent) monthwiseReportContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading month-wise report:', error);
        showMessage('Error loading report', 'error');
    }
}

function showMonthwiseDetails(month) {
    const detailsArray = allTransactions.filter(t => t.monthYear === month && t.status === 'Verified' && t.type === 'Monthly Fee');

    let html = `<h4>Monthly Fee Collection - ${month}</h4>`;
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr><th>Resident Name</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>';

    let totalAmount = 0;
    detailsArray.forEach(trans => {
        totalAmount += parseFloat(trans.amount);
        html += `<tr>
            <td>${trans.name}</td>
            <td>₹${parseFloat(trans.amount).toFixed(2)}</td>
            <td>${trans.status}</td>
            <td>${trans.receiptUrl ? `<a href="${trans.receiptUrl}" target="_blank">📎 View</a>` : '-'}</td>
        </tr>`;
    });

    html += `<tr style="font-weight: bold;"><td>TOTAL</td><td>₹${totalAmount.toFixed(2)}</td><td></td><td></td></tr>`;
    html += '</tbody></table>';

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.backgroundColor = '#f9fafb';
    container.style.padding = '15px';
    container.style.borderRadius = '8px';
    container.style.marginTop = '15px';

    const monthwiseReportContent = document.getElementById('monthwiseReportContent');
    if (monthwiseReportContent) {
        monthwiseReportContent.appendChild(container);
    }
}

async function loadNamewiseReport() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getNamewiseReport`);
        const result = await response.json();
        
        // Extract data from the response object
        const report = result.data || result;

        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th>Name</th><th>Monthly Fees (₹)</th><th>Donations (₹)</th><th>Total (₹)</th><th>Details</th></tr></thead><tbody>';
        
        let totalFees = 0;
        let totalDonations = 0;
        let totalSum = 0;

        for (const [name, data] of Object.entries(report)) {
            html += `<tr>
                <td>${name}</td>
                <td>₹${parseFloat(data.monthlyFees).toFixed(2)}</td>
                <td>₹${parseFloat(data.donations).toFixed(2)}</td>
                <td>₹${parseFloat(data.total).toFixed(2)}</td>
                <td><button class="btn-sm" onclick="showNamewiseDetails('${name}')">View</button></td>
            </tr>`;
            totalFees += data.monthlyFees;
            totalDonations += data.donations;
            totalSum += data.total;
        }

        html += `<tr style="font-weight: bold; border-top: 2px solid #ccc;"><td>TOTAL</td><td>₹${totalFees.toFixed(2)}</td><td>₹${totalDonations.toFixed(2)}</td><td>₹${totalSum.toFixed(2)}</td><td></td></tr>`;
        html += '</tbody></table>';

        const namewiseReportContent = document.getElementById('namewiseReportContent');
        if (namewiseReportContent) namewiseReportContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading name-wise report:', error);
        showMessage('Error loading report', 'error');
    }
}

function showNamewiseDetails(name) {
    const detailsArray = allTransactions.filter(t => t.name === name && t.status === 'Verified');

    let html = `<h4>Transaction Details - ${name}</h4>`;
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr><th>Date</th><th>Amount</th><th>Type</th><th>Category</th><th>Receipt</th></tr></thead><tbody>';

    let monthlyFeesTotal = 0;
    let donationsTotal = 0;

    detailsArray.forEach(trans => {
        const category = trans.type === 'Monthly Fee' ? trans.monthYear : trans.purpose;
        if (trans.type === 'Monthly Fee') {
            monthlyFeesTotal += parseFloat(trans.amount);
        } else {
            donationsTotal += parseFloat(trans.amount);
        }
        html += `<tr>
            <td>${trans.date}</td>
            <td>₹${parseFloat(trans.amount).toFixed(2)}</td>
            <td>${trans.type}</td>
            <td>${category}</td>
            <td>${trans.receiptUrl ? `<a href="${trans.receiptUrl}" target="_blank">📎 View</a>` : '-'}</td>
        </tr>`;
    });

    html += `<tr style="font-weight: bold;"><td colspan="2">Monthly Fees: ₹${monthlyFeesTotal.toFixed(2)} | Donations: ₹${donationsTotal.toFixed(2)}</td><td colspan="3">Total: ₹${(monthlyFeesTotal + donationsTotal).toFixed(2)}</td></tr>`;
    html += '</tbody></table>';

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.backgroundColor = '#f9fafb';
    container.style.padding = '15px';
    container.style.borderRadius = '8px';
    container.style.marginTop = '15px';

    const namewiseReportContent = document.getElementById('namewiseReportContent');
    if (namewiseReportContent) {
        namewiseReportContent.appendChild(container);
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
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = now.toLocaleString('en-IN');
    }
}

function viewTransactionDetails(txnId) {
    const trans = allTransactions.find(t => t.transactionId === txnId);
    if (trans) {
        let detailsMsg = `Transaction Details:\n\nID: ${trans.transactionId}\nName: ${trans.name}\nAmount: ₹${trans.amount}\nType: ${trans.type}\nStatus: ${trans.status}\nDate: ${trans.date}`;
        if (trans.receiptUrl) {
            const confirmed = confirm(detailsMsg + `\n\n📎 View Receipt?`);
            if (confirmed) {
                window.open(trans.receiptUrl, '_blank');
            }
        } else {
            alert(detailsMsg);
        }
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
    .pending-info a {
        color: #0ea5e9;
        text-decoration: none;
    }
    .pending-info a:hover {
        text-decoration: underline;
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
