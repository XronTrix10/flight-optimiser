// src/components/common/Button/Button.jsx
import React from "react";
import { Button as MuiButton } from "@mui/material";
import "./Button.css";

const Button = ({
  children,
  variant = "contained",
  color = "primary",
  size = "medium",
  disabled = false,
  fullWidth = false,
  startIcon = null,
  endIcon = null,
  onClick,
  className = "",
  ...props
}) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      startIcon={startIcon}
      endIcon={endIcon}
      onClick={onClick}
      className={`custom-button ${className}`}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
