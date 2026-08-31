const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const banpickOrder = require("./banpickOrder");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let state = {
  step: 0,
  actions: []
};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("init", { state, order: banpickOrder });

  socket.on("banpick", (data) => {
    if (state.step < banpickOrder.length) {
      state.actions.push({ step: banpickOrder[state.step], champion: data.champion });
      state.step++;
      io.emit("update", state);
    }
  });

  socket.on("reset", () => {
    state = { step: 0, actions: [] };
    io.emit("update", state);
  });
});

server.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
