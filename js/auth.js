// =====================================================
// AUTHENTICATION SYSTEM - LOLAHIN
// =====================================================

// ===== INITIALIZATION =====
window.addEventListener('load', function() {
    checkSession();
    initForms();
    initPasswordStrength();
});

// ===== CHECK SESSION =====
function checkSession() {
    var session = getSession();
    var currentPage = window.location.pathname;
    
    if (session) {
        // Sudah login
        if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
            window.location.href = 'index.html';
        }
    }
}

// ===== FORM INITIALIZATION =====
function initForms() {
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// ===== LOGIN HANDLER =====
function handleLogin(e) {
    e.preventDefault();
    
    var email = document.getElementById('loginEmail').value.trim().toLowerCase();
    var password = document.getElementById('loginPassword').value;
    var remember = document.getElementById('rememberMe').checked;
    
    // Validasi
    if (!email || !password) {
        toast('Mohon isi semua field!', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        toast('Format email tidak valid!', 'error');
        return;
    }
    
    // Cari user
    var users = getUsers();
    var user = null;
    
    for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email) {
            user = users[i];
            break;
        }
    }
    
    if (!user) {
        toast('Email tidak terdaftar!', 'error');
        return;
    }
    
    // Verifikasi password (dalam produksi gunakan hash)
    if (user.password !== hashPassword(password)) {
        toast('Password salah!', 'error');
        return;
    }
    
    // Login berhasil
    createSession(user, remember);
    toast('Login berhasil! Mengalihkan...', 'success');
    
    // Log aktivitas
    logActivity('login', user.email);
    
    setTimeout(function() {
        window.location.href = 'index.html';
    }, 1500);
}

// ===== REGISTER HANDLER =====
function handleRegister(e) {
    e.preventDefault();
    
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim().toLowerCase();
    var password = document.getElementById('regPassword').value;
    var confirm = document.getElementById('regConfirm').value;
    var agree = document.getElementById('agreeTerms').checked;
    
    // Validasi
    if (!name || !email || !password || !confirm) {
        toast('Mohon isi semua field!', 'error');
        return;
    }
    
    if (name.length < 2) {
        toast('Nama minimal 2 karakter!', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        toast('Format email tidak valid!', 'error');
        return;
    }
    
    if (password.length < 6) {
        toast('Password minimal 6 karakter!', 'error');
        return;
    }
    
    if (password !== confirm) {
        toast('Password tidak cocok!', 'error');
        return;
    }
    
    if (!agree) {
        toast('Anda harus menyetujui Syarat & Ketentuan!', 'error');
        return;
    }
    
    // Cek apakah email sudah terdaftar
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email) {
            toast('Email sudah terdaftar!', 'error');
            return;
        }
    }
    
    // Buat user baru
    var newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: hashPassword(password),
        provider: 'email',
        avatar: generateAvatar(name),
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Log aktivitas
    logActivity('register', email);
    
    toast('Pendaftaran berhasil!', 'success');
    
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 1500);
}

// ===== GOOGLE SIGN-IN HANDLER (REAL) =====
function handleGoogleSignIn(response) {
    console.log('Google Sign-In Response:', response);
    
    if (!response.credential) {
        toast('Login Google gagal!', 'error');
        return;
    }
    
    try {
        // Decode JWT token dari Google
        var payload = decodeJwtPayload(response.credential);
        console.log('Google User:', payload);
        
        var googleUser = {
            id: 'google_' + payload.sub,
            name: payload.name || 'Google User',
            email: payload.email,
            avatar: payload.picture || generateAvatar(payload.name || 'G'),
            provider: 'google',
            googleId: payload.sub,
            emailVerified: payload.email_verified,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        // Cek apakah user sudah ada
        var users = getUsers();
        var existingUser = null;
        var existingIndex = -1;
        
        for (var i = 0; i < users.length; i++) {
            if (users[i].email.toLowerCase() === googleUser.email.toLowerCase()) {
                existingUser = users[i];
                existingIndex = i;
                break;
            }
        }
        
        if (existingUser) {
            // Update user yang sudah ada
            existingUser.lastLogin = new Date().toISOString();
            existingUser.avatar = googleUser.avatar;
            if (!existingUser.googleId) {
                existingUser.googleId = googleUser.googleId;
                existingUser.provider = 'google';
            }
            users[existingIndex] = existingUser;
            saveUsers(users);
            googleUser = existingUser;
        } else {
            // Tambah user baru
            users.push(googleUser);
            saveUsers(users);
        }
        
        // Buat session
        createSession(googleUser, true);
        
        // Log aktivitas
        logActivity('google_login', googleUser.email);
        
        toast('Login dengan Google berhasil!', 'success');
        
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error parsing Google token:', error);
        toast('Terjadi kesalahan saat login Google!', 'error');
    }
}

// Fallback jika Google button tidak muncul
function googleSignInFallback() {
    if (CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
        showSetupModal();
        return;
    }
    
    // Trigger Google Sign-In
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt();
    } else {
        toast('Google Sign-In tidak tersedia!', 'error');
    }
}

