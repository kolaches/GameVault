// main.js — minimal logic for rendering and interactions
(function(){
  // helper
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // render helper for cards
  function createCard(game, isFav=false){
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `
      <img class="cover-small" src="${game.cover}" alt="${escapeHtml(game.title)}" />
      <div class="card-content">
        <h3><a href="game.html?id=${encodeURIComponent(game.id)}">${escapeHtml(game.title)}</a></h3>
        <div class="meta">${escapeHtml(game.platform)}</div>
        <p class="short">${escapeHtml(game.short)}</p>
        <div class="card-actions">
          <a class="btn small" href="game.html?id=${encodeURIComponent(game.id)}">View</a>
          <button class="fav small">${isFav ? '★' : '☆'}</button>
        </div>
      </div>
    `;
    const favBtn = article.querySelector('.fav');
    favBtn.addEventListener('click', () => {
      toggleFavorite(game.id);
      favBtn.textContent = isFavorite(game.id) ? '★' : '☆';
    });
    return article;
  }

  // safe text
  function escapeHtml(text){ return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // favorites (localStorage)
  function getFavorites(){ try { return JSON.parse(localStorage.getItem('gv_fav')||'[]') } catch { return [] } }
  function saveFavorites(arr){ localStorage.setItem('gv_fav', JSON.stringify(arr)) }
  function isFavorite(id){ return getFavorites().includes(id) }
  function toggleFavorite(id){
    const arr = getFavorites();
    if(arr.includes(id)) arr.splice(arr.indexOf(id),1); else arr.push(id);
    saveFavorites(arr);
  }

  // render on index: featured + top
  if($('#featuredCards')){
    $('#year').textContent = new Date().getFullYear();
    const featured = GAMES.filter(g=>g.featured);
    const top = GAMES.filter(g=>g.top);
    const fWrap = $('#featuredCards');
    const tWrap = $('#topCards');
    featured.forEach(g => fWrap.appendChild(createCard(g, isFavorite(g.id))));
    top.forEach(g => tWrap.appendChild(createCard(g, isFavorite(g.id))));
  }

  // catalog
  if($('#catalogCards')){
    $('#year2').textContent = new Date().getFullYear();
    const container = $('#catalogCards');
    function renderCatalog(filterText='', platform=''){
      container.innerHTML = '';
      let list = GAMES.slice();
      if(platform) list = list.filter(g => g.platform.includes(platform));
      if(filterText) list = list.filter(g => g.title.toLowerCase().includes(filterText.toLowerCase()));
      list.forEach(g => container.appendChild(createCard(g, isFavorite(g.id))));
    }
    renderCatalog();
    $('#searchCatalog')?.addEventListener('input', e => renderCatalog(e.target.value, $('#filterPlatform').value));
    $('#filterPlatform')?.addEventListener('change', e => renderCatalog($('#searchCatalog').value, e.target.value));
  }

  // game page
  if($('#gameArea')){
    $('#year3').textContent = new Date().getFullYear();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const g = GAMES.find(x=>x.id===id);
    if(!g){
      $('#gameArea').innerHTML = '<p>Game not found</p>';
    } else {
      const fav = isFavorite(g.id);
      const html = `
        <div class="game-page">
          <div class="left">
            <img src="${g.cover}" class="cover" alt="${escapeHtml(g.title)}"/>
          </div>
          <div class="right">
            <h1>${escapeHtml(g.title)}</h1>
            <p class="meta">${escapeHtml(g.platform)}</p>
            <p>${escapeHtml(g.desc)}</p>
            <p><strong>System req:</strong> ${escapeHtml(g.requirements.min)}</p>
            <p><a class="btn" href="${g.steam}" target="_blank">Open on Store</a></p>
            <button id="favBtn" class="btn ghost">${fav? 'Remove Favorite':'Add to Favorites'}</button>
          </div>
        </div>`;
      $('#gameArea').innerHTML = html;
      $('#favBtn').addEventListener('click', () => {
        toggleFavorite(g.id);
        $('#favBtn').textContent = isFavorite(g.id) ? 'Remove Favorite' : 'Add to Favorites';
      });
    }
  }

  // login demo (save email)
  if($('#loginForm')){
    $('#year5').textContent = new Date().getFullYear();
    $('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#email').value.trim();
      localStorage.setItem('gv_user', JSON.stringify({email}));
      alert('Saved demo user: ' + email);
      location.href = 'index.html';
    });
  }

  // search on top (go to catalog)
  $('#searchTop')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      location.href = 'catalog.html';
      setTimeout(()=> { const inp = $('#searchCatalog'); if(inp) inp.value = e.target.value; inp && inp.dispatchEvent(new Event('input')); }, 200);
    }
  });

  // small helpers
  document.querySelectorAll('[id^=year]').forEach(el => el.textContent = new Date().getFullYear());
})();
