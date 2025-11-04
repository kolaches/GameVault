// Обновлённый JS: фильтры, сортировка, вид (сетка/список), ленивые обложки, пагинация
const appEl = document.getElementById('app');
const gridEl = document.getElementById('grid');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const viewToggle = document.getElementById('btn-view-toggle');
const resultsCount = document.getElementById('results-count');
const platformFiltersEl = document.getElementById('platform-filters');
const genreFiltersEl = document.getElementById('genre-filters');
const priceFilter = document.getElementById('price-filter');
const clearFiltersBtn = document.getElementById('clear-filters');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const favCountEl = document.getElementById('fav-count');
const randomBtn = document.getElementById('random-game');
const tpl = document.getElementById('card-template');

let games = [];
let favorites = new Set(JSON.parse(localStorage.getItem('gv_favs')||'[]'));
let activePlatforms = new Set();
let activeGenres = new Set();
let view = localStorage.getItem('gv_view') || 'grid'; // grid or list
let currentPage = 1;
const PAGE_SIZE = 20;

updateFavCount();

// подгружаем games.json
async function loadGames(){
  try{
    const res = await fetch('games.json');
    games = await res.json();
  }catch(e){
    console.error('Не удалось загрузить games.json', e);
    games = [];
  }
  populateFilters();
}

// формируем набор фильтров по данным
function populateFilters(){
  const platforms = new Set();
  const genres = new Set();
  games.forEach(g=>{
    (g.platforms||[]).forEach(p=>platforms.add(p));
    (g.genres||[]).forEach(gx=>genres.add(gx));
  });
  platformFiltersEl.innerHTML = '';
  Array.from(platforms).sort().forEach(p=>{
    const btn = document.createElement('button');
    btn.className='chip';
    btn.textContent=p;
    btn.addEventListener('click', ()=>{ btn.classList.toggle('active'); if(btn.classList.contains('active')) activePlatforms.add(p); else activePlatforms.delete(p); currentPage=1; render(); });
    platformFiltersEl.appendChild(btn);
  });
  genreFiltersEl.innerHTML='';
  Array.from(genres).sort().forEach(gx=>{
    const btn = document.createElement('button');
    btn.className='chip'; btn.textContent=gx;
    btn.addEventListener('click', ()=>{ btn.classList.toggle('active'); if(btn.classList.contains('active')) activeGenres.add(gx); else activeGenres.delete(gx); currentPage=1; render(); });
    genreFiltersEl.appendChild(btn);
  });
}

// Основной рендер: фильтрация, сортировка, пагинация
function render(){
  const q = (searchInput.value||'').trim().toLowerCase();
  let filtered = games.filter(g=>{
    let hay = (g.title + ' ' + (g.genres||[]).join(' ') + ' ' + (g.platforms||[]).join(' ') + ' ' + (g.description||'')).toLowerCase();
    if(q && !hay.includes(q)) return false;
    if(activePlatforms.size){
      const has = (g.platforms||[]).some(p=>activePlatforms.has(p));
      if(!has) return false;
    }
    if(activeGenres.size){
      const hasg = (g.genres||[]).some(gg=>activeGenres.has(gg));
      if(!hasg) return false;
    }
    if(priceFilter && priceFilter.value !== 'any'){
      if(priceFilter.value === 'free' && !g.price_free) return false;
      if(priceFilter.value === 'paid' && g.price_free) return false;
      if(priceFilter.value === 'discount' && !g.discount) return false;
    }
    return true;
  });

  // сортировка
  const sort = sortSelect.value;
  if(sort === 'new') filtered.sort((a,b)=> (b.release_date||'').localeCompare(a.release_date||''));
  else if(sort === 'alpha') filtered.sort((a,b)=> a.title.localeCompare(b.title));
  else if(sort === 'popular') filtered.sort((a,b)=> (b.popularity||0) - (a.popularity||0));
  // relevance ~ default

  // пагинация
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if(currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  resultsCount.textContent = `Найдено: ${total}`;
  renderGrid(pageItems);
  renderPagination(pages);
}

// рендер карточек
function renderGrid(items){
  gridEl.innerHTML = '';
  gridEl.className = view === 'grid' ? 'gv-grid' : 'gv-grid list-view';
  items.forEach(g=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    const img = node.querySelector('.cover');
    img.dataset.src = g.cover || ('https://via.placeholder.com/400x560?text=' + encodeURIComponent(g.title));
    img.alt = g.title;
    node.querySelector('.title').textContent = g.title;
    node.querySelector('.platforms').textContent = (g.platforms||[]).slice(0,2).join(', ');
    node.querySelector('.release').textContent = g.release_date || '';
    const tagsWrap = node.querySelector('.tags');
    tagsWrap.innerHTML = '';
    (g.genres||[]).slice(0,3).forEach(t=>{
      const tEl = document.createElement('span'); tEl.className='tag'; tEl.textContent=t; tagsWrap.appendChild(tEl);
    });
    node.querySelector('.price').textContent = g.price || (g.price_free ? 'БЕСПЛАТНО' : '');
    node.querySelector('.discount').textContent = g.discount ? `${g.discount}%` : '';
    node.querySelector('.btn-details').addEventListener('click', ()=>openDetails(g.id));
    const favBtn = node.querySelector('.btn-fav');
    favBtn.textContent = favorites.has(g.id) ? '❤' : '♡';
    favBtn.addEventListener('click', (e)=>{ e.stopPropagation(); toggleFav(g.id); favBtn.textContent = favorites.has(g.id) ? '❤' : '♡'; });
    node.querySelector('.cover-wrap').addEventListener('click', ()=>openDetails(g.id));
    gridEl.appendChild(node);
  });
  lazyLoadImages();
}

