# Flight Optimization API – Reference Guide  

================================================

Base URL (default dev server)  
```
http://localhost:8000
```

Health-check  
```
GET /health          → 200 OK {"status":"healthy"}
```

No authentication is required right now; every endpoint returns JSON unless noted.

--------------------------------------------------------------------
1. Airports API  [controllers/airports_controller.py](file:///flight_optimization/controllers/airports_controller.py)
--------------------------------------------------------------------

| Verb | Path | Description |
|------|------|-------------|
| GET | /api/airports | List airports (optionally filter by country) |
| GET | /api/airports/routes | Direct-flight adjacency list |
| GET | /api/airports/{iata_code} | Airport detail by IATA code |

### 1.1  GET /api/airports  
Query-string  ?country_code=IN (default “IN”).  
Response `200 OK` – array of Airport objects.

Airport schema
```jsonc
{
  "iata_code": "BLR",
  "name": "Kempegowda International Airport",
  "city": "Bangalore",
  "country": "India",
  "coordinates": [12.9500, 77.6680],
  "elevation": 915,
  "timezone": "Asia/Kolkata",
  "direct_connections": ["DEL", "BOM", "..."]
}
```

### 1.2  GET /api/airports/routes  
Returns a dictionary where each key is an origin IATA and the value is a list of IATA codes that can be reached by direct flight.

```json
{
  "BLR": ["DEL", "BOM"],
  "DEL": ["BLR", "BOM"]
}
```

### 1.3  GET /api/airports/{iata_code}  
404 if airport not found.

--------------------------------------------------------------------
2. Aircraft API  [controllers/aircraft_controller.py](file:///flight_optimization/controllers/aircraft_controller.py)
--------------------------------------------------------------------

| Verb | Path | Description |
|------|------|-------------|
| GET | /api/aircraft | List all aircraft models |
| GET | /api/aircraft/{model} | Get specs for one model |

Aircraft schema
```jsonc
{
  "model": "A320",
  "manufacturer": "Airbus",
  "mtow_kg": 78000,
  "max_range_km": 6100,
  "cruise_speed_kmh": 840,
  "fuel_capacity_liters": 24210,
  "fuel_consumption_lph": 2500,
  "ceiling_m": 12000,
  "additional_specs": null
}
```

--------------------------------------------------------------------
3. Route Generation & Management  
   [controllers/routes_controller.py](file:///flight_optimization/controllers/routes_controller.py)
--------------------------------------------------------------------

| Verb | Path | Description |
|------|------|-------------|
| POST | /api/routes/generate | Create alternative routes and return the optimized one |
| GET  | /api/routes/{route_id} | Fetch a stored route *(not yet implemented, returns 404)* |
| POST | /api/routes/block-waypoint | Mark a waypoint blocked & trigger real-time re-route |

### 3.1  POST /api/routes/generate  
Request body
```jsonc
{
  "origin": "BLR",
  "destination": "DEL",
  "aircraft_model": "A320",          // optional
  "route_types": ["left","right"],   // optional – default six presets
  "optimization_method": "aco",      // "aco" | "genetic" | null
  "excluded_areas": [                // optional – circles to avoid
    { "center": [12.8, 77.6], "radius": 0.2 }
  ]
}
```

Response `200 OK`
```jsonc
{
  "all_routes": [ { /* Route */ }, ... ],
  "optimized_route": { /* Route */ }
}
```

Route schema (truncated)
```jsonc
{
  "id": "9f4d7a08-6c2e-4e9d-9b47-fc8d2caa8e54",
  "name": "BLR to DEL (left)",
  "origin": { /* Airport */ },
  "destination": { /* Airport */ },
  "waypoints": [
    {
      "id": "…",
      "sequence": 1,
      "coordinates": [13.01, 77.43],
      "weather_data": { ... },
      "status": "pending"
    }
  ],
  "route_type": "left",
  "distance_km": 1765.2,
  "estimated_duration_minutes": 125.4,
  "optimization_method": "aco",
  "fitness_score": 0.23,
  "fuel_consumption": 2100.7
}
```

Errors:  
• 404 if origin/destination not found  
• 500 on unexpected failure

### 3.2  POST /api/routes/block-waypoint  
Marks a waypoint as blocked during flight; the **RouteAdjuster** recalculates a new optimal path and pushes updates to all WebSocket subscribers.

Request body
```json
{
  "route_id": "9f4d7a08-6c2e-4e9d-9b47-fc8d2caa8e54",
  "waypoint_id": "288a2fef-8d3a-4c5c-82ae-bcc5d1d3508e"
}
```
Response `200 OK`
```json
{ "new_route": { /* updated route */ } }
```

--------------------------------------------------------------------
4. Optimization API  
   [controllers/optimization_controller.py](file:///flight_optimization/controllers/optimization_controller.py)
--------------------------------------------------------------------

| Verb | Path | Description |
|------|------|-------------|
| POST | /api/optimize/compare | Run both ACO & GA on the same set of routes |
| POST | /api/optimize/optimize | (stub) optimize by IDs – returns 501 |

### 4.1  POST /api/optimize/compare  
Body – list of route objects (as returned by `/api/routes/generate`).  
Response
```jsonc
{
  "aco_result":      { /* Route or null */ },
  "genetic_result":  { /* Route or null */ },
  "recommendation":  { /* Best route */ }
}
```

--------------------------------------------------------------------
5. WebSocket for Real-time Updates  
   [app.py](file:///flight_optimization/app.py)  + [realtime/websocket_manager.py](file:///flight_optimization/realtime/websocket_manager.py)
--------------------------------------------------------------------

Endpoint  
```
ws://localhost:8000/ws/route/{route_id}
```

Upon connection the server keeps the socket open.

Client → Server messages  
```jsonc
// Block a waypoint in real-time
{
  "block_waypoint": true,
  "waypoint_id": "288a2fef-…"
}
```

Server → Client push formats  
```jsonc
// Route replaced
{
  "type": "route_update",
  "data": { /* Route */ }
}

// Waypoint status changed (PASSED / ACTIVE / BLOCKED)
{
  "type": "waypoint_status",
  "data": {
    "waypoint_id": "288a2fef-…",
    "status": "passed"
  }
}
```

--------------------------------------------------------------------
6. Error Model
--------------------------------------------------------------------
Every controller ultimately raises `fastapi.HTTPException`.  
Standard payload:
```json
{
  "detail": "Human-readable message"
}
```
Status codes used: 400, 404, 500, 501.

--------------------------------------------------------------------
7. Environment / Config reference  [utils/config.py](file:///flight_optimization/utils/config.py)
--------------------------------------------------------------------
Important variables (defaults in parentheses):

- HOST (0.0.0.0)  PORT (8000)  DEBUG (False)  
- TRAVELPAYOUTS_API_KEY  
- REDIS_URL (for weather cache)  
- WEATHER_CACHE_TTL (3600 s)  
- DEFAULT_OPTIMIZATION_METHOD (aco)  
- ACO_ITERATIONS (50)  GA_GENERATIONS (50)  POPULATION_SIZE (100)  
- WEATHER_VS_DISTANCE_WEIGHT (0.7) etc.

--------------------------------------------------------------------
8. Running the service
--------------------------------------------------------------------
```bash
pip install -r requirements.txt
cp .env.example .env  # edit as needed
python main.py        # starts Uvicorn server
```

--------------------------------------------------------------------
9. Changelog
--------------------------------------------------------------------
• v1.0 (2025-05-13): first public API — airports, aircraft, route generation, optimization (ACO/GA), real-time re-routing via WebSocket.

--------------------------------------------------------------------
Contact
--------------------------------------------------------------------
For questions / bugs open an issue or ping the backend team on Slack.

---

# CHANGES

## API Documentation: Flight Optimization System with PPO Implementation

This documentation outlines how the APIs will work in our flight optimization application after implementing the Ant Colony Optimization (ACO), Genetic Algorithms (GA), and Proximal Policy Optimization (PPO) for route generation and dynamic rerouting.

## Overview

Our system now incorporates three powerful optimization algorithms:
1. **Ant Colony Optimization (ACO)** - For initial route selection
2. **Genetic Algorithm (GA)** - For alternative route generation and optimization
3. **Proximal Policy Optimization (PPO)** - For dynamic rerouting when obstacles are encountered

## API Endpoints

### 1. Route Generation API

#### `POST /api/routes/generate`

Generates optimized flight routes between two airports.

**Request Body:**
```json
{
  "origin": "DEL",
  "destination": "BOM",
  "aircraft_model": "A320",
  "route_types": ["direct", "left", "right", "north", "south", "wide"],
  "optimization_method": "aco",
  "excluded_areas": [
    {
      "center": {"latitude": 25.0, "longitude": 75.0},
      "radius_km": 100
    }
  ]
}
```

**Response:**
```json
{
  "routes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "DEL-BOM (direct)",
      "origin": {
        "iata_code": "DEL",
        "name": "Indira Gandhi International Airport",
        "latitude": 28.5562,
        "longitude": 77.1000
      },
      "destination": {
        "iata_code": "BOM",
        "name": "Chhatrapati Shivaji International Airport",
        "latitude": 19.0896,
        "longitude": 72.8656
      },
      "waypoints": [
        {
          "id": "7b44e510-c482-4c05-a40a-256e7a132842",
          "name": "WP1_direct",
          "latitude": 27.0562,
          "longitude": 76.2000,
          "order": 1
        },
        // Additional waypoints...
      ],
      "path_type": "direct",
      "optimization_method": "aco",
      "distance_km": 1148.56,
      "fitness_score": 4.23,
      "created_at": "2025-05-17T10:30:45.123456"
    },
    // Additional routes...
  ],
  "best_route": {
    // Details of the route with the best fitness score
  }
}
```

### 2. Route Optimization API

#### `POST /api/routes/optimize`

Optimizes a set of routes using the specified method.

**Request Body:**
```json
{
  "routes": [
    // Array of route objects
  ],
  "method": "aco",  // "aco", "genetic", or "ppo"
  "iterations": 50
}
```

**Response:**
```json
{
  "optimized_route": {
    // Details of the optimized route
  },
  "optimization_method": "aco",
  "fitness_score": 3.75,
  "execution_time_ms": 235
}
```

### 3. Route Rerouting API

#### `POST /api/routes/reroute`

Dynamically reroutes a flight when encountering a blocked waypoint using PPO.

**Request Body:**
```json
{
  "current_route": {
    // Current route object
  },
  "blocked_waypoint": {
    "id": "7b44e510-c482-4c05-a40a-256e7a132842",
    "name": "WP3_direct",
    "latitude": 25.0562,
    "longitude": 74.8000,
    "order": 3
  },
  "aircraft_model": "Jet",
  "current_position": {
    "latitude": 26.5000,
    "longitude": 75.5000
  },
  "alternative_routes": [
    // Array of alternative route objects
  ]
}
```

**Response:**
```json
{
  "rerouted_route": {
    "id": "a50e8400-e29b-41d4-a716-446655440123",
    "name": "Rerouted_DEL-BOM",
    "origin": {
      // Origin details
    },
    "destination": {
      // Destination details
    },
    "waypoints": [
      // Updated waypoints
    ],
    "path_type": "rerouted_north",
    "optimization_method": "ppo",
    "distance_km": 1195.32,
    "fitness_score": 4.56,
    "created_at": "2025-05-17T10:45:23.123456",
    "reroute_history": [
      ["WP3_direct", "north"]
    ]
  },
  "reroute_details": {
    "original_route_id": "550e8400-e29b-41d4-a716-446655440000",
    "blocked_waypoint": "WP3_direct",
    "reroute_starting_point": "WP2_direct",
    "alternative_route_type": "north",
    "distance_increase_km": 46.76
  }
}
```

## Implementation Details

### OptimizerFactory

The `OptimizerFactory` class creates appropriate optimizer instances:

```python
optimizer = optimizer_factory.get_optimizer("aco")  # Returns ACOOptimizer instance
rerouter = optimizer_factory.get_rerouter()         # Returns PPORerouter instance
```

### Route Generation Flow

1. Client requests routes between airports
2. `RouteGenerator` creates multiple route alternatives using different path types
3. `OptimizerFactory` creates the appropriate optimizer based on the specified method
4. The optimizer evaluates all routes and selects the best one
5. Response includes all generated routes and identifies the optimal route

### PPO Rerouting Flow

1. Client detects a blocked waypoint and requests rerouting
2. `PPORerouter` analyzes alternative routes
3. PPO algorithm selects the best reroute option
4. A new route is created combining:
   - Original route up to the waypoint before the blocked one
   - Alternative route from the closest waypoint to destination
5. Response includes the new rerouted path and rerouting details

### Advanced Fitness Function

The route selection is based on a sophisticated fitness function that considers:

- Weather conditions (turbulence, thunderstorms, visibility)
- Distance optimization
- Fuel consumption based on jet stream effects
- Airport conditions at origin and destination
- Safety factors (crosswind, runway conditions)

## Using the APIs in Client Applications

### Example: Generating and Optimizing Routes

```javascript
// Request optimal routes between Delhi and Mumbai
const response = await fetch('/api/routes/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    origin: 'DEL',
    destination: 'BOM',
    aircraft_model: 'A320',
    optimization_method: 'aco'
  }),
});

const data = await response.json();
const optimizedRoute = data.best_route;

// Display the optimized route on a map
displayRouteOnMap(optimizedRoute);
```

### Example: Dynamic Rerouting

```javascript
// When a waypoint becomes blocked during flight
const response = await fetch('/api/routes/reroute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    current_route: currentRoute,
    aircraft_model: 'Jet',
    blocked_waypoint: blockedWaypoint,
    current_position: aircraftPosition,
    alternative_routes: alternativeRoutes
  }),
});

const data = await response.json();
const reroutedPath = data.rerouted_route;

// Update the flight path on the map
updateFlightPath(reroutedPath);
```

## Conclusion

The implementation of PPO, along with ACO and GA optimization techniques, has significantly enhanced our flight optimization system. The new APIs provide robust route generation, optimization, and dynamic rerouting capabilities that adapt to changing conditions in real-time, ensuring safer and more efficient flight operations.