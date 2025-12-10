// ===== ADMIN PANEL =====
var ADMIN_KEY = 'lolahin_admin';
var ADMIN_DATA_KEY = 'lolahin_admin_data';

var adminData = {
    news: [],
    tips: [],
    categories: {
        income: [],
        expense: []
    },
    ads: [],
    settings: {
        appName: 'Lolahin',
        appTagline: 'Kelola Keuanganmu dengan Mudah',
        appIcon: 'fa-wallet',
        themeColor: '#6366f1',
        adminPassword: 'admin123'
    }
};

var currentEditId = null;

// ===== INIT =====
window.onload = function() {
    loadAdminData();
    initNavigation();
};

function loadAdminData() {
    var saved = localStorage.getItem(ADMIN_DATA_KEY);
    if (saved) {
        adminData = JSON.parse(saved);
    } else {
        // Default data
        adminData.tips = [
            "Diversifikasi portofolio. Jangan taruh semua di satu aset!",
            "Investasikan hanya uang yang siap Anda relakan.",
            "Crypto sangat volatile. Bisa naik/turun 20% sehari!",
            "Dollar Cost Averaging (DCA) lebih baik dari timing pasar.",
            "Jangan FOMO! Riset dulu sebelum beli."
        ];
        adminData.news = [
            {id:'1',title:'Bitcoin Menembus $100.000',summary:'Harga Bitcoin mencapai rekor tertinggi.',image:'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200',category:'crypto',source:'CoinDesk',url:'#',date:new Date().toISOString()},
            {id:'2',title:'Regulasi Crypto Indonesia Terbaru',summary:'OJK merilis aturan baru untuk aset kripto.',image:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200',category:'crypto',source:'Kompas',url:'#',date:new Date().toISOString()}
        ];
        saveAdminData();
    }
}

function saveAdminData() {
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData));
}

// ===== ADMIN LOGIN =====
function adminLogin(e) {
    e.preventDefault();
    var user = document.getElementById('adminUser').value;
    var pass = document.getElementById('adminPass').value;
    
    if (user === 'admin' && pass === adminData.settings.adminPassword) {
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        renderDashboard();
        toast('Login berhasil!', 'success');
        addActivity('Login', 'Admin berhasil login');
    } else {
        toast('Username atau password salah!', 'error');
    }
}

function logoutAdmin() {
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('adminLogin').classList.remove('hidden');
    toast('Logout berhasil!');
}

// ===== NAVIGATION =====
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(function(btn) {
        btn.onclick = function() {
            var section = btn.getAttribute('data-section');
            switchSection(section);
        };
    });
}

