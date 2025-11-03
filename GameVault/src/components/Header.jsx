import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header(){
  const nav = useNavigate()
  return (
    <header className="site-header">
      <div className="logo" onClick={()=>nav('/')}>GameVault</div>
      <nav className="nav">
        <Link to="/catalog">Catalog</Link>
        <Link to="/">News</Link>
        <a href="#" onClick={(e)=>{e.preventDefault(); window.open('https://discord.gg','_blank')}}>Discord</a>
      </nav>
      <div className="header-right">
        <input className="search" placeholder="Search games..." onKeyDown={(e)=>{ if(e.key==='Enter') nav('/catalog?q='+encodeURIComponent(e.target.value)) }} />
      </div>
    </header>
  )
}
