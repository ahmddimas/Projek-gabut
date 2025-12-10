var data={transactions:[],budgets:[]};
var currentType='expense';
var currentFilter='all';
var currentTxId=null;
var myChart=null;
var tipIndex=0;

var allCryptoData=[];
var displayedCrypto=20;
var allNewsData=[];
var newsFilter='all';
var currentNewsId=null;

var tips=[
    "Diversifikasi portofolio. Jangan taruh semua di satu aset!",
    "Investasikan hanya uang yang siap Anda relakan.",
    "Crypto sangat volatile. Bisa naik/turun 20% sehari!",
    "Dollar Cost Averaging (DCA) lebih baik dari timing pasar.",
    "Jangan FOMO! Riset dulu sebelum beli.",
    "Simpan crypto di wallet pribadi untuk keamanan.",
    "Selalu gunakan 2FA untuk akun exchange.",
    "Profit belum nyata sampai dijual. Jangan serakah!",
    "Pahami fundamental, bukan cuma ikut hype.",
    "Siapkan dana darurat sebelum investasi!"
];

var categories={
    income:[
        {id:'salary',name:'Gaji',icon:'fa-briefcase',color:'#10b981'},
        {id:'freelance',name:'Freelance',icon:'fa-laptop',color:'#3b82f6'},
        {id:'investment',name:'Investasi',icon:'fa-chart-line',color:'#8b5cf6'},
        {id:'gift',name:'Hadiah',icon:'fa-gift',color:'#ec4899'},
        {id:'other',name:'Lainnya',icon:'fa-plus',color:'#6b7280'}
    ],
    expense:[
        {id:'food',name:'Makanan',icon:'fa-utensils',color:'#ef4444'},
        {id:'transport',name:'Transport',icon:'fa-car',color:'#f59e0b'},
        {id:'shopping',name:'Belanja',icon:'fa-shopping-bag',color:'#ec4899'},
        {id:'bills',name:'Tagihan',icon:'fa-file-invoice',color:'#3b82f6'},
        {id:'health',name:'Kesehatan',icon:'fa-heart',color:'#10b981'},
        {id:'entertainment',name:'Hiburan',icon:'fa-gamepad',color:'#8b5cf6'},
        {id:'other',name:'Lainnya',icon:'fa-ellipsis-h',color:'#6b7280'}
    ]
};

// ===== INIT =====
window.onload=function(){
    setTimeout(function(){
        var splash=document.getElementById('splash');
        splash.classList.add('fade-out');
        setTimeout(function(){
            splash.style.display='none';
            document.getElementById('app').classList.remove('hidden');
            loadData();
            initTheme();
            bindEvents();
            render();
            initChart();
            showTip();
        },500);
    },2000);
};

function loadData(){try{var s=localStorage.getItem('lolahin');if(s)data=JSON.parse(s);}catch(e){}}
function saveData(){localStorage.setItem('lolahin',JSON.stringify(data));}

function initTheme(){
    var t=localStorage.getItem('lolahin_theme')||'light';
    document.documentElement.setAttribute('data-theme',t);
    updateThemeIcon();
}

function toggleTheme(){
    var c=document.documentElement.getAttribute('data-theme');
    var n=c==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',n);
    localStorage.setItem('lolahin_theme',n);
    updateThemeIcon();
    toast('Tema diubah!');
}

function updateThemeIcon(){
    var t=document.documentElement.getAttribute('data-theme');
    document.querySelector('#themeBtn i').className=t==='dark'?'fas fa-sun':'fas fa-moon';
}

function bindEvents(){
    document.getElementById('themeBtn').onclick=toggleTheme;
    document.getElementById('menuBtn').onclick=function(e){
        e.stopPropagation();
        document.getElementById('menuDropdown').classList.toggle('hidden');
    };
    document.onclick=function(){document.getElementById('menuDropdown').classList.add('hidden');};
    document.getElementById('eyeBtn').onclick=function(){
        var el=document.getElementById('balanceAmount');
        el.classList.toggle('blur');
        document.querySelector('#eyeBtn i').className=el.classList.contains('blur')?'fas fa-eye-slash':'fas fa-eye';
    };
}

// ===== RENDER =====
function render(){renderBalance();renderTransactions();renderBudgets();renderStats();}

function renderBalance(){
    var i=0,e=0;
    data.transactions.forEach(function(t){if(t.type==='income')i+=t.amount;else e+=t.amount;});
    document.getElementById('balanceAmount').textContent=formatRp(i-e);
    document.getElementById('incomeAmount').textContent=formatRp(i);
    document.getElementById('expenseAmount').textContent=formatRp(e);
}

