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