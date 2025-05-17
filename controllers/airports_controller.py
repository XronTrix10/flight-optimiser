import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from api.airport_api import AirportAPI

logger = logging.getLogger(__name__)
router = APIRouter()

airport_api = AirportAPI()


@router.get("/", response_model=List[Dict[str, Any]])
async def get_airports(country_code: str = "IN"):
    """
    Get all airports, optionally filtered by country code.
    Default is India (IN).
    """
    try:
        airports = airport_api.fetch_airports(country_code)
        return [airport.to_dict() for airport in airports]
    except Exception as e:
        logger.error(f"Error fetching airports: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routes", response_model=Dict[str, List[str]])
async def get_direct_routes(country_code: Optional[str] = "IN"):
    """
    Get all direct routes between airports, optionally filtered by country code.
    Default is India (IN).
    """
    try:
        routes = airport_api.fetch_routes(country_code)
        return routes
    except Exception as e:
        logger.error(f"Error fetching routes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{iata_code}", response_model=Dict[str, Any])
async def get_airport(iata_code: str):
    """Get airport details by IATA code."""
    try:
        airports = await airport_api.fetch_airports()
        for airport in airports:
            if airport.iata_code.upper() == iata_code.upper():
                return airport.to_dict()
        raise HTTPException(status_code=404, detail=f"Airport {iata_code} not found")
    except Exception as e:
        logger.error(f"Error fetching airport {iata_code}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