function renderTransactions(){
    var s=document.getElementById('searchInput').value.toLowerCase();
    var list=data.transactions.filter(function(t){
        if(currentFilter!=='all'&&t.type!==currentFilter)return false;
        if(s&&t.desc.toLowerCase().indexOf(s)===-1)return false;
        return true;
    });
    list.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    document.getElementById('txCount').textContent=list.length;
    var c=document.getElementById('txList');
    if(!list.length){c.innerHTML='<div class="empty-state"><i class="fas fa-receipt"></i><p>Belum ada transaksi</p></div>';return;}
    var h='';
    list.forEach(function(t){
        var cat=getCat(t.type,t.category);
        h+='<div class="tx-item '+t.type+'" onclick="showDetail(\''+t.id+'\')">';
        h+='<div class="tx-icon" style="background:'+cat.color+'20;color:'+cat.color+'"><i class="fas '+cat.icon+'"></i></div>';
        h+='<div class="tx-info"><h4>'+t.desc+'</h4><span>'+cat.name+'</span></div>';
        h+='<div class="tx-amount"><strong>'+(t.type==='income'?'+':'-')+formatRp(t.amount)+'</strong><small>'+formatDate(t.date)+'</small></div></div>';
    });
    c.innerHTML=h;
}

function renderBudgets(){
    var c=document.getElementById('budgetList');
    if(!data.budgets.length){c.innerHTML='<div class="empty-state"><i class="fas fa-piggy-bank"></i><p>Belum ada anggaran</p></div>';return;}
    var m=new Date().getMonth();var h='';
    data.budgets.forEach(function(b){
        var spent=0;
        data.transactions.forEach(function(t){if(t.type==='expense'&&t.category===b.category&&new Date(t.date).getMonth()===m)spent+=t.amount;});
        var pct=Math.min((spent/b.amount)*100,100);
        var cat=getCat('expense',b.category);
        var st=pct>=100?'danger':pct>=80?'warning':'safe';
        h+='<div class="budget-item"><div class="budget-top"><h4><i class="fas '+cat.icon+'" style="color:'+cat.color+'"></i> '+cat.name+'</h4>';
        h+='<button onclick="deleteBudget(\''+b.id+'\')"><i class="fas fa-times"></i></button></div>';
        h+='<div class="budget-bar"><div class="budget-fill '+st+'" style="width:'+pct+'%"></div></div>';
        h+='<div class="budget-bottom"><span>'+pct.toFixed(0)+'% terpakai</span><span>'+formatRp(spent)+' / '+formatRp(b.amount)+'</span></div></div>';
    });
    c.innerHTML=h;
}

function renderStats(){
    var m=new Date().getMonth();var bc={};var total=0;
    data.transactions.forEach(function(t){if(t.type==='expense'&&new Date(t.date).getMonth()===m){bc[t.category]=(bc[t.category]||0)+t.amount;total+=t.amount;}});
    var c=document.getElementById('categoryStats');
    if(!total){c.innerHTML='<div class="empty-state"><i class="fas fa-chart-pie"></i><p>Belum ada data</p></div>';return;}
    var sorted=[];for(var k in bc)sorted.push([k,bc[k]]);
    sorted.sort(function(a,b){return b[1]-a[1];});
    var h='';
    sorted.slice(0,5).forEach(function(it){
        var cat=getCat('expense',it[0]);var pct=(it[1]/total*100).toFixed(0);
        h+='<div class="cat-item"><div class="cat-icon" style="background:'+cat.color+'20;color:'+cat.color+'"><i class="fas '+cat.icon+'"></i></div>';
        h+='<div class="cat-info"><div><span>'+cat.name+'</span><span>'+formatRp(it[1])+'</span></div>';
        h+='<div class="cat-bar"><div class="cat-fill" style="width:'+pct+'%;background:'+cat.color+'"></div></div></div></div>';
    });
    c.innerHTML=h;
}

// ===== CHART =====
function initChart(){
    var ctx=document.getElementById('myChart');if(!ctx)return;
    myChart=new Chart(ctx.getContext('2d'),{
        type:'bar',
        data:{labels:['Minggu 1','Minggu 2','Minggu 3','Minggu 4'],
            datasets:[{label:'Pemasukan',data:[0,0,0,0],backgroundColor:'rgba(16,185,129,0.8)',borderRadius:6},
                {label:'Pengeluaran',data:[0,0,0,0],backgroundColor:'rgba(239,68,68,0.8)',borderRadius:6}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true}}}
    });
    updateChart();
}

