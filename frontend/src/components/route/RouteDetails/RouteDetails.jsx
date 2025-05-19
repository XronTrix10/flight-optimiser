// src/components/route/RouteDetails/RouteDetails.jsx
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
import "./RouteDetails.css";

const RouteDetails = ({ route, blockedWaypoints = [] }) => {
  if (!route) return null;

  return (
    <Box className="route-details-container">
      <Typography variant="h5" gutterBottom>
        Route Details: {route.name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="route-info-paper">
            <Typography variant="h6" gutterBottom className="section-title">
              <RouteIcon sx={{ mr: 1 }} /> Route Overview
            </Typography>
            <Typography variant="body1">
              From: {route.origin.name} ({route.origin.iata_code})
            </Typography>
            <Typography variant="body1">
              To: {route.destination.name} ({route.destination.iata_code})
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" className="stats-item">
              <SpeedIcon fontSize="small" sx={{ mr: 1 }} /> Distance:{" "}
              {route.distance_km.toFixed(1)} km
            </Typography>
            {/* <Typography variant="body2" className="stats-item">
              <ScheduleIcon fontSize="small" sx={{ mr: 1 }} /> Est. Duration:{" "}
              {route.estimated_duration_minutes.toFixed(0)} minutes
            </Typography> */}
            {/* <Typography variant="body2" className="stats-item">
              <LocalGasStationIcon fontSize="small" sx={{ mr: 1 }} /> Fuel
              Consumption: {route.fuel_consumption.toFixed(1)} liters
            </Typography> */}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="route-info-paper">
            <Typography variant="h6" gutterBottom className="section-title">
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
          <Paper elevation={2} className="route-info-paper">
            <Typography variant="h6" gutterBottom className="section-title">
              Route Statistics
            </Typography>
            <Box className="chips-container">
              <Chip
                icon={<FlightIcon />}
                label={`${route.waypoints.length} Waypoints`}
                color="primary"
                variant="outlined"
                className="info-chip"
              />
              <Chip
                icon={<RouteIcon />}
                label={`Type: ${route.route_type}`}
                color="secondary"
                variant="outlined"
                className="info-chip"
              />
              {blockedWaypoints.length > 0 && (
                <Chip
                  label={`${blockedWaypoints.length} Blocked`}
                  color="error"
                  variant="outlined"
                  className="info-chip"
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer
            component={Paper}
            elevation={2}
            className="waypoints-table-container"
          >
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
                    className={
                      blockedWaypoints.includes(waypoint.id)
                        ? "blocked-waypoint-row"
                        : ""
                    }
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
