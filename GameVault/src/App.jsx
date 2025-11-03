import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import GamePage from './pages/GamePage'
import Header from './components/Header'
import Footer from './components/Footer'
import gamesData from './data/games'

export default function App(){
  const [games] = useState(gamesData)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gv_fav')||'[]') } catch { return [] }
  })

  useEffect(()=> localStorage.setItem('gv_fav', JSON.stringify(favorites)), [favorites])

  const toggleFav = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home games={games} favorites={favorites} toggleFav={toggleFav} />} />
          <Route path="/catalog" element={<Catalog games={games} favorites={favorites} toggleFav={toggleFav} />} />
          <Route path="/game/:id" element={<GamePage games={games} favorites={favorites} toggleFav={toggleFav} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
