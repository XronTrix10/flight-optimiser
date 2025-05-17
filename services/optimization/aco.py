import logging
import numpy as np
from typing import List, Dict, Any, Optional
import os
from models.route import Route
from services.weather_service import WeatherService
from utils.distance_calculator import normalize_distance

logger = logging.getLogger(__name__)


class AntColonyOptimizer:
    """Ant Colony Optimization for route selection."""

    def __init__(
        self,
        weather_service: WeatherService,
        alpha: float = 1.0,
        beta: float = 2.0,
        evaporation_rate: float = 0.5,
        iterations: int = None,
    ):
        self.weather_service = weather_service
        self.alpha = alpha  # Pheromone importance
        self.beta = beta  # Heuristic importance
        self.evaporation_rate = evaporation_rate

        # Use environment variable for iterations if not provided
        if iterations is None:
            self.iterations = int(os.getenv("ACO_ITERATIONS", 50))
        else:
            self.iterations = iterations

        self.weather_vs_distance_weight = float(
            os.getenv("WEATHER_VS_DISTANCE_WEIGHT", 0.7)
        )

    def optimize(self, routes: List[Route]) -> Route:
        """Run ACO algorithm to find optimal route."""
        if not routes:
            logger.error("No routes provided for optimization")
            return None

        logger.info(
            f"Running ACO optimization on {len(routes)} routes for {self.iterations} iterations"
        )

        # Initialize pheromones
        pheromones = {route.id: 1.0 for route in routes}
        best_route = None
        best_fitness = float("inf")

        for iteration in range(self.iterations):
            # Calculate probabilities based on pheromones and heuristic information
            probabilities = self._calculate_probabilities(routes, pheromones)

            # Select route based on probabilities
            selected_route = self._select_route(routes, probabilities)

            # Evaluate fitness
            fitness = self._evaluate_fitness(selected_route)

            # Update best route if better
            if fitness < best_fitness:
                best_fitness = fitness
                best_route = selected_route
                logger.debug(
                    f"New best route found in iteration {iteration+1}: {best_route.name}, fitness={best_fitness:.4f}"
                )

            # Update pheromones
            self._update_pheromones(pheromones, routes, selected_route, fitness)

            if iteration % 10 == 0 or iteration == self.iterations - 1:
                logger.info(
                    f"ACO Iteration {iteration+1}/{self.iterations} - Best fitness: {best_fitness:.4f}"
                )

        # Add optimization metadata to best route
        if best_route:
            best_route.optimization_method = "aco"
            best_route.fitness_score = best_fitness

        return best_route

    def _calculate_probabilities(
        self, routes: List[Route], pheromones: Dict[str, float]
    ) -> List[float]:
        """Calculate selection probabilities based on pheromones and heuristic values."""
        probabilities = []

        for route in routes:
            # Calculate heuristic value (inverse of fitness - lower fitness is better)
            fitness = self._evaluate_fitness(route)
            heuristic = 1.0 / (
                fitness + 0.0001
            )  # Add small constant to avoid division by zero

            # Calculate probability component
            pheromone_factor = pheromones[route.id] ** self.alpha
            heuristic_factor = heuristic**self.beta

            probabilities.append(pheromone_factor * heuristic_factor)

        # Normalize probabilities
        total = sum(probabilities)
        if total > 0:
            probabilities = [p / total for p in probabilities]
        else:
            # Equal probabilities if total is zero
            probabilities = [1.0 / len(routes) for _ in routes]

        return probabilities

    def _select_route(self, routes: List[Route], probabilities: List[float]) -> Route:
        """Select a route based on probability distribution."""
        return np.random.choice(routes, p=probabilities)

    def _update_pheromones(
        self,
        pheromones: Dict[str, float],
        routes: List[Route],
        selected_route: Route,
        fitness: float,
    ) -> None:
        """Update pheromone levels based on selected route's fitness."""
        # Evaporate all pheromones
        for route_id in pheromones:
            pheromones[route_id] *= 1 - self.evaporation_rate

        # Add new pheromones to selected route
        pheromone_deposit = 1.0 / (
            fitness + 0.0001
        )  # Add small constant to avoid division by zero
        pheromones[selected_route.id] += pheromone_deposit

    def _evaluate_fitness(self, route: Route) -> float:
        """Calculate fitness value (lower is better)."""
        # Get weather score (0-1, lower is better)
        weather_score = self.weather_service.calculate_route_weather_score(route)

        # Calculate normalized distance (0-1, lower is better)
        distance_score = normalize_distance(route.distance_km)

        # Combine scores with weight
        fitness = weather_score * self.weather_vs_distance_weight + distance_score * (
            1 - self.weather_vs_distance_weight
        )

        return fitness
