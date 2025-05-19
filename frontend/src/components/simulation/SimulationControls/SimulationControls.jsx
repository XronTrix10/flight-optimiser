// src/components/simulation/SimulationControls/SimulationControls.jsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  Button, 
  IconButton, 
  Paper,
  LinearProgress,
  Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import './SimulationControls.css';

const SimulationControls = ({
  isSimulating,
  progress,
  speed,
  elapsedTime,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  estimatedTotalTime,
  distanceTraveled,
  totalDistance
}) => {
  // Format time in HH:MM:SS
  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate remaining time
  const remainingTime = estimatedTotalTime ? estimatedTotalTime - elapsedTime : 0;
  
  // Calculate progress percentage
  const progressPercent = progress * 100;
  
  return (
    <Paper elevation={3} className="simulation-controls">
      <Box className="controls-header">
        <Typography variant="h6" component="h3">
          Flight Simulation Controls
        </Typography>
      </Box>
      
      <Box className="progress-container">
        <Box className="progress-indicators">
          <Box className="progress-endpoint">
            <FlightTakeoffIcon color="primary" />
            <Typography variant="body2">Origin</Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progressPercent} 
            className="progress-bar"
          />
          
          <Box className="progress-endpoint">
            <FlightLandIcon color="primary" />
            <Typography variant="body2">Destination</Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" className="progress-percentage">
          {progressPercent.toFixed(1)}% Complete
        </Typography>
      </Box>
      
      <Grid container spacing={2} className="simulation-stats">
        <Grid item xs={12} sm={6}>
          <Box className="stat-item">
            <AccessTimeIcon fontSize="small" />
            <Box className="stat-text">
              <Typography variant="caption">Elapsed Time</Typography>
              <Typography variant="body2">{formatTime(elapsedTime)}</Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box className="stat-item">
            <AccessTimeIcon fontSize="small" />
            <Box className="stat-text">
              <Typography variant="caption">Remaining Time</Typography>
              <Typography variant="body2">{formatTime(remainingTime)}</Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box className="stat-item">
            <SpeedIcon fontSize="small" />
            <Box className="stat-text">
              <Typography variant="caption">Simulation Speed</Typography>
              <Typography variant="body2">{speed}x</Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box className="stat-item">
            <RouteIcon fontSize="small" />
            <Box className="stat-text">
              <Typography variant="caption">Distance</Typography>
              <Typography variant="body2">
                {distanceTraveled ? `${distanceTraveled.toFixed(1)}/${totalDistance.toFixed(1)} km` : '-'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      <Box className="speed-control">
        <Typography id="speed-slider-label" gutterBottom>
          Simulation Speed
        </Typography>
        <Slider
          aria-labelledby="speed-slider-label"
          value={speed}
          onChange={(e, newValue) => onSpeedChange(newValue)}
          step={1}
          marks
          min={1}
          max={10}
          valueLabelDisplay="auto"
          disabled={!isSimulating}
        />
      </Box>
      
      <Box className="control-buttons">
        {!isSimulating ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={onStart}
            className="control-button"
          >
            Start
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PauseIcon />}
            onClick={onPause}
            className="control-button"
          >
            Pause
          </Button>
        )}
        
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={onReset}
          className="control-button"
        >
          Reset
        </Button>
      </Box>
    </Paper>
  );
};

// Add a default RouteIcon if not imported
const RouteIcon = ({ fontSize }) => {
  return (
    <svg 
      style={{ width: fontSize === 'small' ? '20px' : '24px', height: fontSize === 'small' ? '20px' : '24px' }}
      viewBox="0 0 24 24"
    >
      <path 
        fill="currentColor" 
        d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" 
      />
    </svg>
  );
};

export default SimulationControls;