function updateChart(){
    if(!myChart)return;
    var now=new Date();var iD=[0,0,0,0],eD=[0,0,0,0];
    data.transactions.forEach(function(t){
        var d=new Date(t.date);
        if(d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()){
            var w=Math.floor((d.getDate()-1)/7);if(w>3)w=3;
            if(t.type==='income')iD[w]+=t.amount;else eD[w]+=t.amount;
        }
    });
    myChart.data.datasets[0].data=iD;myChart.data.datasets[1].data=eD;myChart.update();
}

// ===== TAB SWITCH =====
function switchTab(tab){
    document.querySelectorAll('.tab-content').forEach(function(el){el.classList.remove('active');});
    document.querySelectorAll('.nav-btn').forEach(function(el){el.classList.remove('active');});
    document.getElementById(tab+'Tab').classList.add('active');
    var nb=document.querySelector('[data-tab="'+tab+'"]');if(nb)nb.classList.add('active');
    if(tab==='invest'){loadCrypto();loadNews();}
    if(tab==='stats'){updateChart();loadCryptoStats();}
}

function switchSubTab(subtab){
    document.querySelectorAll('.sub-tab').forEach(function(el){el.classList.remove('active');});
    document.querySelectorAll('.sub-content').forEach(function(el){el.classList.remove('active');});
    document.querySelector('.sub-tab[onclick*="'+subtab+'"]').classList.add('active');
    document.getElementById(subtab+'SubTab').classList.add('active');
}

function setFilter(f){
    currentFilter=f;
    document.querySelectorAll('.filter-btn[data-filter]').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-filter')===f);});
    renderTransactions();
}

function setNewsFilter(f){
    newsFilter=f;
    document.querySelectorAll('.filter-btn[data-news]').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-news')===f);});
    renderNews();
}

// ===== MODAL =====
function openModal(type){
    currentType=type;
    document.getElementById('txId').value='';
    document.getElementById('txDesc').value='';
    document.getElementById('txAmount').value='';
    document.getElementById('txDate').value=new Date().toISOString().split('T')[0];
    document.getElementById('modalTitle').textContent=type==='income'?'Tambah Pemasukan':'Tambah Pengeluaran';
    setType(type);populateCategories();
    document.getElementById('txModal').classList.remove('hidden');
}
function closeModal(){document.getElementById('txModal').classList.add('hidden');}
function setType(type){currentType=type;document.querySelectorAll('.type-btn').forEach(function(el){el.classList.remove('active');});document.querySelector('.type-btn.'+type).classList.add('active');populateCategories();}
function populateCategories(){var cats=categories[currentType];var h='<option value="">Pilih Kategori</option>';cats.forEach(function(c){h+='<option value="'+c.id+'">'+c.name+'</option>';});document.getElementById('txCategory').innerHTML=h;}

function saveTransaction(e){
    e.preventDefault();
    var id=document.getElementById('txId').value||genId();
    var tx={id:id,type:currentType,desc:document.getElementById('txDesc').value,amount:parseNum(document.getElementById('txAmount').value),category:document.getElementById('txCategory').value,date:document.getElementById('txDate').value};
    var idx=-1;for(var i=0;i<data.transactions.length;i++){if(data.transactions[i].id===id){idx=i;break;}}
    if(idx>=0)data.transactions[idx]=tx;else data.transactions.push(tx);
    saveData();render();closeModal();toast('Tersimpan!');
}

function showDetail(id){
    var t=null;for(var i=0;i<data.transactions.length;i++){if(data.transactions[i].id===id){t=data.transactions[i];break;}}
    if(!t)return;currentTxId=id;var cat=getCat(t.type,t.category);
    var h='<div class="detail-icon '+t.type+'"><i class="fas '+cat.icon+'"></i></div>';
    h+='<div class="detail-amount '+t.type+'">'+(t.type==='income'?'+':'-')+formatRp(t.amount)+'</div>';
    h+='<div class="detail-rows"><div class="detail-row"><span>Deskripsi</span><span>'+t.desc+'</span></div>';
    h+='<div class="detail-row"><span>Kategori</span><span>'+cat.name+'</span></div>';
    h+='<div class="detail-row"><span>Tanggal</span><span>'+formatDate(t.date)+'</span></div></div>';
    document.getElementById('detailContent').innerHTML=h;
    document.getElementById('detailModal').classList.remove('hidden');
}
function closeDetail(){document.getElementById('detailModal').classList.add('hidden');}
function editTx(){var t=null;for(var i=0;i<data.transactions.length;i++){if(data.transactions[i].id===currentTxId){t=data.transactions[i];break;}}if(!t)return;closeDetail();currentType=t.type;document.getElementById('txId').value=t.id;document.getElementById('txDesc').value=t.desc;document.getElementById('txAmount').value=formatNum(t.amount);document.getElementById('txDate').value=t.date;document.getElementById('modalTitle').textContent='Edit Transaksi';setType(t.type);populateCategories();document.getElementById('txCategory').value=t.category;document.getElementById('txModal').classList.remove('hidden');}
function deleteTx(){if(!confirm('Hapus transaksi ini?'))return;data.transactions=data.transactions.filter(function(t){return t.id!==currentTxId;});saveData();render();closeDetail();toast('Dihapus!');}

