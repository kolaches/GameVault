// GameVault/js/app.js — SPA + features (local auth, favorites, filters, animations)
(() => {
  const APP = document.getElementById('app');
  const SEARCH = document.getElementById('gv-search');
  const DISCORD_BTN = document.getElementById('btn-discord');
  const LOGIN_BTN = document.getElementById('btn-login');
  const GAMES_URL = 'GameVault/js/games.json';

  let GAMES = null;
  let currentUser = null;

  // helpers
  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));

  // load games
  async function loadGames(){
    if (GAMES) return GAMES;
    try {
      const res = await fetch(GAMES_URL, {cache:'no-store'});
      GAMES = await res.json();
      return GAMES;
    } catch (e) {
      console.error('Ошибка загрузки games.json', e);
      GAMES = [];
      return GAMES;
    }
  }

  // favorites
  function favs(){ try { return JSON.parse(localStorage.getItem('gv_favs')||'[]') } catch { return [] } }
  function setFavs(v){ localStorage.setItem('gv_favs', JSON.stringify(v)) }
  function toggleFav(id){ const f=favs(); const i=f.indexOf(id); if(i===-1) f.push(id); else f.splice(i,1); setFavs(f); return f; }
  function isFav(id){ return favs().indexOf(id)!==-1; }

  // auth (local)
  function users(){ try { return JSON.parse(localStorage.getItem('gv_users')||'{}') } catch { return {} } }
  function saveUserData(users){ localStorage.setItem('gv_users', JSON.stringify(users)) }
  function setCurrentUser(name){ currentUser = name; localStorage.setItem('gv_current', name) }
  function getCurrentUser(){ if(currentUser) return currentUser; const c = localStorage.getItem('gv_current'); currentUser = c; return c; }
  function logout(){ localStorage.removeItem('gv_current'); currentUser = null; updateLoginUI(); route(); }

  function updateLoginUI(){
    const u = getCurrentUser();
    const btn = document.getElementById('btn-login');
    if (!btn) return;
    if (u) { btn.textContent = u; btn.classList.remove('ghost'); btn.classList.add('primary'); }
    else { btn.textContent = 'Войти'; btn.classList.remove('primary'); btn.classList.add('ghost'); }
  }

  // UI card builder (Steam-like banner)
  function cardTpl(game){
    return `
      <div class="banner fade-slide" data-id="${esc(game.id)}">
        <div>
          <img class="hero" src="${esc(game.thumb || 'GameVault/assets/img/placeholder.jpg')}" alt="${esc(game.title)}" onerror="this.src='GameVault/assets/img/placeholder.jpg'">
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px">
          <div style="flex:1">
            <h3>${esc(game.title)}</h3>
            <div class="small-muted">${esc(game.genre)} · ${esc(game.platform)}</div>
          </div>
          <div style="text-align:right">
            <div class="price">${esc(game.price || 'Бесплатно')}</div>
          </div>
        </div>
        <div class="actions">
          <div>
            <a class="btn ghost" href="#/game/${esc(game.id)}">Подробнее</a>
            <button class="btn ${isFav(game.id)?'primary':'ghost'} btn-fav" data-id="${esc(game.id)}">${isFav(game.id)?'В избранном':'В избранное'}</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <a class="btn primary" target="_blank" rel="noopener" href="${encodeStoreLink(game.title)}">Купить</a>
            <div class="small-muted" style="font-size:12px">Рейтинг: ${game.rating || '—'}</div>
          </div>
        </div>
      </div>
    `;
  }

  function encodeStoreLink(title){
    const q = encodeURIComponent(title);
    return `https://store.steampowered.com/search/?term=${q}`;
  }

  // navigation active
  function navActive(){
    qa('.gv-nav .nav-link').forEach(a => {
      const href = (a.getAttribute('href')||'#/').replace('#','') || '/';
      const cur = (location.hash||'#/').replace('#','') || '/';
      a.classList.toggle('active', cur.startsWith(href));
    });
    updateLoginUI();
  }

  // render pages
  async function renderHome(){
    navActive();
    APP.innerHTML = `
      <div class="page-title"><h2>Рекомендации</h2><div class="small-muted">Подборки и новинки</div></div>
      <div id="featured" class="grid"></div>
    `;
    const grid = q('#featured');
    const games = await loadGames();
    // featured: top-rated 4
    const featured = games.slice().sort((a,b)=> (b.rating||0)-(a.rating||0)).slice(0,4);
    grid.innerHTML = featured.map(cardTpl).join('');
    attachCardListeners();
  }

  async function renderCatalog(query, filters={}, sortBy='popular'){
    navActive();
    APP.innerHTML = `
      <div class="page-title">
        <h2>Каталог</h2>
        <div style="display:flex;gap:12px;align-items:center">
          <div class="small-muted">Фильтры:</div>
          <select id="f-genre" class="input"><option value="">Все жанры</option></select>
          <select id="f-price" class="input"><option value="">Любая цена</option><option value="free">Бесплатно</option><option value="paid">Платная</option></select>
          <select id="sort-by" class="input"><option value="popular">По рейтингу</option><option value="price-asc">Цена ↑</option><option value="price-desc">Цена ↓</option></select>
        </div>
      </div>
      <div id="catalog-grid" class="grid"></div>
    `;
    const games = await loadGames();
    let list = games.slice();
    // apply query
    const ql = (query || '').toLowerCase();
    if (ql) list = list.filter(g => (g.title||'').toLowerCase().includes(ql) || (g.genre||'').toLowerCase().includes(ql));
    // populate genre options
    const genres = Array.from(new Set(games.flatMap(g => (g.genre||'').split(',').map(s=>s.trim()).filter(Boolean))));
    const genreSel = q('#f-genre');
    genres.forEach(g => genreSel.insertAdjacentHTML('beforeend', `<option value="${g}">${g}</option>`));
    // filters from param
    if (filters.genre) { list = list.filter(x => (x.genre||'').toLowerCase().includes(filters.genre.toLowerCase())); genreSel.value = filters.genre; }
    if (filters.price === 'free') list = list.filter(x => (x.price||'').toLowerCase().includes('0') || (x.price||'').toLowerCase().includes('бесплат'));
    if (filters.price === 'paid') list = list.filter(x => !((x.price||'').toLowerCase().includes('0') || (x.price||'').toLowerCase().includes('бесплат')));
    // sort
    if (sortBy === 'price-asc') list.sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));
    else if (sortBy === 'price-desc') list.sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));
    else list.sort((a,b)=> (b.rating||0)-(a.rating||0));
    // render
    q('#catalog-grid').innerHTML = list.map(cardTpl).join('') || `<div class="empty">Ничего не найдено</div>`;
    attachCardListeners();
    // hook filters
    genreSel.addEventListener('change', ()=>{ const val = genreSel.value; location.hash = '#/catalog'; setTimeout(()=>renderCatalog(SEARCH.value, {genre: val}), 10); });
    q('#f-price').addEventListener('change', ()=>{ const val=q('#f-price').value; location.hash='#/catalog'; setTimeout(()=>renderCatalog(SEARCH.value, {price:val}),10); });
    q('#sort-by').addEventListener('change', ()=>{ const val=q('#sort-by').value; renderCatalog(SEARCH.value, {}, val); });
  }

  function parsePrice(str){
    if(!str) return 0;
    const num = str.replace(/[^\d.,]/g,'').replace(',','.');
    return parseFloat(num) || 0;
  }

  async function renderFavorites(){
    navActive();
    APP.innerHTML = `<div class="page-title"><h2>Избранное</h2><div class="small-muted">Ваши сохранённые игры</div></div><div id="fav-grid" class="grid"></div>`;
    const games = await loadGames();
    const list = games.filter(g => favs().indexOf(g.id)!==-1);
    q('#fav-grid').innerHTML = list.map(cardTpl).join('') || `<div class="empty">Пусто — добавьте игры в избранное</div>`;
    attachCardListeners();
  }

  async function renderGame(id){
    navActive();
    APP.innerHTML = `<div class="page-title"><h2>Загрузка игры...</h2></div><div class="empty">Загрузка...</div>`;
    const games = await loadGames();
    const game = games.find(g=>String(g.id)===String(id));
    if(!game){ APP.innerHTML = `<div class="empty">Игра не найдена</div>`; return; }
    APP.innerHTML = `
      <div class="page-title"><h2>${esc(game.title)}</h2><div class="small-muted">${esc(game.genre)} · ${esc(game.platform)}</div></div>
      <div class="game-full">
        <div class="left section">
          <img class="hero-big" src="${esc(game.thumb || 'GameVault/assets/img/placeholder.jpg')}" onerror="this.src='GameVault/assets/img/placeholder.jpg'">
          <div style="margin-top:10px;display:flex;gap:8px">
            <button id="page-fav" class="btn ${isFav(game.id)?'primary':'ghost'}">${isFav(game.id)?'Убрать из избранного':'Добавить в избранное'}</button>
            <a class="btn primary" href="${encodeStoreLink(game.title)}" target="_blank" rel="noopener">Купить — ${esc(game.price||'Бесплатно')}</a>
            <button id="btn-similar" class="btn ghost">Найти похожие</button>
          </div>
        </div>
        <div class="right">
          <div class="section"><h3>Описание</h3><p class="small-muted">${esc(game.description || 'Описание отсутствует')}</p></div>
          <div style="height:12px"></div>
          <div class="section"><h3>Системные требования</h3><p class="small-muted">${esc(game.requirements || 'Не указано')}</p></div>
          <div style="height:12px"></div>
          <div class="section"><h3>Отзывы</h3><div id="reviews"></div><div style="height:8px"></div><textarea id="rev-text" class="input" placeholder="Оставить отзыв"></textarea><div style="height:8px"></div><button id="rev-send" class="btn primary">Отправить отзыв</button></div>
        </div>
      </div>
    `;
    // listeners
    q('#page-fav').addEventListener('click', ()=>{ toggleFav(game.id); renderGame(game.id); });
    q('#btn-similar').addEventListener('click', ()=>{ const g = (game.genre||'').split(',')[0].trim(); sessionStorage.setItem('gv_search_query', g); location.hash = '#/catalog'; });
    // reviews
    const revs = loadReviews(game.id);
    renderReviews(revs);
    q('#rev-send').addEventListener('click', ()=> {
      const txt = q('#rev-text').value.trim();
      if(!txt) return alert('Напишите отзыв');
      addReview(game.id, {user: getCurrentUser() || 'Гость', text: txt, date: new Date().toLocaleString()});
      q('#rev-text').value = '';
      renderReviews(loadReviews(game.id));
    });
  }

  // reviews local
  function reviewsKey(id){ return `gv_reviews_${id}` }
  function loadReviews(id){ try { return JSON.parse(localStorage.getItem(reviewsKey(id))||'[]') } catch { return [] } }
  function saveReviews(id, arr){ localStorage.setItem(reviewsKey(id), JSON.stringify(arr)) }
  function addReview(id, obj){ const r = loadReviews(id); r.unshift(obj); if(r.length>50) r.pop(); saveReviews(id,r) }
  function renderReviews(list){
    const area = q('#reviews');
    if(!area) return;
    area.innerHTML = list.map(r=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.02)"><strong>${esc(r.user)}</strong> <span class="small-muted" style="font-size:12px">${esc(r.date)}</span><div style="margin-top:6px">${esc(r.text)}</div></div>`).join('') || `<div class="small-muted">Пока нет отзывов</div>`;
  }

  // Login / Register / Profile (local)
  function renderLogin(){
    navActive();
    APP.innerHTML = `
      <div class="page-title"><h2>Вход</h2><div class="small-muted">Локальная демо-авторизация</div></div>
      <div class="section" style="max-width:520px">
        <div class="form-row"><label>Логин</label><input id="l-login" class="input"></div>
        <div class="form-row"><label>Пароль</label><input id="l-pass" type="password" class="input"></div>
        <div style="display:flex;gap:8px"><button id="do-login" class="btn primary">Войти</button><a class="btn ghost" href="#/register">Регистрация</a></div>
      </div>
    `;
    q('#do-login').addEventListener('click', ()=> {
      const login = q('#l-login').value.trim(); const pass = q('#l-pass').value;
      if(!login || !pass) return alert('Заполните поля');
      const us = users();
      if(us[login] && us[login].pass === pass){ setCurrentUser(login); updateLoginUI(); location.hash = '#/profile'; }
      else alert('Неверный логин или пароль');
    });
  }

  function renderRegister(){
    navActive();
    APP.innerHTML = `
      <div class="page-title"><h2>Регистрация</h2><div class="small-muted">Создать локальный аккаунт</div></div>
      <div class="section" style="max-width:520px">
        <div class="form-row"><label>Логин</label><input id="r-login" class="input"></div>
        <div class="form-row"><label>Пароль</label><input id="r-pass" type="password" class="input"></div>
        <div class="form-row"><label>Discord (опционально)</label><input id="r-discord" class="input"></div>
        <div style="display:flex;gap:8px"><button id="do-reg" class="btn primary">Создать</button><a class="btn ghost" href="#/login">Уже есть</a></div>
      </div>
    `;
    q('#do-reg').addEventListener('click', ()=> {
      const login = q('#r-login').value.trim(); const pass = q('#r-pass').value; const discord = q('#r-discord').value.trim();
      if(!login || !pass) return alert('Заполните логин и пароль');
      const us = users();
      if(us[login]) return alert('Пользователь уже существует');
      us[login] = {pass, discord, created: new Date().toLocaleString()};
      saveUserData(us);
      setCurrentUser(login);
      updateLoginUI();
      location.hash = '#/profile';
    });
  }

  function renderProfile(){
    navActive();
    const u = getCurrentUser();
    if(!u){ location.hash = '#/login'; return; }
    const us = users()[u] || {};
    APP.innerHTML = `
      <div class="page-title"><h2>Профиль: ${esc(u)}</h2><div class="small-muted">Локальный профиль</div></div>
      <div class="section" style="max-width:720px">
        <div class="form-row"><label>Discord</label><input id="p-discord" class="input" value="${esc(us.discord||'') || ''}"></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button id="save-profile" class="btn primary">Сохранить</button>
          <button id="logout" class="btn ghost">Выйти</button>
        </div>
      </div>
    `;
    q('#save-profile').addEventListener('click', ()=> {
      const discord = q('#p-discord').value.trim();
      const all = users(); all[u] = all[u] || {}; all[u].discord = discord; saveUserData(all); alert('Сохранено');
    });
    q('#logout').addEventListener('click', ()=> { logout(); });
  }

  function renderNews(){
    navActive();
    APP.innerHTML = `
      <div class="page-title"><h2>Новости</h2><div class="small-muted">Последние обновления и анонсы</div></div>
      <div class="grid" id="news-grid"></div>
    `;
    // demo news
    const news = [
      {id:1,title:'Обновление v2.0',text:'Много новых игр, профили и отзывы.'},
      {id:2,title:'Скидки недели',text:'Скидки на избранные AAA-тайтлы.'},
      {id:3,title:'Набор в Discord',text:'Присоединяйтесь к нашему сообществу.'}
    ];
    q('#news-grid').innerHTML = news.map(n=>`<div class="banner section"><h3>${esc(n.title)}</h3><div class="small-muted">${esc(n.text)}</div><div style="height:8px"></div><a class="btn ghost" href="#/news">Читать</a></div>`).join('');
  }

  // attach card listeners (delegation)
  function attachCardListeners(){
    qa('.btn-fav').forEach(btn => {
      btn.onclick = (e) => {
        const id = btn.dataset.id;
        toggleFav(id);
        if (isFav(id)) { btn.classList.remove('ghost'); btn.classList.add('primary'); btn.textContent = 'В избранном'; }
        else { btn.classList.remove('primary'); btn.classList.add('ghost'); btn.textContent = 'В избранное'; }
      };
    });
    // hero click -> open game
    qa('.banner').forEach(b => {
      b.querySelectorAll('img').forEach(img => {
        img.style.cursor = 'pointer';
        img.onclick = (e) => { const id = b.dataset.id; location.hash = '#/game/' + id; };
      });
    });
  }

  // router
  function parseHash(){
    const raw = (location.hash||'#/').slice(1);
    const parts = raw.split('/').filter(Boolean);
    return parts;
  }

  async function router(){
    const parts = parseHash();
    const route = parts[0] || '';
    const arg = parts[1] || null;
    if (route === '' || route === undefined) return renderHome();
    if (route === 'catalog') return renderCatalog(SEARCH.value || sessionStorage.getItem('gv_search_query') || '');
    if (route === 'favorites') return renderFavorites();
    if (route === 'game' && arg) return renderGame(arg);
    if (route === 'login') return renderLogin();
    if (route === 'register') return renderRegister();
    if (route === 'profile') return renderProfile();
    if (route === 'news') return renderNews();
    // default
    return renderHome();
  }

  // search handling
  if (SEARCH) {
    SEARCH.addEventListener('keydown', (e)=> {
      if(e.key==='Enter'){ const qv = SEARCH.value.trim(); sessionStorage.setItem('gv_search_query', qv); location.hash = '#/catalog'; }
    });
  }

  // discord and login button
  if (DISCORD_BTN) DISCORD_BTN.addEventListener('click', ()=> { window.open('https://discord.com/invite/your-invite-code','_blank'); });
  document.addEventListener('click', (e)=> {
    const b = e.target.closest('#btn-login');
    if (b) {
      const u = getCurrentUser();
      if (u) { location.hash = '#/profile'; } else { location.hash = '#/login'; }
    }
  });

  // initial
  window.addEventListener('hashchange', ()=> { navActive(); router(); });
  window.addEventListener('load', async ()=> {
    await loadGames();
    if (!location.hash) location.hash = '#/';
    navActive();
    updateLoginUI();
    // apply search saved query
    const qv = sessionStorage.getItem('gv_search_query') || '';
    if (qv && location.hash.startsWith('#/')) { SEARCH.value = qv; }
    router();
  });

  fetch('js/games.json')
    .then(r=>r.json())
    .then(data=>{
      const list=document.getElementById('games-list');
      list.innerHTML='';
      data.forEach(g=>{
        const div=document.createElement('div');
        div.className='game-item';
        div.textContent = g.title + ' — ' + g.price;
        list.appendChild(div);
      });
    })
    .catch(()=>{
      document.getElementById('games-list').textContent='Ошибка загрузки списка игр';
    });
  // Загружаем игры из JSON и распределяем по секциям
  fetch("js/data/games.json")
    .then((res) => res.json())
    .then((games) => {
      renderCarousel("popular", games.slice(0, 8));     // Популярные
      renderCarousel("new", games.slice(8, 14));        // Новинки
      renderCarousel("recommend", games.slice(14, 20)); // Рекомендуем
    })
    .catch(() => {
      document.getElementById("popular").innerHTML = "Ошибка загрузки данных";
    });

  function renderCarousel(id, list) {
    const carousel = document.getElementById(id);
    carousel.innerHTML = "";

    list.forEach((game) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
        <strong>${game.title}</strong><br>
        <span style="color:#7ea2c9">${game.price}</span>
      `;
      carousel.appendChild(card);
    });
  }


})();
