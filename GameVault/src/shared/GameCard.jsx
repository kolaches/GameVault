import React from 'react'
import { Link } from 'react-router-dom'

export default function GameCard({game, isFav, toggleFav}){
  return (
    <article className="card">
      <img src={game.cover} alt={game.title} className="cover-small"/>
      <div className="card-content">
        <h3><Link to={`/game/${game.id}`}>{game.title}</Link></h3>
        <div className="meta">{game.platform}</div>
        <p className="short">{game.short}</p>
        <div className="card-actions">
          <Link className="btn small" to={`/game/${game.id}`}>View</Link>
          <button className={`fav ${isFav? 'active':''}`} onClick={()=>toggleFav(game.id)}>{isFav ? '★' : '☆'}</button>
        </div>
      </div>
    </article>
  )
}
