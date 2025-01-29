require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "https://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Apply conditional JSON parsing middleware
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/user-roles-perm", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Socket.IO Configuration
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Receive location from clients
  socket.on("send-location", (data) => {
    io.emit("receive-location", { id: socket.id, ...data });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id);
  });
});

// Start the server
const port = process.env.SERVER_PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on Port: ${port}`);
});
