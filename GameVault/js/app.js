// app.js — простой SPA hash router + games renderer
(() => {
  const app = document.getElementById('app');
  const routes = {
    '/': renderHome,
    '/catalog': renderCatalog,
    '/favorites': renderFavorites,
    '/game': renderGame, // expects /game/:id
    '/news': renderNews
  };

  // utility fetch partial HTML (if you keep separate html files)
  async function fetchPartial(path) {
    try {
      const res = await fetch(path, {cache: "no-store"});
      if (!res.ok) return `<div class="empty">Не удалось загрузить ${path}</div>`;
      return await res.text();
    } catch(e) {
      return `<div class="empty">Ошибка загрузки ${path}</div>`;
    }
  }

  // highlight active nav link
  function updateActiveNav() {
    document.querySelectorAll('.gv-nav .nav-link').forEach(a => {
      const href = a.getAttribute('href') || '#/';
      const norm = href.replace('#','') || '/';
      const cur = (location.hash.replace('#','') || '/').split('?')[0];
      if (cur.startsWith(norm)) a.classList.add('active'); else a.classList.remove('active');
    });
  }

  // parse current path and params
  function parseHash() {
    const hash = (location.hash || '#/').slice(1);
    const [path, ...rest] = hash.split('/');
    const full = '/' + (path || '');
    return { fullHash: hash, path: full, parts: rest };
  }

  // --- Data: games.json loader ---
  let GAMES = null;
  async function loadGames() {
    if (GAMES) return GAMES;
    try {
      const r = await fetch('js/games.json');
      GAMES = await r.json();
      return GAMES;
    } catch(e) {
      console.error('games load error', e);
      GAMES = [];
      return GAMES;
    }
  }

  // favorites utilities
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('gv_favs') || '[]');
    } catch { return []; }
  }
  function setFavorites(list) {
    localStorage.setItem('gv_favs', JSON.stringify(list));
  }
  function toggleFavorite(id) {
    const fav = getFavorites();
    const idx = fav.indexOf(id);
    if (idx === -1) fav.push(id); else fav.splice(idx,1);
    setFavorites(fav);
    return fav;
  }

  // render helpers
  function createCardHtml(game) {
    /* game must have id, title, thumb, genre, platform */
    return `
      <div class="card" data-id="${game.id}">
        <img class="thumb" src="${game.thumb || 'assets/img/placeholder.jpg'}" alt="${escapeHtml(game.title)}" />
        <h3>${escapeHtml(game.title)}</h3>
        <div class="meta">
          <div class="small-muted">${escapeHtml(game.genre || '')}</div>
          <div>
            <button class="btn btn-fav ${isFav(game.id) ? '' : 'ghost'}" data-id="${game.id}">
              ${isFav(game.id) ? 'Убрать' : 'В избранное'}
            </button>
            <a class="btn ghost" href="#/game/${game.id}">Открыть</a>
          </div>
        </div>
      </div>
    `;
  }
  function isFav(id) {
    return getFavorites().indexOf(id) !== -1;
  }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // render pages
  async function renderHome() {
    app.innerHTML = `<div class="page-title"><h2>Главная</h2><div class="small-muted">Добро пожаловать в GameVault</div></div><div class="empty">Выберите каталог игр.</div>`;
    updateActiveNav();
  }

  async function renderCatalog() {
    updateActiveNav();
    app.innerHTML = `<div class="page-title"><h2>Каталог</h2><div class="small-muted">Все доступные игры</div></div><div id="catalog-grid" class="grid"></div>`;
    const container = document.getElementById('catalog-grid');
    const games = await loadGames();
    if (!games || !games.length) {
      container.innerHTML = `<div class="empty">Каталог пуст</div>`;
      return;
    }
    container.innerHTML = games.map(createCardHtml).join('');
    attachCardListeners();
  }

  async function renderFavorites() {
    updateActiveNav();
    const fav = getFavorites();
    app.innerHTML = `<div class="page-title"><h2>Избранное</h2><div class="small-muted">Ваши сохранённые игры</div></div><div id="fav-grid" class="grid"></div>`;
    const all = await loadGames();
    const list = all.filter(g => fav.includes(g.id));
    const container = document.getElementById('fav-grid');
    if (!list.length) { container.innerHTML = `<div class="empty">Нет избранных</div>`; return; }
    container.innerHTML = list.map(createCardHtml).join('');
    attachCardListeners();
  }

  async function renderGame(parts) {
    // parts[0] expected id
    updateActiveNav();
    const id = parts[0];
    const all = await loadGames();
    const game = all.find(g => String(g.id) === String(id));
    if (!game) {
      app.innerHTML = `<div class="empty">Игра не найдена</div>`; return;
    }
    app.innerHTML = `
      <div class="page-title">
        <h2>${escapeHtml(game.title)}</h2>
        <div>
          <button class="btn ${isFav(game.id) ? '' : 'ghost'}" id="page-fav" data-id="${game.id}">${isFav(game.id) ? 'Убрать из избранного' : 'Добавить в избранное'}</button>
          <a class="btn ghost" target="_blank" href="${escapeHtml(game.store || '#')}">Купить / Страница</a>
        </div>
      </div>
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <img src="${game.thumb}" style="width:280px; border-radius:12px;"/>
        <div style="max-width:760px">
          <p class="small-muted">${escapeHtml(game.genre || '')} • ${escapeHtml(game.platform || '')}</p>
          <p style="line-height:1.6; margin-top:12px">${escapeHtml(game.description || 'Описание отсутствует')}</p>
        </div>
      </div>
    `;
    document.getElementById('page-fav').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      toggleFavorite(id);
      // re-render page (simplest)
      renderGame([id]);
    });
  }

  async function renderNews() {
    updateActiveNav();
    app.innerHTML = `<div class="page-title"><h2>Новости</h2><div class="small-muted">Последние обновления</div></div><div class="empty">Нет новостей.</div>`;
  }

  // attach listeners to card fav buttons
  function attachCardListeners() {
    document.querySelectorAll('.btn-fav').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleFavorite(id);
        // update UI quickly
        const isNow = isFav(id);
        e.currentTarget.classList.toggle('ghost', !isNow);
        e.currentTarget.textContent = isNow ? 'Убрать' : 'В избранное';
      });
    });
  }

  // router dispatcher
  async function route() {
    const { path, parts } = parseHash();
    // route matching
    if (path === '/game') {
      await renderGame(parts);
    } else if (routes[path]) {
      await routes[path]();
    } else {
      // try indexing route (like '/game/123') or default
      if (path === '/' || path === '') return renderHome();
      return renderHome();
    }
  }

  // init
  window.addEventListener('hashchange', () => { route(); updateActiveNav(); });
  window.addEventListener('load', async () => {
    updateActiveNav();
    // if hash empty, default to /
    if (!location.hash) location.hash = '#/';
    // click interception for nav links (optional, ensures active class sets immediately)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        // let hashchange handler do its job
        setTimeout(() => updateActiveNav(), 10);
      }
    });
    await loadGames().catch(()=>{});
    route();
  });

})();
