// Local Storage key
const STORAGE_KEY = 'techMeetingRegistrations';
const MEETINGS_STORAGE_KEY = 'techMeetingSelections';
const QR_IMAGE_STORAGE_KEY = 'techMeetingQrImage';
const QR_DEFAULT_SRC = 'phonepe-qr.png';

// Available meetings
const MEETINGS = [
    {
        id: 1,
        city: 'Hyderabad',
        date: '1-1-2026',
        displayDate: 'January 1, 2026'
    },
    {
        id: 2,
        city: 'Vijayawada',
        date: '2-1-2026',
        displayDate: 'January 2, 2026'
    }
];

// Get all registrations from local storage
function getRegistrations() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save registrations to local storage
function saveRegistrations(registrations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
}

// Get meeting selections for a participant
function getMeetingSelections(email) {
    const data = localStorage.getItem(MEETINGS_STORAGE_KEY);
    const selections = data ? JSON.parse(data) : {};
    return selections[email] || [];
}

// Save meeting selections for a participant
function saveMeetingSelections(email, selectedMeetings) {
    const data = localStorage.getItem(MEETINGS_STORAGE_KEY);
    const selections = data ? JSON.parse(data) : {};
    selections[email] = selectedMeetings;
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(selections));
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[0-9\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
    return phoneRegex;
}

// Clear error messages
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.textContent = '');
}