// ленивый загрузчик простая реализация
function lazyLoadImages(){
  const imgs = document.querySelectorAll('.cover[data-src]');
  const options = {root:null,rootMargin:'200px',threshold:0.01};
  const obs = new IntersectionObserver((entries, observer)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, options);
  imgs.forEach(i=>obs.observe(i));
}

// подробная карточка
function openDetails(id){
  const g = games.find(x=>x.id===id);
  if(!g) return;
  modalBody.innerHTML = `
    <div style="display:grid;grid-template-columns:260px 1fr;gap:16px;">
      <img src="${g.cover||'https://via.placeholder.com/400x560'}" alt="${g.title}" style="width:100%;border-radius:6px"/>
      <div>
        <h2>${g.title}</h2>
        <p class="muted">${(g.genres||[]).join(', ')} • ${(g.platforms||[]).join(', ')}</p>
        <p>${g.description || ''}</p>
        <h4>Системные требования</h4>
        <pre style="white-space:pre-wrap;background:rgba(255,255,255,0.02);padding:8px;border-radius:6px">${g.sysreqs || 'Не указано'}</pre>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          ${(g.storeLinks ? Object.entries(g.storeLinks).map(([k,v])=>`<a class="gv-btn" href="${v}" target="_blank">${k}</a>`).join(' ') : '')}
        </div>
      </div>
    </div>
  `;
  modal.setAttribute('aria-hidden','false');
}
modalClose.addEventListener('click', ()=>modal.setAttribute('aria-hidden','true'));
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.setAttribute('aria-hidden','true') });

// избранное
function toggleFav(id){
  if(favorites.has(id)) favorites.delete(id); else favorites.add(id);
  localStorage.setItem('gv_favs', JSON.stringify([...favorites]));
  updateFavCount();
}
function updateFavCount(){ favCountEl.textContent = String(favorites.size); }

// пагинация
function renderPagination(pages){
  const pag = document.getElementById('pagination');
  if(pages <= 1){ pag.style.display='none'; return; }
  pag.style.display='flex'; pag.innerHTML='';
  for(let i=1;i<=pages;i++){
    const b = document.createElement('button');
    b.className='gv-btn ghost';
    b.textContent = i;
    if(i===currentPage) b.classList.add('active');
    b.addEventListener('click', ()=>{ currentPage=i; render(); });
    pag.appendChild(b);
  }
}

// события UI
searchInput.addEventListener('input', ()=>{ currentPage=1; render(); });
sortSelect.addEventListener('change', ()=>{ currentPage=1; render(); });
priceFilter && priceFilter.addEventListener('change', ()=>{ currentPage=1; render(); });
clearFiltersBtn.addEventListener('click', ()=>{
  activePlatforms.clear(); activeGenres.clear();
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  priceFilter.value = 'any';
  currentPage=1; render();
});
viewToggle.addEventListener('click', ()=>{
  view = view === 'grid' ? 'list' : 'grid';
  localStorage.setItem('gv_view', view);
  viewToggle.textContent = view === 'grid' ? '▦' : '≡';
  render();
});
randomBtn && randomBtn.addEventListener('click', ()=>{
  if(!games.length) return;
  const g = games[Math.floor(Math.random()*games.length)];
  openDetails(g.id);
});

// login button kept as demo
document.getElementById('btn-login').addEventListener('click', ()=>{
  alert('Для реального входа через Discord настройте OAuth как описано в README.');
});

// инициализация
(async function init(){
  await loadGames();
  render();
})();