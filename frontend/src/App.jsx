import {
  Box,
  Container,
  CssBaseline,
  Paper,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import { useState } from "react";
import "./App.css";
import AirportSelection from "./components/AirportSelection";
import RouteDetails from "./components/RouteDetails";
import RouteMap from "./components/RouteMap";

// Create a theme with dark blue/aviation inspired colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#1a237e", // Dark blue
    },
    secondary: {
      main: "#ff9800", // Orange for highlights
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
});

function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [blockedWaypoints, setBlockedWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateRoutes = async (
    selectedOrigin,
    selectedDestination,
    aircraftModel
  ) => {
    setLoading(true);
    try {
      // API call to generate routes
      const response = await fetch(
        "http://localhost:8000/api/routes/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: selectedOrigin.iata_code,
            destination: selectedDestination.iata_code,
            aircraft_model: aircraftModel || "A320",
          }),
        }
      );

      const data = await response.json();
      setGeneratedRoutes(data.all_routes);
      setOptimizedRoute(data.optimized_route);
      setBlockedWaypoints([]);
    } catch (error) {
      console.error("Error generating routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockWaypoint = async (waypointId) => {
    if (!optimizedRoute) return;

    setLoading(true);
    try {
      // API call to block waypoint and re-route
      const response = await fetch(
        "http://localhost:8000/api/routes/block-waypoint",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            route_id: optimizedRoute.id,
            waypoint_id: waypointId,
          }),
        }
      );

      const data = await response.json();
      setOptimizedRoute(data.new_route);
      setBlockedWaypoints([...blockedWaypoints, waypointId]);
    } catch (error) {
      console.error("Error blocking waypoint:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container >
        <Typography
          variant="h3"
          component="h1"
          align="center"
          gutterBottom
          sx={{ mt: 3 }}
        >
          Flight Route Optimization
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Paper elevation={3} sx={{ p: 2, flex: 1 }}>
            <AirportSelection
              onSelectionComplete={handleGenerateRoutes}
              setOrigin={setOrigin}
              setDestination={setDestination}
              loading={loading}
            />
          </Paper>

          <Paper elevation={3} sx={{ p: 2, flex: 3 }}>
            <RouteMap
              origin={origin}
              destination={destination}
              optimizedRoute={optimizedRoute}
              allRoutes={generatedRoutes}
              blockedWaypoints={blockedWaypoints}
              onBlockWaypoint={handleBlockWaypoint}
            />
          </Paper>
        </Box>

        {optimizedRoute && (
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <RouteDetails
              route={optimizedRoute}
              blockedWaypoints={blockedWaypoints}
            />
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
