// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Global variables
let currentSection = 'overview';
let currentUser = null;
let drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
let terminations = JSON.parse(localStorage.getItem('terminations') || '[]');
let admins = JSON.parse(localStorage.getItem('admins') || '[]');
let staff = JSON.parse(localStorage.getItem('staff') || '[]');

// Initialize default admin if none exists
if (admins.length === 0) {
    admins.push({
        fullName: 'Wilson Baraka',
        username: 'admin',
        email: 'admin@onafrica.com',
        phone: '0750507765',
        password: 'admin123',
        role: 'admin',
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active'
    });
    admins.push({
        fullName: 'Wilson Mkuu',
        username: 'wilson',
        email: 'wilson@onafrica.com',
        phone: '0712345678',
        password: '123456',
        role: 'admin',
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active'
    });
    localStorage.setItem('admins', JSON.stringify(admins));
} else {
    // Add wilson if not present
    if (!admins.some(a => a.username === 'wilson')) {
        admins.push({
            fullName: 'Wilson Mkuu',
            username: 'wilson',
            email: 'wilson@onafrica.com',
            phone: '0712345678',
            password: '123456',
            role: 'admin',
            registrationDate: new Date().toISOString().split('T')[0],
            status: 'active'
        });
        localStorage.setItem('admins', JSON.stringify(admins));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    // Hide driver registration for non-admins
    const registerSection = document.getElementById('register');
    const registerBtn = document.getElementById('registerDriverBtn');
    const registerInfo = document.getElementById('registerInfo');
    if (registerBtn && registerInfo) {
        if (!currentUser || currentUser.role !== 'admin') {
            registerBtn.disabled = true;
            registerInfo.style.display = '';
        } else {
            registerBtn.disabled = false;
            registerInfo.style.display = 'none';
        }
    }
    updateStats();
    loadRecentActivity();
    setupStaffEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Admin registration form
    document.getElementById('adminRegisterForm').addEventListener('submit', handleAdminRegistration);
    
    // Form switching
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });
    
    // Driver registration form
    document.getElementById('driverForm').addEventListener('submit', handleDriverRegistration);
    
    // Search functionality
    document.getElementById('searchDrivers').addEventListener('input', filterDrivers);
    
    // Termination modal
    document.getElementById('addTerminationBtn').addEventListener('click', showTerminationModal);
    document.getElementById('terminationForm').addEventListener('submit', handleTermination);
    
    // Admin management
    document.getElementById('addAdminBtn').addEventListener('click', showAdminModal);
    document.getElementById('adminModalForm').addEventListener('submit', handleAdminModalRegistration);
    
    // Modal close
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeAllModals);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Form switching functionality
function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('register-form-container').style.display = 'block';
}

function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('register-form-container').style.display = 'none';
    document.getElementById('login-form-container').style.display = 'block';
}

// Login functionality
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('loginMessage');
    
    // Check against admins array
    const admin = admins.find(a => a.username === username && a.password === password && a.status === 'active');
    
    if (admin) {
        currentUser = admin;
        showDashboard();
        messageElement.textContent = '';
        document.getElementById('currentUser').textContent = admin.fullName;
    } else {
        messageElement.textContent = 'Jina la mtumiaji au neno la siri si sahihi!';
        messageElement.className = 'message error';
    }
}

function showDashboard() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('dashboard-section').classList.add('active');
    switchSection('overview');
}

function handleLogout() {
    currentUser = null;
    document.getElementById('dashboard-section').classList.remove('active');
    document.getElementById('login-section').classList.add('active');
    document.getElementById('loginForm').reset();
    document.getElementById('loginMessage').textContent = '';
    showLoginForm({ preventDefault: () => {} });
}

// Admin registration functionality
function handleAdminRegistration(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('regFullName').value,
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value,
        confirmPassword: document.getElementById('regConfirmPassword').value,
        role: document.getElementById('regRole').value,
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active'
    };
    
    // Validation
    if (!validateAdminData(formData)) {
        return;
    }
    
    // Check if username already exists
    if (admins.some(admin => admin.username === formData.username)) {
        showRegisterMessage('Jina la mtumiaji tayari limetumika!', 'error');
        return;
    }
    
    // Check if email already exists
    if (admins.some(admin => admin.email === formData.email)) {
        showRegisterMessage('Barua pepe tayari imetumika!', 'error');
        return;
    }
    
    // Add admin (remove confirmPassword from data)
    const { confirmPassword, ...adminData } = formData;
    admins.push(adminData);
    saveAdmins();
    
    // Reset form and show success message
    document.getElementById('adminRegisterForm').reset();
    showRegisterMessage('Usajili wa msimamizi umefanikiwa! Unaweza kuingia sasa.', 'success');
    
    // Switch back to login form after 2 seconds
    setTimeout(() => {
        showLoginForm({ preventDefault: () => {} });
    }, 2000);
}

