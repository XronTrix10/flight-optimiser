// src/App.js
import React, { useState } from "react";
import { Box, Container, CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import AppHeader from "./components/common/AppHeader/AppHeader";
import AirportSelection from "./components/airport/AirportSelection/AirportSelection";
import FlightMap from "./components/map/FlightMap/FlightMap";
import RouteDetails from "./components/route/RouteDetails/RouteDetails";
import RouteOptimizer from "./components/route/RouteOptimizer/RouteOptimizer";
import FlightSimulation from "./components/simulation/FlightSimulation/FlightSimulation";
import RouteRerouting from "./components/route/RouteRerouting/RouteRerouting";
import "./styles/App.css";

import { generateRoutes } from "@/services/api/routes";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1a237e",
    },
    secondary: {
      main: "#ff9800",
    },
  },
});

function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [blockedWaypoint, setBlockedWaypoint] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);

  const handleGenerateRoutes = async (
    originAirport,
    destinationAirport,
    aircraftModel
  ) => {
    try {
      const data = await generateRoutes(
        originAirport.iata_code,
        destinationAirport.iata_code,
        aircraftModel
      );

      setRoutes(data.all_routes);
      setSelectedRoute(data.optimized_route);
      setBlockedWaypoint(null);
    } catch (error) {
      console.error("Error generating routes:", error);
    }
  };

  const handleRouteOptimized = (optimizedRoute) => {
    setSelectedRoute(optimizedRoute);
  };

  const handleWaypointBlocked = (waypointId) => {
    setBlockedWaypoint(waypointId);
  };

  const handleRerouteSuccess = (newRoute) => {
    setSelectedRoute(newRoute);
    setBlockedWaypoint(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <AppHeader />

        <Container maxWidth="lg" className="main-container">
          <Box className="content-wrapper">
            <aside className="sidebar">
              <AirportSelection
                onSelectionComplete={handleGenerateRoutes}
                setOrigin={setOrigin}
                setDestination={setDestination}
              />

              {selectedRoute && (
                <>
                  <RouteOptimizer
                    route={selectedRoute}
                    onRouteOptimized={handleRouteOptimized}
                  />

                  {isSimulating && (
                    <FlightSimulation
                      route={selectedRoute}
                      map={mapRef}
                      onPositionUpdate={setCurrentPosition}
                      onSimulationStatusChange={setIsSimulating}
                    />
                  )}
                </>
              )}
            </aside>

            <main className="main-content">
              <FlightMap
                origin={origin}
                destination={destination}
                route={selectedRoute}
                allRoutes={routes}
                blockedWaypoint={blockedWaypoint}
                onWaypointBlocked={handleWaypointBlocked}
                onMapReady={setMapRef}
                isSimulating={isSimulating}
                currentPosition={currentPosition}
              />

              {blockedWaypoint && (
                <RouteRerouting
                  routeId={selectedRoute.id}
                  blockedWaypointId={blockedWaypoint}
                  currentPosition={currentPosition}
                  onRerouteSuccess={handleRerouteSuccess}
                  onRerouteError={(err) => console.error(err)}
                />
              )}

              {selectedRoute && (
                <RouteDetails
                  route={selectedRoute}
                  blockedWaypoint={blockedWaypoint}
                />
              )}
            </main>
          </Box>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
