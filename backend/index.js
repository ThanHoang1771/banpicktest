const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const playersPool = require('./players.json');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Format FVPL: 5 Bans mỗi đội (xen kẽ) -> 11 Picks (Snake Draft)
const banOrder = ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']; // 10 Lượt cấm
const pickOrder = ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B']; // 22 Lượt chọn

let gameState = getInitialState();

function getInitialState() {
    return {
        status: 'WAITING', // WAITING, BAN, PICK, FINISHED
        turnIndex: 0,
        teamA: { bans: [], picks: [] },
        teamB: { bans: [], picks: [] },
        pool: playersPool
    };
}

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('state_update', gameState);

    // Bắt đầu ván draft
    socket.on('start_draft', () => {
        gameState = getInitialState();
        gameState.status = 'BAN';
        io.emit('state_update', gameState);
    });

    // Reset toàn bộ
    socket.on('reset', () => {
        gameState = getInitialState();
        io.emit('state_update', gameState);
    });

    // Xử lý Ban/Pick
    socket.on('action', ({ team, player }) => {
        if (gameState.status !== 'BAN' && gameState.status !== 'PICK') return;

        const isBanPhase = gameState.status === 'BAN';
        const currentOrder = isBanPhase ? banOrder : pickOrder;
        const expectedTeam = currentOrder[gameState.turnIndex];

        // 1. Check lượt
        if (team !== expectedTeam) {
            return socket.emit('error_msg', 'Chưa tới lượt của đội bạn!');
        }

        // 2. Check xem cầu thủ đã bị cấm/chọn chưa (Luật Exclusive Pick)
        const isTaken = [...gameState.teamA.bans, ...gameState.teamB.bans, ...gameState.teamA.picks, ...gameState.teamB.picks]
                        .some(p => p.id === player.id);
        if (isTaken) {
            return socket.emit('error_msg', 'Cầu thủ này đã bị cấm hoặc chọn trước đó!');
        }

        // 3. Xử lý Cấm (Max 2 cầu thủ cùng 1 nhóm vị trí cho 1 đội)
        if (isBanPhase) {
            const teamBans = team === 'A' ? gameState.teamA.bans : gameState.teamB.bans;
            const posCount = teamBans.filter(p => p.posGroup === player.posGroup).length;
            if (posCount >= 2) {
                return socket.emit('error_msg', `Đã cấm tối đa 2 cầu thủ ở vị trí ${player.posGroup}`);
            }
            team === 'A' ? gameState.teamA.bans.push(player) : gameState.teamB.bans.push(player);
        } 
        // 4. Xử lý Chọn
        else {
            team === 'A' ? gameState.teamA.picks.push(player) : gameState.teamB.picks.push(player);
        }

        // 5. Chuyển lượt
        gameState.turnIndex++;
        if (gameState.turnIndex >= currentOrder.length) {
            if (isBanPhase) {
                gameState.status = 'PICK';
                gameState.turnIndex = 0;
            } else {
                gameState.status = 'FINISHED';
            }
        }

        io.emit('state_update', gameState);
    });
});

server.listen(4000, () => console.log('Draft server running on port 4000'));
