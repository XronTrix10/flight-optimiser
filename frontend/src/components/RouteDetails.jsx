import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Divider,
} from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import SpeedIcon from "@mui/icons-material/Speed";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RouteIcon from "@mui/icons-material/Route";

const RouteDetails = ({ route, blockedWaypoints }) => {
  if (!route) return null;

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" gutterBottom>
        Route Details: {route.name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              display="flex"
              alignItems="center"
            >
              <RouteIcon sx={{ mr: 1 }} /> Route Overview
            </Typography>
            <Typography variant="body1">
              From: {route.origin.name} ({route.origin.iata_code})
            </Typography>
            <Typography variant="body1">
              To: {route.destination.name} ({route.destination.iata_code})
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" display="flex" alignItems="center">
              <SpeedIcon fontSize="small" sx={{ mr: 1 }} /> Distance:{" "}
              {route.distance_km.toFixed(1)} km
            </Typography>
            {/* <Typography variant="body2" display="flex" alignItems="center">
              <ScheduleIcon fontSize="small" sx={{ mr: 1 }} /> Est. Duration:{" "}
              {route.estimated_duration_minutes.toFixed(0)} minutes
            </Typography> */}
            {/* <Typography variant="body2" display="flex" alignItems="center">
              <LocalGasStationIcon fontSize="small" sx={{ mr: 1 }} /> Fuel
              Consumption: {route.fuel_consumption.toFixed(1)} liters
            </Typography> */}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Details
            </Typography>
            <Typography variant="body2">
              Method: {route.optimization_method.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              Route Type: {route.route_type}
            </Typography>
            <Typography variant="body2">
              Fitness Score: {route.fitness_score.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Route Statistics
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                icon={<FlightIcon />}
                label={`${route.waypoints.length} Waypoints`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<RouteIcon />}
                label={`Type: ${route.route_type}`}
                color="secondary"
                variant="outlined"
              />
              {blockedWaypoints.length > 0 && (
                <Chip
                  label={`${blockedWaypoints.length} Blocked`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} elevation={2}>
            <Table size="small" aria-label="waypoints table">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Waypoint ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Latitude</TableCell>
                  <TableCell>Longitude</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {route.waypoints.map((waypoint) => (
                  <TableRow
                    key={waypoint.id}
                    sx={{
                      backgroundColor: blockedWaypoints.includes(waypoint.id)
                        ? "rgba(244, 67, 54, 0.1)"
                        : "inherit",
                    }}
                  >
                    <TableCell>{waypoint.order}</TableCell>
                    <TableCell>{waypoint.id.substring(0, 8)}...</TableCell>
                    <TableCell>{waypoint.name}</TableCell>
                    <TableCell>{waypoint.latitude.toFixed(4)}</TableCell>
                    <TableCell>{waypoint.longitude.toFixed(4)}</TableCell>
                    <TableCell>
                      {blockedWaypoints.includes(waypoint.id) ? (
                        <Chip size="small" label="Blocked" color="error" />
                      ) : (
                        <Chip size="small" label="Active" color="success" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RouteDetails;