function switchSection(section) {
    document.querySelectorAll('.nav-item').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelector('[data-section="'+section+'"]').classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(function(el) {
        el.classList.remove('active');
    });
    document.getElementById(section+'Section').classList.add('active');
    
    document.getElementById('pageTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Render content
    if (section === 'dashboard') renderDashboard();
    if (section === 'news') renderNewsTable();
    if (section === 'tips') renderTipsList();
    if (section === 'categories') renderCategories();
    if (section === 'ads') renderAdsList();
    if (section === 'settings') loadSettings();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// ===== DASHBOARD =====
function renderDashboard() {
    var users = JSON.parse(localStorage.getItem('lolahin_users') || '[]');
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalNews').textContent = adminData.news.length;
    document.getElementById('totalTips').textContent = adminData.tips.length;
    document.getElementById('totalAds').textContent = adminData.ads.filter(function(a){return a.active;}).length;
    
    renderRecentActivity();
}

var activities = [];
function addActivity(type, message) {
    activities.unshift({
        type: type,
        message: message,
        time: new Date().toISOString()
    });
    if (activities.length > 10) activities.pop();
    renderRecentActivity();
}

function renderRecentActivity() {
    var c = document.getElementById('recentActivity');
    if (!c) return;
    
    if (!activities.length) {
        c.innerHTML = '<p style="color:var(--text2);text-align:center;padding:2rem">Belum ada aktivitas</p>';
        return;
    }
    
    var icons = {Login:'fa-sign-in-alt',News:'fa-newspaper',Tips:'fa-lightbulb',Ads:'fa-ad',Settings:'fa-cog'};
    var colors = {Login:'#3b82f6',News:'#10b981',Tips:'#f59e0b',Ads:'#8b5cf6',Settings:'#6b7280'};
    
    var h = '';
    activities.forEach(function(a) {
        h += '<div class="activity-item">';
        h += '<i class="fas '+(icons[a.type]||'fa-circle')+'" style="background:'+(colors[a.type]||'#6b7280')+'"></i>';
        h += '<div class="info"><p>'+a.message+'</p><small>'+timeAgo(new Date(a.time))+'</small></div>';
        h += '</div>';
    });
    c.innerHTML = h;
}

// ===== NEWS =====
function renderNewsTable() {
    var c = document.getElementById('newsTable');
    if (!adminData.news.length) {
        c.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text2)">Belum ada berita</td></tr>';
        return;
    }
    
    var h = '';
    adminData.news.forEach(function(n) {
        h += '<tr>';
        h += '<td><img src="'+n.image+'" onerror="this.src=\'https://via.placeholder.com/60x40\'"></td>';
        h += '<td>'+n.title+'</td>';
        h += '<td><span class="badge" style="background:var(--primary)">'+n.category+'</span></td>';
        h += '<td>'+formatDate(n.date)+'</td>';
        h += '<td class="actions">';
        h += '<button class="btn-edit" onclick="editNews(\''+n.id+'\')"><i class="fas fa-edit"></i></button>';
        h += '<button class="btn-delete" onclick="deleteNews(\''+n.id+'\')"><i class="fas fa-trash"></i></button>';
        h += '</td></tr>';
    });
    c.innerHTML = h;
}

function openNewsModal(id) {
    currentEditId = id || null;
    document.getElementById('newsId').value = '';
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsSummary').value = '';
    document.getElementById('newsImage').value = '';
    document.getElementById('newsCategory').value = 'crypto';
    document.getElementById('newsSource').value = '';
    document.getElementById('newsUrl').value = '';
    document.getElementById('newsModalTitle').textContent = 'Tambah Berita';
    document.getElementById('newsModal').classList.remove('hidden');
}

function editNews(id) {
    var news = adminData.news.find(function(n){return n.id===id;});
    if (!news) return;
    
    currentEditId = id;
    document.getElementById('newsId').value = id;
    document.getElementById('newsTitle').value = news.title;
    document.getElementById('newsSummary').value = news.summary;
    document.getElementById('newsImage').value = news.image || '';
    document.getElementById('newsCategory').value = news.category;
    document.getElementById('newsSource').value = news.source;
    document.getElementById('newsUrl').value = news.url || '';
    document.getElementById('newsModalTitle').textContent = 'Edit Berita';
    document.getElementById('newsModal').classList.remove('hidden');
}

function closeNewsModal() {
    document.getElementById('newsModal').classList.add('hidden');
    currentEditId = null;
}

function saveNews(e) {
    e.preventDefault();
    
    var news = {
        id: currentEditId || Date.now().toString(),
        title: document.getElementById('newsTitle').value,
        summary: document.getElementById('newsSummary').value,
        image: document.getElementById('newsImage').value,
        category: document.getElementById('newsCategory').value,
        source: document.getElementById('newsSource').value,
        url: document.getElementById('newsUrl').value,
        date: new Date().toISOString()
    };
    
    if (currentEditId) {
        var idx = adminData.news.findIndex(function(n){return n.id===currentEditId;});
        if (idx !== -1) adminData.news[idx] = news;
        addActivity('News', 'Berita diupdate: ' + news.title);
    } else {
        adminData.news.unshift(news);
        addActivity('News', 'Berita ditambahkan: ' + news.title);
    }
    
    saveAdminData();
    renderNewsTable();
    closeNewsModal();
    toast('Berita berhasil disimpan!', 'success');
}

function deleteNews(id) {
    if (!confirm('Hapus berita ini?')) return;
    adminData.news = adminData.news.filter(function(n){return n.id!==id;});
    saveAdminData();
    renderNewsTable();
    addActivity('News', 'Berita dihapus');
    toast('Berita dihapus!', 'success');
}

// ===== TIPS =====
function renderTipsList() {
    var c = document.getElementById('tipsList');
    if (!adminData.tips.length) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-lightbulb"></i><p>Belum ada tips</p></div>';
        return;
    }
    
    var h = '';
    adminData.tips.forEach(function(tip, i) {
        h += '<div class="tip-item">';
        h += '<i class="fas fa-lightbulb"></i>';
        h += '<p>'+tip+'</p>';
        h += '<div class="actions">';
        h += '<button class="btn-edit" onclick="editTips('+i+')"><i class="fas fa-edit"></i></button>';
        h += '<button class="btn-delete" onclick="deleteTips('+i+')"><i class="fas fa-trash"></i></button>';
        h += '</div></div>';
    });
    c.innerHTML = h;
}