// ===== BUDGET =====
function openBudgetModal(){var used=data.budgets.map(function(b){return b.category;});var av=categories.expense.filter(function(c){return used.indexOf(c.id)===-1;});var h='<option value="">Pilih Kategori</option>';av.forEach(function(c){h+='<option value="'+c.id+'">'+c.name+'</option>';});document.getElementById('budgetCat').innerHTML=h;document.getElementById('budgetAmt').value='';document.getElementById('budgetModal').classList.remove('hidden');}
function closeBudgetModal(){document.getElementById('budgetModal').classList.add('hidden');}
function saveBudget(e){e.preventDefault();data.budgets.push({id:genId(),category:document.getElementById('budgetCat').value,amount:parseNum(document.getElementById('budgetAmt').value)});saveData();renderBudgets();closeBudgetModal();toast('Tersimpan!');}
function deleteBudget(id){if(!confirm('Hapus anggaran?'))return;data.budgets=data.budgets.filter(function(b){return b.id!==id;});saveData();renderBudgets();toast('Dihapus!');}

// ===== CRYPTO STATS (untuk halaman Statistik) =====
function loadCryptoStats(){
    var btn=document.getElementById('refreshStatsBtn');
    if(btn)btn.classList.add('spin');
    var c=document.getElementById('cryptoStatsOverview');
    var m=document.getElementById('topMovers');
    c.innerHTML='<div class="loading"><div class="spinner"></div></div>';
    m.innerHTML='<div class="loading"><div class="spinner"></div></div>';
    
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h')
    .then(function(r){return r.json();})
    .then(function(coins){
        if(btn)btn.classList.remove('spin');
        
        // Top 4 coins untuk overview
        var top4=coins.slice(0,4);
        var h='';
        top4.forEach(function(coin){
            var changeClass=coin.price_change_percentage_24h>=0?'up':'down';
            var changeIcon=coin.price_change_percentage_24h>=0?'fa-caret-up':'fa-caret-down';
            h+='<div class="crypto-stat-card">';
            h+='<img src="'+coin.image+'" alt="'+coin.name+'">';
            h+='<h4>'+coin.symbol.toUpperCase()+'</h4>';
            h+='<div class="price">$'+formatPrice(coin.current_price)+'</div>';
            h+='<div class="change '+changeClass+'"><i class="fas '+changeIcon+'"></i> '+(coin.price_change_percentage_24h||0).toFixed(2)+'%</div>';
            h+='</div>';
        });
        c.innerHTML=h;
        
        // Top Movers (gainers & losers)
        var gainers=coins.filter(function(x){return x.price_change_percentage_24h>0;})
            .sort(function(a,b){return b.price_change_percentage_24h-a.price_change_percentage_24h;}).slice(0,3);
        var losers=coins.filter(function(x){return x.price_change_percentage_24h<0;})
            .sort(function(a,b){return a.price_change_percentage_24h-b.price_change_percentage_24h;}).slice(0,3);
        
        var mh='';
        gainers.forEach(function(coin){
            mh+='<div class="mover-card gainer">';
            mh+='<img src="'+coin.image+'">';
            mh+='<h5>'+coin.symbol.toUpperCase()+'</h5>';
            mh+='<div class="price">$'+formatPrice(coin.current_price)+'</div>';
            mh+='<div class="change up"><i class="fas fa-caret-up"></i> +'+(coin.price_change_percentage_24h||0).toFixed(2)+'%</div>';
            mh+='</div>';
        });
        losers.forEach(function(coin){
            mh+='<div class="mover-card loser">';
            mh+='<img src="'+coin.image+'">';
            mh+='<h5>'+coin.symbol.toUpperCase()+'</h5>';
            mh+='<div class="price">$'+formatPrice(coin.current_price)+'</div>';
            mh+='<div class="change down"><i class="fas fa-caret-down"></i> '+(coin.price_change_percentage_24h||0).toFixed(2)+'%</div>';
            mh+='</div>';
        });
        m.innerHTML=mh;
    })
    .catch(function(){
        if(btn)btn.classList.remove('spin');
        c.innerHTML='<div class="empty-state"><p>Gagal memuat</p></div>';
        m.innerHTML='<div class="empty-state"><p>Gagal memuat</p></div>';
    });
}

