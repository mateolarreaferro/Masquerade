const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Performance optimization: add compression middleware
const compression = require('compression');
app.use(compression());

// Socket.IO setup - initialize before middleware for proper path handling
const io = new Server(server, {
    cors: {
        origin: "*", // Allows connections from any origin, including local IPs
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    // Enhanced WebSocket configuration for better cross-platform support
    transports: ['websocket', 'polling'], // Start with either method
    path: '/socket.io', // Remove trailing slash to match client config
    connectTimeout: 45000, // Increase timeout for slow connections
    pingTimeout: 60000,      // Longer timeout for mobile devices
    pingInterval: 25000,     // More frequent pings to detect disconnections
    upgradeTimeout: 30000,   // Longer timeout for upgrading to WebSockets
    maxHttpBufferSize: 1e8,  // 100MB
    allowUpgrades: true,     // Enable upgrades to WebSocket
    perMessageDeflate: {     // Configure compression better
        threshold: 32 * 1024, // Only compress data if message is larger than 32KB
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        }
    },
    httpCompression: {
        threshold: 1024      // Compress HTTP requests larger than 1KB
    },
    allowEIO3: true,         // Allow clients using older versions of engine.io
});

// Add more robust CORS middleware to handle preflight requests for Socket.IO
app.use((req, res, next) => {
  // Allow requests from any origin (in production, restrict this)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight OPTIONS requests more thoroughly
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Max-Age', '3600'); // Cache preflight for 1 hour
    return res.status(204).send();
  }
  
  // Add caching for GET requests with varied cache times based on content type
  if (req.method === 'GET') {
    // For static assets, use a longer cache time
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
  next();
});

// Serve static files from the Next.js output directory and public folder
const frontendPath = path.join(__dirname, '../out'); // Static export output directory
const publicPath = path.join(__dirname, '../public');