function openTipsModal() {
    currentEditId = null;
    document.getElementById('tipId').value = '';
    document.getElementById('tipContent').value = '';
    document.getElementById('tipsModal').classList.remove('hidden');
}

function editTips(index) {
    currentEditId = index;
    document.getElementById('tipId').value = index;
    document.getElementById('tipContent').value = adminData.tips[index];
    document.getElementById('tipsModal').classList.remove('hidden');
}

function closeTipsModal() {
    document.getElementById('tipsModal').classList.add('hidden');
}

function saveTips(e) {
    e.preventDefault();
    var content = document.getElementById('tipContent').value;
    
    if (currentEditId !== null) {
        adminData.tips[currentEditId] = content;
        addActivity('Tips', 'Tips diupdate');
    } else {
        adminData.tips.push(content);
        addActivity('Tips', 'Tips ditambahkan');
    }
    
    saveAdminData();
    renderTipsList();
    closeTipsModal();
    toast('Tips berhasil disimpan!', 'success');
}

function deleteTips(index) {
    if (!confirm('Hapus tips ini?')) return;
    adminData.tips.splice(index, 1);
    saveAdminData();
    renderTipsList();
    addActivity('Tips', 'Tips dihapus');
    toast('Tips dihapus!', 'success');
}

// ===== CATEGORIES =====
function renderCategories() {
    renderCategoryList('income', document.getElementById('incomeCategories'));
    renderCategoryList('expense', document.getElementById('expenseCategories'));
}

function renderCategoryList(type, container) {
    var cats = adminData.categories[type] || [];
    if (!cats.length) {
        container.innerHTML = '<p style="color:var(--text2);text-align:center;padding:1rem">Belum ada kategori kustom</p>';
        return;
    }
    
    var h = '';
    cats.forEach(function(c) {
        h += '<div class="cat-item">';
        h += '<i class="fas '+c.icon+'" style="background:'+c.color+'"></i>';
        h += '<span>'+c.name+'</span>';
        h += '<button class="btn-delete" onclick="deleteCategory(\''+type+'\',\''+c.id+'\')"><i class="fas fa-times"></i></button>';
        h += '</div>';
    });
    container.innerHTML = h;
}

function openCategoryModal() {
    document.getElementById('catId').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.add('hidden');
}

function saveCategory(e) {
    e.preventDefault();
    
    var cat = {
        id: Date.now().toString(),
        name: document.getElementById('catName').value,
        icon: document.getElementById('catIcon').value,
        color: document.getElementById('catColor').value
    };
    
    var type = document.getElementById('catType').value;
    if (!adminData.categories[type]) adminData.categories[type] = [];
    adminData.categories[type].push(cat);
    
    saveAdminData();
    renderCategories();
    closeCategoryModal();
    addActivity('Settings', 'Kategori ditambahkan: ' + cat.name);
    toast('Kategori berhasil disimpan!', 'success');
}

function deleteCategory(type, id) {
    if (!confirm('Hapus kategori ini?')) return;
    adminData.categories[type] = adminData.categories[type].filter(function(c){return c.id!==id;});
    saveAdminData();
    renderCategories();
    toast('Kategori dihapus!', 'success');
}

// ===== ADS =====
function renderAdsList() {
    var c = document.getElementById('adsList');
    if (!adminData.ads.length) {
        c.innerHTML = '<div class="empty-state" style="padding:2rem;text-align:center;color:var(--text2)"><i class="fas fa-ad" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i><p>Belum ada iklan</p></div>';
        return;
    }
    
    var h = '';
    adminData.ads.forEach(function(ad) {
        h += '<div class="ad-item">';
        h += '<div class="ad-info"><h4>'+ad.name+'</h4><span>Posisi: '+ad.position+'</span></div>';
        h += '<span class="ad-status '+(ad.active?'active':'inactive')+'">'+(ad.active?'Aktif':'Nonaktif')+'</span>';
        h += '<div class="actions">';
        h += '<button class="btn-edit" onclick="editAds(\''+ad.id+'\')"><i class="fas fa-edit"></i></button>';
        h += '<button class="btn-delete" onclick="deleteAds(\''+ad.id+'\')"><i class="fas fa-trash"></i></button>';
        h += '</div></div>';
    });
    c.innerHTML = h;
}

function openAdsModal() {
    currentEditId = null;
    document.getElementById('adId').value = '';
    document.getElementById('adName').value = '';
    document.getElementById('adPosition').value = 'header';
    document.getElementById('adCode').value = '';
    document.getElementById('adActive').checked = true;
    document.getElementById('adsModal').classList.remove('hidden');
}

