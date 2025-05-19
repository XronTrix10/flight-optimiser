// src/services/api/routes.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const generateRoutes = async (origin, destination, aircraftModel) => {
  const response = await axios.post(`${API_BASE_URL}/api/routes/generate`, {
    origin,
    destination,
    aircraft_model: aircraftModel,
  });
  return response.data;
};

export const optimizeRoute = async (routeId, method = "aco") => {
  const response = await axios.post(`${API_BASE_URL}/api/routes/optimize`, {
    route_id: routeId,
    method,
  });
  return response.data;
};

export const blockWaypointAndReroute = async (
  routeId,
  waypointId,
  currentPosition
) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/routes/block-waypoint`,
    {
      route_id: routeId,
      waypoint_id: waypointId,
      current_position: currentPosition,
    }
  );
  return response.data;
};