// Initialize directories if they don't exist (important for container environment)
try {
  if (!fs.existsSync(frontendPath)) {
    fs.mkdirSync(frontendPath, { recursive: true });
    console.log('Created output directory:', frontendPath);
  }
  
  // If running in container, copy public files to out directory if needed
  if (process.env.CONTAINER_ENV === 'true' && fs.existsSync(publicPath)) {
    const publicFiles = fs.readdirSync(publicPath);
    if (publicFiles.length > 0) {
      console.log('Copying public files to output directory...');
      publicFiles.forEach(file => {
        const sourcePath = path.join(publicPath, file);
        const destPath = path.join(frontendPath, file);
        if (fs.statSync(sourcePath).isDirectory()) {
          // For directories, use recursive copy
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          copyDir(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      });
      console.log('Public files copied successfully to output directory');
    }
  }
} catch (err) {
  console.warn('Warning: Error handling static directories:', err.message);
}

// Helper function to copy directories recursively
function copyDir(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    entries.forEach(entry => {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath); // Recursively copy subdirectories
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    console.log(`Copied directory: ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying directory ${src} to ${dest}:`, err);
  }
}

// Serve static files with proper error handling
app.use(express.static(frontendPath, {
  fallthrough: true,
  // Handle errors in static file serving
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

// Only serve from public directory as fallback
app.use(express.static(publicPath, {
  fallthrough: true
}));

// Add route for health check and to verify server is running
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Add an iOS-specific ping endpoint that iOS WebKit can access if having issues with Socket.IO
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    pong: true, 
    timestamp: Date.now(),
    clientInfo: req.headers['user-agent'] 
  });
});

// Cache prompts and answer styles in memory
let cachedPrompts = [];
let cachedStyles = [];

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

// Track player indices for prompt and answer style selection rotation
const playerSelectionIndices = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Create a new lobby
    socket.on('createLobby', ({ username }) => {
        const lobbyCode = generateLobbyCode();
        const player = {
            id: socket.id,
            name: username,
            isHost: true,
            score: 0 // Add score for tracking points
        };
        
        // Store lobby data
        lobbies.set(lobbyCode, {
            players: [player],
            gameStarted: false,
            hostId: socket.id,
            currentPrompt: null,
            currentAnswerStyle: null,
            roundAnswers: new Map(),
            roundComplete: false,
            inVotingPhase: false, // Track if we're in the voting phase
            votes: new Map(),     // Store player votes
            playerScores: new Map(), // Track player scores,
            // New properties for prompt and style selection phases
            inPromptSelectionPhase: false,
            inStyleSelectionPhase: false,
            promptOptions: [],
            styleOptions: []
        });
        
        // Initialize player selection indices for this lobby
        playerSelectionIndices.set(lobbyCode, {
            promptPlayerIndex: 0,
            stylePlayerIndex: 1 // Start with different players for prompt and style
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
        
        // Allow joining if game is in prompt or style selection phase
        if (lobby.gameStarted && !(lobby.inPromptSelectionPhase || lobby.inStyleSelectionPhase)) {
            socket.emit('error', { message: 'Game already in progress. You can only join between rounds.' });
            return;
        }
        
        const player = {
            id: socket.id,
            name: username,
            isHost: false,
            score: 0 // Add score for tracking points
        };
        
        // Save current selectors before adding player
        let currentPromptSelector = null;
        let currentStyleSelector = null;
        
        if (lobby.gameStarted) {
            const indices = playerSelectionIndices.get(lobbyCode);
            if (indices) {
                // Save the current selectors' IDs before modifying the player array
                currentPromptSelector = lobby.players[indices.promptPlayerIndex]?.id;
                currentStyleSelector = lobby.players[indices.stylePlayerIndex]?.id;
            }
        }
        
        // Add player to lobby
        lobby.players.push(player);
        
        // Join the socket to the lobby room
        socket.join(lobbyCode);
        socket.lobbyCode = lobbyCode;
        
        console.log(`Player ${username} joined lobby: ${lobbyCode}`);
        socket.emit('lobbyJoined', { lobbyCode, player });
        io.to(lobbyCode).emit('playerListUpdate', { players: lobby.players });
        
        // If game is already in progress and in selection phase, update indices and send current game state
        if (lobby.gameStarted) {
            const indices = playerSelectionIndices.get(lobbyCode);
            if (indices && currentPromptSelector && currentStyleSelector) {
                // Update indices to point to the same players as before
                indices.promptPlayerIndex = lobby.players.findIndex(p => p.id === currentPromptSelector);
                indices.stylePlayerIndex = lobby.players.findIndex(p => p.id === currentStyleSelector);
                
                // Handle edge case where a selector might have disconnected
                if (indices.promptPlayerIndex === -1) indices.promptPlayerIndex = 0;
                if (indices.stylePlayerIndex === -1) indices.stylePlayerIndex = Math.min(1, lobby.players.length - 1);
            }
            
            socket.emit('gameStarted');
            
            // Send appropriate phase information to the joining player
            if (lobby.inPromptSelectionPhase) {
                socket.emit('startPromptSelection', { 
                    prompts: lobby.promptOptions,
                    playerId: currentPromptSelector || lobby.players[0].id
                });
            } else if (lobby.inStyleSelectionPhase) {
                // If prompt already selected, send that info
                if (lobby.currentPrompt) {
                    socket.emit('promptSelected', { prompt: lobby.currentPrompt });
                }
                
                socket.emit('startStyleSelection', { 
                    styles: lobby.styleOptions,
                    playerId: currentStyleSelector || lobby.players[Math.min(1, lobby.players.length - 1)].id
                });
            }
        }
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
        
        // Set the game as started
        lobby.gameStarted = true;
        console.log(`Game started in lobby: ${lobbyCode}`);
        
        // Reset the game state to ensure we start fresh
        lobby.roundAnswers = new Map();
        lobby.roundComplete = false;
        lobby.inVotingPhase = false;
        lobby.votes = new Map();
        
        // Initialize player selection indices if not already done
        if (!playerSelectionIndices.has(lobbyCode)) {
            playerSelectionIndices.set(lobbyCode, {
                promptPlayerIndex: 0,
                stylePlayerIndex: 1 // Start with different players for prompt and style
            });
        }
        
        // Notify all players that the game has started
        io.to(lobbyCode).emit('gameStarted');
        
        // Start the first round with prompt selection
        startPromptSelectionPhase(lobbyCode);
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
                lobby.inVotingPhase = true;
                
                // Convert Map to Array for easy handling in frontend
                const answers = Array.from(lobby.roundAnswers.values());
                
                // Randomize the order of answers before sending to clients
                const shuffledAnswers = shuffleArray(answers);
                
                // Only send the answers without playerNames
                const answersForVoting = shuffledAnswers.map(answer => ({
                    answerId: answer.playerId,  // Keep the ID for reference but don't display
                    answer: answer.answer
                }));
                
                io.to(lobbyCode).emit('startVotingPhase', { 
                    answers: answersForVoting,
                    players: lobby.players.map(p => ({ id: p.id, name: p.name }))
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
    
    // Handle player votes
    socket.on('submitVotes', ({ votes }) => {
        const lobbyCode = socket.lobbyCode;
        if (!lobbyCode) return;
        
        const lobby = lobbies.get(lobbyCode);
        if (!lobby || !lobby.inVotingPhase) return;
        
        // Store player's votes
        lobby.votes.set(socket.id, votes);
        
        // Check if all players have voted
        if (lobby.votes.size === lobby.players.length) {
            // Calculate scores
            const playerScores = calculateScores(lobby.roundAnswers, lobby.votes, lobby.players);
            
            // Update each player's score
            playerScores.forEach((score, playerId) => {
                const player = lobby.players.find(p => p.id === playerId);
                if (player) {
                    if (!lobby.playerScores.has(playerId)) {
                        lobby.playerScores.set(playerId, 0);
                    }
                    const currentScore = lobby.playerScores.get(playerId);
                    lobby.playerScores.set(playerId, currentScore + score);
                    player.score = currentScore + score;
                }
            });
            
            // Reveal results to all players
            const revealedAnswers = Array.from(lobby.roundAnswers.values());
            
            io.to(lobbyCode).emit('revealResults', { 
                answers: revealedAnswers,
                scores: lobby.players.map(p => ({ 
                    id: p.id, 
                    name: p.name, 
                    score: p.score 
                })),
                votingResults: Array.from(lobby.votes)
            });
            
            // Reset voting phase
            lobby.inVotingPhase = false;
            lobby.votes = new Map();
        } else {
            // Update voting progress
            io.to(lobbyCode).emit('votingProgress', {
                submitted: lobby.votes.size,
                total: lobby.players.length
            });
        }
    });

    // Start a new round (only the host can trigger this)
    socket.on('newRound', () => {
        const lobbyCode = socket.lobbyCode;
        const lobby = lobbies.get(lobbyCode);
        
        if (!lobby || !lobby.gameStarted) return;
        if (socket.id !== lobby.hostId) return;
        
        // Instead of directly selecting a random prompt and answer style,
        // we'll start with the prompt selection phase
        startPromptSelectionPhase(lobbyCode);
    });
    
    // Handle prompt selection
    socket.on('selectPrompt', ({ prompt }) => {
        const lobbyCode = socket.lobbyCode;
        if (!lobbyCode) return;
        
        const lobby = lobbies.get(lobbyCode);
        if (!lobby || !lobby.inPromptSelectionPhase) return;
        
        const indices = playerSelectionIndices.get(lobbyCode);
        if (!indices) return;
        
        // Check if this player is the designated prompt selector
        const promptSelector = lobby.players[indices.promptPlayerIndex];
        if (!promptSelector || promptSelector.id !== socket.id) {
            socket.emit('error', { message: 'You are not the prompt selector for this round' });
            return;
        }
        
        // Save the selected prompt
        lobby.currentPrompt = prompt;
        lobby.inPromptSelectionPhase = false;
        
        // Notify all players about the selected prompt
        io.to(lobbyCode).emit('promptSelected', { prompt });
        
        // Start the style selection phase
        startStyleSelectionPhase(lobbyCode);
    });
    
    // Handle style selection
    socket.on('selectStyle', ({ style }) => {
        const lobbyCode = socket.lobbyCode;
        if (!lobbyCode) return;
        
        const lobby = lobbies.get(lobbyCode);
        if (!lobby || !lobby.inStyleSelectionPhase) return;
        
        const indices = playerSelectionIndices.get(lobbyCode);
        if (!indices) return;
        
        // Check if this player is the designated style selector
        const styleSelector = lobby.players[indices.stylePlayerIndex];
        if (!styleSelector || styleSelector.id !== socket.id) {
            socket.emit('error', { message: 'You are not the style selector for this round' });
            return;
        }
        
        // Save the selected style
        lobby.currentAnswerStyle = style;
        lobby.inStyleSelectionPhase = false;
        
        // Notify all players about the selected style
        io.to(lobbyCode).emit('styleSelected', { style });
        
        // Start the answer submission phase with the selected prompt and style
        io.to(lobbyCode).emit('roundSetup', {
            prompt: lobby.currentPrompt,
            answerStyle: lobby.currentAnswerStyle
        });
        
        // Update indices for next round
        updatePlayerSelectionIndices(lobbyCode);
        
        // Reset round state for new answers
        lobby.roundAnswers = new Map();
        lobby.roundComplete = false;
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
        
        // Clear the socket's lobbyCode
        delete socket.lobbyCode;
        
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
    for (let i = 0; i < 4; i++) { // Changed from 6 to 4
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Calculate scores based on voting results
function calculateScores(roundAnswers, votes, players) {
    const scores = new Map();
    
    // Initialize scores
    players.forEach(player => {
        scores.set(player.id, 0);
    });
    
    // Award points for correct guesses
    votes.forEach((playerVotes, voterId) => {
        // Go through each of this player's votes
        playerVotes.forEach(vote => {
            const { answerId, guessedPlayerId } = vote;
            
            // Don't allow voting for your own answer
            if (answerId === voterId) return;
            
            // If the guess is correct, award a point
            const answerData = roundAnswers.get(answerId);
            if (answerData && guessedPlayerId === answerId) {
                const currentScore = scores.get(voterId) || 0;
                scores.set(voterId, currentScore + 1);
                console.log(`Player ${voterId} awarded 1 point for correct guess on ${answerId}'s answer`);
            }
        });
    });
    
    return scores;
}

// Start the prompt selection phase
function startPromptSelectionPhase(lobbyCode) {
    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;
    
    // Select a subset of prompts for the player to choose from
    const promptOptions = getRandomSubset(prompts, 3); // Select 3 random prompts
    lobby.promptOptions = promptOptions;
    lobby.inPromptSelectionPhase = true;
    
    // Get the indices for player selection
    const indices = playerSelectionIndices.get(lobbyCode);
    if (!indices) return;
    
    // Get the player who will select the prompt
    const promptSelector = lobby.players[indices.promptPlayerIndex];
    if (!promptSelector) return;
    
    // Notify all players about the prompt selection phase and who is selecting
    io.to(lobbyCode).emit('startPromptSelection', { 
        prompts: promptOptions, 
        playerId: promptSelector.id 
    });
}

// Start the style selection phase
function startStyleSelectionPhase(lobbyCode) {
    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;
    
    // Select a subset of styles for the player to choose from
    const styleOptions = getRandomSubset(answerStyles, 3); // Select 3 random styles
    lobby.styleOptions = styleOptions;
    lobby.inStyleSelectionPhase = true;
    
    // Get the indices for player selection
    const indices = playerSelectionIndices.get(lobbyCode);
    if (!indices) return;
    
    // Get the player who will select the style
    const styleSelector = lobby.players[indices.stylePlayerIndex];
    if (!styleSelector) return;
    
    // Notify all players about the style selection phase and who is selecting
    io.to(lobbyCode).emit('startStyleSelection', { 
        styles: styleOptions, 
        playerId: styleSelector.id 
    });
}

// Get a random subset of an array
function getRandomSubset(array, size) {
    const shuffled = shuffleArray([...array]); // Make a copy before shuffling
    return shuffled.slice(0, Math.min(size, shuffled.length));
}

// Update player selection indices for next round
function updatePlayerSelectionIndices(lobbyCode) {
    const indices = playerSelectionIndices.get(lobbyCode);
    if (!indices) return;
    
    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;
    
    // Rotate indices for next round
    indices.promptPlayerIndex = (indices.promptPlayerIndex + 1) % lobby.players.length;
    
    // Make sure prompt and style selectors are different players if possible
    if (lobby.players.length > 1) {
        indices.stylePlayerIndex = (indices.promptPlayerIndex + 1) % lobby.players.length;
    } else {
        indices.stylePlayerIndex = 0; // If only one player, they select both
    }
}

// Function to display all available network interfaces for easier debugging
function displayNetworkInterfaces() {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    console.log('\nAvailable Network Interfaces:');
    console.log('-----------------------------');
    
    // Loop through all network interfaces
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        
        // Loop through each interface configuration
        interfaces.forEach((iface) => {
            // Skip internal interfaces and IPv6
            if (!iface.internal && iface.family === 'IPv4') {
                console.log(`Interface: ${interfaceName}`);
                console.log(`IP Address: http://${iface.address}:${PORT}`);
                console.log('-----------------------------');
            }
        });
    }
}

// Get port from environment variable, fallback to 3001
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;

// Detect if we're running in the container environment
const isContainer = process.env.SERVER_PORT === '443' || process.env.CONTAINER_ENV === 'true';
console.log(`Running in ${isContainer ? 'container' : 'local'} environment on port ${PORT}`);

// Initialize directories if they don't exist (important for container environment)
try {
  // In container environment, we need to handle paths differently
  const frontendPath = isContainer 
    ? path.join(__dirname, '../.next/standalone') // Path for standalone Next.js output in container
    : path.join(__dirname, '../out');            // Path for local development output
  
  const publicPath = path.join(__dirname, '../public');
  
  console.log('Using frontend path:', frontendPath);
  console.log('Using public path:', publicPath);
  
  if (!fs.existsSync(frontendPath)) {
    try {
      fs.mkdirSync(frontendPath, { recursive: true });
      console.log('Created output directory:', frontendPath);
    } catch (err) {
      console.warn('Warning: Could not create frontend directory:', err.message);
    }
  }
  
  // Ensure the public directory exists in the standalone output
  const standalonePublicPath = path.join(frontendPath, 'public');
  if (!fs.existsSync(standalonePublicPath) && fs.existsSync(publicPath)) {
    try {
      fs.mkdirSync(standalonePublicPath, { recursive: true });
      console.log('Created standalone public directory:', standalonePublicPath);
      
      // Copy public files to standalone directory
      const publicFiles = fs.readdirSync(publicPath);
      if (publicFiles.length > 0) {
        console.log('Copying public files to standalone directory...');
        publicFiles.forEach(file => {
          const sourcePath = path.join(publicPath, file);
          const destPath = path.join(standalonePublicPath, file);
          try {
            if (fs.statSync(sourcePath).isDirectory()) {
              copyDir(sourcePath, destPath);
            } else {
              fs.copyFileSync(sourcePath, destPath);
            }
          } catch (err) {
            console.warn(`Warning: Could not copy file ${file}:`, err.message);
          }
        });
        console.log('Public files copied successfully');
      }
    } catch (err) {
      console.warn('Warning: Could not set up standalone public directory:', err.message);
    }
  }
  
  // Serve static files with proper error handling
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath, {
      fallthrough: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }));
    console.log('Serving static files from:', frontendPath);
  } else {
    console.warn('Warning: Frontend path does not exist:', frontendPath);
  }
  
  // Serve from public as fallback
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath, { 
      fallthrough: true 
    }));
    console.log('Serving public files from:', publicPath);
  } else {
    console.warn('Warning: Public path does not exist:', publicPath);
  }
  
  // Serve from standalone public as another fallback
  if (fs.existsSync(standalonePublicPath)) {
    app.use(express.static(standalonePublicPath, { 
      fallthrough: true 
    }));
    console.log('Serving standalone public files from:', standalonePublicPath);
  }
  
} catch (err) {
  console.warn('Warning: Error handling static directories:', err.message);
}

// Remove the catch-all route and replace with specific routes
// Handle requests for the lobby page
app.get('/lobby', (req, res) => {
    const lobbyPath = path.join(__dirname, '../out/lobby.html');
    if (fs.existsSync(lobbyPath)) {
        return res.sendFile(lobbyPath);
    } else {
        return res.sendFile(path.join(__dirname, '../out/index.html'));
    }
});

// Default route for the root page
app.get('/', (req, res) => {
    // Check for file in the standalone output directory first
    const standaloneIndexPath = path.join(__dirname, '../.next/standalone/index.html');
    const staticIndexPath = path.join(__dirname, '../out/index.html');
    
    if (fs.existsSync(standaloneIndexPath)) {
        return res.sendFile(standaloneIndexPath);
    } else if (fs.existsSync(staticIndexPath)) {
        return res.sendFile(staticIndexPath);
    } else {
        console.log('Index file not found. Checked paths:', {
            standalone: standaloneIndexPath,
            static: staticIndexPath
        });
        return res.send('Welcome to Masquerade Game!');
    }
});

// 404 route for everything else
app.use((req, res) => {
    const path404 = path.join(__dirname, '../out/404.html');
    if (fs.existsSync(path404)) {
        return res.status(404).sendFile(path404);
    } else {
        return res.status(404).send('Page not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access locally via: http://localhost:${PORT}`);
    displayNetworkInterfaces();
    console.log(`Loaded ${prompts.length} prompts and ${answerStyles.length} answer styles`);
});