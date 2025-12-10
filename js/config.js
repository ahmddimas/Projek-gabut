// =====================================================
// KONFIGURASI LOLAHIN
// =====================================================
// Ganti YOUR_GOOGLE_CLIENT_ID dengan Client ID dari Google Cloud Console
// Format: xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

var CONFIG = {
    // Google OAuth
    // Dapatkan dari: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: localStorage.getItem('lolahin_google_client_id') || 'YOUR_GOOGLE_CLIENT_ID',
    
    // App Settings
    APP_NAME: 'Lolahin',
    APP_VERSION: '2.0.0',
    
    // Storage Keys
    USERS_KEY: 'lolahin_users',
    SESSION_KEY: 'lolahin_session',
    ADMIN_DATA_KEY: 'lolahin_admin_data',
    
    // API Endpoints (jika menggunakan backend)
    API_URL: '',
    
    // Feature Flags
    ENABLE_GOOGLE_LOGIN: true,
    ENABLE_EMAIL_VERIFICATION: false,
    REQUIRE_LOGIN: false
};

// Update Google button dengan Client ID yang benar
window.addEventListener('load', function() {
    setTimeout(function() {
        var googleElements = document.querySelectorAll('[data-client_id]');
        googleElements.forEach(function(el) {
            if (CONFIG.GOOGLE_CLIENT_ID && CONFIG.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
                el.setAttribute('data-client_id', CONFIG.GOOGLE_CLIENT_ID);
            }
        });
        
        // Cek apakah Google Client ID sudah dikonfigurasi
        if (CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            console.warn('⚠️ Google Client ID belum dikonfigurasi!');
            console.log('Buka js/config.js dan ganti YOUR_GOOGLE_CLIENT_ID dengan Client ID Anda');
            
            // Tampilkan fallback button
            var fallback = document.getElementById('googleFallback');
            if (fallback) fallback.classList.remove('hidden');
        }
    }, 500);
});
