const socket = io(); //calls io from app.js

if (navigator.geolocation) {
  //checks if geolocation is available in navigator
  navigator.geolocation.watchPosition(
    //watchPosition maps the position of the object
    (position) => {
      const { latitude, longitude } = position.coords; //position coordinates extracted
      socket.emit("send-location", { latitude, longitude }); //sent to backend
    },

    //In case of error
    (error) => {
      console.error(error);
    },

    //Settings
    {
      enableHighAccuracy: true,
      timeout: 5000, //timeout after 5 seconds
      maximumAge: 0, //disables caching (no saved data)
    }
  );
}
//Fetching location from user using Leaflet
const key = "4GHN77k99mMRwg7gwdKs";
const map = L.map("map").setView([23.02161944, 72.57971111], 16);

L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, {
  //style URL
  attribution: "Laari Khojo",
}).addTo(map);

L.circle([23.02161944, 72.57971111], {
  color: "none",
  fillColor: "#F5EAEA",
  fillOpacity: 0,
  radius: 1000000,
}).addTo(map);

//Markers
const markers = {};

// Custom marker icon
const customIcon = L.icon({
  iconUrl: '/public/images/streetfood.svg', // Your custom icon URL
  iconSize: [50, 50], // Adjust as per requirements
});


var yourPoint = L.divIcon({
  className: 'map-marker-yourClassHere',
  iconSize: null,
  iconAnchor:   [17, 35],
  html:'<div class="text-marker">'+ "hellloooo" +'</div>'
});



//receiving location on front-end
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data; //info extracted from data
  map.setView([latitude, longitude]);
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
  L.marker([latitude, longitude], {icon : yourPoint}).addTo(map)

  //pan to user's location
  map.panTo([latitude, longitude]);
});

//when disconnected
socket.on("user-disconnected", (id) => {
  if(markers[id]){
    map.removeLayer(markers[id]);
    delete markers[id];
  }
})
