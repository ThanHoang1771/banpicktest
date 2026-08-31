import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import './App.css';

function App() {
  const [gameState, setGameState] = useState(null);
  const [role, setRole] = useState(null); // 'A', 'B', or null (Viewer)
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    socket.on('state_update', (state) => setGameState(state));
    socket.on('error_msg', (msg) => alert(msg));
    return () => {
      socket.off('state_update');
      socket.off('error_msg');
    };
  }, []);

  if (!gameState) return <div style={{padding: 20}}>Đang kết nối Server...</div>;

  const isMyTurn = () => {
    if (!role || gameState.status === 'WAITING' || gameState.status === 'FINISHED') return false;
    const currentOrder = gameState.status === 'BAN' 
      ? ['A','B','A','B','A','B','A','B','A','B'] 
      : ['A','B','B','A','A','B','B','A','A','B','B','A','A','B','B','A','A','B','B','A','A','B'];
    return currentOrder[gameState.turnIndex] === role;
  };

  const handleAction = () => {
    if (!selectedPlayer) return alert("Chọn một cầu thủ trước!");
    socket.emit('action', { team: role, player: selectedPlayer });
    setSelectedPlayer(null);
  };

  // Lọc cầu thủ và kiểm tra xem ai đã bị chọn/cấm
  const takenIds = [...gameState.teamA.bans, ...gameState.teamB.bans, ...gameState.teamA.picks, ...gameState.teamB.picks].map(p => p.id);
  const filteredPool = gameState.pool.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="header">
        <h1>FVPL Summer 2026 - Ban/Pick Draft</h1>
        <h2>Trạng thái: {gameState.status}</h2>
        {!role ? (
          <div className="role-selector">
            <button className="btn" onClick={() => setRole('A')}>Tham gia Đội A</button>
            <button className="btn btn-red" onClick={() => setRole('B')}>Tham gia Đội B</button>
          </div>
        ) : (
          <div className="role-selector">
            <span>Bạn đang là: <b>Đội {role}</b></span>
            {gameState.status === 'WAITING' && <button className="btn" onClick={() => socket.emit('start_draft')}>Bắt đầu</button>}
            <button className="btn" onClick={() => socket.emit('reset')}>Reset Game</button>
          </div>
        )}
      </div>

      <div className="draft-layout">
        {/* TEAM A */}
        <div className="side-panel">
          <h2 style={{color: '#58a6ff'}}>ĐỘI A</h2>
          <div className="list-box">
            <h3>Bans</h3>
            {gameState.teamA.bans.map((p, i) => <div key={i} className="draft-item text-red">🚫 {p.name} ({p.posGroup})</div>)}
          </div>
          <div className="list-box" style={{flex: 1}}>
            <h3>Picks</h3>
            {gameState.teamA.picks.map((p, i) => <div key={i} className="draft-item">✅ {p.name} [{p.season}]</div>)}
          </div>
        </div>

        {/* BỂ CẦU THỦ */}
        <div className="center-panel">
          <input 
            className="search-input" 
            placeholder="Tìm kiếm cầu thủ..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <div className="player-list">
            {filteredPool.map(player => (
              <div 
                key={player.id} 
                className={`player-card ${selectedPlayer?.id === player.id ? 'selected' : ''} ${takenIds.includes(player.id) ? 'taken' : ''}`}
                onClick={() => !takenIds.includes(player.id) && setSelectedPlayer(player)}
              >
                <div><b>{player.name}</b></div>
                <div style={{fontSize: 12, color: '#8b949e'}}>{player.season} - {player.posGroup}</div>
              </div>
            ))}
          </div>
          <button 
            className={`btn ${gameState.status === 'BAN' ? 'btn-red' : ''}`} 
            style={{padding: '15px', fontSize: '18px'}}
            disabled={!isMyTurn()}
            onClick={handleAction}
          >
            {gameState.status === 'BAN' ? 'KHÓA LƯỢT CẤM' : 'KHÓA LƯỢT CHỌN'}
          </button>
        </div>

        {/* TEAM B */}
        <div className="side-panel">
          <h2 style={{color: '#da3633', textAlign: 'right'}}>ĐỘI B</h2>
          <div className="list-box">
            <h3 style={{textAlign: 'right'}}>Bans</h3>
            {gameState.teamB.bans.map((p, i) => <div key={i} className="draft-item" style={{textAlign: 'right'}}>({p.posGroup}) {p.name} 🚫</div>)}
          </div>
          <div className="list-box" style={{flex: 1}}>
            <h3 style={{textAlign: 'right'}}>Picks</h3>
            {gameState.teamB.picks.map((p, i) => <div key={i} className="draft-item" style={{textAlign: 'right'}}>[{p.season}] {p.name} ✅</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
