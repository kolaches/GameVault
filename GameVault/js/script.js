// Lightweight data + UI functions for demo
const G = (window.G = {});
G.games = [
{id:1,title:'Slope',genre:'Arcade',desc:'Fast-paced rolling game',img:'https://picsum.photos/seed/s1/600/400',rating:4.5,store:'#'},
{id:2,title:'Run 3',genre:'Platformer',desc:'Spacey platform runner',img:'https://picsum.photos/seed/s2/600/400',rating:4.4,store:'#'},
{id:3,title:'Krunker',genre:'Shooter',desc:'Browser FPS',img:'https://picsum.photos/seed/s3/600/400',rating:4.2,store:'#'},
{id:4,title:'Among Us',genre:'Party',desc:'Social deduction',img:'https://picsum.photos/seed/s4/600/400',rating:4.3,store:'#'},
{id:5,title:'Celeste',genre:'Platformer',desc:'Difficult heartfelt platformer',img:'https://picsum.photos/seed/s5/600/400',rating:4.9,store:'#'}
];


// utils
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));


function init(){
// year
['#year','#year2','#year3',' #year'].forEach(s=>{const el = document.querySelector(s); if(el) el.textContent = new Date().getFullYear();});
// fill genre selects
const genres = ['All', ...new Set(G.games.map(g=>g.genre))];
const sel1 = document.getElementById('filter-genre');
const sel2 = document.getElementById('catalog-genre');
if(sel1) genres.forEach(g=>{const o = document.createElement('option'); o.value = g.toLowerCase(); o.textContent = g; sel1.appendChild(o)});
if(sel2) genres.forEach(g=>{const o = document.createElement('option'); o.value = g.toLowerCase(); o.textContent = g; sel2.appendChild(o)});


// counts
const elCount = document.getElementById('games-count'); if(elCount) elCount.textContent = G.games.length;


renderTop();
renderCatalog();


// events
const search = document.getElementById('search'); if(search) search.addEventListener('input',renderTop);
const catalogSearch = document.getElementById('catalog-search'); if(catalogSearch) catalogSearch.addEventListener('input',renderCatalog);
const filterGenre = document.getElementById('filter-genre'); if(filterGenre) filterGenre.addEventListener('change',renderTop);
const sortBy = document.getElementById('sort-by'); if(sortBy)