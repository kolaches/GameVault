import React from 'react'
import GameCard from '../shared/GameCard'

export default function Home({games, favorites, toggleFav}){
  return (
    <>
      <section className="hero">
        <h1>Welcome to GameVault</h1>
        <p>Your gateway to games — discover, compare, and connect.</p>
        <div className="hero-actions">
          <a className="btn" href="/GameVault/catalog">Browse Games</a>
        </div>
      </section>

      <section className="featured">
        <h2>Featured Games</h2>
        <div className="cards">{games.slice(0,3).map(g=> <GameCard key={g.id} game={g} isFav={favorites.includes(g.id)} toggleFav={toggleFav} />)}</div>
      </section>
    </>
  )
}
