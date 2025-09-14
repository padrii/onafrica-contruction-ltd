// Admin credentials
const ADMIN_USERNAME = 'wilson';
const ADMIN_PASSWORD = '123456';

// Global variables
let currentSection = 'overview';
let currentUser = null;
let drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
let terminations = JSON.parse(localStorage.getItem('terminations') || '[]');
let admins = JSON.parse(localStorage.getItem('admins') || '[]');
let staff = JSON.parse(localStorage.getItem('staff') || '[]');
let fuelRatios = JSON.parse(localStorage.getItem('fuelRatios') || '[]');

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
    setupDriverEventListeners(); // Ensure driver modal and form listeners are set
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
    switchSection('drivers');
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
        case 'fuel-ratio':
            loadFuelRatioTable();
            updateFuelStats();
            setDefaultDate();
            break;
        case 'drivers':
            loadDriverTable();
            updateDriverStats();
            break;
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
    if (admin.username === 'wilson') {
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

// Add event listeners for fuel ratio management
function setupFuelRatioEventListeners() {
    const fuelRatioForm = document.getElementById('fuelRatioForm');
    if (fuelRatioForm) {
        fuelRatioForm.addEventListener('submit', handleFuelRatioSubmission);
    }
    const searchFuelRatios = document.getElementById('searchFuelRatios');
    if (searchFuelRatios) {
        searchFuelRatios.addEventListener('input', filterFuelRatios);
    }
    
    // Add event listeners for fuel calculation
    const tripType = document.getElementById('tripType');
    const loadedDistance = document.getElementById('loadedDistance');
    const emptyDistance = document.getElementById('emptyDistance');
    const fuelDistance = document.getElementById('fuelDistance');
    const tripStatus = document.getElementById('tripStatus');
    const loadedRatio = document.getElementById('loadedRatio');
    const emptyRatio = document.getElementById('emptyRatio');
    const tankBalance = document.getElementById('tankBalance');
    
    if (tripType) {
        tripType.addEventListener('change', toggleTripFields);
    }
    if (loadedDistance) {
        loadedDistance.addEventListener('input', calculateFuelConsumption);
    }
    if (emptyDistance) {
        emptyDistance.addEventListener('input', calculateFuelConsumption);
    }
    if (fuelDistance) {
        fuelDistance.addEventListener('input', calculateFuelConsumption);
    }
    if (tripStatus) {
        tripStatus.addEventListener('change', calculateFuelConsumption);
    }
    if (loadedRatio) {
        loadedRatio.addEventListener('input', calculateFuelConsumption);
    }
    if (emptyRatio) {
        emptyRatio.addEventListener('input', calculateFuelConsumption);
    }
    if (tankBalance) {
        tankBalance.addEventListener('input', calculateTankBalance);
    }
    
}

// Extend closeAllModals to also close staffModal and driverModal
const originalCloseAllModals = closeAllModals;
closeAllModals = function() {
    document.getElementById('staffModal').style.display = 'none';
    document.getElementById('driverModal').style.display = 'none';
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
    setupFuelRatioEventListeners();
    setupDriverEventListeners();
};

// Fuel Ratio Management Functions
function handleFuelRatioSubmission(e) {
    e.preventDefault();
    
    const tripType = document.getElementById('tripType').value;
    const loadedRatio = parseFloat(document.getElementById('loadedRatio').value) || 0.4;
    const emptyRatio = parseFloat(document.getElementById('emptyRatio').value) || 0.35;
    
    const formData = {
        vehicleType: document.getElementById('fuelVehicle').value,
        tripNumber: document.getElementById('tripNumber').value,
        tripType: tripType,
        date: document.getElementById('fuelDate').value,
        fuelAmount: parseFloat(document.getElementById('fuelAmount').value),
        fuelCost: parseFloat(document.getElementById('fuelCost').value),
        tankBalance: parseFloat(document.getElementById('tankBalance').value) || 0,
        driverName: document.getElementById('driverName').value,
        notes: document.getElementById('fuelNotes').value,
        loadedRatio: loadedRatio,
        emptyRatio: emptyRatio,
        recordedDate: new Date().toISOString().split('T')[0],
        recordedBy: currentUser ? currentUser.username : 'admin'
    };
    
    // Calculate distances and fuel consumption based on trip type
    if (tripType === 'mixed') {
        formData.loadedDistance = parseFloat(document.getElementById('loadedDistance').value) || 0;
        formData.emptyDistance = parseFloat(document.getElementById('emptyDistance').value) || 0;
        formData.totalDistance = formData.loadedDistance + formData.emptyDistance;
        formData.expectedFuelConsumption = (formData.loadedDistance * loadedRatio) + (formData.emptyDistance * emptyRatio);
        // Calculate total fuel used for mixed trip
        formData.totalFuelUsed = formData.fuelAmount;
    } else {
        formData.distance = parseFloat(document.getElementById('fuelDistance').value) || 0;
        formData.totalDistance = formData.distance;
        formData.tripStatus = document.getElementById('tripStatus').value;
        formData.expectedFuelConsumption = formData.distance * (formData.tripStatus === 'loaded' ? loadedRatio : emptyRatio);
        formData.loadedDistance = formData.tripStatus === 'loaded' ? formData.distance : 0;
        formData.emptyDistance = formData.tripStatus === 'empty' ? formData.distance : 0;
        // Calculate total fuel used for single type trip
        formData.totalFuelUsed = formData.fuelAmount;
    }
    
    
    // Calculate fuel consumption ratio
    formData.consumptionRatio = formData.totalDistance > 0 ? (formData.fuelAmount / formData.totalDistance).toFixed(3) : 0;
    
    // Validation
    if (!validateFuelRatioData(formData)) {
        return;
    }
    
    // Add fuel ratio record
    fuelRatios.push(formData);
    saveFuelRatios();
    
    // Reset form and show success message
    document.getElementById('fuelRatioForm').reset();
    showFuelMessage('Rekodi ya mafuta imehifadhiwa kikamilifu!', 'success');
    
    // Update tables and stats
    loadFuelRatioTable();
    updateFuelStats();
    loadRecentActivity();
}

function validateFuelRatioData(data) {
    const requiredFields = ['vehicleType', 'tripNumber', 'tripType', 'date', 'fuelAmount', 'fuelCost'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field] === '') {
            showFuelMessage('Tafadhali jaza sehemu zote muhimu.', 'error');
            return false;
        }
    }
    
    // Validate distance based on trip type
    if (data.tripType === 'mixed') {
        if (data.loadedDistance <= 0 && data.emptyDistance <= 0) {
            showFuelMessage('Tafadhali weka umbali wa mizigo au tupu.', 'error');
            return false;
        }
    } else {
        if (data.totalDistance <= 0) {
            showFuelMessage('Tafadhali weka umbali wa safari.', 'error');
            return false;
        }
    }
    
    if (data.fuelAmount <= 0) {
        showFuelMessage('Kiasi cha mafuta lazima kiwe zaidi ya sifuri.', 'error');
        return false;
    }
    
    if (data.fuelCost <= 0) {
        showFuelMessage('Gharama ya mafuta lazima iwe zaidi ya sifuri.', 'error');
        return false;
    }
    
    if (data.distance <= 0) {
        showFuelMessage('Umbali lazima uwe zaidi ya sifuri.', 'error');
        return false;
    }
    
    return true;
}