function validateAdminData(data) {
    const requiredFields = ['fullName', 'username', 'email', 'phone', 'password', 'confirmPassword', 'role'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showRegisterMessage('Tafadhali jaza sehemu zote muhimu.', 'error');
            return false;
        }
    }
    
    // Check password confirmation
    if (data.password !== data.confirmPassword) {
        showRegisterMessage('Neno la siri na uthibitisho wake hazifanani.', 'error');
        return false;
    }
    
    // Check password length
    if (data.password.length < 6) {
        showRegisterMessage('Neno la siri lazima liwe na herufi 6 au zaidi.', 'error');
        return false;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showRegisterMessage('Tafadhali weka barua pepe sahihi.', 'error');
        return false;
    }
    
    return true;
}

function showRegisterMessage(message, type) {
    const messageElement = document.getElementById('registerMessage');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

// Navigation functionality
function switchSection(sectionName) {
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.dashboard-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    currentSection = sectionName;
    
    // Load section-specific content
    switch(sectionName) {
        case 'overview':
            updateStats();
            loadRecentActivity();
            break;
        case 'drivers':
            loadDriversTable();
            break;
        case 'terminations':
            loadTerminationsTable();
            break;
        case 'admins':
            loadAdminsTable();
            break;
        case 'staff':
            loadStaffTable();
            break;
    }
}

// Driver registration functionality
function handleDriverRegistration(e) {
    e.preventDefault();
    const photoInput = document.getElementById('driverPhoto');
    const nidaNumber = document.getElementById('nidaNumber').value;
    const formData = {
        name: document.getElementById('fullname').value,
        license: document.getElementById('license').value,
        licenseExpiry: document.getElementById('licenseExpiry').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        vehicleType: document.getElementById('vehicleType').value,
        address: document.getElementById('address').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        nidaNumber: nidaNumber,
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active',
        registeredBy: currentUser ? currentUser.username : 'admin',
        photo: ''
    };
    // Handle photo upload (as base64)
    if (photoInput && photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            formData.photo = evt.target.result;
            saveDriverAndGenerateCertificate(formData);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveDriverAndGenerateCertificate(formData);
    }
}

function saveDriverAndGenerateCertificate(formData) {
    // Validation
    if (!validateDriverData(formData)) {
        return;
    }
    // Check if driver already exists
    if (drivers.some(driver => driver.license === formData.license)) {
        showMessage('Dereva na leseni hii tayari amesajiliwa!', 'error');
        return;
    }
    // Add driver
    drivers.push(formData);
    saveDrivers();
    // Generate PDF certificate
    generateDriverCertificate(formData);
    // Reset form and show success message
    document.getElementById('driverForm').reset();
    showMessage('Usajili wa dereva umefanikiwa! Cheti kimeundwa.', 'success');
    // Update stats and recent activity
    updateStats();
    loadRecentActivity();
}

function validateDriverData(data) {
    const requiredFields = ['name', 'license', 'licenseExpiry', 'phone', 'email', 'vehicleType', 'address', 'emergencyContact'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showMessage('Tafadhali jaza sehemu zote muhimu.', 'error');
            return false;
        }
    }
    
    // Check license expiry
    const expiryDate = new Date(data.licenseExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate < today) {
        showMessage('Leseni imekwisha muda wake. Tafadhali weka leseni halali.', 'error');
        return false;
    }
    
    return true;
}

function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

