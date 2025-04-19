const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this to your frontend domain
        methods: ["GET", "POST"]
    }
});

// Load prompts and answer styles from text files
function loadLinesFromFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return [];
    }
}

// Game prompts and answer styles
const prompts = loadLinesFromFile(path.join(__dirname, 'prompts.txt'));
const answerStyles = loadLinesFromFile(path.join(__dirname, 'answer-styles.txt'));

// Fallback to default prompts if file is empty or cannot be read
if (prompts.length === 0) {
    console.warn('Using default prompts as prompts.txt is empty or cannot be read');
    prompts.push(
        "What's the next happy meal toy?",
        "It's a pity that kids these days are ___",
        "I'm sorry I couldn't do my homework because __",
        "TSA now prohibits __ on airplanes",
        "And the Academy Award for __ goes to __",
        "The only thing you need in life is __"
    );
}

// Fallback to default answer styles if file is empty or cannot be read
if (answerStyles.length === 0) {
    console.warn('Using default answer styles as answer-styles.txt is empty or cannot be read');
    answerStyles.push(
        "One word only",
        "Answer in 3 words",
        "Answer in 4-letter words only",
        "Emojis-only",
        "Answer in a food analogy",
        "Anecdote (true or made-up)"
    );
}

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
            hostId: socket.id,
            currentPrompt: null,
            currentAnswerStyle: null,
            roundAnswers: new Map(),
            roundComplete: false
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
        
        // Select random prompt and answer style
        lobby.currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        lobby.currentAnswerStyle = answerStyles[Math.floor(Math.random() * answerStyles.length)];
        lobby.gameStarted = true;
        lobby.roundAnswers = new Map();
        lobby.roundComplete = false;
        
        console.log(`Game started in lobby: ${lobbyCode}`);
        io.to(lobbyCode).emit('gameStarted', {
            prompt: lobby.currentPrompt,
            answerStyle: lobby.currentAnswerStyle
        });
    });

    // Handle player answer submission
    socket.on('submitAnswer', ({ answer }) => {
        const lobbyCode = socket.lobbyCode;
        if (!lobbyCode) return;
        
        const lobby = lobbies.get(lobbyCode);
        if (!lobby || !lobby.gameStarted) return;
        
        // Add answer to the round answers
        const player = lobby.players.find(p => p.id === socket.id);
        if (player) {
            lobby.roundAnswers.set(socket.id, {
                playerId: socket.id,
                playerName: player.name,
                answer: answer
            });
            
            // Notify player that their answer was received
            socket.emit('answerReceived');
            
            // Check if all players have submitted answers
            if (lobby.roundAnswers.size === lobby.players.length) {
                lobby.roundComplete = true;
                
                // Convert Map to Array for easy handling in frontend
                const answers = Array.from(lobby.roundAnswers.values());
                
                // Randomize the order of answers before sending to clients
                const shuffledAnswers = shuffleArray(answers);
                
                io.to(lobbyCode).emit('allAnswersSubmitted', { 
                    answers: shuffledAnswers
                });
            } else {
                // Notify all players about progress
                io.to(lobbyCode).emit('answerProgress', {
                    submitted: lobby.roundAnswers.size,
                    total: lobby.players.length
                });
            }
        }
    });

    // Start a new round (only the host can trigger this)
    socket.on('newRound', () => {
        const lobbyCode = socket.lobbyCode;
        const lobby = lobbies.get(lobbyCode);
        
        if (!lobby || !lobby.gameStarted) return;
        if (socket.id !== lobby.hostId) return;
        
        // Select new random prompt and answer style
        lobby.currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        lobby.currentAnswerStyle = answerStyles[Math.floor(Math.random() * answerStyles.length)];
        lobby.roundAnswers = new Map();
        lobby.roundComplete = false;
        
        io.to(lobbyCode).emit('newRound', {
            prompt: lobby.currentPrompt,
            answerStyle: lobby.currentAnswerStyle
        });
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
        
        // Remove their answer if they submitted one
        if (lobby.roundAnswers && lobby.roundAnswers.has(socket.id)) {
            lobby.roundAnswers.delete(socket.id);
            
            // Check if this affects the round completion status
            if (lobby.roundAnswers.size === lobby.players.length && lobby.players.length > 0) {
                lobby.roundComplete = true;
                
                // Convert Map to Array
                const answers = Array.from(lobby.roundAnswers.values());
                const shuffledAnswers = shuffleArray(answers);
                
                io.to(lobbyCode).emit('allAnswersSubmitted', { 
                    answers: shuffledAnswers
                });
            } else if (lobby.players.length > 0) {
                // Update progress
                io.to(lobbyCode).emit('answerProgress', {
                    submitted: lobby.roundAnswers.size,
                    total: lobby.players.length
                });
            }
        }
        
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

// Helper function to shuffle an array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

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
    console.log(`Loaded ${prompts.length} prompts and ${answerStyles.length} answer styles`);
});