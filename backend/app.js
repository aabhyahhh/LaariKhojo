require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");

console.log("1");
const authRoutes = require("./routes/authRoute");

const allowedOrigin = ["http://localhost:5173"];

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
app.use(express.json()); // <-- Important: This enables JSON body parsing
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: allowedOrigin, // Replace with the actual origin or use an array of allowed origins
    credentials: true, // This will enable `Access-Control-Allow-Credentials`
  })
);
const server = http.createServer(app);

// Apply conditional JSON parsing middleware
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

console.log("9");


// MongoDB Connection
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb+srv://abhayacibos:jtBZ0FOsJQL3bJKI@cluster0.dztbn64.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
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

console.log("10");


app.use("/api", authRoutes);

console.log("11");


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

console.log("12");


// Add this endpoint to your Express server
app.get("/api/vendors", async (req, res) => {
  try {
    const vendors = await VendorModel.find({});
    res.json({ data: vendors });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

console.log("13");


app.get("/", (req, res) => {
  res.send("Hello from Express on Render!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


module.exports = app;