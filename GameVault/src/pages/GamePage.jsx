import React from 'react'
import { useParams } from 'react-router-dom'

export default function GamePage({games, favorites, toggleFav}){
  const { id } = useParams()
  const g = games.find(x=>x.id===id)
  if(!g) return <div>Game not found</div>
  return (
    <div className="game-page">
      <div className="left">
        <img src={g.cover} alt={g.title} className="cover" />
      </div>
      <div className="right">
        <h1>{g.title}</h1>
        <p className="meta">{g.platform}</p>
        <p>{g.desc}</p>
        <p><strong>System req:</strong> {g.requirements.min}</p>
        <p><a className="btn" href={g.steam} target="_blank" rel="noreferrer">Open on Store</a></p>
        <button className="btn ghost" onClick={()=>toggleFav(g.id)}>{favorites.includes(g.id) ? 'Remove Favorite' : 'Add to Favorites'}</button>
      </div>
    </div>
  )
}
