// src/components/common/Alert/Alert.jsx
import React from "react";
import { Alert as MuiAlert, Snackbar } from "@mui/material";
import "./Alert.css";

const Alert = ({
  type = "info", // 'error', 'warning', 'info', 'success'
  message,
  open = true,
  onClose = null,
  autoHideDuration = 5000,
  position = { vertical: "top", horizontal: "right" },
  className = "",
  ...props
}) => {
  // If open is controlled externally with onClose
  if (onClose) {
    return (
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={position}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={type}
          onClose={onClose}
          className={`custom-alert ${className}`}
          {...props}
        >
          {message}
        </MuiAlert>
      </Snackbar>
    );
  }

  // If used as a static component
  return (
    <MuiAlert
      severity={type}
      className={`custom-alert ${className}`}
      {...props}
    >
      {message}
    </MuiAlert>
  );
};

export default Alert;
