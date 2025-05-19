// src/components/map/Waypoint/BlockableWaypoint.jsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './BlockableWaypoint.css';

// Define the icons for different waypoint states
const defaultWaypointIcon = L.divIcon({
  html: '<div style="background-color: #2196f3; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
  className: 'waypoint-marker',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const blockedWaypointIcon = L.divIcon({
  html: '<div style="background-color: #f44336; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
  className: 'blocked-waypoint-marker',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const passedWaypointIcon = L.divIcon({
  html: '<div style="background-color: #4caf50; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
  className: 'passed-waypoint-marker',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const upcomingWaypointIcon = L.divIcon({
  html: '<div style="background-color: #ff9800; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
  className: 'upcoming-waypoint-marker',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const BlockableWaypoint = ({
  waypoint,
  isBlocked,
  isPassed,
  isUpcoming,
  onBlock,
}) => {
  // Determine marker icon based on waypoint status
  const getWaypointIcon = () => {
    if (isBlocked) return blockedWaypointIcon;
    if (isPassed) return passedWaypointIcon;
    if (isUpcoming) return upcomingWaypointIcon;
    return defaultWaypointIcon;
  };
  
  // Get text representation of waypoint status
  const getStatusText = () => {
    if (isBlocked) return "Blocked";
    if (isPassed) return "Passed";
    if (isUpcoming) return "Upcoming";
    return "Default";
  };

  return (
    <Marker
      position={[waypoint.latitude, waypoint.longitude]}
      icon={getWaypointIcon()}
    >
      <Popup>
        <div className="waypoint-popup">
          <h4>{waypoint.name}</h4>
          <p>Order: {waypoint.order}</p>
          <p>Status: {getStatusText()}</p>

          {isUpcoming && !isBlocked && (
            <button 
              className="block-button"
              onClick={() => onBlock(waypoint.id)}
            >
              Block Waypoint
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default BlockableWaypoint;
