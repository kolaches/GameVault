// GameVault app with Firebase Auth integration (requires firebase-config.js filled)
// Uses compat SDK loaded in index.html
(function(){
  const APP = document.getElementById('app');
  const SEARCH = document.getElementById('gv-search');

  // Initialize Firebase (must set window.FIREBASE_CONFIG in firebase-config.js)
  if (!window.FIREBASE_CONFIG) {
    console.warn('Firebase config not found. Please fill GameVault/js/firebase-config.js with your Firebase project config.');
  } else {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    window.auth = firebase.auth();
  }

  // helper to fetch games.json
  async function loadGames(){
    try {
      const res = await fetch('GameVault/js/games.json');
      return await res.json();
    } catch (e) {
      console.error('Failed to load games.json', e);
      return [];
    }
  }

  // auth UI
  function updateAuthUI(){
    const btn = document.getElementById('btn-login') || document.querySelector('.btn#btn-login') || document.querySelector('.btn.ghost#login-btn');
    if (!btn) return;
    if (window.auth && auth.currentUser) {
      btn.textContent = auth.currentUser.email || auth.currentUser.displayName || 'Профиль';
      btn.classList.remove('ghost'); btn.classList.add('primary');
    } else { btn.textContent = 'Войти'; btn.classList.remove('primary'); btn.classList.add('ghost'); }
  }

  // basic SPA routing
  function parseHash(){
    const raw = (location.hash || '#/').slice(1);
    const parts = raw.split('/').filter(Boolean);
    return parts;
  }

  // render pages
  async function renderHome(){
    APP.innerHTML = '<div class="page-title"><h2>Рекомендации</h2><div class="small-muted">Подборки</div></div><div id="featured" class="grid"></div>';
    const games = await loadGames();
    const featured = games.slice(0,4);
    document.getElementById('featured').innerHTML = featured.map(g => `
      <div class="banner">
        <img src="${g.thumb}" alt="${g.title}">
        <h3>${g.title}</h3>
        <div class="small-muted">${g.genre} · ${g.platform}</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <a class="btn ghost" href="#/game/${g.id}">Подробнее</a>
          <a class="btn primary" href="${g.store}" target="_blank">Купить</a>
        </div>
      </div>
    `).join('');
  }

  async function renderCatalog(){
    APP.innerHTML = '<div class="page-title"><h2>Каталог</h2><div class="small-muted">Все игры</div></div><div id="catalog" class="grid"></div>';
    const games = await loadGames();
    document.getElementById('catalog').innerHTML = games.map(g => `
      <div class="banner">
        <img src="${g.thumb}" alt="${g.title}">
        <h3>${g.title}</h3>
        <div class="small-muted">${g.genre} · ${g.platform}</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <a class="btn ghost" href="#/game/${g.id}">Подробнее</a>
          <a class="btn primary" href="${g.store}" target="_blank">Купить</a>
        </div>
      </div>
    `).join('');
  }

  async function renderGame(id){
    APP.innerHTML = '<div class="page-title"><h2>Загрузка...</h2></div>';
    const games = await loadGames();
    const game = games.find(x => x.id === id);
    if (!game) { APP.innerHTML = '<div class="empty">Игра не найдена</div>'; return; }
    APP.innerHTML = `
      <div class="page-title"><h2>${game.title}</h2><div class="small-muted">${game.genre} · ${game.platform}</div></div>
      <div class="game-full">
        <div class="left section"><img class="hero-big" src="${game.thumb}"></div>
        <div class="right">
          <div class="section"><h3>Описание</h3><p class="small-muted">${game.description}</p></div>
          <div style="height:12px"></div>
          <div class="section"><h3>Системные требования</h3><p class="small-muted">${game.requirements}</p></div>
          <div style="height:12px"></div>
          <div class="section"><h3>Новости по игре</h3><div class="small-muted">Нет свежих новостей.</div></div>
        </div>
      </div>
    `;
  }

  function renderNews(){
    APP.innerHTML = '<div class="page-title"><h2>Новости</h2><div class="small-muted">Последние анонсы</div></div><div id="news-grid" class="grid"></div>';
    const news = [
      {id:1,title:'GameVault v2.0 — релиз',date:'2025-11-04',tags:['release','update'],text:'Встречайте новую версию GameVault — улучшенный UI, авторизация и 35 игр.'},
      {id:2,title:'Скидки недели',date:'2025-11-02',tags:['sale'],text:'Особые предложения на популярные AAA-тайтлы.'}
    ];
    document.getElementById('news-grid').innerHTML = news.map(n => `
      <div class="banner section">
        <h3>${n.title}</h3>
        <div class="small-muted">${n.date} · ${n.tags.join(', ')}</div>
        <p class="small-muted">${n.text}</p>
        <a class="btn ghost" href="#/news/${n.id}">Читать</a>
      </div>
    `).join('');
  }

  // basic router
  async function router(){
    const parts = parseHash();
    const route = parts[0] || '';
    const arg = parts[1] || null;
    if (route === '' || route === undefined) return renderHome();
    if (route === 'catalog') return renderCatalog();
    if (route === 'favorites') return APP.innerHTML = '<div class="empty">Избранное пусто</div>';
    if (route === 'game' && arg) return renderGame(arg);
    if (route === 'news') return renderNews();
    return renderHome();
  }

  // auth listeners
  function attachAuth(){
    if (!window.auth) return;
    auth.onAuthStateChanged(user => {
      updateAuthUI();
    });
  }

  // login flow (popup Google)
  function signInWithGoogle(){
    if (!window.auth) return alert('Firebase не инициализирован. Добавьте конфиг в GameVault/js/firebase-config.js');
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => alert('Ошибка входа: ' + e.message));
  }

  // simple email/password register/login functions shown as examples
  async function emailRegister(email,pass){
    if (!window.auth) return alert('Firebase не инициализирован');
    try {
      await auth.createUserWithEmailAndPassword(email,pass);
      alert('Регистрация успешна');
    } catch(e) { alert('Ошибка: ' + e.message); }
  }
  async function emailLogin(email,pass){
    if (!window.auth) return alert('Firebase не инициализирован');
    try {
      await auth.signInWithEmailAndPassword(email,pass);
      alert('Вход выполнен');
    } catch(e) { alert('Ошибка: ' + e.message); }
  }

  // wire global UI and routing
  window.addEventListener('hashchange', router);
  window.addEventListener('load', async () => {
    // hook login button to open a quick auth modal (simplified)
    const loginBtn = document.getElementById('btn-login') || document.querySelector('.btn#login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (window.auth && auth.currentUser) { alert('Вы уже вошли как ' + (auth.currentUser.email || auth.currentUser.displayName)); return; }
        // quick prompt for sign-in method
        const m = confirm('Войти через Google? Отмена — вход по email.');
        if (m) signInWithGoogle();
        else {
          const email = prompt('Email:');
          const pass = prompt('Пароль:');
          if (email && pass) emailLogin(email, pass);
        }
      });
    }
    // discord button
    const dBtn = document.getElementById('btn-discord');
    if (dBtn) dBtn.addEventListener('click', () => window.open('https://discord.com/invite/your-invite-code','_blank'));
    // initial router
    await router();
    attachAuth();
    updateAuthUI();
  });
})();
