import React, { useState } from "react";
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
import { Box, Typography, IconButton, Tooltip, Paper } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";

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

// Custom icons for airports and waypoints
const airportIcon = L.divIcon({
  html: '<div style="background-color: #3f51b5; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  className: "airport-marker",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const waypointIcon = L.divIcon({
  html: '<div style="background-color: #ff9800; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
  className: "waypoint-marker",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const blockedWaypointIcon = L.divIcon({
  html: '<div style="background-color: #f44336; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
  className: "blocked-waypoint-marker",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Component to update map view when props change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

const RouteMap = ({
  origin,
  destination,
  optimizedRoute,
  allRoutes,
  blockedWaypoints,
  onBlockWaypoint,
}) => {
  const [center, setCenter] = useState([20.5937, 78.9629]); // Default center of India
  const [zoom, setZoom] = useState(5);

  // Update map center when origin and destination change
  React.useEffect(() => {
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

  // Render routes on the map
  const renderRoutes = () => {
    if (!allRoutes || allRoutes.length === 0) return null;

    return allRoutes.map((route, index) => {
      // Create a path from origin through waypoints to destination
      const path = [
        [route.origin.latitude, route.origin.longitude],
        ...route.waypoints.map((wp) => [wp.latitude, wp.longitude]),
        [route.destination.latitude, route.destination.longitude],
      ];

      const isOptimized = optimizedRoute && route.id === optimizedRoute.id;

      return (
        <Polyline
          key={`route-${index}`}
          positions={path}
          color={isOptimized ? "#1a237e" : "#757575"}
          weight={isOptimized ? 4 : 2}
          opacity={isOptimized ? 1 : 0.5}
        />
      );
    });
  };

  // Render waypoints for the optimized route
  const renderWaypoints = () => {
    if (!optimizedRoute) return null;

    return optimizedRoute.waypoints.map((waypoint) => {
      const isBlocked = blockedWaypoints.includes(waypoint.id);

      return (
        <Marker
          key={waypoint.id}
          position={[waypoint.latitude, waypoint.longitude]}
          icon={isBlocked ? blockedWaypointIcon : waypointIcon}
        >
          <Popup>
            <Typography variant="subtitle2">{waypoint.name}</Typography>
            <Typography variant="body2">Order: {waypoint.order}</Typography>
            {!isBlocked && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onBlockWaypoint(waypoint.id)}
                title="Block this waypoint"
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            )}
          </Popup>
        </Marker>
      );
    });
  };

  return (
    <Box sx={{ height: 600, width: "100%", position: "relative" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={center} zoom={zoom} />

        {origin && (
          <Marker
            position={[origin.latitude, origin.longitude]}
            icon={airportIcon}
          >
            <Popup>
              <Typography variant="subtitle1">{origin.name}</Typography>
              <Typography variant="body2">
                {origin.city}, {origin.country}
              </Typography>
              <Typography variant="body2">IATA: {origin.iata_code}</Typography>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={[destination.latitude, destination.longitude]}
            icon={airportIcon}
          >
            <Popup>
              <Typography variant="subtitle1">{destination.name}</Typography>
              <Typography variant="body2">
                {destination.city}, {destination.country}
              </Typography>
              <Typography variant="body2">
                IATA: {destination.iata_code}
              </Typography>
            </Popup>
          </Marker>
        )}

        {renderRoutes()}
        {renderWaypoints()}
      </MapContainer>

      {optimizedRoute && (
        <Paper
          elevation={3}
          sx={{
            position: "absolute",
            bottom: 10,
            right: 10,
            p: 1,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            maxWidth: 300,
          }}
        >
          <Typography variant="subtitle2">
            Optimized Route: {optimizedRoute.name}
          </Typography>
          <Typography variant="body2">
            Distance: {optimizedRoute.distance_km.toFixed(1)} km
          </Typography>
          {/* <Typography variant="body2">
            Duration: {optimizedRoute.estimated_duration_minutes.toFixed(0)}{" "}
            mins
          </Typography> */}
          <Typography variant="body2">
            Method: {optimizedRoute.optimization_method}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default RouteMap;
