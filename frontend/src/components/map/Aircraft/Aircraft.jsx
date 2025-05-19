// src/components/map/Aircraft/Aircraft.jsx
import React from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "./Aircraft.css";

// Aircraft icon with rotation capability
const createAircraftIcon = (rotation = 0) => {
  return L.divIcon({
    html: `
      <div class="aircraft-icon" style="transform: rotate(${rotation}deg)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="#1a237e" d="M22,16v-2l-8.5-5V3.5C13.5,2.67,12.83,2,12,2s-1.5,0.67-1.5,1.5V9L2,14v2l8.5-2.5V19L8,20.5L8,22l4-1l4,1l0-1.5L13.5,19 v-5.5L22,16z"/>
        </svg>
      </div>
    `,
    className: "aircraft-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const AircraftMarker = ({ position, rotation }) => {
  // Don't render if no position is available
  if (!position) return null;

  const aircraftIcon = createAircraftIcon(rotation);

  return (
    <Marker position={position} icon={aircraftIcon}>
      <Tooltip permanent direction="right" offset={[15, 0]}>
        Aircraft Position
      </Tooltip>
    </Marker>
  );
};

export default AircraftMarker;
