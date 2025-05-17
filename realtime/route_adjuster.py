import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
import asyncio
from uuid import uuid4

from models.route import Route
from models.waypoint import Waypoint, WaypointStatus
from services.route_generator import RouteGenerator
from services.weather_service import WeatherService
from services.optimization.optimizer_factory import OptimizerFactory

logger = logging.getLogger(__name__)


class RouteAdjuster:
    """Service for real-time route adjustments."""

    def __init__(self):
        # These will be initialized on first use
        self._route_generator = None
        self._optimizer_factory = None
        self._weather_service = None

        # In-memory route storage (would be a database in production)
        self.active_routes = {}

    @property
    def route_generator(self):
        if self._route_generator is None:
            self._weather_service = WeatherService()
            self._route_generator = RouteGenerator(self._weather_service)
        return self._route_generator

    @property
    def optimizer_factory(self):
        if self._optimizer_factory is None:
            self._weather_service = WeatherService()
            self._optimizer_factory = OptimizerFactory(self._weather_service)
        return self._optimizer_factory

    @property
    def weather_service(self):
        if self._weather_service is None:
            self._weather_service = WeatherService()
        return self._weather_service

    async def handle_blocked_waypoint(
        self, route_id: str, waypoint_id: str
    ) -> Optional[Route]:
        """Handle a blocked waypoint by generating a new route."""
        logger.info(f"Handling blocked waypoint {waypoint_id} on route {route_id}")

        # Get the route
        route = self.active_routes.get(route_id)
        if not route:
            logger.warning(f"Route {route_id} not found")
            return None

        # Find the blocked waypoint
        blocked_waypoint = None
        for waypoint in route.waypoints:
            if str(waypoint.id) == waypoint_id:
                blocked_waypoint = waypoint
                blocked_waypoint.mark_as_blocked()
                break

        if not blocked_waypoint:
            logger.warning(f"Waypoint {waypoint_id} not found in route {route_id}")
            return None

        # Get current position (waypoint before blocked one, or first waypoint)
        current_position = None
        for i, waypoint in enumerate(route.waypoints):
            if waypoint.id == blocked_waypoint.id:
                if i > 0:
                    current_position = route.waypoints[i - 1]
                    current_position.mark_as_active()
                else:
                    # If blocked waypoint is the first one, use origin
                    current_position = None  # Will use route origin instead
                break

        # Generate new routes from current position to destination
        excluded_area = {
            "center": (blocked_waypoint.latitude, blocked_waypoint.longitude),
            "radius": 0.2,  # ~20km exclusion radius
        }

        if current_position:
            # If we have a current position, create a new origin airport at that location
            from models.airport import Airport

            temp_origin = Airport(
                iata_code=f"TMP{str(uuid4())[:4]}",
                name="Current Position",
                city="",
                country="",
                latitude=current_position.latitude,
                longitude=current_position.longitude,
            )

            new_routes = await self.route_generator.generate_alternative_routes(
                origin=temp_origin,
                destination=route.destination,
                aircraft_model=None,  # Use default
                excluded_areas=[excluded_area],
            )
        else:
            # If blocked waypoint is first, reroute from original origin
            new_routes = await self.route_generator.generate_alternative_routes(
                origin=route.origin,
                destination=route.destination,
                aircraft_model=None,  # Use default
                excluded_areas=[excluded_area],
            )

        # Use same optimization method as original route
        optimizer = self.optimizer_factory.get_optimizer(route.optimization_method)
        optimized_route = optimizer.optimize(new_routes)

        if not optimized_route:
            logger.error(f"Failed to generate alternative route")
            return None

        # Update the stored route
        optimized_route.id = UUID(route_id)  # Keep same ID
        self.active_routes[route_id] = optimized_route

        return optimized_route

    def register_route(self, route: Route) -> None:
        """Register a new active route."""
        self.active_routes[str(route.id)] = route
        logger.info(f"Registered route {route.id}: {route.name}")
