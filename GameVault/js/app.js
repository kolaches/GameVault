// GameVault/js/app.js
(() => {
  const APP_CONTAINER = document.getElementById('app');
  const SEARCH_INPUT = document.getElementById('gv-search');
  const GAMES_JSON = 'GameVault/js/games.json';
  let GAMES = null;

  // helpers
  const q = sel => document.querySelector(sel);
  const qa = sel => Array.from(document.querySelectorAll(sel));
  const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));

  // load games
  async function loadGames() {
    if (GAMES) return GAMES;
    try {
      const res = await fetch(GAMES_JSON, {cache:'no-store'});
      GAMES = await res.json();
      return GAMES;
    } catch (e) {
      console.error('Не удалось загрузить games.json', e);
      GAMES = [];
      return GAMES;
    }
  }

  // favorites
  function getFavs(){ try { return JSON.parse(localStorage.getItem('gv_favs')||'[]') } catch { return [] } }
  function setFavs(list){ localStorage.setItem('gv_favs', JSON.stringify(list)) }
  function toggleFav(id){
    const list = getFavs(); const idx = list.indexOf(id);
    if (idx === -1) list.push(id); else list.splice(idx,1);
    setFavs(list); return list;
  }
  function isFav(id){ return getFavs().indexOf(id) !== -1 }

  // routing
  function parseHash(){
    const raw = (location.hash || '#/').slice(1);
    const parts = raw.split('/').filter(Boolean);
    return parts;
  }

  // render helpers
  function navActive() {
    qa('.gv-nav .nav-link').forEach(a => {
      const href = (a.getAttribute('href')||'#/').replace('#','') || '/';
      const cur = (location.hash||'#/').replace('#','') || '/';
      a.classList.toggle('active', cur.startsWith(href));
    });
  }

  function createCard(game) {
    const price = game.price || 'Бесплатно';
    return `
      <div class="card" data-id="${esc(game.id)}">
        <img class="thumb" src="${esc(game.thumb || 'GameVault/assets/img/placeholder.jpg')}" alt="${esc(game.title)}" onerror="this.src='GameVault/assets/img/placeholder.jpg'">
        <h3>${esc(game.title)}</h3>
        <div class="meta">
          <div>
            <div class="small-muted">${esc(game.genre || '')}</div>
            <div class="small-muted" style="margin-top:6px">${esc(game.platform || '')}</div>
          </div>
          <div style="text-align:right">
            <div class="price">${esc(price)}</div>
          </div>
        </div>
        <div class="actions">
          <div>
            <a class="btn ghost" href="#/game/${esc(game.id)}">Подробнее</a>
            <button class="btn ${isFav(game.id)?'primary':'ghost'} btn-fav" data-id="${esc(game.id)}">${isFav(game.id)?'В избранном':'В избранное'}</button>
          </div>
          <div>
            <a class="btn primary" target="_blank" rel="noopener" href="${esc(game.store || '#')}">Купить</a>
          </div>
        </div>
      </div>
    `;
  }

  // render pages
  async function renderHome(){
    navActive();
    APP_CONTAINER.innerHTML = `
      <div class="page-title">
        <h2>Рекомендации</h2>
        <div class="small-muted">Подборки и новинки</div>
      </div>
      <div class="grid" id="home-grid"></div>
    `;
    const grid = q('#home-grid');
    const games = await loadGames();
    // show first 4 as featured
    const featured = games.slice(0,4);
    grid.innerHTML = featured.map(createCard).join('');
    attachCardListeners();
  }

  async function renderCatalog(query) {
    navActive();
    APP_CONTAINER.innerHTML = `
      <div class="page-title">
        <h2>Каталог игр</h2>
        <div class="small-muted">Всего игр: <span id="total-count">…</span></div>
      </div>
      <div id="catalog-grid" class="grid"></div>
    `;
    const grid = q('#catalog-grid');
    grid.innerHTML = `<div class="empty"><div class="skeleton" style="height:18px;width:60%"></div><div style="height:12px"></div><div class="skeleton" style="height:12px;width:40%"></div></div>`;
    const games = await loadGames();
    let list = games;
    if (query) {
      const qlc = query.toLowerCase();
      list = games.filter(g => (g.title||'').toLowerCase().includes(qlc) || (g.genre||'').toLowerCase().includes(qlc));
    } else {
      // also check session search saved
      const s = sessionStorage.getItem('gv_search_query') || '';
      if (s) {
        const qlc = s.toLowerCase();
        list = games.filter(g => (g.title||'').toLowerCase().includes(qlc) || (g.genre||'').toLowerCase().includes(qlc));
        sessionStorage.removeItem('gv_search_query');
      }
    }
    q('#total-count').textContent = String(list.length);
    grid.innerHTML = list.map(createCard).join('') || `<div class="empty">Ничего не найдено</div>`;
    attachCardListeners();
  }

  async function renderFavorites(){
    navActive();
    APP_CONTAINER.innerHTML = `
      <div class="page-title">
        <h2>Избранное</h2>
        <div class="small-muted">Ваши сохранённые игры</div>
      </div>
      <div id="fav-grid" class="grid"></div>
    `;
    const favGrid = q('#fav-grid');
    const games = await loadGames();
    const favs = getFavs();
    const list = games.filter(g => favs.indexOf(g.id) !== -1);
    favGrid.innerHTML = list.map(createCard).join('') || `<div class="empty">Пусто — добавьте игры в избранное</div>`;
    attachCardListeners();
  }

  async function renderGamePage(id){
    navActive();
    APP_CONTAINER.innerHTML = `<div class="page-title"><h2>Загрузка...</h2></div><div class="empty">Идёт загрузка страницы игры</div>`;
    const games = await loadGames();
    const game = games.find(g => String(g.id) === String(id));
    if (!game) { APP_CONTAINER.innerHTML = `<div class="empty">Игра не найдена</div>`; return; }
    APP_CONTAINER.innerHTML = `
      <div class="page-title">
        <h2>${esc(game.title)}</h2>
        <div class="small-muted">${esc(game.genre)} • ${esc(game.platform)} • ${esc(game.price||'Бесплатно')}</div>
      </div>
      <div class="game-full">
        <div class="left">
          <img class="hero" src="${esc(game.thumb || 'GameVault/assets/img/placeholder.jpg')}" onerror="this.src='GameVault/assets/img/placeholder.jpg'">
        </div>
        <div class="right">
          <p class="small-muted">${esc(game.description || 'Описание отсутствует')}</p>
          <div style="height:12px"></div>
          <div style="display:flex;gap:10px;align-items:center">
            <button id="page-fav" class="btn ${isFav(game.id)?'primary':'ghost'}">${isFav(game.id)?'Убрать из избранного':'Добавить в избранное'}</button>
            <a class="btn primary" href="${esc(game.store||'#')}" target="_blank" rel="noopener">Купить — ${esc(game.price||'Бесплатно')}</a>
            <button id="btn-similar" class="btn ghost">Найти похожие</button>
          </div>
        </div>
      </div>
    `;
    // listeners
    q('#page-fav').addEventListener('click', (e) => {
      toggleFav(game.id);
      renderGamePage(game.id);
    });
    q('#btn-similar').addEventListener('click', () => {
      // simple similar: by genre
      const genre = (game.genre||'').split(',')[0].trim();
      if (!genre) return;
      location.hash = '#/catalog';
      // save quick search
      sessionStorage.setItem('gv_search_query', genre);
      setTimeout(()=>{ location.reload(); }, 60); // quick force to apply search on catalog render
    });
  }

  // attach listeners for card favorites (delegation)
  function attachCardListeners() {
    qa('.btn-fav').forEach(btn => {
      btn.onclick = (e) => {
        const id = btn.dataset.id;
        toggleFav(id);
        // update styles/text quickly
        if (isFav(id)) {
          btn.classList.remove('ghost'); btn.classList.add('primary'); btn.textContent = 'В избранном';
        } else {
          btn.classList.remove('primary'); btn.classList.add('ghost'); btn.textContent = 'В избранное';
        }
      };
    });
  }

  // router dispatcher
  async function router(){
    const parts = parseHash();
    const route = parts[0] || '';
    const arg = parts[1] || null;
    const searchQuery = (SEARCH_INPUT && SEARCH_INPUT.value && SEARCH_INPUT.value.trim()) ? SEARCH_INPUT.value.trim() : null;

    if (route === '' || route === undefined) return renderHome();
    if (route === 'catalog') return renderCatalog(searchQuery);
    if (route === 'favorites') return renderFavorites();
    if (route === 'game' && arg) return renderGamePage(arg);
    if (route === 'news') {
      APP_CONTAINER.innerHTML = `<div class="page-title"><h2>Новости</h2><div class="small-muted">Скоро появятся</div></div><div class="empty">Новостей пока нет</div>`;
      return;
    }
    // fallback
    return renderHome();
  }

  // init
  window.addEventListener('hashchange', () => { navActive(); router(); });
  window.addEventListener('load', async () => {
    // wire search
    if (SEARCH_INPUT) {
      SEARCH_INPUT.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = SEARCH_INPUT.value.trim();
          location.hash = '#/catalog';
          sessionStorage.setItem('gv_search_query', q);
          // small delay to let router pick up
          setTimeout(()=>router(), 50);
        }
      });
    }
    // initial load
    await loadGames();
    // default hash
    if (!location.hash) location.hash = '#/';
    navActive();
    router();
  });

})();
