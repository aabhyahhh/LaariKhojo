require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");

const authRoutes = require("./routes/authRoute");

const allowedOrigin = ["http://localhost:5173"];

const app = express();
app.use(express.json()); // <-- Important: This enables JSON body parsing
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: allowedOrigin, // Replace with the actual origin or use an array of allowed origins
    credentials: true, // This will enable `Access-Control-Allow-Credentials`
  })
);
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "https://localhost:5173",
    methods: ["GET", "POST"],
  },
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
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/user-roles-perm",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Add error handler
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

app.use("/api", authRoutes);

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
