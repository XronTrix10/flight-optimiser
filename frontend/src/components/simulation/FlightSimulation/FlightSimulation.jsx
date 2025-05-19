// src/components/simulation/FlightSimulation/FlightSimulation.jsx
import React from "react";
import Aircraft from "&/map/Aircraft/Aircraft";
import SimulationControls from "../SimulationControls/SimulationControls";
import useSimulation from "@/hooks/useSimulation";

import {
  calculateDistance,
  formatTime,
  calculateRotation,
} from "@/services/utils/routeUtils";

const FlightSimulation = ({ route, map }) => {
  const {
    isSimulating,
    currentPosition,
    progress,
    speed,
    elapsedTime,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSpeed,
  } = useSimulation(route);

  // Calculate the current waypoint based on progress
  const currentWaypointIndex = Math.floor(progress * route.waypoints.length);
  const nextWaypoint = route.waypoints[currentWaypointIndex + 1];

  return (
    <div className="flight-simulation">
      <Aircraft
        position={currentPosition}
        rotation={calculateRotation(currentPosition, nextWaypoint)}
        map={map}
      />

      <SimulationControls
        isSimulating={isSimulating}
        progress={progress}
        speed={speed}
        elapsedTime={elapsedTime}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onReset={resetSimulation}
        onSpeedChange={setSpeed}
        estimatedTotalTime={route.estimated_duration_minutes * 60}
        distanceTraveled={calculateDistance(route, progress)}
        totalDistance={route.distance_km}
      />

      <div className="simulation-info">
        <p>Current speed: {speed}x</p>
        <p>Elapsed time: {formatTime(elapsedTime)}</p>
        <p>Distance traveled: {calculateDistance(route, progress)} km</p>
      </div>
    </div>
  );
};

export default FlightSimulation;
