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
const ipLocationRoute = require('./routes/ipLocationRoute');

const allowedOrigins = [
  "https://laarikhojo.in",
  "https://www.laarikhojo.in",
  "https://laarikhojo.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174"
];
const app = express();

const PORT = process.env.PORT || 3000;

// Add compression middleware to reduce response size
app.use(compression({
  level: 9, // Maximum compression
  threshold: 1024, // Compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Allow non-browser requests (like curl, Postman)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"]
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
app.use('/api', ipLocationRoute);

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
    const limit = parseInt(req.query.limit) || 30; // Further reduced to 30
    const skip = (page - 1) * limit;
    
    // Only fetch minimal essential fields to reduce response size
    const vendors = await User.find({})
      .select('name contactNumber mapsLink operatingHours foodType latitude longitude')
      .limit(limit)
      .skip(skip)
      .sort({ updatedAt: -1 });
    
    // Get total count for pagination info
    const total = await User.countDocuments({});
    
    // Transform data to reduce response size
    const transformedVendors = vendors.map(vendor => ({
      id: vendor._id,
      n: vendor.name, // Shortened field names
      c: vendor.contactNumber,
      m: vendor.mapsLink,
      o: vendor.operatingHours,
      f: vendor.foodType,
      lat: vendor.latitude,
      lng: vendor.longitude
    }));
    
    // Set cache headers to reduce repeated requests
    res.set({
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      'ETag': `vendors-${page}-${limit}-${total}`,
      'Content-Type': 'application/json'
    });
    
    res.json({ 
      success: true,
      data: transformedVendors,
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