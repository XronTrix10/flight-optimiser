// src/components/common/LoadingIndicator/LoadingIndicator.jsx
import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import "./LoadingIndicator.css";

const LoadingIndicator = ({
  message = "Loading...",
  progress = null, // If provided, shows determinate progress
  className = "",
  ...props
}) => {
  return (
    <Box className={`loading-indicator ${className}`} {...props}>
      <Typography variant="body2" className="loading-text">
        {message}
      </Typography>

      {progress !== null ? (
        <LinearProgress
          variant="determinate"
          value={progress}
          className="progress-bar"
        />
      ) : (
        <LinearProgress variant="indeterminate" className="progress-bar" />
      )}
    </Box>
  );
};

export default LoadingIndicator;
