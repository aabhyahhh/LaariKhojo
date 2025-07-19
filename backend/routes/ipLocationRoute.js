const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// List of public IP geolocation APIs (rotate for reliability)
const services = [
  'https://ipapi.co/json/',
  'https://ipinfo.io/json',
  'https://api.ipgeolocation.io/ipgeo?apiKey=free',
  'https://extreme-ip-lookup.com/json/'
];

router.get('/ip-location', async (req, res) => {
  for (const service of services) {
    try {
      const response = await fetch(service, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LaariKhojo/1.0'
        },
        timeout: 4000
      });
      if (!response.ok) continue;
      const data = await response.json();
      // Normalize response
      let lat, lng;
      if (data.latitude && data.longitude) {
        lat = parseFloat(data.latitude);
        lng = parseFloat(data.longitude);
      } else if (data.loc) {
        const [latStr, lngStr] = data.loc.split(',');
        lat = parseFloat(latStr);
        lng = parseFloat(lngStr);
      } else if (data.lat && data.lon) {
        lat = parseFloat(data.lat);
        lng = parseFloat(data.lon);
      }
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return res.json({ latitude: lat, longitude: lng, source: service });
      }
    } catch (err) {
      continue;
    }
  }
  res.status(500).json({ error: 'All IP location services failed' });
});

module.exports = router; 