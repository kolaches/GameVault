/* auth.js - client-side helpers for sign-in (stub) */
(function(){
  // If you have a backend, change SIGNIN_URL to backend '/auth/discord'
  const SIGNIN_URL = '/auth/discord';

  // Attach sign-in link to open popup (stub)
  document.addEventListener('click', (e) => {
    if(e.target && (e.target.id === 'sign-link' || e.target.id === 'sign-link-2')){
      // if there's a backend provide real flow
      if(window.fetch){ // try to open flow (backend required)
        // Real flow requires server. We'll show a message if no backend.
        alert('Sign in via Discord requires a backend. I can provide Node example if needed.');
      } else {
        alert('Sign in unavailable.');
      }
      e.preventDefault();
    }
  });
})();