function showFuelMessage(message, type) {
    const messageElement = document.getElementById('fuelMessage');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

function setDefaultDate() {
    // Set today's date as default
    document.getElementById('fuelDate').value = new Date().toISOString().split('T')[0];
}

// Toggle trip fields based on trip type
function toggleTripFields() {
    const tripType = document.getElementById('tripType').value;
    const mixedFields = document.getElementById('mixedTripFields');
    const singleFields = document.getElementById('singleTripFields');
    
    // Hide both field sets first
    mixedFields.style.display = 'none';
    singleFields.style.display = 'none';
    
    // Show appropriate fields based on trip type
    if (tripType === 'mixed') {
        mixedFields.style.display = 'flex';
    } else if (tripType === 'loaded-only' || tripType === 'empty-only') {
        singleFields.style.display = 'flex';
        // Set trip status based on type
        if (tripType === 'loaded-only') {
            document.getElementById('tripStatus').value = 'loaded';
        } else {
            document.getElementById('tripStatus').value = 'empty';
        }
    }
    
    // Recalculate fuel consumption
    calculateFuelConsumption();
}

// Fuel calculation function
function calculateFuelConsumption() {
    const tripType = document.getElementById('tripType').value;
    const loadedRatio = parseFloat(document.getElementById('loadedRatio').value) || 0.4;
    const emptyRatio = parseFloat(document.getElementById('emptyRatio').value) || 0.35;
    const calculatedDisplay = document.getElementById('calculatedFuelDisplay');
    const calculationInfo = document.getElementById('calculationInfo');
    const calculationBreakdown = document.getElementById('calculationBreakdown');
    
    let totalFuelConsumption = 0;
    let breakdown = '';
    
    if (tripType === 'mixed') {
        const loadedDistance = parseFloat(document.getElementById('loadedDistance').value) || 0;
        const emptyDistance = parseFloat(document.getElementById('emptyDistance').value) || 0;
        
        if (loadedDistance > 0 || emptyDistance > 0) {
            const loadedFuel = loadedDistance * loadedRatio;
            const emptyFuel = emptyDistance * emptyRatio;
            totalFuelConsumption = loadedFuel + emptyFuel;
            
            breakdown = `
                <div>Mizigo: ${loadedDistance} km × ${loadedRatio} = ${loadedFuel.toFixed(2)} L</div>
                <div>Tupu: ${emptyDistance} km × ${emptyRatio} = ${emptyFuel.toFixed(2)} L</div>
                <div><strong>Jumla: ${totalFuelConsumption.toFixed(2)} L</strong></div>
            `;
        }
    } else if (tripType === 'loaded-only' || tripType === 'empty-only') {
        const distance = parseFloat(document.getElementById('fuelDistance').value) || 0;
        const status = document.getElementById('tripStatus').value;
        
        if (distance > 0) {
            const ratio = status === 'loaded' ? loadedRatio : emptyRatio;
            totalFuelConsumption = distance * ratio;
            
            breakdown = `
                <div>${status === 'loaded' ? 'Mizigo' : 'Tupu'}: ${distance} km × ${ratio} = ${totalFuelConsumption.toFixed(2)} L</div>
            `;
        }
    }
    
    if (totalFuelConsumption > 0) {
        calculatedDisplay.textContent = totalFuelConsumption.toFixed(2) + ' L';
        calculationInfo.textContent = 'Jumla ya mafuta yaliyo tumika:';
        calculationBreakdown.innerHTML = breakdown;
    } else {
        calculatedDisplay.textContent = '0.00 L';
        calculationInfo.textContent = 'Weka umbali na aina ya safari ili kuona hesabu';
        calculationBreakdown.innerHTML = '';
    }
}

// Tank balance calculation function
function calculateTankBalance() {
    const tankBalance = parseFloat(document.getElementById('tankBalance').value) || 0;
    const tankBalanceDisplay = document.getElementById('tankBalanceDisplay');
    const tankPercentage = document.getElementById('tankPercentage');
    const tankInfo = document.getElementById('tankInfo');
    
    if (tankBalance > 0) {
        tankBalanceDisplay.textContent = tankBalance.toFixed(2) + ' L';
        tankPercentage.innerHTML = '';
        tankInfo.textContent = 'Salio la tank baada ya safari';
    } else {
        tankBalanceDisplay.textContent = '0.00 L';
        tankPercentage.innerHTML = '';
        tankInfo.textContent = 'Weka salio la tank baada ya safari';
    }
}


function loadFuelRatioTable() {
    const tbody = document.querySelector('#fuelRatioTable tbody');
    tbody.innerHTML = '';
    
    fuelRatios.forEach((record, index) => {
        const row = tbody.insertRow();
        let tripTypeText = '';
        let statusClass = '';
        
        if (record.tripType === 'mixed') {
            tripTypeText = 'Mchanganyiko';
            statusClass = 'status-mixed';
        } else if (record.tripType === 'loaded-only') {
            tripTypeText = 'Mizigo Pekee';
            statusClass = 'status-loaded';
        } else if (record.tripType === 'empty-only') {
            tripTypeText = 'Tupu Pekee';
            statusClass = 'status-empty';
        }
        
        row.innerHTML = `
            <td>${record.vehicleType}</td>
            <td>${record.tripNumber || '-'}</td>
            <td><span class="${statusClass}">${tripTypeText}</span></td>
            <td>${formatDate(record.date)}</td>
            <td>${record.expectedFuelConsumption ? record.expectedFuelConsumption.toFixed(2) + ' L' : '-'}</td>
            <td>${record.totalFuelUsed ? record.totalFuelUsed.toFixed(2) + ' L' : record.fuelAmount ? record.fuelAmount.toFixed(2) + ' L' : '-'}</td>
            <td>${record.tankBalance ? record.tankBalance.toFixed(2) + ' L' : '-'}</td>
            <td>${record.driverName || '-'}</td>
            <td>${record.fuelCost.toLocaleString('en-TZ')} TZS</td>
            <td>${record.totalDistance ? record.totalDistance.toFixed(2) : '0.00'} Km</td>
            <td>${record.loadedDistance ? record.loadedDistance.toFixed(2) : '0.00'} Km</td>
            <td>${record.emptyDistance ? record.emptyDistance.toFixed(2) : '0.00'} Km</td>
            <td>${record.consumptionRatio} L/Km</td>
            <td>${record.notes || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editFuelRatio(${index})">Hariri</button>
                <button class="action-btn delete-btn" onclick="deleteFuelRatio(${index})">Futa</button>
            </td>
        `;
    });
}

function filterFuelRatios() {
    const searchTerm = document.getElementById('searchFuelRatios').value.toLowerCase();
    const tbody = document.querySelector('#fuelRatioTable tbody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

function updateFuelStats() {
    const totalFuelAmount = fuelRatios.reduce((sum, record) => sum + record.fuelAmount, 0);
    const totalFuelCost = fuelRatios.reduce((sum, record) => sum + record.fuelCost, 0);
    const totalDistance = fuelRatios.reduce((sum, record) => sum + (record.totalDistance || record.distance || 0), 0);
    const averageConsumption = totalDistance > 0 ? (totalFuelAmount / totalDistance).toFixed(3) : 0;
    
    // Tank balance statistics
    const totalTankBalance = fuelRatios.reduce((sum, record) => sum + (record.tankBalance || 0), 0);
    const totalDriversRegistered = fuelRatios.filter(record => record.driverName && record.driverName.trim() !== '').length;
    
    document.getElementById('totalFuelAmount').textContent = totalFuelAmount.toFixed(2);
    document.getElementById('totalFuelCost').textContent = totalFuelCost.toLocaleString('en-TZ');
    document.getElementById('totalDistance').textContent = totalDistance.toFixed(2);
    document.getElementById('averageConsumption').textContent = averageConsumption;
    document.getElementById('totalTankBalance').textContent = totalTankBalance.toFixed(2);
    document.getElementById('totalDriversRegistered').textContent = totalDriversRegistered;
}

function editFuelRatio(index) {
    // Implementation for editing fuel ratio
    alert('Utengenezaji wa hariri rekodi ya mafuta utafanywa baadae.');
}

function deleteFuelRatio(index) {
    if (confirm('Una uhakika unataka kufuta rekodi hii ya mafuta?')) {
        fuelRatios.splice(index, 1);
        saveFuelRatios();
        loadFuelRatioTable();
        updateFuelStats();
        loadRecentActivity();
    }
}

function saveFuelRatios() {
    localStorage.setItem('fuelRatios', JSON.stringify(fuelRatios));
}

// Driver Management Functions
function setupDriverEventListeners() {
    const driverForm = document.getElementById('driverForm');
    const searchDrivers = document.getElementById('searchDrivers');
    const driverModalBtn = document.getElementById('driverModalBtn');
    
    if (driverForm) {
        driverForm.addEventListener('submit', handleDriverSubmission);
    }
    
    if (searchDrivers) {
        searchDrivers.addEventListener('input', () => {
            const searchTerm = searchDrivers.value.toLowerCase();
            filterDrivers(searchTerm);
        });
    }
    
    if (driverModalBtn) {
        driverModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openDriverModal();
        });
    }
}

function handleDriverSubmission(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('driverFullName').value,
        licenseNumber: document.getElementById('driverLicenseNumber').value,
        phone: document.getElementById('driverPhone').value,
        email: document.getElementById('driverEmail').value,
        vehicleType: document.getElementById('driverVehicleType').value,
        status: document.getElementById('driverStatus').value,
        notes: document.getElementById('driverNotes').value,
        registrationDate: new Date().toISOString().split('T')[0],
        registeredBy: currentUser ? currentUser.username : 'admin'
    };
    
    // Validation
    if (!validateDriverData(formData)) {
        return;
    }
    
    // Check if license number already exists
    if (drivers.some(driver => driver.licenseNumber === formData.licenseNumber)) {
        showDriverMessage('Namba ya leseni tayari imetumika!', 'error');
        return;
    }
    
    // Add driver
    drivers.push(formData);
    saveDrivers();
    
    // Clear form
    document.getElementById('driverForm').reset();
    closeDriverModal();
    
    // Refresh table
    loadDriverTable();
    updateDriverStats();
    
    showDriverMessage('Dereva amesajiliwa kwa mafanikio!', 'success');
}

