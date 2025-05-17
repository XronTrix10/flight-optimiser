# services/weather_service.py
import logging
import random
import asyncio
from typing import Dict, Any, List, Optional
from models.route import Route
from models.waypoint import Waypoint

logger = logging.getLogger(__name__)


class WeatherService:
    """Service to retrieve weather data for flight routes."""

    def __init__(self):
        self.cache = {}
        self.api_key = "your_weather_api_key"  # Replace with actual API key

    async def get_weather_for_route(self, route: Route) -> Dict[str, Dict[str, Any]]:
        """
        Get weather data for all points along a route.

        Args:
            route: A Route object with waypoints

        Returns:
            Dictionary mapping node keys to weather data dictionaries
        """
        logger.info(f"Fetching weather data for route {route.name}")

        # Collect all points (origin, waypoints, destination)
        all_points = []
        if route.origin:
            all_points.append(("origin", route.origin.latitude, route.origin.longitude))

        for i, waypoint in enumerate(route.waypoints):
            all_points.append((f"waypoint_{i}", waypoint.latitude, waypoint.longitude))

        if route.destination:
            all_points.append(
                ("destination", route.destination.latitude, route.destination.longitude)
            )

        # Get weather for each point
        weather_data = {}
        for point_key, lat, lon in all_points:
            # Check cache first
            cache_key = f"{lat:.4f}_{lon:.4f}"
            if cache_key in self.cache:
                weather_data[point_key] = self.cache[cache_key]
            else:
                # In a real implementation, call weather API here
                # For now, generate mock data
                weather = await self._generate_mock_weather(lat, lon)
                self.cache[cache_key] = weather
                weather_data[point_key] = weather

                # Simulate API rate limiting
                await asyncio.sleep(0.1)

        return weather_data

    async def _generate_mock_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate mock weather data for testing."""
        # Use lat/lon to create somewhat realistic variations
        temp_base = 20 - (abs(lat) / 90) * 30  # Colder at higher latitudes

        return {
            "temperature_2m": round(temp_base + random.uniform(-5, 5), 1),
            "precipitation": round(random.uniform(0, 20), 1),
            "rain": round(random.uniform(0, 10), 1),
            "showers": round(random.uniform(0, 10), 1),
            "snowfall": round(random.uniform(0, 5), 1),
            "cloud_cover": random.randint(0, 100),
            "cloud_cover_high": random.randint(0, 100),
            "weather_code": random.randint(0, 100),
            "visibility": round(random.uniform(1000, 10000), 1),
            "wind_speed_10m": round(random.uniform(0, 50), 1),
            "wind_direction_10m": random.randint(0, 360),
            "jet_stream_speed_250hPa": round(random.uniform(50, 150), 1),
            "jet_stream_direction_250hPa": random.randint(0, 360),
            "vertical_velocity_250hPa": round(random.uniform(-2, 2), 1),
            "cape": round(random.uniform(0, 2000), 1),
            "temperature_500hPa": round(random.uniform(-50, 0), 1),
            "relative_humidity_500hPa": random.randint(0, 100),
            "temperature_700hPa": round(random.uniform(-20, 10), 1),
            "relative_humidity_700hPa": random.randint(0, 100),
        }

    async def get_current_conditions(self, airport_code: str) -> Dict[str, Any]:
        """Get current weather conditions at an airport."""
        # In a real implementation, fetch airport coordinates and call weather API
        # For now, return mock data
        return await self._generate_mock_weather(0, 0)
