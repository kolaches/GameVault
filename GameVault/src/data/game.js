const games = [
  {
    id: 'dota2',
    title: 'Dota 2',
    platform: 'PC · Steam',
    short: '5v5 MOBA — strategy & skill',
    desc: 'Dota 2 is a competitive free-to-play game of team-based action and strategy.',
    cover: '/assets/img/dota2.jpg',
    steam: 'https://store.steampowered.com/app/570/Dota_2/',
    requirements: { min: '8 GB RAM, GTX 660 or equivalent' }
  },
  {
    id: 'cs2',
    title: 'Counter-Strike 2',
    platform: 'PC · Steam',
    short: 'Tactical first-person shooter',
    desc: 'Counter-Strike 2 is the next step in the Counter-Strike series.',
    cover: '/assets/img/cs2.jpg',
    steam: 'https://store.steampowered.com/app/730/CounterStrike_Global_Offensive/',
    requirements: { min: '8 GB RAM, GTX 970 or equivalent' }
  },
  {
    id: 'valorant',
    title: 'Valorant',
    platform: 'PC',
    short: '5v5 character shooter by Riot Games',
    desc: 'Valorant blends precise gunplay with unique agent abilities.',
    cover: '/assets/img/valorant.jpg',
    steam: '#',
    requirements: { min: '4 GB RAM, Dual Core' }
  }
]

export default games
