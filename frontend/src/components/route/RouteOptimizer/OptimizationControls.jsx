// src/components/route/RouteOptimizer/OptimizationControls.jsx
import React from "react";
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import OptimizeIcon from "@mui/icons-material/TuneOutlined";
import CompareIcon from "@mui/icons-material/CompareArrows";
import SettingsIcon from "@mui/icons-material/Settings";
import "./OptimizationControls.css";

const OptimizationControls = ({
  method,
  onChangeMethod,
  onOptimize,
  onCompare,
  isOptimizing,
  showAdvancedOptions = false,
  onToggleAdvancedOptions,
}) => {
  return (
    <div className="optimization-controls">
      <Box className="optimization-header">
        <Typography variant="h6" className="section-title">
          <OptimizeIcon className="section-icon" />
          Optimization Method
        </Typography>

        {onToggleAdvancedOptions && (
          <Tooltip title="Advanced Options">
            <Button
              size="small"
              variant="outlined"
              className="advanced-button"
              onClick={onToggleAdvancedOptions}
            >
              <SettingsIcon fontSize="small" />
            </Button>
          </Tooltip>
        )}
      </Box>

      <FormControl component="fieldset" className="method-selector">
        <RadioGroup
          row
          name="optimization-method"
          value={method}
          onChange={(e) => onChangeMethod(e.target.value)}
        >
          <FormControlLabel
            value="aco"
            control={<Radio />}
            label={
              <Tooltip title="Ant Colony Optimization - Efficient for finding shortest paths">
                <span>ACO</span>
              </Tooltip>
            }
            disabled={isOptimizing}
          />
          <FormControlLabel
            value="genetic"
            control={<Radio />}
            label={
              <Tooltip title="Genetic Algorithm - Good for complex multi-factor optimization">
                <span>Genetic</span>
              </Tooltip>
            }
            disabled={isOptimizing}
          />
          <FormControlLabel
            value="ppo"
            control={<Radio />}
            label={
              <Tooltip title="Proximal Policy Optimization - Advanced AI learning for dynamic conditions">
                <span>PPO</span>
              </Tooltip>
            }
            disabled={isOptimizing}
          />
        </RadioGroup>
      </FormControl>

      {showAdvancedOptions && (
        <Box className="advanced-options">
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Advanced Options
          </Typography>
          {/* Add more advanced options here */}
        </Box>
      )}

      <Box className="action-buttons">
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onOptimize}
          disabled={isOptimizing}
          className="optimize-button"
          startIcon={
            isOptimizing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <OptimizeIcon />
            )
          }
        >
          {isOptimizing ? "Optimizing..." : "Optimize Route"}
        </Button>

        {onCompare && (
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={onCompare}
            disabled={isOptimizing}
            className="compare-button"
            startIcon={<CompareIcon />}
          >
            Compare Methods
          </Button>
        )}
      </Box>
    </div>
  );
};

export default OptimizationControls;
