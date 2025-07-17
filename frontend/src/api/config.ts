// Use the proxy server in development, direct API in production
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://laarikhojo.onrender.com' ||
  'https://laarikhojo-dev.onrender.com' ||
  'http://localhost:3000';

export { API_URL };