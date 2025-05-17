import logging
from typing import List, Dict, Any
import asyncio
from api.weather_api import WeatherAPI
from models.route import Route
from models.weather_data import WeatherData

logger = logging.getLogger(__name__)


class WeatherService:
    """Service for fetching and processing weather data."""

    def __init__(self):
        self.weather_api = WeatherAPI()

    async def update_route_weather(self, route: Route) -> Route:
        """Fetch and update weather data for all waypoints in a route."""
        logger.info(f"Updating weather data for route: {route.name}")

        # Create tasks for fetching weather data for each waypoint
        tasks = []
        for waypoint in route.waypoints:
            tasks.append(
                self.weather_api.fetch_weather(waypoint.latitude, waypoint.longitude)
            )

        # Wait for all tasks to complete
        weather_data_list = await asyncio.gather(*tasks)

        # Update each waypoint with its weather data
        for i, waypoint in enumerate(route.waypoints):
            waypoint.weather_data = weather_data_list[i].dict()

        logger.info(
            f"Updated weather data for {len(route.waypoints)} waypoints in route: {route.name}"
        )

        return route

    def calculate_route_weather_score(self, route: Route) -> float:
        """Calculate a weather score for the route (0-1, lower is better)."""
        if not route.waypoints or not all(wp.weather_data for wp in route.waypoints):
            logger.warning(
                f"Cannot calculate weather score for route: {route.name} - missing weather data"
            )
            return 0.5  # Default mid-range score

        precipitation_total = 0
        cloud_cover_total = 0

        for waypoint in route.waypoints:
            weather = waypoint.weather_data
            if weather:
                precipitation_total += (
                    weather.get("precipitation", 0) / 20
                )  # Normalize to 0-1 (assuming 20mm is max)
                cloud_cover_total += weather.get("cloudcover", 0) / 100  # Already 0-100

        # Average the scores across all waypoints
        waypoint_count = len(route.waypoints)
        precipitation_score = precipitation_total / waypoint_count
        cloud_cover_score = cloud_cover_total / waypoint_count

        # Combine scores with weights from environment variables
        import os

        precip_weight = float(os.getenv("PRECIPITATION_WEIGHT", 0.6))
        cloud_weight = float(os.getenv("CLOUD_COVER_WEIGHT", 0.4))

        weather_score = (precipitation_score * precip_weight) + (
            cloud_cover_score * cloud_weight
        )

        logger.debug(f"Weather score for route {route.name}: {weather_score:.4f}")

        return weather_score