function editAds(id) {
    var ad = adminData.ads.find(function(a){return a.id===id;});
    if (!ad) return;
    
    currentEditId = id;
    document.getElementById('adId').value = id;
    document.getElementById('adName').value = ad.name;
    document.getElementById('adPosition').value = ad.position;
    document.getElementById('adCode').value = ad.code;
    document.getElementById('adActive').checked = ad.active;
    document.getElementById('adsModal').classList.remove('hidden');
}

function closeAdsModal() {
    document.getElementById('adsModal').classList.add('hidden');
}

function saveAds(e) {
    e.preventDefault();
    
    var ad = {
        id: currentEditId || Date.now().toString(),
        name: document.getElementById('adName').value,
        position: document.getElementById('adPosition').value,
        code: document.getElementById('adCode').value,
        active: document.getElementById('adActive').checked
    };
    
    if (currentEditId) {
        var idx = adminData.ads.findIndex(function(a){return a.id===currentEditId;});
        if (idx !== -1) adminData.ads[idx] = ad;
        addActivity('Ads', 'Iklan diupdate: ' + ad.name);
    } else {
        adminData.ads.push(ad);
        addActivity('Ads', 'Iklan ditambahkan: ' + ad.name);
    }
    
    saveAdminData();
    renderAdsList();
    closeAdsModal();
    toast('Iklan berhasil disimpan!', 'success');
}

function deleteAds(id) {
    if (!confirm('Hapus iklan ini?')) return;
    adminData.ads = adminData.ads.filter(function(a){return a.id!==id;});
    saveAdminData();
    renderAdsList();
    toast('Iklan dihapus!', 'success');
}

// ===== SETTINGS =====
function loadSettings() {
    document.getElementById('appName').value = adminData.settings.appName;
    document.getElementById('appTagline').value = adminData.settings.appTagline;
    document.getElementById('appIcon').value = adminData.settings.appIcon;
    
    var colorRadios = document.querySelectorAll('[name="themeColor"]');
    colorRadios.forEach(function(radio) {
        radio.checked = radio.value === adminData.settings.themeColor;
    });
}

function saveBranding() {
    adminData.settings.appName = document.getElementById('appName').value;
    adminData.settings.appTagline = document.getElementById('appTagline').value;
    adminData.settings.appIcon = document.getElementById('appIcon').value;
    saveAdminData();
    addActivity('Settings', 'Branding diupdate');
    toast('Branding berhasil disimpan!', 'success');
}

function saveTheme() {
    var selected = document.querySelector('[name="themeColor"]:checked');
    if (selected) {
        adminData.settings.themeColor = selected.value;
        saveAdminData();
        addActivity('Settings', 'Tema diupdate');
        toast('Tema berhasil disimpan!', 'success');
    }
}

function changePassword() {
    var oldPass = document.getElementById('oldPass').value;
    var newPass = document.getElementById('newPass').value;
    var confirmPass = document.getElementById('confirmPass').value;
    
    if (oldPass !== adminData.settings.adminPassword) {
        toast('Password lama salah!', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        toast('Password baru tidak cocok!', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        toast('Password minimal 6 karakter!', 'error');
        return;
    }
    
    adminData.settings.adminPassword = newPass;
    saveAdminData();
    document.getElementById('oldPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
    addActivity('Settings', 'Password admin diubah');
    toast('Password berhasil diubah!', 'success');
}

function exportAdminData() {
    var blob = new Blob([JSON.stringify(adminData, null, 2)], {type: 'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lolahin-admin-backup.json';
    a.click();
    toast('Data admin berhasil diexport!', 'success');
}

function importAdminData(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(ev) {
        try {
            var imported = JSON.parse(ev.target.result);
            if (imported.settings) {
                adminData = imported;
                saveAdminData();
                toast('Data admin berhasil diimport!', 'success');
                renderDashboard();
            } else {
                toast('File tidak valid!', 'error');
            }
        } catch (err) {
            toast('Gagal membaca file!', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===== HELPERS =====
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'});
}

function timeAgo(date) {
    var s = Math.floor((new Date() - date) / 1000);
    if (s < 60) return 'Baru saja';
    var m = Math.floor(s / 60);
    if (m < 60) return m + ' menit lalu';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' jam lalu';
    var d = Math.floor(h / 24);
    return d + ' hari lalu';
}

function toast(msg, type) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    setTimeout(function() { t.classList.add('hidden'); }, 3000);
}
