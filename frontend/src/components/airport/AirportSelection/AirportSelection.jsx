// src/components/airport/AirportSelection/AirportSelection.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import "./AirportSelection.css";

const AirportSelection = ({
  onSelectionComplete,
  setOrigin,
  setDestination,
  loading,
}) => {
  const [airports, setAirports] = useState([]);
  const [originAirport, setOriginAirport] = useState(null);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationAirport, setDestinationAirport] = useState(null);
  const [aircraftModels, setAircraftModels] = useState([
    { model: "Turboprop", manufacturer: "Unknown" },
    { model: "Piston", manufacturer: "Unknown" },
    { model: "Jet", manufacturer: "Unknown" },
  ]);
  const [selectedAircraft, setSelectedAircraft] = useState("Jet");
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Fetch all airports on component mount
  useEffect(() => {
    const fetchAirports = async () => {
      setLoadingOrigin(true);
      try {
        const response = await fetch("http://localhost:8000/api/airports");
        const data = await response.json();
        setAirports(data);
      } catch (error) {
        console.error("Error fetching airports:", error);
      } finally {
        setLoadingOrigin(false);
      }
    };

    const fetchAircraftModels = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/aircraft");
        const data = await response.json();
        if (data && data.length > 0) {
          const limitedData = data.slice(0, 30); // Get the first 30 objects
          setAircraftModels(limitedData);
        }
      } catch (error) {
        console.error("Error fetching aircraft models:", error);
      }
    };

    fetchAirports();
    fetchAircraftModels();
  }, []);

  // Fetch possible destinations when origin is selected
  useEffect(() => {
    if (!originAirport) {
      setDestinationOptions([]);
      return;
    }

    const fetchDestinations = async () => {
      setLoadingDestinations(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/airports/${originAirport.iata_code}/destinations`
        );
        const data = await response.json();
        setDestinationOptions(data);
      } catch (error) {
        console.error("Error fetching destinations:", error);
      } finally {
        setLoadingDestinations(false);
      }
    };

    fetchDestinations();
  }, [originAirport]);

  const handleOriginChange = (event, value) => {
    setOriginAirport(value);
    setOrigin(value);
    setDestinationAirport(null);
  };

  const handleDestinationChange = (event, value) => {
    setDestinationAirport(value);
    setDestination(value);
  };

  const handleAircraftChange = (event) => {
    setSelectedAircraft(event.target.value);
  };

  const handleGenerateRoutes = () => {
    if (originAirport && destinationAirport) {
      onSelectionComplete(originAirport, destinationAirport, selectedAircraft);
    }
  };

  return (
    <Box className="airport-selection-container">
      <Typography variant="h5" component="h2" gutterBottom>
        Flight Route Planning
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            id="origin-airport"
            options={airports}
            getOptionLabel={(option) =>
              `${option.iata_code} - ${option.name} (${
                option.city || option.country
              })`
            }
            loading={loadingOrigin}
            value={originAirport}
            onChange={handleOriginChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Origin Airport"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <FlightTakeoffIcon color="primary" sx={{ mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loadingOrigin ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            id="destination-airport"
            options={destinationOptions}
            getOptionLabel={(option) =>
              `${option.iata_code} - ${option.name} (${
                option.city || option.country
              })`
            }
            loading={loadingDestinations}
            disabled={!originAirport}
            value={destinationAirport}
            onChange={handleDestinationChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination Airport"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <FlightLandIcon color="primary" sx={{ mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loadingDestinations ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="aircraft-select-label">Aircraft Model</InputLabel>
            <Select
              labelId="aircraft-select-label"
              id="aircraft-select"
              value={selectedAircraft}
              onChange={handleAircraftChange}
              label="Aircraft Model"
              startAdornment={<AirplanemodeActiveIcon sx={{ mr: 1 }} />}
            >
              {aircraftModels.map((aircraft, index) => (
                <MenuItem key={`${aircraft.model}-${index}`} value={aircraft.model}>
                  {aircraft.model} - {aircraft.manufacturer}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={!originAirport || !destinationAirport || loading}
            onClick={handleGenerateRoutes}
            className="generate-routes-button"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Generate Routes"
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AirportSelection;
