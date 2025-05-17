# models/route.py
import math
import os
from uuid import UUID, uuid4
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from models.airport import Airport
from models.waypoint import Waypoint, WaypointStatus
from models.aircraft import Aircraft

logger = logging.getLogger(__name__)

class Route:
    """A flight route consisting of origin, destination, and waypoints."""
    
    def __init__(self, 
                 id: UUID = None,
                 name: str = "",
                 origin: Airport = None,
                 destination: Airport = None,
                 waypoints: List[Waypoint] = None,
                 path_type: str = "direct",
                 optimization_method: str = "",
                 distance: float = 0,
                 fitness_score: float = 0,
                 created_at: datetime = None):
        self.id = id or uuid4()
        self.name = name
        self.origin = origin
        self.destination = destination
        self.waypoints = waypoints or []
        self.path_type = path_type
        self.optimization_method = optimization_method
        self.distance = distance
        self.fitness_score = fitness_score
        self.created_at = created_at or datetime.utcnow()
        self.weather_data = {}  # Will be populated by weather service

    def get_current_waypoint(self, current_time: datetime = None) -> Optional[Waypoint]:
        """Return the current active waypoint based on time elapsed."""
        if not current_time:
            current_time = datetime.utcnow()
            
        active_waypoints = [wp for wp in self.waypoints if wp.status == WaypointStatus.ACTIVE]
        return active_waypoints[0] if active_waypoints else None
        
    def calculate_total_distance(self) -> float:
        """Calculate the total distance of the route in kilometers."""
        total = 0.0
        
        # Add distance from origin to first waypoint
        if self.origin and self.waypoints:
            total += self.origin.calculate_distance(self.waypoints[0])
            
        # Add distances between waypoints
        for i in range(len(self.waypoints) - 1):
            total += self.waypoints[i].calculate_distance(self.waypoints[i+1])
            
        # Add distance from last waypoint to destination
        if self.destination and self.waypoints:
            total += self.waypoints[-1].calculate_distance(self.destination)
            
        self.distance = total
        return total
    
    def calculate_fitness_score(self, 
                               aircraft: Optional[Aircraft] = None,
                               weather_weight: float = 0.6,
                               distance_weight: float = 0.4) -> float:
        """
        Calculate the fitness score of the route based on weather and distance.
        
        Lower scores are better.
        """
        if self.distance <= 0:
            self.calculate_total_distance()
            
        if not self.weather_data:
            logger.warning(f"No weather data available for route {self.id}")
            # Default to distance-only fitness if no weather data
            self.fitness_score = self.distance / 1000  # Normalize distance
            return self.fitness_score
            
        # Get all waypoints including origin and destination
        all_points = [self.origin] + self.waypoints + [self.destination]
        weather_nodes = list(self.weather_data.values())
        
        # If incomplete weather data, default to distance-only fitness
        if len(weather_nodes) < 2:
            logger.warning(f"Incomplete weather data for route {self.id}")
            self.fitness_score = self.distance / 1000
            return self.fitness_score
            
        # Step 1: Estimate flight heading (simplified)
        if self.origin and self.destination:
            delta_lat = self.destination.latitude - self.origin.latitude
            delta_lon = self.destination.longitude - self.origin.longitude
            flight_heading_deg = math.degrees(math.atan2(delta_lon, delta_lat)) % 360
        else:
            flight_heading_deg = 0
            
        # Step 2: Ground Speed and Flight Time Calculation
        airspeed_km_h = 900  # Typical jet airspeed
        avg_ground_speed = 0
        
        for node in weather_nodes:
            jet_stream_speed = node.get('jet_stream_speed_250hPa', 0)
            jet_stream_direction = node.get('jet_stream_direction_250hPa', 0)
            angle_diff = math.radians(abs(flight_heading_deg - jet_stream_direction))
            jet_stream_component = jet_stream_speed * math.cos(angle_diff)
            ground_speed = airspeed_km_h + jet_stream_component
            avg_ground_speed += max(ground_speed, airspeed_km_h * 0.5)  # Prevent unrealistically slow speeds
            
        avg_ground_speed /= len(weather_nodes) if weather_nodes else 1
        flight_time_hours = self.distance / avg_ground_speed if avg_ground_speed > 0 else float('inf')
        
        # Step 3: Fuel Consumption Calculation (use provided aircraft or defaults)
        if aircraft:
            fuel_consumption_rate = aircraft.fuel_consumption_rate_kg_hr
            fuel_capacity_kg = aircraft.fuel_capacity_l * 0.8  # 0.8 kg/L for jet fuel
        else:
            # Default values
            fuel_consumption_rate = 3000  # kg/hr
            fuel_capacity_kg = 70000
            
        fuel_consumption_kg = fuel_consumption_rate * flight_time_hours
        
        # Step 4: Fuel Sufficiency Check
        fuel_penalty = 0
        if fuel_consumption_kg > fuel_capacity_kg:
            fuel_penalty = (fuel_consumption_kg - fuel_capacity_kg) / fuel_capacity_kg * 10
            
        # Step 5: Safety Assessments
        # Turbulence risk
        turbulence_risk = 0
        for node in weather_nodes:
            vertical_velocity = node.get('vertical_velocity_250hPa', 0)
            if abs(vertical_velocity) > 0.5:
                turbulence_risk += 1
        turbulence_penalty = (turbulence_risk / len(weather_nodes)) * 2 if weather_nodes else 0
        
        # Thunderstorm risk
        thunderstorm_risk = 0
        for node in weather_nodes:
            cape = node.get('cape', 0)
            cloud_cover_high = node.get('cloud_cover_high', 0)
            if cape > 1000 or cloud_cover_high > 80:
                thunderstorm_risk += 1
        thunderstorm_penalty = (thunderstorm_risk / len(weather_nodes)) * 3 if weather_nodes else 0
        
        # Visibility and cloud cover
        source_weather = weather_nodes[0] if weather_nodes else {}
        dest_weather = weather_nodes[-1] if weather_nodes else {}
        
        visibility_source = source_weather.get('visibility', 10000)
        visibility_dest = dest_weather.get('visibility', 10000)
        cloud_cover_source = source_weather.get('cloud_cover', 0)
        cloud_cover_dest = dest_weather.get('cloud_cover', 0)
        
        visibility_penalty = 0
        if visibility_source < 5000 or visibility_dest < 5000:
            visibility_penalty = 1.0
            
        cloud_cover_penalty = 0
        if cloud_cover_source > 80 or cloud_cover_dest > 80:
            cloud_cover_penalty = 0.5
            
        # Runway condition assessment
        runway_risk = 0
        for weather in [source_weather, dest_weather]:
            precipitation = weather.get('precipitation', 0)
            rain = weather.get('rain', 0)
            showers = weather.get('showers', 0)
            snowfall = weather.get('snowfall', 0)
            if precipitation > 10 or rain > 5 or showers > 5 or snowfall > 1:
                runway_risk += 1
        runway_penalty = runway_risk * 0.75
        
        # Crosswind component
        crosswind_penalty = 0
        for weather in [source_weather, dest_weather]:
            wind_speed_10m = weather.get('wind_speed_10m', 0)
            wind_direction_10m = weather.get('wind_direction_10m', 0)
            angle_diff = math.radians(abs(flight_heading_deg - wind_direction_10m))
            crosswind_component = wind_speed_10m * math.sin(angle_diff)
            if crosswind_component > 20:
                crosswind_penalty += 0.5
                
        # Weather hazard flag
        weather_hazard_penalty = 0
        for weather in [source_weather, dest_weather]:
            weather_code = weather.get('weather_code', 0)
            if weather_code > 50:
                weather_hazard_penalty += 0.3
                
        # Step 6: Route Safety Score
        safety_score = (
            turbulence_penalty + 
            thunderstorm_penalty + 
            visibility_penalty + 
            cloud_cover_penalty + 
            runway_penalty + 
            crosswind_penalty + 
            weather_hazard_penalty
        )
        
        # Step 7: Combine into Fitness Score
        normalized_fuel = fuel_consumption_kg / 10000  # Normalize
        normalized_distance = self.distance / 5000  # Normalize assuming max 5000km
        
        # Final fitness score (lower is better)
        fitness_score = (
            weather_weight * safety_score + 
            distance_weight * normalized_fuel + 
            fuel_penalty
        )
        
        # Extra penalties for very long routes
        if self.distance > 5000:
            fitness_score += (self.distance - 5000) / 1000
            
        self.fitness_score = fitness_score
        return fitness_score
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert route to dictionary for API responses."""
        waypoints_dict = [wp.to_dict() for wp in self.waypoints]
        
        return {
            "id": str(self.id),
            "name": self.name,
            "origin": self.origin.to_dict() if self.origin else None,
            "destination": self.destination.to_dict() if self.destination else None,
            "waypoints": waypoints_dict,
            "path_type": self.path_type,
            "optimization_method": self.optimization_method,
            "distance_km": self.distance,
            "fitness_score": self.fitness_score,
            "created_at": self.created_at.isoformat(),
            "reroute_history": getattr(self, "reroute_history", [])
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Route':
        """Create a Route from dictionary data."""
        origin = Airport.from_dict(data["origin"]) if data.get("origin") else None
        destination = Airport.from_dict(data["destination"]) if data.get("destination") else None
        
        waypoints = []
        for wp_data in data.get("waypoints", []):
            waypoints.append(Waypoint.from_dict(wp_data))
            
        route = cls(
            id=UUID(data["id"]) if "id" in data else uuid4(),
            name=data.get("name", ""),
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            path_type=data.get("path_type", "direct"),
            optimization_method=data.get("optimization_method", ""),
            distance=data.get("distance_km", 0),
            fitness_score=data.get("fitness_score", 0)
        )
        
        if "created_at" in data:
            try:
                route.created_at = datetime.fromisoformat(data["created_at"])
            except ValueError:
                route.created_at = datetime.utcnow()
                
        if "reroute_history" in data:
            route.reroute_history = data["reroute_history"]
            
        return route
