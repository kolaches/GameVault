// GameVault — простой SPA на чистом JS
// Комментарии и функции на русском для удобства
const appEl = document.getElementById('app');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const favCountEl = document.getElementById('fav-count');
const btnLogin = document.getElementById('btn-login');

let games = [];
let favorites = new Set(JSON.parse(localStorage.getItem('gv_favs')||'[]'));
updateFavCount();

async function loadGames(){
  try{
    const res = await fetch('games.json');
    games = await res.json();
  }catch(e){
    console.error('Не удалось загрузить games.json, используем демо', e);
    games = [];
  }
}

// --- Рендеринг страниц ---
function route(){
  const hash = location.hash.replace('#','') || '/catalog';
  document.querySelectorAll('[data-route]').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href')===('#'+hash));
  });
  if(hash.startsWith('/catalog')) renderCatalog();
  else if(hash.startsWith('/news')) renderNews();
  else if(hash.startsWith('/contacts')) renderContacts();
  else if(hash.startsWith('/favorites')) renderFavorites();
  else renderCatalog();
}

function renderCatalog(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const filtered = games.filter(g=>{
    const hay = (g.title + ' ' + (g.genres||[]).join(' ') + ' ' + (g.platforms||[]).join(' ')).toLowerCase();
    return hay.includes(q);
  });
  appEl.innerHTML = `
    <section class="page">
      <div class="header-row">
        <h2>Каталог</h2>
        <div class="muted">Найдено: ${filtered.length}</div>
      </div>
      <div class="grid" id="grid"></div>
    </section>
  `;
  const grid = document.getElementById('grid');
  const tpl = document.getElementById('card-template');
  filtered.forEach(g=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.card-cover').src = g.cover || ('https://via.placeholder.com/400x560?text=' + encodeURIComponent(g.title));
    node.querySelector('.card-cover').alt = g.title;
    node.querySelector('.card-title').textContent = g.title;
    node.querySelector('.card-meta').textContent = `${g.release_date || ''} • ${g.genres?.slice(0,2).join(', ') || ''}`;
    node.querySelector('.btn-details').addEventListener('click', ()=>openDetails(g.id));
    const favBtn = node.querySelector('.btn-fav');
    favBtn.textContent = favorites.has(g.id) ? '❤' : '🤍';
    favBtn.addEventListener('click', ()=>{
      toggleFav(g.id);
      favBtn.textContent = favorites.has(g.id) ? '❤' : '🤍';
    });
    grid.appendChild(node);
  });
}

function renderNews(){
  appEl.innerHTML = `
    <section class="page">
      <div class="header-row"><h2>Новости</h2></div>
      <article class="card neon" style="padding:18px;">
        <h3>Добро пожаловать в GameVault</h3>
        <p>Это демо‑страница новостей. Подключите CMS или GitHub Discussions для реальных новостей.</p>
      </article>
    </section>
  `;
}

function renderContacts(){
  appEl.innerHTML = `
    <section class="page">
      <div class="header-row"><h2>Контакты</h2></div>
      <div style="display:grid;gap:12px">
        <p>Если хотите связаться: <a href="mailto:you@example.com">you@example.com</a></p>
        <p>Discord: <code>your-discord#0000</code></p>
      </div>
    </section>
  `;
}

function renderFavorites(){
  const favArr = games.filter(g => favorites.has(g.id));
  appEl.innerHTML = `
    <section class="page">
      <div class="header-row"><h2>Избранное</h2><div class="muted">${favArr.length} игр</div></div>
      <div class="grid" id="grid-fav"></div>
    </section>
  `;
  const grid = document.getElementById('grid-fav');
  const tpl = document.getElementById('card-template');
  favArr.forEach(g=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.card-cover').src = g.cover || ('https://via.placeholder.com/400x560?text=' + encodeURIComponent(g.title));
    node.querySelector('.card-cover').alt = g.title;
    node.querySelector('.card-title').textContent = g.title;
    node.querySelector('.card-meta').textContent = `${g.release_date || ''}`
    node.querySelector('.btn-details').addEventListener('click', ()=>openDetails(g.id));
    const favBtn = node.querySelector('.btn-fav');
    favBtn.textContent = '❤';
    favBtn.addEventListener('click', ()=>{
      toggleFav(g.id);
      node.remove();
      updateFavCount();
    });
    grid.appendChild(node);
  });
}

// --- Детали игры ---
function openDetails(id){
  const g = games.find(x=>x.id===id);
  if(!g) return;
  modalBody.innerHTML = `
    <div style="display:grid;grid-template-columns:200px 1fr;gap:14px;">
      <img src="${g.cover||'https://via.placeholder.com/400x560'}" alt="${g.title}" style="width:100%; border-radius:8px"/>
      <div>
        <h2>${g.title}</h2>
        <p style="color:var(--muted)">${g.genres?.join(', ') || ''} • ${g.platforms?.join(', ') || ''}</p>
        <p>${g.description || 'Описание отсутствует.'}</p>
        <h4>Системные требования</h4>
        <pre style="white-space:pre-wrap; background:rgba(255,255,255,0.02); padding:8px; border-radius:8px;">${g.sysreqs || 'Не указано'}</pre>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          ${renderStoreButtons(g.storeLinks)}
        </div>
      </div>
    </div>
  `;
  modal.setAttribute('aria-hidden','false');
}

function renderStoreButtons(storeLinks = {}){
  const btns = [];
  for(const [k,v] of Object.entries(storeLinks)){
    btns.push(`<a class="btn btn-primary" href="${v}" target="_blank" rel="noopener noreferrer">${k}</a>`);
  }
  return btns.join(' ');
}

modalClose.addEventListener('click', ()=>modal.setAttribute('aria-hidden','true'));
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.setAttribute('aria-hidden','true') });

// --- Избранное ---
function toggleFav(id){
  if(favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  localStorage.setItem('gv_favs', JSON.stringify([...favorites]));
  updateFavCount();
}

function updateFavCount(){
  favCountEl.textContent = String(favorites.size);
}

// --- Поиск и маршруты ---
searchInput.addEventListener('input', ()=>{ route(); });
window.addEventListener('hashchange', route);

// --- Login (Discord) ---
// Простой redirect к Discord OAuth2 (implicit/demo). Для рабочего входа нужен client_id и redirect URI.
// Инструкция — в README.
btnLogin.addEventListener('click', ()=>{
  const clientId = prompt('Введите Discord Client ID для демо (оставьте пустым, чтобы показать подсказку):') || '';
  if(!clientId){
    alert('Чтобы включить реальный вход через Discord, зарегистрируйте приложение в https://discord.com/developers и укажите client_id и redirect URI. См. README.');
    return;
  }
  const redirectUri = location.origin + location.pathname.replace(/[^\/]*$/, '') + 'auth.html';
  const scope = 'identify';
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`;
  location.href = url;
});

// --- Инициализация ---
(async function init(){
  await loadGames();
  route();
})();