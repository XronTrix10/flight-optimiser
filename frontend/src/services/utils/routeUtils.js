// src/services/utils/routeUtils.js
export const calculateDistance = (route, progress) => {
  if (!route || progress === 0) return 0;
  return route.distance_km * progress;
};

export const formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const calculatePositionAlongRoute = (route, progress) => {
  if (!route || !route.waypoints || route.waypoints.length === 0) {
    return null;
  }

  // Create an array of all points including origin and destination
  const allPoints = [
    { latitude: route.origin.latitude, longitude: route.origin.longitude },
    ...route.waypoints,
    {
      latitude: route.destination.latitude,
      longitude: route.destination.longitude,
    },
  ];

  // If at the start or end, return those points directly
  if (progress <= 0) return [allPoints[0].latitude, allPoints[0].longitude];
  if (progress >= 1)
    return [
      allPoints[allPoints.length - 1].latitude,
      allPoints[allPoints.length - 1].longitude,
    ];

  // Calculate which segment the aircraft is on
  const totalPoints = allPoints.length;
  const segmentProgress = progress * (totalPoints - 1);
  const currentSegment = Math.floor(segmentProgress);
  const segmentFraction = segmentProgress - currentSegment;

  // Get the current and next point
  const currentPoint = allPoints[currentSegment];
  const nextPoint = allPoints[currentSegment + 1];

  // Interpolate between the points
  const lat =
    currentPoint.latitude +
    (nextPoint.latitude - currentPoint.latitude) * segmentFraction;
  const lng =
    currentPoint.longitude +
    (nextPoint.longitude - currentPoint.longitude) * segmentFraction;

  return [lat, lng];
};

export const calculateRotation = (currentPosition, nextWaypoint) => {
  if (!currentPosition || !nextWaypoint) return 0;

  const [lat1, lng1] = currentPosition;
  const lat2 = nextWaypoint.latitude;
  const lng2 = nextWaypoint.longitude;

  // Calculate bearing
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  const bearing = Math.atan2(y, x) * (180 / Math.PI);

  return (bearing + 360) % 360;
};
