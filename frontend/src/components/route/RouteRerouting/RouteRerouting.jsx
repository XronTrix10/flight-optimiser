// src/components/route/RouteRerouting/RouteRerouting.jsx
import React, { useState } from "react";
import { blockWaypointAndReroute } from "@/services/api/routes";
import { Alert, Spinner, Button } from "../../common/";
import "./RouteRerouting.css";

const RouteRerouting = ({
  routeId,
  blockedWaypointId,
  currentPosition,
  onRerouteSuccess,
  onRerouteError,
}) => {
  const [isRerouting, setIsRerouting] = useState(false);
  const [error, setError] = useState(null);

  const handleReroute = async () => {
    setIsRerouting(true);
    setError(null);

    try {
      const reroutedData = await blockWaypointAndReroute(
        routeId,
        blockedWaypointId,
        currentPosition
      );

      onRerouteSuccess(reroutedData.new_route);
    } catch (err) {
      setError("Failed to reroute. Please try again.");
      onRerouteError(err);
    } finally {
      setIsRerouting(false);
    }
  };

  return (
    <div className="route-rerouting">
      <h4>Waypoint Blocked</h4>
      <p>A waypoint has been blocked and rerouting is required.</p>

      {error && <Alert type="error" message={error} />}

      <Button
        className="reroute-button"
        onClick={handleReroute}
        disabled={isRerouting}
        color="warning"
        variant="contained"
        fullWidth
      >
        {isRerouting ? <Spinner size="sm" /> : "Reroute Flight"}
      </Button>
    </div>
  );
};

export default RouteRerouting;
