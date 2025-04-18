const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const lobbies = {};

function generateLobbyCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-lobby", (name, callback) => {
    const code = generateLobbyCode();
    lobbies[code] = {
      host: socket.id,
      players: {},
      state: "waiting",
    };
    lobbies[code].players[socket.id] = name;
    socket.join(code);
    callback({ lobbyCode: code, players: lobbies[code].players });
    io.to(code).emit("player-list", lobbies[code].players);
  });

  socket.on("join-lobby", (code, name, callback) => {
    if (lobbies[code]) {
      lobbies[code].players[socket.id] = name;
      socket.join(code);
      callback({ success: true, players: lobbies[code].players });
      io.to(code).emit("player-list", lobbies[code].players);
    } else {
      callback({ success: false, error: "Lobby not found" });
    }
  });

  socket.on("start-game", (code) => {
    if (lobbies[code]) {
      lobbies[code].state = "prompting";
      io.to(code).emit("game-started");
    }
  });

  socket.on("spin-wheel", (code) => {
    const chosen = prompts[Math.floor(Math.random() * prompts.length)];
    io.to(code).emit("prompt-chosen", chosen); // send both prompt and type
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let code in lobbies) {
      if (lobbies[code].players[socket.id]) {
        delete lobbies[code].players[socket.id];
        io.to(code).emit("player-list", lobbies[code].players);
        if (Object.keys(lobbies[code].players).length === 0) {
          delete lobbies[code];
        }
      }
    }
  });
});

http.listen(PORT, () => {
  console.log("Server listening on", PORT);
});

const prompts = [
  { text: "Describe your ideal vacation using only emojis.", type: "emoji" },
  {
    text: "Invent a new superpower and describe it in caveman speak.",
    type: "caveman",
  },
  { text: "Write a limerick about losing your keys.", type: "limerick" },
  { text: "Sum up your last meal in one word.", type: "one-word" },
  // add as many as you want
];
