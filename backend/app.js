require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const compression = require("compression"); // Add compression middleware
const MONGO_URI = process.env.MONGO_URI;
const axios = require('axios'); // ✅ Add this at the top
const User = require('./models/userModel');

const authRoutes = require("./routes/authRoute");
const webhookRoutes = require("./routes/webhookRoute");
const reviewRoutes = require("./routes/reviewRoute");
const publicVendorImageRoutes = require('./routes/publicVendorImageRoute');

const allowedOrigins = [
  "https://laarikhojo.in",  // Without trailing slash
  "http://localhost:3000",  // For local development
  "https://www.laarikhojo.in",    // ✅ ADD THIS LINE
  "http://localhost:5173",
  "http://localhost:5174",  // Add this line
  // For Vite's default port
  // Add any other origins you need
];
const app = express();

const PORT = process.env.PORT || 3000;

// Add compression middleware to reduce response size
app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => (typeof o === 'string' && o === origin) || (o instanceof RegExp && o.test(origin)))) {
      callback(null, true);
    } else {
      console.log("Blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI, {
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

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/public/vendor-images', express.static(path.join(__dirname, 'public/vendor-images')));

app.use("/api", authRoutes);
app.use("/api", webhookRoutes);
app.use("/api", reviewRoutes);
app.use('/api/public', publicVendorImageRoutes);

const adminRoutes = require("./routes/adminRoute");
app.use("/api/admin", adminRoutes);

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
    // Add pagination and limit to reduce response size
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Reduced from 100 to 50
    const skip = (page - 1) * limit;
    
    // Only fetch essential fields to reduce response size
    const vendors = await User.find({})
      .select('name email contactNumber mapsLink operatingHours foodType profilePicture bestDishes latitude longitude updatedAt')
      .limit(limit)
      .skip(skip)
      .sort({ updatedAt: -1 });
    
    // Get total count for pagination info
    const total = await User.countDocuments({});
    
    res.json({ 
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

app.get('/', (req, res) => {
  res.status(200).send('Backend is live');
});


module.exports = app;