// Display error messages
function displayError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Validate form
function validateForm(formData) {
    clearErrors();
    let isValid = true;

    // Full Name validation
    if (!formData.fullName.trim()) {
        displayError('nameError', 'Full name is required');
        isValid = false;
    } else if (formData.fullName.trim().length < 2) {
        displayError('nameError', 'Full name must be at least 2 characters');
        isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
        displayError('emailError', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(formData.email)) {
        displayError('emailError', 'Please enter a valid email address');
        isValid = false;
    }

    // Company validation
    if (!formData.company.trim()) {
        displayError('companyError', 'Company/Organization is required');
        isValid = false;
    }

    // Job Title validation
    if (!formData.jobTitle.trim()) {
        displayError('jobTitleError', 'Job title/role is required');
        isValid = false;
    }

    // Phone validation
    if (formData.phone && !isValidPhone(formData.phone)) {
        displayError('phoneError', 'Please enter a valid phone number');
        isValid = false;
    }

    // Terms validation
    if (!formData.terms) {
        displayError('termsError', 'You must agree to the terms and conditions');
        isValid = false;
    }

    return isValid;
}

// Format date for display
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Create participant card HTML
function createParticipantCard(participant, index) {
    const meetings = getMeetingSelections(participant.email);
    const meetingsHtml = meetings.length > 0 
        ? `<div class="participant-detail"><strong>Selected Meetings:</strong> ${meetings.map(m => m.city + ' (' + m.date + ')').join(', ')}</div>`
        : `<div class="participant-detail"><strong>Selected Meetings:</strong> None</div>`;
    
    return `
        <div class="participant-card">
            <div class="participant-info">
                <div class="participant-name">${escapeHtml(participant.fullName)}</div>
                <div class="participant-detail"><strong>Email:</strong> ${escapeHtml(participant.email)}</div>
                <div class="participant-detail"><strong>Company:</strong> ${escapeHtml(participant.company)}</div>
                <div class="participant-detail"><strong>Role:</strong> ${escapeHtml(participant.jobTitle)}</div>
                ${participant.dietary ? `<div class="participant-detail"><strong>Diet:</strong> ${participant.dietary}</div>` : ''}
                ${meetingsHtml}
                <div class="participant-detail"><strong>Registered:</strong> ${formatDate(participant.registeredAt)}</div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-remove" onclick="removeParticipant(${index})">Remove</button>
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Render participants list
function renderParticipants() {
    const registrations = getRegistrations();
    const participantsList = document.getElementById('participantsList');
    const participantCount = document.getElementById('participantCount');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    participantCount.textContent = registrations.length;

    if (registrations.length === 0) {
        participantsList.innerHTML = '<p class="no-data">No participants registered yet.</p>';
        exportBtn.style.display = 'none';
        clearAllBtn.style.display = 'none';
    } else {
        participantsList.innerHTML = registrations.map((p, i) => createParticipantCard(p, i)).join('');
        exportBtn.style.display = 'inline-block';
        clearAllBtn.style.display = 'inline-block';
    }
}

// Remove a participant
function removeParticipant(index) {
    if (confirm('Are you sure you want to remove this participant?')) {
        const registrations = getRegistrations();
        registrations.splice(index, 1);
        saveRegistrations(registrations);
        renderParticipants();
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to delete all registrations? This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('registrationForm').reset();
        renderParticipants();
    }
}

// Export to CSV
function exportToCSV() {
    const registrations = getRegistrations();
    
    if (registrations.length === 0) {
        alert('No data to export');
        return;
    }

    // Prepare CSV headers
    const headers = ['Full Name', 'Email', 'Company', 'Job Title', 'Phone', 'Dietary Preference', 'Comments', 'Registered Date'];
    
    // Prepare CSV rows
    const rows = registrations.map(p => [
        p.fullName,
        p.email,
        p.company,
        p.jobTitle,
        p.phone || '',
        p.dietary || '',
        p.comments || '',
        formatDate(p.registeredAt)
    ]);

    // Create CSV content
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    csvContent += rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tech-meeting-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle form submission
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        jobTitle: document.getElementById('jobTitle').value,
        phone: document.getElementById('phone').value,
        dietary: document.getElementById('dietary').value,
        comments: document.getElementById('comments').value,
        terms: document.getElementById('termsCheckbox').checked,
        registeredAt: new Date().toISOString()
    };

    // Validate form
    if (!validateForm(formData)) {
        return;
    }

    // Check for duplicate email
    const registrations = getRegistrations();
    if (registrations.some(r => r.email.toLowerCase() === formData.email.toLowerCase())) {
        displayError('emailError', 'This email is already registered');
        return;
    }

    // Save registration
    registrations.push(formData);
    saveRegistrations(registrations);

    // Reset form
    this.reset();
    clearErrors();

    // Update participants list
    renderParticipants();

    // Show meetings modal
    showMeetingsModal(formData.email);
});

// Modal functions
function showMeetingsModal(email) {
    const modal = document.getElementById('meetingsModal');
    const overlay = document.getElementById('modalOverlay');
    const meetingsGrid = document.getElementById('meetingsGrid');

    // Populate meetings grid
    meetingsGrid.innerHTML = MEETINGS.map((meeting, index) => {
        const savedSelections = getMeetingSelections(email);
        const isSelected = savedSelections.some(m => m.id === meeting.id);
        
        return `
            <div class="meeting-card ${isSelected ? 'selected' : ''}">
                <div class="meeting-info">
                    <div class="meeting-city">${meeting.city}</div>
                    <div class="meeting-date">
                        <span class="meeting-date-icon">📅</span>
                        <span>${meeting.displayDate}</span>
                    </div>
                </div>
                <div class="meeting-actions">
                    <button class="btn btn-primary btn-small" onclick="handlePayNow(event, '${email}', ${meeting.id})">💳 Pay Now</button>
                </div>
            </div>
        `;
    }).join('');

    // Show modal and overlay
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');

    // Store current email for selection
    document.getElementById('meetingsModal').dataset.userEmail = email;

    // Store original alert behavior
    window.currentRegistrationEmail = email;
}


function closeMeetingsModal() {
    const modal = document.getElementById('meetingsModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function toggleMeetingSelection(card, meetingId, email) {
    card.classList.toggle('selected');
    const checkbox = card.querySelector('.meeting-checkbox');
    checkbox.checked = !checkbox.checked;

    // Get current selections
    let selections = getMeetingSelections(email);
    
    // Toggle selection
    if (checkbox.checked) {
        // Add meeting if not already there
        if (!selections.some(m => m.id === meetingId)) {
            const meeting = MEETINGS.find(m => m.id === meetingId);
            selections.push(meeting);
        }
    } else {
        // Remove meeting
        selections = selections.filter(m => m.id !== meetingId);
    }

    // Save selections
    saveMeetingSelections(email, selections);
}

// Handle Pay Now button click
function handlePayNow(event, email, meetingId) {
    event.preventDefault();
    event.stopPropagation();
    
    // First, select the meeting if not already selected
    let selections = getMeetingSelections(email);
    if (!selections.some(m => m.id === meetingId)) {
        const meeting = MEETINGS.find(m => m.id === meetingId);
        selections.push(meeting);
        saveMeetingSelections(email, selections);
        
        // Refresh the meetings modal to show updated selection
        showMeetingsModal(email);
    }
    
    // Then show payment modal
    showPaymentQRModal(event, email, meetingId);
}

// Payment Flow Functions
function showPaymentQRModal(event, email, meetingId) {
    event.preventDefault();
    event.stopPropagation();
    
    const meeting = MEETINGS.find(m => m.id === meetingId);
    const modal = document.getElementById('qrCodeModal');
    const overlay = document.getElementById('modalOverlay');
    
    document.getElementById('meetingPaymentInfo').textContent = `Payment for ${meeting.city} Tech Meeting`;
    
    // Store current payment info
    document.getElementById('qrCodeModal').dataset.userEmail = email;
    document.getElementById('qrCodeModal').dataset.meetingId = meetingId;
    const stored = localStorage.getItem(QR_IMAGE_STORAGE_KEY);
    const img = document.getElementById('qrCodeImage') || document.querySelector('#qrCodePlaceholder .qr-image');
    if (img) {
        const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='white'/%3E%3Crect x='10' y='10' width='280' height='280' fill='white' stroke='%23e5e7eb' stroke-width='2'/%3E%3Ctext x='150' y='150' font-size='48' text-anchor='middle' dominant-baseline='middle' fill='%232563eb' font-weight='bold'%3E%F0%9F%94%90%3C/text%3E%3Ctext x='150' y='200' font-size='14' text-anchor='middle' fill='%236b7280'%3EPhonePe QR Code%3C/text%3E%3C/svg%3E";
        img.src = stored || QR_DEFAULT_SRC;
        img.onerror = function() { img.src = placeholder; };
    }
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeQRModal() {
    const modal = document.getElementById('qrCodeModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function proceedToReceipt() {
    closeQRModal();
    showReceiptUploadModal();
}

function showReceiptUploadModal() {
    const modal = document.getElementById('receiptUploadModal');
    const overlay = document.getElementById('modalOverlay');
    
    // Reset file input
    document.getElementById('receiptFile').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('submitReceiptBtn').disabled = true;
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptUploadModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function submitReceipt() {
    const fileInput = document.getElementById('receiptFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a receipt image');
        return;
    }
    
    closeReceiptModal();
    generateMeetingReceipt();
}

function generateMeetingReceipt() {
    const qrModal = document.getElementById('qrCodeModal');
    const email = qrModal.dataset.userEmail;
    const meetingId = parseInt(qrModal.dataset.meetingId);
    const meeting = MEETINGS.find(m => m.id === meetingId);
    
    // Get participant info
    const registrations = getRegistrations();
    const participant = registrations.find(r => r.email === email);
    
    if (!participant || !meeting) return;
    
    // Generate unique receipt number
    const receiptNumber = 'TM' + new Date().getFullYear() + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Create receipt HTML
    const receiptHTML = `
        <div class="receipt-section">
            <div class="receipt-title">Receipt Number</div>
            <div class="receipt-item">
                <span class="receipt-item-label">Receipt ID:</span>
                <span class="receipt-item-value">${receiptNumber}</span>
            </div>
        </div>
        
        <div class="receipt-section">
            <div class="receipt-title">Event Details</div>
            <div class="receipt-item">
                <span class="receipt-item-label">Event:</span>
                <span>${meeting.city} Tech Meeting</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Date:</span>
                <span>${meeting.displayDate}</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Location:</span>
                <span>${meeting.city}, India</span>
            </div>
        </div>
        
        <div class="receipt-section">
            <div class="receipt-title">Participant Information</div>
            <div class="receipt-item">
                <span class="receipt-item-label">Name:</span>
                <span>${participant.fullName}</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Email:</span>
                <span>${participant.email}</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Company:</span>
                <span>${participant.company}</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Role:</span>
                <span>${participant.jobTitle}</span>
            </div>
        </div>
        
        <div class="receipt-section">
            <div class="receipt-title">Payment Information</div>
            <div class="receipt-item">
                <span class="receipt-item-label">Amount Paid:</span>
                <span class="receipt-item-value">₹500</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Payment Date:</span>
                <span>${formatDate(new Date())}</span>
            </div>
            <div class="receipt-item">
                <span class="receipt-item-label">Payment Status:</span>
                <span style="color: var(--success-color); font-weight: 600;">✓ Confirmed</span>
            </div>
        </div>
        
        <div class="receipt-confirmation">
            <div class="receipt-confirmation-text">
                <span>✓</span>
                <span>Payment Verified & Confirmed</span>
            </div>
        </div>
        
        <div class="receipt-footer">
            <p>This is an official receipt for your registration and payment.</p>
            <p>Please keep this receipt for your records.</p>
            <p style="margin-top: 15px; font-size: 0.85em;">Generated on ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    document.getElementById('receiptContent').innerHTML = receiptHTML;
    
    // Store receipt data for download
    window.currentReceipt = {
        number: receiptNumber,
        participant: participant,
        meeting: meeting,
        amount: 500,
        date: new Date().toLocaleString()
    };
    
    showMeetingReceiptModal();
}

function showMeetingReceiptModal() {
    const modal = document.getElementById('meetingReceiptModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeMeetingReceiptModal() {
    const modal = document.getElementById('meetingReceiptModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function handleOverlayClick() {
    // Prevent closing modals by clicking overlay
    return false;
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Meeting Receipt</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .receipt-header h2 { color: #16a34a; font-size: 1.5em; }
                .receipt-section { margin-bottom: 20px; page-break-inside: avoid; }
                .receipt-title { font-weight: bold; text-transform: uppercase; font-size: 0.9em; margin-bottom: 10px; color: #666; }
                .receipt-item { display: flex; justify-content: space-between; padding: 8px 0; }
                .receipt-confirmation { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .receipt-footer { text-align: center; border-top: 2px dashed #ccc; padding-top: 20px; margin-top: 20px; color: #666; font-size: 0.9em; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h2>Meeting Confirmation Receipt</h2>
                <p>Tech Meeting 2025</p>
            </div>
            ${receiptContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadReceipt() {
    if (!window.currentReceipt) return;
    
    const receipt = window.currentReceipt;
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Tech Meeting Receipt</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 40px; background: #f3f4f6; }
                .receipt-container { background: white; padding: 40px; border-radius: 8px; max-width: 700px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                .receipt-header { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; }
                .receipt-header h2 { color: #16a34a; font-size: 1.8em; margin-bottom: 10px; }
                .receipt-section { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                .receipt-section:last-child { border-bottom: none; }
                .receipt-title { font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: bold; margin-bottom: 12px; }
                .receipt-item { display: flex; justify-content: space-between; padding: 10px 0; }
                .receipt-item-label { font-weight: 500; }
                .receipt-item-value { color: #2563eb; font-weight: 600; }
                .receipt-confirmation { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; margin: 15px 0; }
                .receipt-confirmation-text { color: #16a34a; font-weight: 600; }
                .receipt-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #ddd; color: #999; font-size: 0.9em; }
                @media print { body { padding: 0; background: white; } .receipt-container { box-shadow: none; margin: 0; } }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="receipt-header">
                    <h2>Meeting Confirmation Receipt</h2>
                    <p>Tech Meeting 2025</p>
                </div>
                ${receiptContent}
            </div>
        </body>
        </html>
    `;
    
    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${receipt.number}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}



// Handle clear all button
document.getElementById('clearAllBtn').addEventListener('click', clearAllData);

// File Upload Handler
const uploadArea = document.getElementById('uploadArea');
const receiptFile = document.getElementById('receiptFile');
const uploadPreview = document.getElementById('uploadPreview');
const submitReceiptBtn = document.getElementById('submitReceiptBtn');

uploadArea.addEventListener('click', () => receiptFile.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.background = 'rgba(37, 99, 235, 0.05)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'var(--light-bg)';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'var(--light-bg)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        receiptFile.files = files;
        handleFileUpload(files[0]);
    }
});

receiptFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

function handleFileUpload(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image or PDF file');
        receiptFile.value = '';
        return;
    }
    
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        receiptFile.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImage = document.getElementById('previewImage');
        const uploadedFileName = document.getElementById('uploadedFileName');
        
        if (file.type.startsWith('image/')) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        } else {
            previewImage.style.display = 'none';
        }
        
        uploadedFileName.textContent = `File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        uploadPreview.style.display = 'block';
        submitReceiptBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function triggerQrUpload() {
    const input = document.getElementById('qrImageFile');
    if (input) input.click();
}

const qrImageFileInput = document.getElementById('qrImageFile');
if (qrImageFileInput) {
    qrImageFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            localStorage.setItem(QR_IMAGE_STORAGE_KEY, ev.target.result);
            const img = document.getElementById('qrCodeImage') || document.querySelector('#qrCodePlaceholder .qr-image');
            if (img) img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

document.addEventListener('paste', function(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (!file || !file.type.startsWith('image/')) continue;
            const reader = new FileReader();
            reader.onload = (ev) => {
                localStorage.setItem(QR_IMAGE_STORAGE_KEY, ev.target.result);
                const img = document.getElementById('qrCodeImage');
                if (img) img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            break;
        }
    }
});

// Initial render
document.addEventListener('DOMContentLoaded', function() {
    renderParticipants();
});

