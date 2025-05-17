# services/optimization/ppo_rerouter.py
import logging
from typing import List, Optional, Dict, Any, Tuple
from uuid import uuid4
from geopy.distance import geodesic
import copy

from models.route import Route
from models.waypoint import Waypoint, WaypointStatus
from models.airport import Airport

logger = logging.getLogger(__name__)

class PPORerouter:
    """PPO-based rerouting logic for flight paths."""
    
    def __init__(self):
        self.used_route_types = []
        
    def reroute(self, 
                blocked_waypoint: Waypoint, 
                current_route: Route, 
                alternative_routes: List[Route],
                current_position: Optional[Waypoint] = None) -> Optional[Route]:
        """
        Reroute a flight path when a waypoint is blocked.
        
        Args:
            blocked_waypoint: The waypoint that needs to be avoided
            current_route: The currently active route
            alternative_routes: Other possible routes to consider for rerouting
            current_position: Current aircraft position (defaults to waypoint before blocked)
            
        Returns:
            A new Route object with the rerouted path, or None if rerouting failed
        """
        if not blocked_waypoint or not current_route or not alternative_routes:
            logger.warning("Missing required parameters for rerouting")
            return None
            
        logger.info(f"PPO Rerouting from {current_route.name} around blocked waypoint {blocked_waypoint.name}")
        
        # Reset used route types if this is a new rerouting session
        if not hasattr(current_route, "reroute_history") or not current_route.reroute_history:
            self.used_route_types = [current_route.path_type]
        else:
            # Extract used route types from reroute history
            self.used_route_types = [route_type for _, route_type in current_route.reroute_history]
            
        # If no current_position is provided, use the waypoint before the blocked one
        if not current_position:
            try:
                blocked_index = current_route.waypoints.index(blocked_waypoint)
                if blocked_index > 0:
                    current_position = current_route.waypoints[blocked_index - 1]
                    current_position.status = WaypointStatus.ACTIVE
                else:
                    # If blocked waypoint is the first one, current position is the origin
                    logger.warning("Cannot reroute from origin - first waypoint is blocked")
                    return None
            except ValueError:
                logger.error(f"Blocked waypoint not found in current route")
                return None
                
        # Find the closest waypoint in alternative routes, excluding used route types
        reroute_targets = []
        
        for alt_route in alternative_routes:
            # Skip routes with previously used path types
            if alt_route.path_type in self.used_route_types:
                continue
                
            # Find closest waypoint in this alternative route
            nearest_wp = None
            nearest_index = -1
            min_distance = float('inf')
            
            for i, wp in enumerate(alt_route.waypoints):
                distance = current_position.calculate_distance(wp)
                if distance < min_distance:
                    min_distance = distance
                    nearest_wp = wp
                    nearest_index = i
                    
            if nearest_wp:
                reroute_targets.append({
                    'route': alt_route,
                    'target_waypoint': nearest_wp,
                    'target_index': nearest_index,
                    'distance': min_distance
                })
                
        # No valid reroute targets found
        if not reroute_targets:
            logger.warning("No valid alternative routes found for rerouting")
            return None
            
        # Sort targets by distance (closest first)
        reroute_targets.sort(key=lambda x: x['distance'])
        best_reroute = reroute_targets[0]
        
        logger.info(f"Selected reroute target: {best_reroute['target_waypoint'].name} on route {best_reroute['route'].name} (distance: {best_reroute['distance']:.2f} km)")
        
        # Create a new rerouted path
        rerouted_route = self._create_rerouted_path(
            current_route=current_route,
            blocked_waypoint=blocked_waypoint,
            current_position=current_position,
            alternative_route=best_reroute['route'],
            target_waypoint=best_reroute['target_waypoint'],
            target_index=best_reroute['target_index']
        )
        
        # Add route type to used routes
        self.used_route_types.append(best_reroute['route'].path_type)
        
        return rerouted_route
        
    def _create_rerouted_path(self,
                             current_route: Route,
                             blocked_waypoint: Waypoint,
                             current_position: Waypoint,
                             alternative_route: Route,
                             target_waypoint: Waypoint,
                             target_index: int) -> Route:
        """Create a new route by combining the current route up to current_position with 
        the alternative route from target_waypoint to destination."""
        
        # Find indices in current route
        try:
            current_pos_index = current_route.waypoints.index(current_position)
            blocked_index = current_route.waypoints.index(blocked_waypoint)
        except ValueError:
            # Fallback if waypoints are not found (shouldn't happen with proper inputs)
            logger.error("Cannot find position indices in current route")
            current_pos_index = max(0, len(current_route.waypoints) - 1)
            blocked_index = current_pos_index + 1
            
        # Get waypoints from current route up to current position
        waypoints_initial = current_route.waypoints[:current_pos_index + 1]
        
        # Get waypoints from alternative route after target position
        waypoints_alt = alternative_route.waypoints[target_index:]
        
        # Combine waypoints
        combined_waypoints = waypoints_initial + waypoints_alt
        
        # Create reroute record
        reroute_record = (blocked_waypoint.name, alternative_route.path_type)
        
        # Create a new route
        rerouted_route = Route(
            id=uuid4(),
            name=f"Rerouted_{current_route.name}",
            origin=current_route.origin,
            destination=current_route.destination,
            waypoints=combined_waypoints,
            path_type=f"rerouted_{alternative_route.path_type}",
            optimization_method="ppo",
            distance=0,  # Will be calculated
            fitness_score=0  # Will be calculated
        )
        
        # Add reroute history (preserve existing if any)
        if hasattr(current_route, "reroute_history") and current_route.reroute_history:
            rerouted_route.reroute_history = current_route.reroute_history + [reroute_record]
        else:
            rerouted_route.reroute_history = [reroute_record]
            
        # Calculate distance and fitness
        rerouted_route.calculate_total_distance()
        rerouted_route.calculate_fitness_score()
        
        logger.info(f"Created rerouted path with {len(rerouted_route.waypoints)} waypoints")
        return rerouted_route
