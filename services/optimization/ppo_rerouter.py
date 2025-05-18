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

    def reroute(
        self,
        blocked_waypoint: Waypoint,
        current_route: Route,
        alternative_routes: List[Route],
        current_position: Optional[Waypoint] = None,
    ) -> Optional[Route]:
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

        logger.info(
            f"PPO Rerouting from {current_route.name} around blocked waypoint {blocked_waypoint.name}"
        )

        # Reset used route types if this is a new rerouting session
        if (
            not hasattr(current_route, "reroute_history")
            or not current_route.reroute_history
        ):
            self.used_route_types = [current_route.path_type]
        else:
            # Extract used route types from reroute history
            self.used_route_types = [
                route_type for _, route_type in current_route.reroute_history
            ]

        # If no current_position is provided, use the waypoint before the blocked one
        if not current_position:
            try:
                blocked_index = current_route.waypoints.index(blocked_waypoint)
                if blocked_index > 0:
                    current_position = current_route.waypoints[blocked_index - 1]
                    current_position.status = WaypointStatus.ACTIVE
                else:
                    # If blocked waypoint is the first one, current position is the origin
                    logger.warning(
                        "Cannot reroute from origin - first waypoint is blocked"
                    )
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
            min_distance = float("inf")

            for i, wp in enumerate(alt_route.waypoints):
                distance = current_position.calculate_distance(wp)
                if distance < min_distance:
                    min_distance = distance
                    nearest_wp = wp
                    nearest_index = i

            if nearest_wp:
                reroute_targets.append(
                    {
                        "route": alt_route,
                        "target_waypoint": nearest_wp,
                        "target_index": nearest_index,
                        "distance": min_distance,
                    }
                )

        # No valid reroute targets found
        if not reroute_targets:
            logger.warning("No valid alternative routes found for rerouting")
            return None

        # Sort targets by distance (closest first)
        reroute_targets.sort(key=lambda x: x["distance"])
        best_reroute = reroute_targets[0]

        logger.info(
            f"Selected reroute target: {best_reroute['target_waypoint'].name} on route {best_reroute['route'].name} (distance: {best_reroute['distance']:.2f} km)"
        )

        # Create a new rerouted path
        rerouted_route = self._create_rerouted_path(
            current_route=current_route,
            blocked_waypoint=blocked_waypoint,
            current_position=current_position,
            alternative_route=best_reroute["route"],
            target_waypoint=best_reroute["target_waypoint"],
            target_index=best_reroute["target_index"],
        )

        # Add route type to used routes
        self.used_route_types.append(best_reroute["route"].path_type)

        return rerouted_route

    def _create_rerouted_path(
        self,
        current_route: Route,
        blocked_waypoint: Waypoint,
        current_position: Waypoint,
        alternative_route: Route,
        target_waypoint: Waypoint,
        target_index: int,
    ) -> Route:
        """Create a new route by combining the current route up to current_position with
        the alternative route from target_waypoint to destination."""

        # Find index in current route for current position and blocked waypoint
        current_pos_index = -1
        blocked_index = -1

        for i, wp in enumerate(current_route.waypoints):
            if wp.id == current_position.id:
                current_pos_index = i
            if wp.id == blocked_waypoint.id:
                blocked_index = i

        if current_pos_index == -1:
            # Current position not found in waypoints by ID, try to find by closest coordinates
            min_distance = float("inf")
            for i, wp in enumerate(current_route.waypoints):
                distance = geodesic(
                    (current_position.latitude, current_position.longitude),
                    (wp.latitude, wp.longitude),
                ).kilometers
                if distance < min_distance:
                    min_distance = distance
                    current_pos_index = i

        logger.info(
            f"Current position index: {current_pos_index}, Blocked index: {blocked_index}"
        )

        # Determine if we're before or after the blocked waypoint
        if blocked_index != -1 and current_pos_index < blocked_index:
            # We're before the blocked waypoint, we need to reroute around it

            # Get waypoints from current route up to current position
            waypoints_initial = current_route.waypoints[: current_pos_index + 1]

            # Calculate how many more waypoints we need from the alternative route
            total_waypoints_needed = len(current_route.waypoints)
            remaining_waypoints_needed = total_waypoints_needed - len(waypoints_initial)

            # For the alternative route, we need to find a good entry point
            # Let's use the target_index provided, or find the closest waypoint to the blocked one
            alt_start_index = target_index

            # Get waypoints from alternative route starting from our entry point
            waypoints_alt = alternative_route.waypoints[alt_start_index:]
            if len(waypoints_alt) > remaining_waypoints_needed:
                waypoints_alt = waypoints_alt[:remaining_waypoints_needed]
            elif len(waypoints_alt) < remaining_waypoints_needed and waypoints_alt:
                logger.warning(
                    f"Alternative route has fewer waypoints than needed. Using what's available."
                )
        else:
            # We're already past the blocked waypoint or it's not in our route
            # Just continue on current route but note the blockage
            waypoints_initial = current_route.waypoints[: current_pos_index + 1]

            # Continue with the remaining waypoints from the current route
            remaining_waypoints = current_route.waypoints[current_pos_index + 1 :]

            # Log a warning about this situation
            logger.warning(
                f"Current position ({current_pos_index}) is already past or equal to blocked waypoint ({blocked_index}). "
                f"Continuing on current route but noting the blockage."
            )

            # Treat the remaining waypoints as if they were from the alternative route
            waypoints_alt = remaining_waypoints

        # Update the order of all waypoints
        combined_waypoints = []
        for i, wp in enumerate(waypoints_initial):
            wp_copy = copy.deepcopy(wp)
            wp_copy.order = i + 1
            # Keep the original name for these waypoints
            combined_waypoints.append(wp_copy)

        next_order = len(combined_waypoints) + 1
        for i, wp in enumerate(waypoints_alt):
            wp_copy = copy.deepcopy(wp)
            wp_copy.id = uuid4()  # Generate new ID to prevent duplicates

            # FIX: Rename waypoints to reflect their new position in sequence
            # Extract the route type from the original name (e.g., "WP5_right" -> "right")
            original_name_parts = wp.name.split("_")
            route_type = (
                original_name_parts[-1] if len(original_name_parts) > 1 else "alt"
            )

            # Create a new name with the correct sequence number
            wp_copy.name = f"WP{next_order + i}_{route_type}"
            wp_copy.order = next_order + i
            combined_waypoints.append(wp_copy)

        logger.info(
            f"Combined route: {len(waypoints_initial)} initial + {len(waypoints_alt)} alternative = {len(combined_waypoints)} total waypoints"
        )

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
            fitness_score=0,  # Will be calculated
        )

        # Add reroute history (preserve existing if any)
        if hasattr(current_route, "reroute_history") and current_route.reroute_history:
            rerouted_route.reroute_history = current_route.reroute_history + [
                reroute_record
            ]
        else:
            rerouted_route.reroute_history = [reroute_record]

        # Calculate distance and fitness
        rerouted_route.calculate_total_distance()
        rerouted_route.calculate_fitness_score()

        logger.info(
            f"Created rerouted path with {len(rerouted_route.waypoints)} waypoints"
        )
        return rerouted_route
