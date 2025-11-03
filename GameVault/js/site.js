/* site.js — common helpers for GameVault (search, lazy load, favorites, theme) */
(function(){
  // helpers
  window.$ = s => document.querySelector(s);
  window.$$ = s => Array.from(document.querySelectorAll(s));
  window.escapeHtml = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // theme toggle
  function setTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('gv_theme', t);
  }
  const savedTheme = localStorage.getItem('gv_theme') || 'dark';
  setTheme(savedTheme);
  window.setTheme = setTheme;

  // init toggles
  document.addEventListener('click', (e)=> {
    if(e.target && (e.target.id === 'themeToggle' || e.target.closest('#themeToggle'))){
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    }
  });

  // favorites
  window.isFav = id => (JSON.parse(localStorage.getItem('gv_fav')||'[]')).includes(id);
  window.toggleFav = id => {
    const arr = JSON.parse(localStorage.getItem('gv_fav')||'[]');
    if(arr.includes(id)) arr.splice(arr.indexOf(id),1); else arr.push(id);
    localStorage.setItem('gv_fav', JSON.stringify(arr));
  };

  // lazy loading images
  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const img = e.target;
        const src = img.dataset.src;
        if(src){ img.src = src; img.classList.add('loaded'); }
        lazyObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  window.initLazy = function(){
    document.querySelectorAll('img.lazy').forEach(img => {
      if(!img.src) lazyObserver.observe(img);
    });
  };

  // simple safe fetch wrapper (handles CORS and errors)
  window.safeFetch = async function(url, opts){
    try{
      const r = await fetch(url, opts);
      if(!r.ok) throw new Error('Fetch error ' + r.status);
      return await r.json();
    }catch(e){
      console.warn('safeFetch', e);
      return null;
    }
  };

})();
