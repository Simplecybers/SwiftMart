import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type TrackingLog } from "@shared/schema";
import L from "leaflet";
import { useMemo } from "react";

// Fix Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Mock coordinates for demonstration since we don't have a real geocoding service
// In a real app, 'location' string would be geocoded to lat/lng
const getCoords = (location: string): [number, number] => {
  // Hash the string to get stable pseudo-random coordinates around US
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = 30 + (hash % 15);
  const lng = -120 + (hash % 40);
  return [lat, lng];
};

interface MapProps {
  logs: TrackingLog[];
  className?: string;
}

export default function Map({ logs, className }: MapProps) {
  const points = useMemo(() => {
    return logs.map(log => ({
      ...log,
      coords: getCoords(log.location)
    }));
  }, [logs]);

  if (logs.length === 0) return null;

  const center = points[points.length - 1].coords;

  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={5} 
        scrollWheelZoom={false}
        className="w-full h-full rounded-xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {points.map((point, idx) => (
          <Marker key={point.id} position={point.coords}>
            <Popup>
              <div className="text-sm font-semibold">{point.status}</div>
              <div className="text-xs text-muted-foreground">{point.location}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(point.timestamp!).toLocaleString()}
              </div>
            </Popup>
          </Marker>
        ))}

        <Polyline 
          positions={points.map(p => p.coords)} 
          color="#fb7701" 
          weight={4}
          opacity={0.8}
        />
      </MapContainer>
    </div>
  );
}