// ===== DECODE JWT =====
function decodeJwtPayload(token) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding JWT:', e);
        return null;
    }
}

// ===== SESSION MANAGEMENT =====
function createSession(user, remember) {
    var session = {
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || generateAvatar(user.name),
        provider: user.provider || 'email',
        loginAt: new Date().toISOString()
    };
    
    var storage = remember ? localStorage : sessionStorage;
    storage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    
    // Juga simpan di localStorage untuk persistensi
    if (remember) {
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    }
}

function getSession() {
    var session = localStorage.getItem(CONFIG.SESSION_KEY) || sessionStorage.getItem(CONFIG.SESSION_KEY);
    if (session) {
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function logout() {
    var session = getSession();
    if (session) {
        logActivity('logout', session.email);
    }
    
    localStorage.removeItem(CONFIG.SESSION_KEY);
    sessionStorage.removeItem(CONFIG.SESSION_KEY);
    
    // Revoke Google session jika ada
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
    
    window.location.href = 'login.html';
}

// ===== USER STORAGE =====
function getUsers() {
    try {
        var users = localStorage.getItem(CONFIG.USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(CONFIG.USERS_KEY, JSON.stringify(users));
}

function getUserByEmail(email) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email.toLowerCase()) {
            return users[i];
        }
    }
    return null;
}

// ===== ACTIVITY LOG =====
function logActivity(type, email) {
    try {
        var logs = JSON.parse(localStorage.getItem('lolahin_activity_logs') || '[]');
        logs.unshift({
            type: type,
            email: email,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs = logs.slice(0, 100);
        }
        
        localStorage.setItem('lolahin_activity_logs', JSON.stringify(logs));
    } catch (e) {
        console.error('Error logging activity:', e);
    }
}

// ===== PASSWORD STRENGTH =====
function initPasswordStrength() {
    var passwordInput = document.getElementById('regPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            showPasswordStrength(this.value);
        });
    }
}

function showPasswordStrength(password) {
    var strengthDiv = document.getElementById('passwordStrength');
    if (!strengthDiv) return;
    
    var strength = calculatePasswordStrength(password);
    var labels = ['Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
    var colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];
    
    if (password.length === 0) {
        strengthDiv.innerHTML = '';
        return;
    }
    
    strengthDiv.innerHTML = '<div class="strength-bar"><div class="strength-fill" style="width:' + ((strength + 1) * 20) + '%;background:' + colors[strength] + '"></div></div><span style="color:' + colors[strength] + '">' + labels[strength] + '</span>';
}

function calculatePasswordStrength(password) {
    var strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 4);
}

// ===== HELPERS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    // Simple hash untuk demo - dalam produksi gunakan bcrypt atau sejenisnya
    var hash = 0;
    for (var i = 0; i < password.length; i++) {
        var char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(16);
}

function isValidEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function generateAvatar(name) {
    var initial = (name || 'U').charAt(0).toUpperCase();
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'User') + '&background=6366f1&color=fff&size=128';
}

function togglePassword(inputId) {
    var input = document.getElementById(inputId);
    var icon = input.parentElement.querySelector('.toggle-pass i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function showForgotPassword() {
    toast('Fitur reset password akan dikirim ke email Anda!', 'info');
}

function showTerms() {
    alert('Syarat & Ketentuan:\n\n1. Aplikasi ini gratis digunakan.\n2. Data disimpan di perangkat Anda.\n3. Kami tidak bertanggung jawab atas kehilangan data.\n4. Fitur investasi bukan saran keuangan.');
}

// ===== SETUP MODAL =====
function showSetupModal() {
    var modal = document.getElementById('setupModal');
    if (modal) modal.classList.remove('hidden');
}

function closeSetupModal() {
    var modal = document.getElementById('setupModal');
    if (modal) modal.classList.add('hidden');
}

function saveClientId() {
    var clientId = document.getElementById('clientIdInput').value.trim();
    
    if (!clientId) {
        toast('Mohon masukkan Client ID!', 'error');
        return;
    }
    
    if (!clientId.includes('.apps.googleusercontent.com')) {
        toast('Format Client ID tidak valid!', 'error');
        return;
    }
    
    localStorage.setItem('lolahin_google_client_id', clientId);
    toast('Client ID tersimpan! Memuat ulang...', 'success');
    
    setTimeout(function() {
        window.location.reload();
    }, 1500);
}

// ===== TOAST =====
function toast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;
    
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    
    setTimeout(function() {
        t.classList.add('hidden');
    }, 3000);
}