function validateDriverData(data) {
    if (!data.fullName.trim()) {
        showDriverMessage('Jina la dereva ni lazima!', 'error');
        return false;
    }
    if (!data.licenseNumber.trim()) {
        showDriverMessage('Namba ya leseni ni lazima!', 'error');
        return false;
    }
    if (!data.phone.trim()) {
        showDriverMessage('Namba ya simu ni lazima!', 'error');
        return false;
    }
    if (!data.vehicleType) {
        showDriverMessage('Aina ya gari ni lazima!', 'error');
        return false;
    }
    return true;
}

function showDriverMessage(message, type) {
    const messageElement = document.getElementById('driverMessage');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 3000);
}

function openDriverModal() {
    console.log('Opening driver modal...');
    const modal = document.getElementById('driverModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('Driver modal opened successfully');
    } else {
        console.error('Driver modal element not found!');
    }
}

function closeDriverModal() {
    document.getElementById('driverModal').style.display = 'none';
    document.getElementById('driverForm').reset();
    showDriverMessage('', '');
}

function loadDriverTable() {
    const tbody = document.querySelector('#driverTable tbody');
    tbody.innerHTML = '';
    
    drivers.forEach((driver, index) => {
        const row = document.createElement('tr');
        const statusClass = driver.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = driver.status === 'active' ? 'Aktifu' : 'Haajiriwi';
        
        row.innerHTML = `
            <td>${driver.fullName}</td>
            <td>${driver.licenseNumber}</td>
            <td>${driver.phone}</td>
            <td>${driver.email || '-'}</td>
            <td>${formatDate(driver.registrationDate)}</td>
            <td>${driver.vehicleType}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteDriver(${index})">
                    <i class="fas fa-trash"></i> Futa
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteDriver(index) {
    const driver = drivers[index];
    if (confirm(`Una uhakika unataka kufuta dereva ${driver.fullName}?`)) {
        drivers.splice(index, 1);
        saveDrivers();
        loadDriverTable();
        updateDriverStats();
        showDriverMessage('Dereva amefutwa kwa mafanikio!', 'success');
    }
}

function filterDrivers(searchTerm) {
    const rows = document.querySelectorAll('#driverTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function updateDriverStats() {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(driver => driver.status === 'active').length;
    const inactiveDrivers = drivers.filter(driver => driver.status === 'inactive').length;
    
    document.getElementById('totalDrivers').textContent = totalDrivers;
    document.getElementById('activeDrivers').textContent = activeDrivers;
    document.getElementById('inactiveDrivers').textContent = inactiveDrivers;
}

function saveDrivers() {
    localStorage.setItem('drivers', JSON.stringify(drivers));
} 