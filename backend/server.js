// filepath: /Users/gdmagana/Developer/Github/Masquerade/backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this to your frontend domain
        methods: ["GET", "POST"]
    }
});

// Store active lobbies and their players
const lobbies = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Create a new lobby
    socket.on('createLobby', ({ username }) => {
        const lobbyCode = generateLobbyCode();
        const player = {
            id: socket.id,
            name: username,
            isHost: true
        };
        
        // Store lobby data
        lobbies.set(lobbyCode, {
            players: [player],
            gameStarted: false,
            hostId: socket.id
        });
        
        // Join the socket to the lobby room
        socket.join(lobbyCode);
        socket.lobbyCode = lobbyCode;
        
        console.log(`Lobby created: ${lobbyCode} by ${username}`);
        socket.emit('lobbyCreated', { lobbyCode, player });
        io.to(lobbyCode).emit('playerListUpdate', { players: lobbies.get(lobbyCode).players });
    });

    // Join an existing lobby
    socket.on('joinLobby', ({ username, lobbyCode }) => {
        const lobby = lobbies.get(lobbyCode);
        
        if (!lobby) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }
        
        if (lobby.gameStarted) {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }
        
        const player = {
            id: socket.id,
            name: username,
            isHost: false
        };
        
        // Add player to lobby
        lobby.players.push(player);
        
        // Join the socket to the lobby room
        socket.join(lobbyCode);
        socket.lobbyCode = lobbyCode;
        
        console.log(`Player ${username} joined lobby: ${lobbyCode}`);
        socket.emit('lobbyJoined', { lobbyCode, player });
        io.to(lobbyCode).emit('playerListUpdate', { players: lobby.players });
    });

    // Start the game
    socket.on('startGame', () => {
        const lobbyCode = socket.lobbyCode;
        const lobby = lobbies.get(lobbyCode);
        
        if (!lobby) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }
        
        if (socket.id !== lobby.hostId) {
            socket.emit('error', { message: 'Only the host can start the game' });
            return;
        }
        
        if (lobby.players.length < 2) {
            socket.emit('error', { message: 'Need at least 2 players to start' });
            return;
        }
        
        lobby.gameStarted = true;
        console.log(`Game started in lobby: ${lobbyCode}`);
        io.to(lobbyCode).emit('gameStarted');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        
        // Check if user was in a lobby
        const lobbyCode = socket.lobbyCode;
        if (!lobbyCode) return;
        
        const lobby = lobbies.get(lobbyCode);
        if (!lobby) return;
        
        // Remove player from lobby
        lobby.players = lobby.players.filter(player => player.id !== socket.id);
        
        // If host left, assign a new host or delete the lobby if empty
        if (socket.id === lobby.hostId) {
            if (lobby.players.length > 0) {
                const newHost = lobby.players[0];
                newHost.isHost = true;
                lobby.hostId = newHost.id;
                console.log(`New host assigned in lobby ${lobbyCode}: ${newHost.name}`);
            } else {
                lobbies.delete(lobbyCode);
                console.log(`Lobby deleted: ${lobbyCode}`);
                return;
            }
        }
        
        // Update remaining players
        io.to(lobbyCode).emit('playerListUpdate', { players: lobby.players });
    });

    // Keep the spin functionality
    socket.on('spin', (data) => {
        console.log('Spin event received:', data);
        const result = Math.floor(Math.random() * 10) + 1; // Random spin result
        io.emit('spinResult', { user: socket.id, result });
    });
});

// Generate a unique lobby code
function generateLobbyCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});