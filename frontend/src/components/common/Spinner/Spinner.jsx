// src/components/common/Spinner/Spinner.jsx
import React from "react";
import { CircularProgress, Box } from "@mui/material";
import "./Spinner.css";

const Spinner = ({
  size = "md", // 'sm', 'md', 'lg'
  color = "primary",
  thickness = 3.6,
  className = "",
  text = "",
  ...props
}) => {
  const sizeMap = {
    sm: 20,
    md: 40,
    lg: 60,
  };

  const actualSize = sizeMap[size] || sizeMap.md;

  return (
    <Box className={`spinner-container ${className}`} {...props}>
      <CircularProgress
        size={actualSize}
        color={color}
        thickness={thickness}
        className="spinner"
      />
      {text && <div className="spinner-text">{text}</div>}
    </Box>
  );
};

export default Spinner;
