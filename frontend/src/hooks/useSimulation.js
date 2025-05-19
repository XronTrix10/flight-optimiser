// src/hooks/useSimulation.js
import { useState, useEffect, useRef } from "react";

import { calculatePositionAlongRoute } from "@/services/utils/routeUtils";

const useSimulation = (route) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);

  const animationRef = useRef(null);
  const lastTimestampRef = useRef(null);

  useEffect(() => {
    if (!route || !route.waypoints || route.waypoints.length === 0) return;

    // Initialize position at the origin
    setCurrentPosition([route.origin.latitude, route.origin.longitude]);
  }, [route]);

  const animate = (timestamp) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    // Calculate simulation progress
    const newElapsedTime = elapsedTime + (deltaTime * speed) / 1000;
    setElapsedTime(newElapsedTime);

    // Calculate total flight time in seconds
    const totalFlightTime = route.estimated_duration_minutes * 60;

    // Update progress (0 to 1)
    const newProgress = Math.min(newElapsedTime / totalFlightTime, 1);
    setProgress(newProgress);

    // Calculate current position along the route
    setCurrentPosition(calculatePositionAlongRoute(route, newProgress));

    // Continue animation if not completed
    if (newProgress < 1 && isSimulating) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (newProgress >= 1) {
      setIsSimulating(false);
    }
  };

  const startSimulation = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      lastTimestampRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetSimulation = () => {
    pauseSimulation();
    setProgress(0);
    setElapsedTime(0);
    setCurrentPosition([route.origin.latitude, route.origin.longitude]);
  };

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    isSimulating,
    currentPosition,
    progress,
    speed,
    elapsedTime,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSpeed,
  };
};

export default useSimulation;
