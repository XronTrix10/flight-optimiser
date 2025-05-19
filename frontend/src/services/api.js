// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = {
  // Airport endpoints
  getAirports: async (countryCode = "IN") => {
    const response = await axios.get(
      `${API_BASE_URL}/api/airports?country_code=${countryCode}`
    );
    return response.data;
  },

  getRoutes: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/airports/routes`);
    return response.data;
  },

  getAirportDetails: async (iataCode) => {
    const response = await axios.get(
      `${API_BASE_URL}/api/airports/${iataCode}`
    );
    return response.data;
  },

  getDestinations: async (iataCode) => {
    const response = await axios.get(
      `${API_BASE_URL}/api/airports/${iataCode}/destinations`
    );
    return response.data;
  },

  // Aircraft endpoints
  getAircraftModels: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/aircraft`);
    return response.data;
  },

  getAircraftDetails: async (model) => {
    const response = await axios.get(`${API_BASE_URL}/api/aircraft/${model}`);
    return response.data;
  },

  // Route endpoints
  generateRoutes: async (params) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/routes/generate`,
      params
    );
    return response.data;
  },

  blockWaypoint: async (routeId, waypointId) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/routes/block-waypoint`,
      {
        route_id: routeId,
        waypoint_id: waypointId,
      }
    );
    return response.data;
  },

  // Optimization endpoints
  compareOptimization: async (routes) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/optimize/compare`,
      routes
    );
    return response.data;
  },
};

export default api;