// ===== CRYPTO =====
function loadCrypto(){
    var btn=document.getElementById('refreshBtn');btn.classList.add('spin');
    var c=document.getElementById('cryptoList');
    c.innerHTML='<div class="loading"><div class="spinner"></div><p>Memuat semua koin...</p></div>';
    
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h')
    .then(function(r){return r.json();})
    .then(function(coins){
        btn.classList.remove('spin');
        allCryptoData=coins;
        displayedCrypto=20;
        
        var up=coins.filter(function(x){return x.price_change_percentage_24h>0;}).length;
        var dn=coins.filter(function(x){return x.price_change_percentage_24h<0;}).length;
        
        document.getElementById('cryptoUp').textContent=up;
        document.getElementById('cryptoDown').textContent=dn;
        document.getElementById('cryptoTotal').textContent=coins.length;
        
        renderCryptoList();
    })
    .catch(function(){
        btn.classList.remove('spin');
        c.innerHTML='<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Gagal memuat</p><button onclick="loadCrypto()" class="btn primary" style="margin-top:1rem;padding:.5rem 1rem">Coba Lagi</button></div>';
    });
}

function renderCryptoList(){
    var search=document.getElementById('cryptoSearch').value.toLowerCase();
    var filtered=allCryptoData.filter(function(c){
        if(!search)return true;
        return c.name.toLowerCase().indexOf(search)!==-1||c.symbol.toLowerCase().indexOf(search)!==-1;
    });
    
    var toShow=filtered.slice(0,displayedCrypto);
    var c=document.getElementById('cryptoList');
    
    if(!toShow.length){
        c.innerHTML='<div class="empty-state"><i class="fas fa-search"></i><p>Koin tidak ditemukan</p></div>';
        document.getElementById('loadMoreBtn').classList.add('hidden');
        return;
    }
    
    var h='';
    toShow.forEach(function(x,i){
        var changeClass=x.price_change_percentage_24h>=0?'up':'down';
        var changeIcon=x.price_change_percentage_24h>=0?'fa-caret-up':'fa-caret-down';
        var changeVal=x.price_change_percentage_24h?x.price_change_percentage_24h.toFixed(2):'0.00';
        
        h+='<div class="crypto-item" onclick="showCryptoDetail(\''+x.id+'\')">';
        h+='<div class="crypto-rank">'+(i+1)+'</div>';
        h+='<img class="crypto-img" src="'+x.image+'" onerror="this.src=\'https://via.placeholder.com/36\'">';
        h+='<div class="crypto-info"><h4>'+x.name+'</h4><span>'+x.symbol+'</span></div>';
        h+='<div class="crypto-price"><strong>$'+formatPrice(x.current_price)+'</strong>';
        h+='<div class="crypto-change '+changeClass+'"><i class="fas '+changeIcon+'"></i> '+changeVal+'%</div></div></div>';
    });
    c.innerHTML=h;
    
    if(filtered.length>displayedCrypto){
        document.getElementById('loadMoreBtn').classList.remove('hidden');
    }else{
        document.getElementById('loadMoreBtn').classList.add('hidden');
    }
}

function filterCrypto(){renderCryptoList();}
function loadMoreCrypto(){displayedCrypto+=20;renderCryptoList();}

function showCryptoDetail(id){
    var coin=null;
    for(var i=0;i<allCryptoData.length;i++){
        if(allCryptoData[i].id===id){coin=allCryptoData[i];break;}
    }
    if(!coin)return;
    
    var changeClass=coin.price_change_percentage_24h>=0?'up':'down';
    var h='<div class="crypto-detail-header">';
    h+='<img src="'+coin.image+'" alt="'+coin.name+'">';
    h+='<h2>'+coin.name+'</h2>';
    h+='<span>'+coin.symbol.toUpperCase()+'</span></div>';
    h+='<div class="crypto-detail-price"><strong>$'+formatPrice(coin.current_price)+'</strong>';
    h+='<div class="crypto-change '+changeClass+'" style="justify-content:center;font-size:1rem;margin-top:.5rem">';
    h+='<i class="fas '+(coin.price_change_percentage_24h>=0?'fa-caret-up':'fa-caret-down')+'"></i> ';
    h+=(coin.price_change_percentage_24h||0).toFixed(2)+'%</div></div>';
    h+='<div class="crypto-detail-stats">';
    h+='<div class="crypto-stat-box"><small>Market Cap</small><span>$'+formatLargeNum(coin.market_cap)+'</span></div>';
    h+='<div class="crypto-stat-box"><small>Volume 24h</small><span>$'+formatLargeNum(coin.total_volume)+'</span></div>';
    h+='<div class="crypto-stat-box"><small>High 24h</small><span>$'+formatPrice(coin.high_24h)+'</span></div>';
    h+='<div class="crypto-stat-box"><small>Low 24h</small><span>$'+formatPrice(coin.low_24h)+'</span></div>';
    h+='<div class="crypto-stat-box"><small>ATH</small><span>$'+formatPrice(coin.ath)+'</span></div>';
    h+='<div class="crypto-stat-box"><small>Rank</small><span>#'+coin.market_cap_rank+'</span></div></div>';
    
    document.getElementById('cryptoModalTitle').textContent=coin.name;
    document.getElementById('cryptoModalContent').innerHTML=h;
    document.getElementById('cryptoModal').classList.remove('hidden');
}

