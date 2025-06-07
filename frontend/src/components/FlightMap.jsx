// src/components/FlightMap.jsx
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-rotatedmarker"; 

// Fix for default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom plane icon
const planeIcon = new L.Icon({
  iconUrl: "/plane.png", // Add this icon to your public folder
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component to handle map bounds
function SetBoundsAndZoom({ source, destination }) {
  const map = useMap();

  useEffect(() => {
    if (source && destination) {
      const bounds = L.latLngBounds(
        [source.latitude, source.longitude],
        [destination.latitude, destination.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, source, destination]);

  return null;
}

// Component to animate plane movement
function PlaneMarker({ route, position, simulationActive }) {
  const map = useMap();
  const markerRef = useRef(null);
  
  useEffect(() => {
    if (!route || !simulationActive || position === undefined) return;
    
    // Get the current waypoint position
    const waypoints = route.waypoints;
    
    // Get the integer and fractional parts of the position
    const currentIndex = Math.floor(position);
    const progress = position - currentIndex;
    
    // If we're at the last waypoint, just use its position
    if (currentIndex >= waypoints.length - 1) {
      const lastWaypoint = waypoints[waypoints.length - 1];
      if (markerRef.current) {
        markerRef.current.setLatLng([lastWaypoint.latitude, lastWaypoint.longitude]);
      }
      return;
    }
    
    // Get current and next waypoints
    const currentWp = waypoints[currentIndex];
    const nextWp = waypoints[currentIndex + 1];
    
    // Interpolate between waypoints
    const lat = currentWp.latitude + (nextWp.latitude - currentWp.latitude) * progress;
    const lng = currentWp.longitude + (nextWp.longitude - currentWp.longitude) * progress;
    
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      
      // Calculate bearing for plane rotation
      const bearing = calculateBearing(
        currentWp.latitude, 
        currentWp.longitude,
        nextWp.latitude,
        nextWp.longitude
      );
      
      // This will work after we add the leaflet-rotatedmarker plugin
      markerRef.current.setRotationAngle(bearing);
    }
  }, [route, position, simulationActive, map]);

  if (!route || !simulationActive) return null;
  
  // Start at the first waypoint
  const initialWaypoint = route.waypoints[0];
  
  return (
    <Marker 
      position={[initialWaypoint.latitude, initialWaypoint.longitude]}
      icon={planeIcon}
      rotationAngle={0}
      rotationOrigin="center"
      ref={markerRef}
    />
  );
}

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return bearing;
}

export default function FlightMap({
  sourceAirport,
  destinationAirport,
  optimizedRoute,
  simulationActive,
  simulationPosition,
  onWaypointClick,
}) {
  if (!sourceAirport || !destinationAirport) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">
          Select source and destination airports to view map
        </p>
      </div>
    );
  }

  // Prepare direct route for display
  const directRoute = optimizedRoute
    ? optimizedRoute.waypoints.map((wp) => [wp.latitude, wp.longitude])
    : [];

  // Get waypoints from the optimized route
  const waypoints = optimizedRoute?.waypoints || [];

  return (
    <MapContainer
      center={[20.5937, 78.9629]} // Center of India
      zoom={5}
      style={{ height: "500px", width: "100%" }}
      className="rounded-lg shadow-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sourceAirport && (
        <Marker position={[sourceAirport.latitude, sourceAirport.longitude]}>
          <Popup>
            <strong>{sourceAirport.name}</strong>
            <br />
            {sourceAirport.city}, {sourceAirport.country}
          </Popup>
        </Marker>
      )}

      {destinationAirport && (
        <Marker
          position={[destinationAirport.latitude, destinationAirport.longitude]}
        >
          <Popup>
            <strong>{destinationAirport.name}</strong>
            <br />
            {destinationAirport.city}, {destinationAirport.country}
          </Popup>
        </Marker>
      )}

      {/* Direct line between airports */}
      {sourceAirport && destinationAirport && (
        <Polyline
          positions={[
            [sourceAirport.latitude, sourceAirport.longitude],
            [destinationAirport.latitude, destinationAirport.longitude],
          ]}
          color="gray"
          dashArray="5, 5"
          weight={2}
        />
      )}

      {/* Optimized route */}
      {directRoute.length > 0 && (
        <Polyline positions={directRoute} color="blue" weight={3} />
      )}

      {/* Waypoint markers */}
      {waypoints.map((waypoint, index) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.latitude, waypoint.longitude]}
          eventHandlers={{
            click: () => onWaypointClick(waypoint.id),
          }}
        >
          <Popup>
            <strong>
              Waypoint {index + 1}: {waypoint.name}
            </strong>
            <br />
            Latitude: {waypoint.latitude.toFixed(4)}
            <br />
            Longitude: {waypoint.longitude.toFixed(4)}
          </Popup>
        </Marker>
      ))}

      {/* Plane marker for simulation */}
      <PlaneMarker
        route={optimizedRoute}
        position={simulationPosition}
        simulationActive={simulationActive}
      />

      <SetBoundsAndZoom
        source={sourceAirport}
        destination={destinationAirport}
      />
    </MapContainer>
  );
}
