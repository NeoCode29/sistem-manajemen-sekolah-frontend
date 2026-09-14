import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Perbaikan untuk ikon marker bawaan Leaflet di React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  position: [number, number] | null;
  radius: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationMarker = ({ position, onLocationSelect }: { position: [number, number] | null, onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

// Komponen helper untuk mengupdate center map ketika position berubah
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMapEvents({});
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ position, radius, onLocationSelect }) => {
  // Default ke Monas, Jakarta jika position belum diset
  const defaultCenter: [number, number] = [-6.175110, 106.827153];
  const center = position || defaultCenter;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative" style={{ zIndex: 0 }}>
      <MapContainer 
        center={center} 
        zoom={position ? 16 : 12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <MapUpdater center={center} />}
        <LocationMarker position={position} onLocationSelect={onLocationSelect} />
        {position && radius && radius > 0 && (
          <Circle 
            center={position} 
            radius={radius}
            pathOptions={{ fillColor: '#8b5cf6', color: '#6d28d9', weight: 2, fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>
    </div>
  );
};
