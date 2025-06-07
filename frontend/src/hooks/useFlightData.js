// src/hooks/useFlightData.js
import { useState, useEffect } from "react";
import {
  fetchAirports,
  fetchAircraft,
  fetchAirportDestinations,
  generateRoutes,
  rerouteFlightPath,
} from "../services/api";

export function useFlightData() {
  const [airports, setAirports] = useState([]);
  const [destinationAirports, setDestinationAirports] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [error, setError] = useState(null);
  const [sourceAirport, setSourceAirport] = useState(null);
  const [destinationAirport, setDestinationAirport] = useState(null);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationPosition, setSimulationPosition] = useState(0);
  const [isRerouting, setIsRerouting] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [airportsData, aircraftData] = await Promise.all([
          fetchAirports(),
          fetchAircraft(),
        ]);
        setAirports(airportsData);
        setAircraft(aircraftData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch destination airports when source airport changes
  useEffect(() => {
    const fetchDestinations = async () => {
      if (sourceAirport) {
        try {
          setLoadingDestinations(true);
          setDestinationAirport(null); // Reset destination when source changes
          const destinations = await fetchAirportDestinations(
            sourceAirport.iata_code
          );
          setDestinationAirports(destinations);
        } catch (err) {
          setError(`Failed to fetch destinations: ${err.message}`);
        } finally {
          setLoadingDestinations(false);
        }
      } else {
        setDestinationAirports([]);
      }
    };

    fetchDestinations();
  }, [sourceAirport]);

  // Generate routes when source, destination and aircraft are selected
  useEffect(() => {
    if (sourceAirport && destinationAirport && selectedAircraft) {
      generateFlightRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceAirport, destinationAirport, selectedAircraft]);

  const generateFlightRoutes = async () => {
    try {
      setLoading(true);
      const routeData = await generateRoutes({
        origin: sourceAirport.iata_code,
        destination: destinationAirport.iata_code,
        aircraft_model: selectedAircraft.model || "Jet",
        route_types: ["direct", "left", "right", "north", "south", "wide"],
      });

      setRoutes(routeData.all_routes);
      setOptimizedRoute(routeData.optimized_route);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = () => {
    setSimulationActive(true);
  };

  const stopSimulation = () => {
    setSimulationActive(false);
  };

  const blockWaypoint = async (waypointId) => {
    if (!optimizedRoute) return;

    try {
      setIsRerouting(true);

      // Find the waypoint to block
      const waypointToBlock = optimizedRoute.waypoints.find(
        (wp) => wp.id === waypointId
      );
      if (!waypointToBlock) throw new Error("Waypoint not found");

      // Get current position (waypoint before blocked one)
      const currentWaypointIndex =
        optimizedRoute.waypoints.findIndex((wp) => wp.id === waypointId) - 1;
      const currentWaypoint =
        currentWaypointIndex >= 0
          ? optimizedRoute.waypoints[currentWaypointIndex]
          : optimizedRoute.waypoints[0];

      const rerouteResult = await rerouteFlightPath({
        current_route: optimizedRoute,
        blocked_waypoint: waypointToBlock,
        aircraft_model: selectedAircraft.model || "Jet",
        current_position: {
          id: currentWaypoint.id,
          latitude: currentWaypoint.latitude,
          longitude: currentWaypoint.longitude,
        },
        alternative_routes: routes,
      });

      setOptimizedRoute(rerouteResult.rerouted_route);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRerouting(false);
    }
  };

  // Define a custom setter for source airport that also resets destination
  const handleSetSourceAirport = (airport) => {
    setSourceAirport(airport);
    setDestinationAirport(null);
  };

  return {
    airports,
    destinationAirports,
    aircraft,
    loading,
    loadingDestinations,
    error,
    sourceAirport,
    setSourceAirport: handleSetSourceAirport,
    destinationAirport,
    setDestinationAirport,
    selectedAircraft,
    setSelectedAircraft,
    routes,
    optimizedRoute,
    simulationActive,
    simulationPosition,
    setSimulationPosition,
    isRerouting,
    startSimulation,
    stopSimulation,
    blockWaypoint,
    generateFlightRoutes,
  };
}
