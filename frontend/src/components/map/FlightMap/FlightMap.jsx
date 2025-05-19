// src/components/map/FlightMap/FlightMap.jsx
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AircraftMarker from "../Aircraft/Aircraft";
import BlockableWaypoint from "../Waypoint/BlockableWaypoint";
import "./FlightMap.css";

// Fix for Leaflet marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom airport icon
const airportIcon = L.divIcon({
  html: '<div style="background-color: #3f51b5; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  className: "airport-marker",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to update map view when props change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

const FlightMap = ({
  origin,
  destination,
  route,
  allRoutes = [],
  blockedWaypoint,
  onWaypointBlocked,
  onMapReady,
  isSimulating = false,
  currentPosition = null,
}) => {
  const [center, setCenter] = useState([20.5937, 78.9629]); // Default center (India)
  const [zoom, setZoom] = useState(5);
  const [mapRef, setMapRef] = useState(null);

  // Update map center when origin and destination change
  useEffect(() => {
    if (origin && destination) {
      // Calculate midpoint between origin and destination
      const midLat = (origin.latitude + destination.latitude) / 2;
      const midLng = (origin.longitude + destination.longitude) / 2;
      setCenter([midLat, midLng]);

      // Calculate appropriate zoom level based on distance
      const R = 6371; // Earth's radius in km
      const dLat =
        (Math.abs(origin.latitude - destination.latitude) * Math.PI) / 180;
      const dLon =
        (Math.abs(origin.longitude - destination.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origin.latitude * Math.PI) / 180) *
          Math.cos((destination.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Adjust zoom based on distance
      if (distance > 1000) setZoom(5);
      else if (distance > 500) setZoom(6);
      else if (distance > 200) setZoom(7);
      else setZoom(8);
    }
  }, [origin, destination]);

  // Pass map reference to parent component
  useEffect(() => {
    if (mapRef && onMapReady) {
      onMapReady(mapRef);
    }
  }, [mapRef, onMapReady]);

  // Calculate aircraft rotation based on current and next waypoint
  const calculateRotation = (currentPos, nextWaypoint) => {
    if (!currentPos || !nextWaypoint) return 0;

    const [lat1, lng1] = currentPos;
    const lat2 = nextWaypoint.latitude;
    const lng2 = nextWaypoint.longitude;

    // Calculate bearing
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    const bearing = Math.atan2(y, x) * (180 / Math.PI);

    return (bearing + 360) % 360;
  };

  // Render all alternative routes
  const renderAllRoutes = () => {
    if (!allRoutes || allRoutes.length === 0) return null;

    return allRoutes.map((r, index) => {
      if (!r || !r.waypoints) return null;

      // Create a path from origin through waypoints to destination
      const path = [
        [r.origin.latitude, r.origin.longitude],
        ...r.waypoints.map((wp) => [wp.latitude, wp.longitude]),
        [r.destination.latitude, r.destination.longitude],
      ];

      const isCurrentRoute = route && r.id === route.id;

      return (
        <Polyline
          key={`route-${index}-${r.id}`}
          positions={path}
          pathOptions={{
            color: isCurrentRoute ? "#1a237e" : "#9e9e9e",
            weight: isCurrentRoute ? 4 : 2,
            opacity: isCurrentRoute ? 1 : 0.5,
            dashArray: isCurrentRoute ? null : "5, 5",
          }}
        />
      );
    });
  };

  // Render waypoints for the current route
  const renderWaypoints = () => {
    if (!route || !route.waypoints || route.waypoints.length === 0) return null;

    return route.waypoints.map((waypoint, index) => {
      // Calculate waypoint status
      const isBlocked = blockedWaypoint === waypoint.id;

      // If simulating, determine if waypoint is passed or upcoming
      let isPassed = false;
      let isUpcoming = false;

      if (isSimulating && currentPosition && route) {
        // Find current waypoint index based on simulation progress
        const waypointIndex = route.waypoints.findIndex(
          (wp) => wp.id === waypoint.id
        );
        const currentWaypointIndex = determineCurrentWaypointIndex(
          route,
          currentPosition
        );

        isPassed = waypointIndex < currentWaypointIndex;
        isUpcoming = waypointIndex > currentWaypointIndex;
      }

      return (
        <BlockableWaypoint
          key={waypoint.id + index}
          waypoint={waypoint}
          isBlocked={isBlocked}
          isPassed={isPassed}
          isUpcoming={isUpcoming}
          onBlock={onWaypointBlocked}
        />
      );
    });
  };

  // Helper function to determine current waypoint index during simulation
  const determineCurrentWaypointIndex = (route, position) => {
    if (!route || !position) return 0;

    // Create a path of all points including origin and destination
    const allPoints = [
      { latitude: route.origin.latitude, longitude: route.origin.longitude },
      ...route.waypoints,
      {
        latitude: route.destination.latitude,
        longitude: route.destination.longitude,
      },
    ];

    // Find the closest waypoint to current position
    let minDistance = Infinity;
    let closestIndex = 0;

    allPoints.forEach((point, index) => {
      const distance = calculateDistance(
        position[0],
        position[1],
        point.latitude,
        point.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    // Adjust to get the index in the original waypoints array
    return closestIndex - 1 >= 0 ? closestIndex - 1 : 0;
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find the next waypoint for aircraft rotation
  const getNextWaypoint = () => {
    if (!route || !route.waypoints || !currentPosition) return null;

    const currentWaypointIndex = determineCurrentWaypointIndex(
      route,
      currentPosition
    );
    return (
      route.waypoints[currentWaypointIndex + 1] || {
        latitude: route.destination.latitude,
        longitude: route.destination.longitude,
      }
    );
  };

  return (
    <div className="flight-map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        className="flight-map"
        whenCreated={setMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={center} zoom={zoom} />

        {/* Render origin airport */}
        {origin && (
          <Marker
            position={[origin.latitude, origin.longitude]}
            icon={airportIcon}
          >
            <Popup>
              <div>
                <h4>{origin.name}</h4>
                <p>IATA: {origin.iata_code}</p>
                <p>
                  {origin.city}, {origin.country}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render destination airport */}
        {destination && (
          <Marker
            position={[destination.latitude, destination.longitude]}
            icon={airportIcon}
          >
            <Popup>
              <div>
                <h4>{destination.name}</h4>
                <p>IATA: {destination.iata_code}</p>
                <p>
                  {destination.city}, {destination.country}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render all routes */}
        {renderAllRoutes()}

        {/* Render waypoints */}
        {renderWaypoints()}

        {/* Render aircraft position during simulation */}
        {isSimulating && currentPosition && (
          <AircraftMarker
            position={currentPosition}
            rotation={calculateRotation(currentPosition, getNextWaypoint())}
          />
        )}
      </MapContainer>

      {/* Route information overlay */}
      {route && (
        <div className="route-info-overlay">
          <h4>{route.name}</h4>
          <p>Distance: {route.distance_km.toFixed(1)} km</p>
          {/* <p>Est. Time: {route.estimated_duration_minutes.toFixed(0)} min</p> */}
        </div>
      )}
    </div>
  );
};

export default FlightMap;
