/* main.js — улучшенная логика: search, filters, theme, lazy load, admin (localStorage) */
(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const YEAR = new Date().getFullYear();

  // ---------- theme ----------
  function setTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('gv_theme', t);
  }
  const stored = localStorage.getItem('gv_theme') || 'dark';
  setTheme(stored);

  // attach toggle if exists
  const themeBtn = $('#themeToggle');
  if(themeBtn){
    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(cur==='dark' ? 'light' : 'dark');
    });
  }

  // ---------- helpers ----------
  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function isFav(id){ return (JSON.parse(localStorage.getItem('gv_fav')||'[]')).includes(id); }
  function toggleFav(id){
    const arr = JSON.parse(localStorage.getItem('gv_fav')||'[]');
    if(arr.includes(id)) arr.splice(arr.indexOf(id),1); else arr.push(id);
    localStorage.setItem('gv_fav', JSON.stringify(arr));
  }

  // ---------- render card ----------
  function cardHTML(g){
    return `
      <img class="thumb lazy" data-src="${g.cover}" alt="${escapeHtml(g.title)}" />
      <div>
        <h3>${escapeHtml(g.title)}</h3>
        <div class="meta">${escapeHtml(g.platform)} · ${escapeHtml(g.genre)} · ⭐ ${g.rating}</div>
        <p class="short">${escapeHtml(g.short)}</p>
      </div>
      <div class="card-actions">
        <a class="btn small" href="game.html?id=${encodeURIComponent(g.id)}">View</a>
        <button class="fav-btn" data-id="${g.id}">${isFav(g.id)?'★':'☆'}</button>
      </div>
    `;
  }

  // ---------- lazy loader ----------
  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(e=>{
      if(e.isIntersecting){
        const img = e.target;
        const src = img.dataset.src;
        if(src){ img.src = src; img.classList.add('loaded'); }
        lazyObserver.unobserve(img);
      }
    });
  }, {rootMargin: '200px'});

  function initLazy(){
    $$('.lazy').forEach(img => {
      if(img.dataset.src && !img.src) lazyObserver.observe(img);
    });
  }

  // ---------- data source (admin override) ----------
  function loadGames(){
    try {
      const saved = JSON.parse(localStorage.getItem('gv_games_override')||'null');
      return saved || GAMES;
    } catch(e){ return GAMES; }
  }

  // ---------- index / catalog render ----------
  function renderList(targetId, list){
    const wrap = document.getElementById(targetId);
    if(!wrap) return;
    wrap.innerHTML = '';
    list.forEach(g => {
      const art = document.createElement('article');
      art.className = 'card';
      art.innerHTML = cardHTML(g);
      wrap.appendChild(art);
      // attach fav
      art.querySelector('.fav-btn').addEventListener('click', (e)=>{
        toggleFav(g.id);
        e.currentTarget.textContent = isFav(g.id)?'★':'☆';
      });
    });
    initLazy();
  }

  // ---------- search & filters ----------
  function applyFilters(){
    const q = ($('#searchCatalog') && $('#searchCatalog').value.trim().toLowerCase()) || '';
    const platform = ($('#filterPlatform') && $('#filterPlatform').value) || '';
    const genre = ($('#filterGenre') && $('#filterGenre').value) || '';
    const sort = ($('#sortBy') && $('#sortBy').value) || 'popular';
    let list = loadGames().slice();
    if(platform) list = list.filter(g=>g.platform.toLowerCase().includes(platform.toLowerCase()));
    if(genre) list = list.filter(g=>g.genre && g.genre.toLowerCase().includes(genre.toLowerCase()));
    if(q) list = list.filter(g=>g.title.toLowerCase().includes(q) || g.short.toLowerCase().includes(q));
    if(sort==='new') list = list.sort((a,b)=> (b.date||0)-(a.date||0));
    if(sort==='rating') list = list.sort((a,b)=> (b.rating||0)-(a.rating||0));
    renderList('catalogCards', list);
  }

  // ---------- game page ----------
  function renderGame(){
    const el = document.getElementById('gameArea');
    if(!el) return;
    const p = new URLSearchParams(location.search);
    const id = p.get('id');
    const g = loadGames().find(x=>x.id===id);
    if(!g){ el.innerHTML = '<p>Game not found</p>'; return; }
    el.innerHTML = `
      <div class="game-page">
        <div class="left">
          <img src="${g.cover}" class="cover" alt="${escapeHtml(g.title)}" />
          ${g.trailer ? `<div class="trailer"><iframe src="${g.trailer}" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe></div>` : ''}
        </div>
        <div class="right">
          <h1>${escapeHtml(g.title)}</h1>
          <div class="game-meta">Platform: ${escapeHtml(g.platform)} · Genre: ${escapeHtml(g.genre)} · ⭐ ${g.rating}</div>
          <p>${escapeHtml(g.desc)}</p>
          <p><strong>System req:</strong> ${escapeHtml(g.requirements.min)}</p>
          <p><a class="btn" href="${g.steam}" target="_blank">Open on Store</a></p>
          <button id="favBtn" class="btn ghost">${isFav(g.id)?'Remove Favorite':'Add to Favorites'}</button>
        </div>
      </div>
    `;
    $('#favBtn').addEventListener('click', ()=>{
      toggleFav(g.id);
      $('#favBtn').textContent = isFav(g.id)?'Remove Favorite':'Add to Favorites';
    });
  }

  // ---------- admin page ----------
  function initAdmin(){
    const adminWrap = document.getElementById('adminArea');
    if(!adminWrap) return;
    // render list and form
    function refresh(){
      const list = loadGames();
      const out = adminWrap.querySelector('.admin-list');
      out.innerHTML = '';
      list.forEach(g=>{
        const row = document.createElement('div');
        row.className = 'admin-row';
        row.innerHTML = `<strong>${escapeHtml(g.title)}</strong> — ${escapeHtml(g.genre)} <button class="btn small del" data-id="${g.id}">Delete</button>`;
        out.appendChild(row);
      });
      $$('.del').forEach(b => b.addEventListener('click', (e)=>{
        const id = e.currentTarget.dataset.id;
        const arr = loadGames().filter(x=>x.id!==id);
        localStorage.setItem('gv_games_override', JSON.stringify(arr));
        refresh();
      }));
    }
    adminWrap.querySelector('#adminAdd').addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const title = adminWrap.querySelector('#adm_title').value.trim();
      const id = adminWrap.querySelector('#adm_id').value.trim();
      const cover = adminWrap.querySelector('#adm_cover').value.trim();
      const genre = adminWrap.querySelector('#adm_genre').value.trim();
      if(!id||!title) return alert('id and title required');
      const arr = loadGames();
      arr.unshift({ id, title, platform: 'PC', genre, short: title, desc: title, cover: cover||'assets/img/placeholder.jpg', trailer:'', steam:'#', requirements:{min:'N/A'}, rating:4.0 });
      localStorage.setItem('gv_games_override', JSON.stringify(arr));
      adminWrap.querySelector('#adminAdd').reset();
      refresh();
    });
    refresh();
  }

  // ---------- init on load ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    // insert year fields
    document.querySelectorAll('[id^=year]').forEach(e=>e.textContent = YEAR);

    // search top linking to catalog
    $('#searchTop')?.addEventListener('keydown', e=>{
      if(e.key==='Enter'){
        location.href = 'catalog.html';
        setTimeout(()=> {
          const el = $('#searchCatalog');
          if(el){ el.value = e.target.value; el.dispatchEvent(new Event('input')); }
        }, 150);
      }
    });

    // render index featured & top
    if(document.getElementById('featuredCards')){
      const games = loadGames();
      renderList('featuredCards', games.filter(g=>g.featured));
      renderList('topCards', games.filter(g=>g.top));
    }

    // catalog page hooks
    if(document.getElementById('catalogCards')){
      // populate filter genres
      const genres = Array.from(new Set(loadGames().map(g=>g.genre).filter(Boolean)));
      const gsel = $('#filterGenre');
      if(gsel){
        genres.forEach(gg => {
          const opt = document.createElement('option'); opt.value = gg; opt.textContent = gg; gsel.appendChild(opt);
        });
      }
      $('#searchCatalog')?.addEventListener('input', applyFilters);
      $('#filterPlatform')?.addEventListener('change', applyFilters);
      $('#filterGenre')?.addEventListener('change', applyFilters);
      $('#sortBy')?.addEventListener('change', applyFilters);
      applyFilters();
    }

    // game page
    renderGame();

    // admin
    initAdmin();

    // lazy init
    setTimeout(initLazy, 300);
  });
})();
