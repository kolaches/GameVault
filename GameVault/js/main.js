/* main.js - shared utilities for GameVault */
(function(){
  window.$ = s => document.querySelector(s);
  window.$$ = s => Array.from(document.querySelectorAll(s));
  window.escape = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));

  // Theme toggle
  const THEME_KEY = 'gv_theme';
  function applyTheme(t){
    document.body.classList.remove('gv-theme-dark','gv-theme-light');
    document.body.classList.add(t === 'light' ? 'gv-theme-light' : 'gv-theme-dark');
    localStorage.setItem(THEME_KEY, t);
  }
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  document.addEventListener('click', (e) => {
    if(e.target.closest('#theme-toggle') || e.target.closest('#theme-toggle-2') || e.target.closest('#theme-toggle-3') || e.target.closest('#theme-toggle-game')){
      const cur = localStorage.getItem(THEME_KEY) || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    }
  });

  // Lazy load images
  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting){
        const img = en.target;
        const src = img.getAttribute('data-src');
        if(src){ img.src = src; img.removeAttribute('data-src'); }
        lazyObserver.unobserve(img);
      }
    });
  }, { rootMargin:'300px' });

  window.observeLazy = (root=document) => {
    root.querySelectorAll('img[data-src]').forEach(img => lazyObserver.observe(img));
  };

  // Favorites (localStorage)
  const FKEY = 'gv_favs';
  window.getFavs = () => JSON.parse(localStorage.getItem(FKEY) || '[]');
  window.isFav = id => getFavs().includes(id);
  window.toggleFav = id => {
    const arr = getFavs();
    const idx = arr.indexOf(id);
    if(idx === -1) arr.push(id); else arr.splice(idx,1);
    localStorage.setItem(FKEY, JSON.stringify(arr));
    return arr;
  };

  // small dom helper
  window.htmlToElem = html => {
    const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild;
  };

  // expose
  window.GV = window.GV || {};
  window.GV.applyTheme = applyTheme;
  window.GV.observeLazy = observeLazy;
})();
