import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
from uuid import UUID

from models.airport import Airport
from models.route import Route
from models.aircraft import Aircraft
from services.route_generator import RouteGenerator
from services.optimization.optimizer_factory import OptimizerFactory
from services.weather_service import WeatherService
from api.airport_api import AirportAPI
from api.aircraft_api import AircraftAPI

logger = logging.getLogger(__name__)
router = APIRouter()


# Models for request/response
class RouteRequest(BaseModel):
    origin: str
    destination: str
    aircraft_model: Optional[str] = None
    route_types: Optional[List[str]] = None
    optimization_method: Optional[str] = None
    excluded_areas: Optional[List[Dict[str, Any]]] = None


class BlockWaypointRequest(BaseModel):
    route_id: str
    waypoint_id: str


# Create shared services
airport_api = AirportAPI()
aircraft_api = AircraftAPI()
weather_service = WeatherService()
optimizer_factory = OptimizerFactory(weather_service)
route_generator = RouteGenerator(weather_service)


@router.post("/generate", response_model=Dict[str, Any])
async def generate_routes(route_request: RouteRequest):
    """Generate and optimize routes between two airports."""
    try:
        logger.info(
            f"Generating routes from {route_request.origin} to {route_request.destination}"
        )

        # Get airport data
        airports = await airport_api.fetch_airports()
        airport_dict = {airport.iata_code: airport for airport in airports}

        # Validate airports
        if route_request.origin not in airport_dict:
            raise HTTPException(
                status_code=404,
                detail=f"Origin airport {route_request.origin} not found",
            )
        if route_request.destination not in airport_dict:
            raise HTTPException(
                status_code=404,
                detail=f"Destination airport {route_request.destination} not found",
            )

        origin = airport_dict[route_request.origin]
        destination = airport_dict[route_request.destination]

        # Get aircraft if specified
        aircraft = None
        if route_request.aircraft_model:
            aircraft = await aircraft_api.get_aircraft(route_request.aircraft_model)
            if not aircraft:
                raise HTTPException(
                    status_code=404,
                    detail=f"Aircraft model {route_request.aircraft_model} not found",
                )

        # Generate alternative routes
        routes = await route_generator.generate_alternative_routes(
            origin=origin,
            destination=destination,
            route_types=route_request.route_types,
            aircraft_model=route_request.aircraft_model,
            excluded_areas=route_request.excluded_areas,
        )

        # Optimize routes
        optimizer = optimizer_factory.get_optimizer(route_request.optimization_method)
        optimized_route = optimizer.optimize(routes)

        # Calculate estimated fuel consumption if aircraft was specified
        if aircraft and optimized_route:
            optimized_route.fuel_consumption = aircraft.calculate_estimated_fuel(
                optimized_route.distance_km
            )

        # Return all routes and optimized route
        return {
            "all_routes": [route.to_dict() for route in routes],
            "optimized_route": optimized_route.to_dict() if optimized_route else None,
        }

    except Exception as e:
        logger.error(f"Error generating routes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{route_id}", response_model=Dict[str, Any])
async def get_route(route_id: str):
    """Get a specific route by ID."""
    # In a real implementation, this would retrieve from a database
    # For now, we'll return a 404 as we don't have persistence
    raise HTTPException(status_code=404, detail=f"Route {route_id} not found")


@router.post("/block-waypoint", response_model=Dict[str, Any])
async def block_waypoint(request: BlockWaypointRequest):
    """Register a blocked waypoint and recalculate the route."""
    from realtime.route_adjuster import route_adjuster

    try:
        new_route = await route_adjuster.handle_blocked_waypoint(
            request.route_id, request.waypoint_id
        )

        if not new_route:
            raise HTTPException(
                status_code=404, detail=f"Route {request.route_id} not found"
            )

        return {"new_route": new_route.to_dict()}

    except Exception as e:
        logger.error(f"Error handling blocked waypoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