function closeCryptoModal(){document.getElementById('cryptoModal').classList.add('hidden');}

// ===== NEWS =====
function loadNews(){
    var btn=document.getElementById('refreshNewsBtn');
    if(btn)btn.classList.add('spin');
    var c=document.getElementById('newsList');
    c.innerHTML='<div class="loading"><div class="spinner"></div><p>Memuat berita...</p></div>';
    
    setTimeout(function(){
        if(btn)btn.classList.remove('spin');
        allNewsData=[
            {id:1,title:'Bitcoin Menembus $100.000 untuk Pertama Kalinya dalam Sejarah',summary:'Harga Bitcoin mencapai rekor tertinggi sepanjang masa setelah adopsi institusional meningkat drastis. Para analis memperkirakan tren bullish akan berlanjut hingga akhir tahun.',thumb:'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',source:'CoinDesk',date:'2 jam lalu',category:'crypto',content:'Bitcoin akhirnya menembus angka psikologis $100.000 untuk pertama kalinya dalam sejarah. Pencapaian ini menandai era baru bagi cryptocurrency terbesar di dunia. Para investor institusional terus mengakumulasi BTC sebagai lindung nilai terhadap inflasi.'},
            {id:2,title:'Bank Indonesia Rilis Regulasi Baru untuk Aset Kripto di 2024',summary:'Regulasi baru bertujuan melindungi investor ritel dan meningkatkan transparansi pasar kripto di Indonesia.',thumb:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',source:'Kompas',date:'4 jam lalu',category:'crypto',content:'Bank Indonesia bersama OJK telah merilis kerangka regulasi komprehensif untuk aset kripto. Regulasi ini mencakup persyaratan KYC yang lebih ketat, batasan leverage, dan perlindungan dana nasabah.'},
            {id:3,title:'Rupiah Menguat 0.5% Terhadap Dollar AS di Tengah Optimisme Ekonomi',summary:'Nilai tukar rupiah menguat terhadap dollar AS didukung oleh data ekonomi domestik yang positif.',thumb:'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400',source:'CNBC Indonesia',date:'5 jam lalu',category:'ekonomi',content:'Rupiah mencatat penguatan signifikan terhadap dollar AS seiring dengan membaiknya neraca perdagangan Indonesia. Cadangan devisa juga meningkat ke level tertinggi dalam 6 bulan terakhir.'},
            {id:4,title:'Ethereum 2.0 Staking Rewards Meningkat Setelah Upgrade Dencun',summary:'Validator Ethereum 2.0 kini menerima reward yang lebih tinggi setelah implementasi upgrade Dencun.',thumb:'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',source:'CoinTelegraph',date:'6 jam lalu',category:'crypto',content:'Upgrade Dencun telah berhasil diimplementasikan pada jaringan Ethereum, membawa peningkatan efisiensi dan rewards yang lebih baik bagi para validator. Gas fee juga turun signifikan.'},
            {id:5,title:'OJK Keluarkan Peringatan Investasi Bodong: Waspada Skema Ponzi',summary:'Otoritas Jasa Keuangan meminta masyarakat waspada terhadap skema investasi ilegal yang marak.',thumb:'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',source:'Detik Finance',date:'8 jam lalu',category:'ekonomi',content:'OJK telah mengidentifikasi puluhan skema investasi bodong yang beroperasi tanpa izin. Masyarakat diminta untuk selalu mengecek legalitas platform investasi sebelum menanamkan dana.'},
            {id:6,title:'Solana Pecahkan Rekor 65.000 TPS, Jadi Blockchain Tercepat',summary:'Solana membuktikan skalabilitasnya dengan mencapai throughput tertinggi di antara blockchain layer-1.',thumb:'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',source:'Decrypt',date:'10 jam lalu',category:'crypto',content:'Jaringan Solana berhasil memproses 65.000 transaksi per detik dalam stress test terbaru, mengukuhkan posisinya sebagai blockchain tercepat. Biaya transaksi tetap di bawah $0.001.'},
            {id:7,title:'Inflasi Indonesia Terkendali di 2.8%, Lebih Rendah dari Ekspektasi',summary:'BPS melaporkan tingkat inflasi tahunan berada di level yang lebih rendah dari perkiraan pasar.',thumb:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',source:'Bisnis Indonesia',date:'12 jam lalu',category:'ekonomi',content:'Badan Pusat Statistik mencatat inflasi year-on-year sebesar 2.8%, lebih rendah dari konsensus pasar 3.1%. Hal ini memberi ruang bagi Bank Indonesia untuk mempertahankan suku bunga.'},
            {id:8,title:'NFT Gaming dan Metaverse Token Naik 200% dalam Sepekan',summary:'Token-token gaming berbasis NFT dan metaverse mengalami rally signifikan seiring tren GameFi.',thumb:'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400',source:'The Block',date:'1 hari lalu',category:'crypto',content:'Sektor GameFi kembali mencuri perhatian dengan beberapa token mencatat kenaikan hingga 200% dalam seminggu. Para analis melihat ini sebagai awal dari bull run sektor gaming crypto.'}
        ];
        renderNews();
    },800);
}

function renderNews(){
    var search=document.getElementById('newsSearch').value.toLowerCase();
    var filtered=allNewsData.filter(function(n){
        if(newsFilter!=='all'&&n.category!==newsFilter)return false;
        if(search&&n.title.toLowerCase().indexOf(search)===-1)return false;
        return true;
    });
    
    var c=document.getElementById('newsList');
    if(!filtered.length){
        c.innerHTML='<div class="empty-state"><i class="fas fa-newspaper"></i><p>Tidak ada berita</p></div>';
        return;
    }
    
    var h='';
    filtered.forEach(function(n){
        var catClass=n.category==='crypto'?'crypto':'ekonomi';
        h+='<div class="news-item" onclick="showNewsDetail('+n.id+')">';
        h+='<img class="news-thumb" src="'+n.thumb+'" onerror="this.style.background=\'var(--border)\'" alt="">';
        h+='<div class="news-content">';
        h+='<h4>'+n.title+'</h4>';
        h+='<p class="news-summary">'+n.summary+'</p>';
        h+='<div class="news-meta"><span class="news-category '+catClass+'">'+n.category.toUpperCase()+'</span>';
        h+='<span>'+n.source+'</span><i class="fas fa-circle"></i><span>'+n.date+'</span></div>';
        h+='</div></div>';
    });
    c.innerHTML=h;
}

function filterNews(){renderNews();}

function showNewsDetail(id){
    var news=null;
    for(var i=0;i<allNewsData.length;i++){
        if(allNewsData[i].id===id){news=allNewsData[i];break;}
    }
    if(!news)return;
    
    currentNewsId=id;
    var catClass=news.category==='crypto'?'crypto':'ekonomi';
    
    var h='<img class="news-detail-img" src="'+news.thumb+'" onerror="this.style.background=\'var(--border)\'" alt="">';
    h+='<div class="news-detail-body">';
    h+='<h2>'+news.title+'</h2>';
    h+='<div class="news-detail-meta">';
    h+='<span class="news-category '+catClass+'">'+news.category.toUpperCase()+'</span>';
    h+='<span>'+news.source+'</span>';
    h+='<span>'+news.date+'</span>';
    h+='</div>';
    h+='<p class="news-detail-text">'+news.content+'</p>';
    h+='<div class="news-detail-actions">';
    h+='<button class="btn primary" onclick="shareNews()"><i class="fas fa-share"></i> Bagikan</button>';
    h+='<button class="btn secondary" onclick="closeNewsModal()"><i class="fas fa-times"></i> Tutup</button>';
    h+='</div></div>';
    
    document.getElementById('newsModalContent').innerHTML=h;
    document.getElementById('newsModal').classList.remove('hidden');
}

function closeNewsModal(){document.getElementById('newsModal').classList.add('hidden');}

function shareNews(){
    var news=null;
    for(var i=0;i<allNewsData.length;i++){
        if(allNewsData[i].id===currentNewsId){news=allNewsData[i];break;}
    }
    if(!news)return;
    
    if(navigator.share){
        navigator.share({
            title:news.title,
            text:news.summary,
            url:window.location.href
        });
    }else{
        // Fallback: copy to clipboard
        var text=news.title+'\n'+news.summary;
        if(navigator.clipboard){
            navigator.clipboard.writeText(text);
            toast('Link disalin!');
        }else{
            toast('Bagikan: '+news.title);
        }
    }
}

// ===== TIPS =====
function showTip(){document.getElementById('tipText').textContent=tips[tipIndex];}
function nextTip(){tipIndex=(tipIndex+1)%tips.length;var el=document.getElementById('tipText');el.style.opacity='0';setTimeout(function(){el.textContent=tips[tipIndex];el.style.opacity='1';},150);}

// ===== IMPORT/EXPORT =====
function exportData(){var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lolahin-backup.json';a.click();toast('Data diexport!');}
function importData(e){var file=e.target.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(ev){try{var imported=JSON.parse(ev.target.result);if(imported.transactions){data=imported;saveData();render();toast('Data diimport!');}}catch(err){toast('File tidak valid!');}};reader.readAsText(file);e.target.value='';}
function resetData(){if(!confirm('Hapus semua data?'))return;data={transactions:[],budgets:[]};saveData();render();toast('Data direset!');}

// ===== HELPERS =====
function genId(){return Date.now().toString(36)+Math.random().toString(36).substr(2);}
function formatRp(n){return'Rp '+n.toLocaleString('id-ID');}
function formatNum(n){return n.toLocaleString('id-ID');}
function parseNum(s){return parseInt(s.replace(/\D/g,''))||0;}
function formatDate(s){return new Date(s).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});}
function formatInput(el){var v=el.value.replace(/\D/g,'');el.value=v?parseInt(v).toLocaleString('id-ID'):'';}
function formatPrice(n){if(!n)return'0';if(n>=1)return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});return n.toLocaleString('en-US',{minimumFractionDigits:4,maximumFractionDigits:6});}
function formatLargeNum(n){if(!n)return'0';if(n>=1e12)return(n/1e12).toFixed(2)+'T';if(n>=1e9)return(n/1e9).toFixed(2)+'B';if(n>=1e6)return(n/1e6).toFixed(2)+'M';if(n>=1e3)return(n/1e3).toFixed(2)+'K';return n.toString();}
function getCat(type,id){var l=categories[type]||[];for(var i=0;i<l.length;i++){if(l[i].id===id)return l[i];}return{name:'Lainnya',icon:'fa-question',color:'#6b7280'};}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.remove('hidden');setTimeout(function(){t.classList.add('hidden');},2500);}

