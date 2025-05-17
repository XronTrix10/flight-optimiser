import logging
import random
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import os
from models.route import Route
from services.weather_service import WeatherService
from utils.distance_calculator import normalize_distance

logger = logging.getLogger(__name__)


class GeneticAlgorithm:
    """Genetic Algorithm for route selection."""

    def __init__(
        self,
        weather_service: WeatherService,
        population_size: int = None,
        generations: int = None,
        mutation_rate: float = 0.2,
        elite_size: int = 2,
    ):
        self.weather_service = weather_service
        self.mutation_rate = mutation_rate
        self.elite_size = elite_size

        # Use environment variables if not provided
        if population_size is None:
            self.population_size = int(os.getenv("POPULATION_SIZE", 100))
        else:
            self.population_size = population_size

        if generations is None:
            self.generations = int(os.getenv("GA_GENERATIONS", 50))
        else:
            self.generations = generations

        self.weather_vs_distance_weight = float(
            os.getenv("WEATHER_VS_DISTANCE_WEIGHT", 0.7)
        )

    def optimize(self, routes: List[Route]) -> Route:
        """Run genetic algorithm to find optimal route."""
        if not routes:
            logger.error("No routes provided for optimization")
            return None

        logger.info(
            f"Running genetic algorithm on {len(routes)} routes for {self.generations} generations"
        )

        # Initial population (randomly select from routes, with replacements to meet population size)
        population = [random.choice(routes) for _ in range(self.population_size)]

        best_route = None
        best_fitness = float("inf")

        for generation in range(self.generations):
            # Evaluate fitness for each route
            fitness_results = [
                (route, self._evaluate_fitness(route)) for route in population
            ]

            # Sort by fitness (lower is better)
            fitness_results.sort(key=lambda x: x[1])

            # Update best route if better
            if fitness_results[0][1] < best_fitness:
                best_fitness = fitness_results[0][1]
                best_route = fitness_results[0][0]
                logger.debug(
                    f"New best route found in generation {generation+1}: {best_route.name}, fitness={best_fitness:.4f}"
                )

            # Select elite routes to pass directly to next generation
            elite_routes = [result[0] for result in fitness_results[: self.elite_size]]

            # Selection, crossover, and mutation to create the next generation
            next_generation = elite_routes.copy()

            # Fill the rest of the population
            while len(next_generation) < self.population_size:
                # Selection
                parent1 = self._selection(fitness_results)
                parent2 = self._selection(fitness_results)

                # Crossover (for routes, this just selects the better parent)
                child = self._crossover(parent1, parent2)

                # Mutation (randomly replace with another route)
                if random.random() < self.mutation_rate:
                    child = random.choice(routes)

                next_generation.append(child)

            # Update the population
            population = next_generation

            if generation % 10 == 0 or generation == self.generations - 1:
                logger.info(
                    f"GA Generation {generation+1}/{self.generations} - Best fitness: {best_fitness:.4f}"
                )

        # Add optimization metadata to best route
        if best_route:
            best_route.optimization_method = "genetic"
            best_route.fitness_score = best_fitness

        return best_route

    def _selection(self, fitness_results: List[Tuple[Route, float]]) -> Route:
        """Select a route using tournament selection."""
        tournament_size = min(5, len(fitness_results))
        tournament = random.sample(fitness_results, tournament_size)
        return min(tournament, key=lambda x: x[1])[
            0
        ]  # Return the route with best fitness

    def _crossover(self, parent1: Route, parent2: Route) -> Route:
        """Perform crossover between two parent routes."""
        # For routes, crossover is simply selecting the better parent
        # This is because we're not creating new routes, just selecting from existing ones
        fitness1 = self._evaluate_fitness(parent1)
        fitness2 = self._evaluate_fitness(parent2)

        return parent1 if fitness1 <= fitness2 else parent2

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
