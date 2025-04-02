require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const MONGOURI = process.env.MONGOURI;

const authRoutes = require("./routes/authRoute");

const allowedOrigins = [
  "https://laarikhojo.in",  // Without trailing slash
  "https://laarikhojo.in/", // With trailing slash
  "http://localhost:3000",  // For local development
  "http://localhost:5173",
  "http://localhost:5174",  // Add this line
  // For Vite's default port
  // Add any other origins you need
];
const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
const server = http.createServer(app);

app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() =>{
  console.log("App connected to database");
  app.listen(PORT, ()=>{
    console.log(`App listening to: ${PORT}`);
  });
}).catch((error)=>{
  console.log(error)
});

// Add error handler
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});



app.use("/api", authRoutes);



app.get("/api/expand-url", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const response = await axios.head(url, { maxRedirects: 5 });
    res.json({ expandedUrl: response.request.res.responseUrl });
  } catch (error) {
    console.error("Error expanding URL:", error);
    res.status(500).json({ error: "Failed to expand URL" });
  }
});


app.get("/api/all-users", async (req, res) => {
  try {
    const vendors = await VendorModel.find({});
    res.json({ data: vendors });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});


app.get("/", (req, res) => {
  res.send("Hello from Express on Render!");
});

module.exports = app;