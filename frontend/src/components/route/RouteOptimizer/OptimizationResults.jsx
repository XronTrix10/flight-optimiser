// src/components/route/RouteOptimizer/OptimizationResults.jsx
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlightIcon from "@mui/icons-material/Flight";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import RouteIcon from "@mui/icons-material/Route";
import SpeedIcon from "@mui/icons-material/Speed";
import {
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import "./OptimizationResults.css";

const OptimizationResults = ({ originalRoute, optimizedRoute }) => {
  // Calculate improvement percentages
  const distanceImprovement =
    originalRoute && optimizedRoute
      ? (
          ((originalRoute.distance_km - optimizedRoute.distance_km) /
            originalRoute.distance_km) *
          100
        ).toFixed(1)
      : 0;

  const timeImprovement =
    originalRoute && optimizedRoute
      ? (
          ((originalRoute.estimated_duration_minutes -
            optimizedRoute.estimated_duration_minutes) /
            originalRoute.estimated_duration_minutes) *
          100
        ).toFixed(1)
      : 0;

  const fuelImprovement =
    originalRoute && optimizedRoute
      ? (
          ((originalRoute.fuel_consumption - optimizedRoute.fuel_consumption) /
            originalRoute.fuel_consumption) *
          100
        ).toFixed(1)
      : 0;

  // Function to render improvement with arrows
  const renderImprovement = (value, positive = true) => {
    const num = parseFloat(value);
    if (num <= 0) return <span className="no-change">No change</span>;

    return (
      <span
        className={positive ? "improvement-positive" : "improvement-negative"}
      >
        <ArrowDownwardIcon fontSize="small" className="improvement-icon" />
        {value}%
      </span>
    );
  };

  // If routes are the same, return a message
  if (
    originalRoute &&
    optimizedRoute &&
    originalRoute.id === optimizedRoute.id
  ) {
    return (
      <Paper elevation={0} className="optimization-results no-optimization">
        <Typography variant="body1" align="center">
          <CheckCircleIcon color="success" className="success-icon" />
          The route was already optimized.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box className="optimization-results">
      <Typography variant="h6" className="results-title">
        Optimization Results
      </Typography>

      {optimizedRoute && (
        <>
          <Box className="optimization-method">
            <Chip
              icon={<FlightIcon />}
              label={`Optimized with ${optimizedRoute.optimization_method.toUpperCase()}`}
              color="primary"
              variant="outlined"
              className="method-chip"
            />
          </Box>

          <Paper elevation={2} className="improvements-container">
            <Typography variant="subtitle2" gutterBottom>
              Improvements
            </Typography>

            <Box className="improvement-metrics">
              <Box className="metric-item">
                <Box className="metric-header">
                  <RouteIcon fontSize="small" />
                  <Typography variant="body2">Distance</Typography>
                </Box>
                <Typography variant="body1" className="metric-value">
                  {renderImprovement(distanceImprovement)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    Math.abs(parseFloat(distanceImprovement)),
                    100
                  )}
                  className="improvement-progress"
                  color="success"
                />
              </Box>

              <Box className="metric-item">
                <Box className="metric-header">
                  <SpeedIcon fontSize="small" />
                  <Typography variant="body2">Time</Typography>
                </Box>
                <Typography variant="body1" className="metric-value">
                  {renderImprovement(timeImprovement)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Math.abs(parseFloat(timeImprovement)), 100)}
                  className="improvement-progress"
                  color="success"
                />
              </Box>

              <Box className="metric-item">
                <Box className="metric-header">
                  <LocalGasStationIcon fontSize="small" />
                  <Typography variant="body2">Fuel</Typography>
                </Box>
                <Typography variant="body1" className="metric-value">
                  {renderImprovement(fuelImprovement)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Math.abs(parseFloat(fuelImprovement)), 100)}
                  className="improvement-progress"
                  color="success"
                />
              </Box>
            </Box>
          </Paper>

          <Divider className="section-divider" />

          <TableContainer
            component={Paper}
            elevation={2}
            className="comparison-table-container"
          >
            <Table size="small" aria-label="route comparison table">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Original</TableCell>
                  <TableCell align="right">Optimized</TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Distance (km)
                  </TableCell>
                  <TableCell align="right">
                    {originalRoute?.distance_km.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {optimizedRoute.distance_km.toFixed(1)}
                  </TableCell>
                  <TableCell align="right" className="difference-cell">
                    {(
                      originalRoute?.distance_km - optimizedRoute.distance_km
                    ).toFixed(1)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Duration (min)
                  </TableCell>
                  <TableCell align="right">
                    {originalRoute?.estimated_duration_minutes.toFixed(0)}
                  </TableCell>
                  <TableCell align="right">
                    {optimizedRoute.estimated_duration_minutes.toFixed(0)}
                  </TableCell>
                  <TableCell align="right" className="difference-cell">
                    {(
                      originalRoute?.estimated_duration_minutes -
                      optimizedRoute.estimated_duration_minutes
                    ).toFixed(0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Fuel (l)
                  </TableCell>
                  <TableCell align="right">
                    {originalRoute?.fuel_consumption.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {optimizedRoute.fuel_consumption.toFixed(1)}
                  </TableCell>
                  <TableCell align="right" className="difference-cell">
                    {(
                      originalRoute?.fuel_consumption -
                      optimizedRoute.fuel_consumption
                    ).toFixed(1)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Fitness Score
                  </TableCell>
                  <TableCell align="right">
                    {originalRoute?.fitness_score.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {optimizedRoute.fitness_score.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={
                      optimizedRoute.fitness_score >
                      originalRoute?.fitness_score
                        ? "positive-difference"
                        : "difference-cell"
                    }
                  >
                    {(
                      optimizedRoute.fitness_score -
                      originalRoute?.fitness_score
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {optimizedRoute.waypoints.length !==
            originalRoute?.waypoints.length && (
            <Typography variant="body2" className="waypoint-note">
              Waypoints changed: {originalRoute?.waypoints.length} →{" "}
              {optimizedRoute.waypoints.length}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default OptimizationResults;
