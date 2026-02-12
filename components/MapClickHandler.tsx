
// FIX: Import React to resolve the "Cannot find namespace 'React'" error.
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void;
}

export const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};