// Driver table functionality
function loadDriversTable() {
    const tbody = document.querySelector('#driversTable tbody');
    tbody.innerHTML = '';
    let filteredDrivers = drivers;
    if (!currentUser || currentUser.role !== 'admin') {
        filteredDrivers = drivers.filter(driver => driver.registeredBy === 'admin');
    }
    filteredDrivers.forEach((driver, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${driver.name}</td>
            <td>${driver.license}</td>
            <td class="${getLicenseStatusClass(driver.licenseExpiry)}">${formatDate(driver.licenseExpiry)}</td>
            <td>${driver.phone}</td>
            <td>${driver.email}</td>
            <td>${driver.vehicleType}</td>
            <td>${driver.address}</td>
            <td>
                ${currentUser && currentUser.role === 'admin' ? `
                <button class="action-btn edit-btn" onclick="editDriver(${index})">Hariri</button>
                <button class="action-btn terminate-btn" onclick="terminateDriver(${index})">Acha Kazi</button>
                <button class="action-btn delete-btn" onclick="deleteDriver(${index})">Futa</button>
                ` : '-'}
            </td>
        `;
    });
}

function filterDrivers() {
    const searchTerm = document.getElementById('searchDrivers').value.toLowerCase();
    const tbody = document.querySelector('#driversTable tbody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

function getLicenseStatusClass(expiryDate) {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (expiry < today) {
        return 'status-expired';
    } else if (expiry <= thirtyDaysFromNow) {
        return 'status-warning';
    } else {
        return 'status-active';
    }
}

// Termination functionality
function showTerminationModal() {
    const select = document.getElementById('terminatedDriver');
    select.innerHTML = '<option value="">Chagua dereva</option>';
    
    drivers.forEach((driver, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${driver.name} - ${driver.license}`;
        select.appendChild(option);
    });
    
    document.getElementById('terminationModal').style.display = 'block';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function handleTermination(e) {
    e.preventDefault();
    
    const driverIndex = parseInt(document.getElementById('terminatedDriver').value);
    const terminationDate = document.getElementById('terminationDate').value;
    const reason = document.getElementById('terminationReason').value;
    const details = document.getElementById('terminationDetails').value;
    
    if (driverIndex === '' || !terminationDate || !reason) {
        alert('Tafadhali jaza sehemu zote muhimu.');
        return;
    }
    
    const driver = drivers[driverIndex];
    const termination = {
        driverId: driverIndex,
        driverName: driver.name,
        driverLicense: driver.license,
        terminationDate: terminationDate,
        reason: reason,
        details: details,
        recordedDate: new Date().toISOString().split('T')[0],
        recordedBy: currentUser ? currentUser.username : 'admin'
    };
    
    terminations.push(termination);
    saveTerminations();
    
    // Update driver status
    drivers[driverIndex].status = 'terminated';
    saveDrivers();
    
    closeAllModals();
    updateStats();
    loadRecentActivity();
    loadTerminationsTable();
    
    alert('Taarifa za kuacha kazi zimehifadhiwa.');
}

function loadTerminationsTable() {
    const tbody = document.querySelector('#terminationsTable tbody');
    tbody.innerHTML = '';
    
    terminations.forEach((termination, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${termination.driverName}</td>
            <td>${termination.driverLicense}</td>
            <td>${formatDate(termination.terminationDate)}</td>
            <td>${termination.reason}</td>
            <td>${termination.details || '-'}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteTermination(${index})">Futa</button>
            </td>
        `;
    });
}

// Admin management functionality
function showAdminModal() {
    document.getElementById('adminModal').style.display = 'block';
}

function handleAdminModalRegistration(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('modalFullName').value,
        username: document.getElementById('modalUsername').value,
        email: document.getElementById('modalEmail').value,
        phone: document.getElementById('modalPhone').value,
        password: document.getElementById('modalPassword').value,
        role: document.getElementById('modalRole').value,
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active',
        registeredBy: currentUser ? currentUser.username : 'admin'
    };
    
    // Validation
    if (!validateAdminData({ ...formData, confirmPassword: formData.password })) {
        return;
    }
    
    // Check if username already exists
    if (admins.some(admin => admin.username === formData.username)) {
        alert('Jina la mtumiaji tayari limetumika!');
        return;
    }
    
    // Check if email already exists
    if (admins.some(admin => admin.email === formData.email)) {
        alert('Barua pepe tayari imetumika!');
        return;
    }
    
    // Add admin
    admins.push(formData);
    saveAdmins();
    
    // Reset form and close modal
    document.getElementById('adminModalForm').reset();
    closeAllModals();
    
    // Update stats and reload admin table
    updateStats();
    loadAdminsTable();
    loadRecentActivity();
    
    alert('Msimamizi mpya amesajiliwa kikamilifu!');
}

function loadAdminsTable() {
    const tbody = document.querySelector('#adminsTable tbody');
    tbody.innerHTML = '';
    
    admins.forEach((admin, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${admin.fullName}</td>
            <td>${admin.username}</td>
            <td>${admin.email}</td>
            <td>${admin.phone}</td>
            <td><span class="role-badge role-${admin.role}">${admin.role}</span></td>
            <td>${formatDate(admin.registrationDate)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editAdmin(${index})">Hariri</button>
                <button class="action-btn delete-btn" onclick="deleteAdmin(${index})">Futa</button>
            </td>
        `;
    });
}

// Utility functions
function updateStats() {
    const activeDrivers = drivers.filter(d => d.status !== 'terminated').length;
    const expiringLicenses = drivers.filter(d => {
        const expiry = new Date(d.licenseExpiry);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiry <= thirtyDaysFromNow && expiry >= new Date();
    }).length;
    const activeAdmins = admins.filter(a => a.status === 'active').length;
    
    document.getElementById('totalDrivers').textContent = activeDrivers;
    document.getElementById('totalTerminations').textContent = terminations.length;
    document.getElementById('expiringLicenses').textContent = expiringLicenses;
    document.getElementById('totalAdmins').textContent = activeAdmins;
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    const activities = [];
    
    // Add recent registrations
    drivers.slice(-5).forEach(driver => {
        activities.push({
            type: 'registration',
            text: `Dereva mpya alisajiliwa: ${driver.name}`,
            date: driver.registrationDate
        });
    });
    
    // Add recent terminations
    terminations.slice(-5).forEach(termination => {
        activities.push({
            type: 'termination',
            text: `Dereva aliacha kazi: ${termination.driverName}`,
            date: termination.recordedDate
        });
    });
    
    // Add recent admin registrations
    admins.slice(-5).forEach(admin => {
        activities.push({
            type: 'admin',
            text: `Msimamizi mpya alisajiliwa: ${admin.fullName}`,
            date: admin.registrationDate
        });
    });
    
    // Sort by date and take last 10
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivities = activities.slice(0, 10);
    
    container.innerHTML = recentActivities.map(activity => 
        `<div class="activity-item">
            <span class="activity-text">${activity.text}</span>
            <span class="activity-date">${formatDate(activity.date)}</span>
        </div>`
    ).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ');
}

function generateDriverCertificate(driver) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Header
    doc.setFontSize(20);
    doc.text('On Africa Construction', 105, 18, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Cheti cha Usajili wa Dereva', 105, 30, { align: 'center' });
    // Picha ya dereva (kama ipo)
    if (driver.photo) {
        doc.addImage(driver.photo, 'JPEG', 155, 40, 40, 40);
    }
    // Taarifa za dereva
    doc.setFontSize(12);
    let y = 45;
    doc.text('Jina Kamili:', 20, y); doc.text(driver.name, 60, y);
    y += 8;
    doc.text('Namba ya Leseni:', 20, y); doc.text(driver.license, 60, y);
    y += 8;
    doc.text('Namba ya NIDA:', 20, y); doc.text(driver.nidaNumber || '-', 60, y);
    y += 8;
    doc.text('Tarehe ya Kuisha kwa Leseni:', 20, y); doc.text(formatDate(driver.licenseExpiry), 60, y);
    y += 8;
    doc.text('Namba ya Simu:', 20, y); doc.text(driver.phone, 60, y);
    y += 8;
    doc.text('Barua Pepe:', 20, y); doc.text(driver.email, 60, y);
    y += 8;
    doc.text('Aina ya Gari:', 20, y); doc.text(driver.vehicleType, 60, y);
    y += 8;
    doc.text('Mahali anakoishi:', 20, y); doc.text(driver.address, 60, y);
    y += 8;
    doc.text('Mawasiliano ya Dharura:', 20, y); doc.text(driver.emergencyContact, 60, y);
    y += 8;
    doc.text('Tarehe ya Usajili:', 20, y); doc.text(formatDate(driver.registrationDate), 60, y);
    // Footer
    doc.setFontSize(10);
    doc.text('Cheti hiki kinathibitisha kuwa dereva amesajiliwa na On Africa Construction', 105, 190, { align: 'center' });
    doc.save(`cheti_usajili_${driver.name.replace(/\s+/g, '_')}.pdf`);
}

// Data persistence
function saveDrivers() {
    localStorage.setItem('drivers', JSON.stringify(drivers));
}

function saveTerminations() {
    localStorage.setItem('terminations', JSON.stringify(terminations));
}

function saveAdmins() {
    localStorage.setItem('admins', JSON.stringify(admins));
}

// Action functions
function editDriver(index) {
    // Implementation for editing driver
    alert('Utengenezaji wa hariri dereva utafanywa baadae.');
}

function terminateDriver(index) {
    showTerminationModal();
    document.getElementById('terminatedDriver').value = index;
}

function deleteDriver(index) {
    if (confirm('Una uhakika unataka kufuta dereva huyu?')) {
        drivers.splice(index, 1);
        saveDrivers();
        loadDriversTable();
        updateStats();
        loadRecentActivity();
    }
}

function deleteTermination(index) {
    if (confirm('Una uhakika unataka kufuta taarifa hizi za kuacha kazi?')) {
        terminations.splice(index, 1);
        saveTerminations();
        loadTerminationsTable();
        updateStats();
        loadRecentActivity();
    }
}

function editAdmin(index) {
    // Implementation for editing admin
    alert('Utengenezaji wa hariri msimamizi utafanywa baadae.');
}

function deleteAdmin(index) {
    const admin = admins[index];
    if (admin.username === 'admin') {
        alert('Huwezi kufuta msimamizi mkuu!');
        return;
    }
    
    if (confirm('Una uhakika unataka kufuta msimamizi huyu?')) {
        admins.splice(index, 1);
        saveAdmins();
        loadAdminsTable();
        updateStats();
        loadRecentActivity();
    }
}

// Staff management functionality
function showStaffModal() {
    document.getElementById('staffModal').style.display = 'block';
}

function handleStaffRegistration(e) {
    e.preventDefault();
    const formData = {
        fullName: document.getElementById('staffFullName').value,
        username: document.getElementById('staffUsername').value,
        email: document.getElementById('staffEmail').value,
        phone: document.getElementById('staffPhone').value,
        role: document.getElementById('staffRole').value,
        password: document.getElementById('staffPassword').value,
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active',
        registeredBy: currentUser ? currentUser.username : 'admin'
    };

    // Validation
    if (!formData.fullName || !formData.username || !formData.email || !formData.phone || !formData.role || !formData.password) {
        alert('Tafadhali jaza sehemu zote muhimu.');
        return;
    }
    if (staff.some(s => s.username === formData.username)) {
        alert('Jina la mtumiaji tayari limetumika!');
        return;
    }
    if (staff.some(s => s.email === formData.email)) {
        alert('Barua pepe tayari imetumika!');
        return;
    }
    staff.push(formData);
    saveStaff();
    document.getElementById('staffModalForm').reset();
    closeAllModals();
    loadStaffTable();
    alert('Staff mpya amesajiliwa kikamilifu!');
}

function saveStaff() {
    localStorage.setItem('staff', JSON.stringify(staff));
}

function loadStaffTable() {
    const tbody = document.querySelector('#staffTable tbody');
    tbody.innerHTML = '';
    staff.forEach((member, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${member.fullName}</td>
            <td>${member.username}</td>
            <td>${member.email}</td>
            <td>${member.phone}</td>
            <td>${member.role}</td>
            <td>${formatDate(member.registrationDate)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteStaff(${index})">Futa</button>
            </td>
        `;
    });
}

function deleteStaff(index) {
    if (confirm('Una uhakika unataka kufuta staff huyu?')) {
        staff.splice(index, 1);
        saveStaff();
        loadStaffTable();
    }
}

// Add event listeners for staff modal and form
function setupStaffEventListeners() {
    const addStaffBtn = document.getElementById('addStaffBtn');
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', showStaffModal);
    }
    const staffModalForm = document.getElementById('staffModalForm');
    if (staffModalForm) {
        staffModalForm.addEventListener('submit', handleStaffRegistration);
    }
}

// Extend closeAllModals to also close staffModal
const originalCloseAllModals = closeAllModals;
closeAllModals = function() {
    document.getElementById('staffModal').style.display = 'none';
    originalCloseAllModals();
};

// Extend switchSection to load staff table when staff section is shown
const originalSwitchSection = switchSection;
switchSection = function(sectionName) {
    originalSwitchSection(sectionName);
    if (sectionName === 'staff') {
        loadStaffTable();
    }
};

// Initialize staff event listeners on DOMContentLoaded
const originalInitializeApp = initializeApp;
initializeApp = function() {
    originalInitializeApp();
    setupStaffEventListeners();
}; 