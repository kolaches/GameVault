import React from 'react'
import GameCard from '../shared/GameCard'
export default function Catalog({games, favorites, toggleFav}){
  return (
    <>
      <h1>Game Catalog</h1>
      <div className="cards">
        {games.map(g=> <GameCard key={g.id} game={g} isFav={favorites.includes(g.id)} toggleFav={toggleFav} />)}
      </div>
    </>
  )
}
