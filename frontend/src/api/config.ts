// Use the proxy server in development, direct API in production
const API_URL = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://laari-khojo-backend.onrender.com';

export { API_URL };