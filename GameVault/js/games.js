/* games.js - loading and rendering games (RAWG optional) */
(function(){
  const RAWG_KEY = ''; // <-- вставь сюда ключ (опционально)
  const RAWG_BASE = 'https://api.rawg.io/api';
  const PAGE_SIZE = 12;

  const DEMO = [
    {id:'slope', name:'Slope', released:'2014', rating:4.3, genres:[{name:'Arcade'}], platforms:[{platform:{name:'PC'}}], background_image:'assets/img/placeholder.jpg', slug:'slope'},
    {id:'run3', name:'Run 3', released:'2016', rating:4.4, genres:[{name:'Platformer'}], platforms:[{platform:{name:'PC'}}], background_image:'assets/img/placeholder2.jpg', slug:'run-3'},
    {id:'celeste', name:'Celeste', released:'2018', rating:4.9, genres:[{name:'Platformer'}], platforms:[{platform:{name:'PC'}}], background_image:'assets/img/placeholder3.jpg', slug:'celeste'},
    {id:'amongus', name:'Among Us', released:'2018', rating:4.1, genres:[{name:'Party'}], platforms:[{platform:{name:'PC'}}], background_image:'assets/img/placeholder4.jpg', slug:'among-us'},
    {id:'krunker', name:'Krunker', released:'2018', rating:4.2, genres:[{name:'Shooter'}], platforms:[{platform:{name:'PC'}}], background_image:'assets/img/placeholder5.jpg', slug:'krunker'}
  ];

  function safeFetch(url){
    return fetch(url).then(r => r.ok ? r.json() : Promise.reject(r.status)).catch(()=>null);
  }

  function makeCard(game){
    const id = game.slug || game.id || game.name;
    const genres = (game.genres||[]).map(g=>g.name).slice(0,2).join(', ');
    const platforms = (game.platforms||[]).map(p=> p.platform ? p.platform.name : p.name ).slice(0,2).join(', ');
    const img = game.background_image || 'assets/img/placeholder.jpg';
    const rating = game.rating || 0;
    const released = game.released || '';
    const fav = isFav(id);

    const html = `
      <article class="card">
        <img class="thumb" data-src="${img}" alt="${escape(game.name)}" />
        <div>
          <h3><a href="game.html?id=${encodeURIComponent(id)}">${escape(game.name)}</a></h3>
          <div class="meta">${platforms} · ⭐ ${rating} · ${released}</div>
          <div class="tags">${genres ? `<span class="tag">${escape(genres)}</span>` : ''}</div>
          <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
            <button class="btn small view-btn" data-id="${id}">View</button>
            <button class="btn-ghost small fav-btn ${fav ? 'fav-on' : ''}" data-id="${id}">${fav ? '♥' : '♡'}</button>
          </div>
        </div>
      </article>
    `;
    return htmlToElem(html);
  }

  async function renderList({container, page=1, page_size=PAGE_SIZE, query='', genres='', platforms='', ordering='-rating', append=false}){
    const cont = document.getElementById(container);
    if(!cont) return;
    if(!append) cont.innerHTML = '';

    // Try RAWG
    if(RAWG_KEY){
      const url = new URL(RAWG_BASE + '/games');
      url.searchParams.set('page', page);
      url.searchParams.set('page_size', page_size);
      if(query) url.searchParams.set('search', query);
      if(genres) url.searchParams.set('genres', genres);
      if(platforms) url.searchParams.set('platforms', platforms);
      if(ordering) url.searchParams.set('ordering', ordering);
      url.searchParams.set('key', RAWG_KEY);
      const res = await safeFetch(url.toString());
      if(res && res.results && res.results.length){
        res.results.forEach(g => cont.appendChild(makeCard(g)));
        GV.observeLazy(cont);
        attachButtons(cont);
        return;
      }
    }

    // fallback DEMO
    let arr = DEMO.slice();
    if(query) arr = arr.filter(g => (g.name + ' ' + (g.genres||[]).map(x=>x.name).join(' ')).toLowerCase().includes(query.toLowerCase()));
    if(genres) arr = arr.filter(g => (g.genres||[]).some(x => x.name.toLowerCase().includes(genres.toLowerCase())));
    if(platforms) arr = arr.filter(g => (g.platforms||[]).some(p => (p.platform ? p.platform.name : p.name).toLowerCase().includes(platforms.toLowerCase())));
    if(ordering === 'name') arr.sort((a,b)=>a.name.localeCompare(b.name)); else if(ordering === '-rating') arr.sort((a,b)=> (b.rating||0) - (a.rating||0));
    arr.forEach(g => cont.appendChild(makeCard(g)));
    GV.observeLazy(cont);
    attachButtons(cont);
  }

  async function initIndex(){
    const featuredWrap = document.getElementById('featured-wrap');
    if(featuredWrap){
      const game = DEMO[0];
      const html = `
        <div class="featured">
          <img class="cover" data-src="${game.background_image}" alt="${escape(game.name)}" />
          <h3 style="margin-top:10px">${escape(game.name)}</h3>
          <p class="meta">${(game.genres||[]).map(g=>g.name).join(', ')} · ⭐ ${game.rating}</p>
          <div style="margin-top:8px"><a class="btn" href="game.html?id=${encodeURIComponent(game.slug||game.id)}">Open</a></div>
        </div>
      `;
      featuredWrap.innerHTML = '';
      featuredWrap.appendChild(htmlToElem(html));
      GV.observeLazy(featuredWrap);
    }

    await renderList({container:'trending', page_size:6, ordering:'-added'});
    await renderList({container:'top-rated', page_size:6, ordering:'-rating'});
  }

  let catalogPage = 1;
  async function initCatalog(){
    if(RAWG_KEY){
      // load genres
      const genresRes = await safeFetch(RAWG_BASE + '/genres?key=' + RAWG_KEY);
      if(genresRes && genresRes.results){
        const sel = document.getElementById('filter-genre');
        genresRes.results.forEach(g => {
          const o = document.createElement('option'); o.value = g.slug; o.textContent = g.name; sel.appendChild(o);
        });
      }
      // platforms
      const platsRes = await safeFetch(RAWG_BASE + '/platforms/lists/parents?key=' + RAWG_KEY);
      if(platsRes && platsRes.results){
        const selp = document.getElementById('filter-platform');
        platsRes.results.forEach(p => {
          const o = document.createElement('option'); o.value = p.name; o.textContent = p.name; selp.appendChild(o);
        });
      }
    } else {
      ['Arcade','Platformer','Shooter','Party'].forEach(g => {
        const o = document.createElement('option'); o.value = g; o.textContent = g; document.getElementById('filter-genre').appendChild(o);
      });
      ['PC','PlayStation','Xbox','Switch'].forEach(p => {
        const o = document.createElement('option'); o.value = p; o.textContent = p; document.getElementById('filter-platform').appendChild(o);
      });
    }

    await renderList({container:'catalog-grid', page:catalogPage, page_size: PAGE_SIZE});
  }

  function attachButtons(root){
    (root || document).querySelectorAll('.fav-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        toggleFav(id);
        btn.classList.toggle('fav-on');
        btn.textContent = isFav(id) ? '♥' : '♡';
      };
      btn.textContent = isFav(btn.dataset.id) ? '♥' : '♡';
    });

    (root || document).querySelectorAll('.view-btn').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.id;
        window.location = 'game.html?id=' + encodeURIComponent(id);
      };
    });
  }

  // page init
  document.addEventListener('DOMContentLoaded', async () => {
    const page = window.GV_PAGE || 'index';

    const topSearch = document.getElementById('top-search');
    if(topSearch){
      topSearch.addEventListener('keydown', e => {
        if(e.key === 'Enter'){
          const q = topSearch.value.trim();
          window.location = 'catalog.html' + (q ? ('?q=' + encodeURIComponent(q)) : '');
        }
      });
    }

    if(page === 'index') await initIndex();
    if(page === 'catalog') {
      await initCatalog();
      document.getElementById('load-more').addEventListener('click', async ()=>{
        catalogPage++; await renderList({container:'catalog-grid', page:catalogPage, append:true});
      });
      document.getElementById('catalog-search').addEventListener('input', debounce(async (e)=>{
        catalogPage = 1; await renderList({container:'catalog-grid', page:1, query:e.target.value, append:false});
      },300));
      document.getElementById('filter-genre').addEventListener('change', async (e)=>{ catalogPage=1; await renderList({container:'catalog-grid', page:1, genres:e.target.value, append:false});});
      document.getElementById('filter-platform').addEventListener('change', async (e)=>{ catalogPage=1; await renderList({container:'catalog-grid', page:1, platforms:e.target.value, append:false});});
      document.getElementById('sort-by').addEventListener('change', async (e)=>{ catalogPage=1; await renderList({container:'catalog-grid', page:1, ordering:e.target.value, append:false});});
      document.getElementById('reset-filters').addEventListener('click', async ()=>{ document.getElementById('catalog-search').value=''; document.getElementById('filter-genre').value=''; document.getElementById('filter-platform').value=''; document.getElementById('sort-by').value='-rating'; catalogPage=1; await renderList({container:'catalog-grid', page:1, append:false});});
    }

    // game page rendering
    if(page === 'game'){
      const params = new URLSearchParams(location.search);
      const id = params.get('id');
      await renderGamePage(id);
    }

    GV.observeLazy(document);
    attachButtons(document);
  });

  // render single game page
  async function renderGamePage(id){
    const wrap = document.getElementById('game-wrap');
    if(!wrap) return;
    wrap.innerHTML = '<div class="muted">Loading...</div>';
    // try RAWG
    if(RAWG_KEY){
      const url = `${RAWG_BASE}/games/${encodeURIComponent(id)}?key=${RAWG_KEY}`;
      const data = await safeFetch(url);
      if(data){
        wrap.innerHTML = renderGameHtml(data);
        GV.observeLazy(wrap);
        return;
      }
    }
    // fallback: find in DEMO
    const game = DEMO.find(g => (g.slug || g.id || g.name) === id) || DEMO[0];
    wrap.innerHTML = renderGameHtml(game);
    GV.observeLazy(wrap);
  }

  function renderGameHtml(g){
    const genres = (g.genres||[]).map(x=>x.name).join(', ');
    const platforms = (g.platforms||[]).map(p=> p.platform ? p.platform.name : (p.name||'')).join(', ');
    const img = g.background_image || 'assets/img/placeholder.jpg';
    return `
      <div class="game-page glass" style="display:grid;grid-template-columns:1fr 360px;gap:20px">
        <div>
          <img class="cover" data-src="${img}" alt="${escape(g.name)}" />
          <h1>${escape(g.name)}</h1>
          <div class="meta">${platforms} · ${genres} · ⭐ ${g.rating || ''}</div>
          <p style="margin-top:12px">${escape(g.description_raw || g.description || 'Описание отсутствует')}</p>
        </div>
        <aside class="glass" style="padding:12px;border-radius:12px">
          <h3>Info</h3>
          <p>Релиз: ${g.released || '—'}</p>
          <p>Рейтинг: ${g.rating || '—'}</p>
          <p>Платформы: ${platforms}</p>
          <div style="margin-top:12px"><a class="btn" href="#">Open Store</a></div>
        </aside>
      </div>
    `;
  }

  // debounce
  function debounce(fn, ms=200){ let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), ms); }; }

})();