// ===== CHECK USER SESSION =====
function checkUserSession() {
    var session = null;
    try {
        session = JSON.parse(localStorage.getItem('lolahin_session') || sessionStorage.getItem('lolahin_session'));
    } catch(e) {}
    
    if (session) {
        // Update header dengan info user
        var headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            var userBtn = document.createElement('button');
            userBtn.className = 'icon-btn user-btn';
            userBtn.innerHTML = '<img src="' + (session.avatar || 'https://ui-avatars.com/api/?name=User') + '" alt="User" style="width:32px;height:32px;border-radius:50%">';
            userBtn.onclick = function() { showUserMenu(); };
            headerActions.insertBefore(userBtn, headerActions.firstChild);
        }
    }
}

function showUserMenu() {
    var session = JSON.parse(localStorage.getItem('lolahin_session') || sessionStorage.getItem('lolahin_session'));
    if (!session) return;
    
    var existing = document.getElementById('userMenu');
    if (existing) {
        existing.remove();
        return;
    }
    
    var menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'menu-dropdown';
    menu.style.cssText = 'top:60px;right:60px';
    menu.innerHTML = '<div style="padding:1rem;border-bottom:1px solid var(--border);text-align:center"><img src="' + session.avatar + '" style="width:50px;height:50px;border-radius:50%;margin-bottom:0.5rem"><p style="font-weight:600">' + session.name + '</p><p style="font-size:0.8rem;color:var(--text2)">' + session.email + '</p></div>' +
        '<button onclick="window.location.href=\'login.html\'"><i class="fas fa-user"></i> Profil</button>' +
        '<button onclick="logoutUser()"><i class="fas fa-sign-out-alt"></i> Logout</button>';
    
    document.body.appendChild(menu);
    
    setTimeout(function() {
        document.addEventListener('click', function handler(e) {
            if (!e.target.closest('#userMenu') && !e.target.closest('.user-btn')) {
                menu.remove();
                document.removeEventListener('click', handler);
            }
        });
    }, 100);
}

function logoutUser() {
    localStorage.removeItem('lolahin_session');
    sessionStorage.removeItem('lolahin_session');
    toast('Logout berhasil!');
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 1000);
}

// Panggil saat load
if (typeof checkUserSession === 'function') {
    setTimeout(checkUserSession, 100);
}
