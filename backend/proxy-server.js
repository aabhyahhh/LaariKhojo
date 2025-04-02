// proxy-server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;
const TARGET_URL = 'https://laari-khojo-backend.onrender.com';

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Forward all other requests to the target API
app.all('*', async (req, res) => {
  if (req.url === '/health' || req.url === '/favicon.ico') {
    return next();
  }
  
  try {
    const { method, url, headers, body } = req;
    // Remove leading slash and any proxy path
    const targetPath = url.replace(/^\/+/, '').replace(/^proxy\/+/, '');
    
    console.log(`Proxying ${method} request to: ${TARGET_URL}/${targetPath}`);
    
    // Prepare headers (remove host to avoid conflicts)
    const requestHeaders = { ...headers };
    delete requestHeaders.host;
    
    // Make the request to the target API
    const response = await axios({
      method,
      url: `${TARGET_URL}/${targetPath}`,
      headers: requestHeaders,
      data: method !== 'GET' ? body : undefined,
      validateStatus: () => true // Don't throw on non-2xx responses
    });
    
    console.log(`Response from ${targetPath}: ${response.status}`);
    
    // Forward the response back to the client
    res.status(response.status);
    
    // Forward response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
    
    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    res.status(500).json({ error: 'Proxy server error', message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy running at http://localhost:${PORT}`);
  console.log(`Forwarding requests to ${TARGET_URL}`);
});