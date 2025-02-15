import { useEffect } from "react";
import L from "leaflet";

const MapComponent: React.FC = () => {
  useEffect(() => {
    const map = L.map("map").setView([23.033863, 72.585022], 16);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "Laari Khojo",
    }).addTo(map);

    const marker = L.marker([23.033863, 72.585022]).addTo(map);
    
    marker.bindPopup(
      `<b>Laari Name</b><br>Phone: <a href="tel:">Call</a><br>
       <a href=" " target="_blank">Google Maps</a>`
    );
  }, []);

  return <div id="map" style={{ height: "500px", width: "100%" }}></div>;
};

export default Map;