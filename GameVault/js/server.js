// server.js — демо сервер для Steam OpenID и Discord OAuth (Express + Passport)
// Установи зависимости: npm i express express-session passport passport-steam passport-discord dotenv cors
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5500'; // где фронтенд работает

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure:true на HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Passport Steam (OpenID)
if(process.env.STEAM_REALM && process.env.STEAM_RETURN_URL){
  passport.use(new SteamStrategy({
    returnURL: process.env.STEAM_RETURN_URL,
    realm: process.env.STEAM_REALM,
    apiKey: process.env.STEAM_API_KEY
  }, (identifier, profile, done) => {
    // profile содержит steamid и displayName
    profile.identifier = identifier;
    return done(null, profile);
  }));
}

// Passport Discord
if(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET){
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify']
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));
}

// Routes
app.get('/auth/steam', (req, res, next) => {
  if(!passport._strategy('steam')) return res.status(500).send('Steam strategy not configured. Set STEAM_REALM, STEAM_RETURN_URL, STEAM_API_KEY in .env');
  passport.authenticate('steam')(req, res, next);
});
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req,res) => {
  // after login redirect back to client
  res.redirect(process.env.CLIENT_URL + '/?auth=steam');
});

app.get('/auth/discord', (req,res,next) => {
  if(!passport._strategy('discord')) return res.status(500).send('Discord strategy not configured.');
  passport.authenticate('discord')(req,res,next);
});
app.get('/auth/discord/return', passport.authenticate('discord', { failureRedirect: '/' }), (req,res) => {
  res.redirect(process.env.CLIENT_URL + '/?auth=discord');
});

app.get('/api/me', (req,res) => {
  if(req.isAuthenticated && req.isAuthenticated()){
    return res.json({ user: req.user });
  }
  res.json({ user: null });
});

app.get('/api/logout', (req,res) => {
  req.logout?.();
  req.session.destroy(()=>res.json({ ok: true }));
});

app.listen(PORT, ()=> console.log(`Auth server listening on ${PORT}`));