from pydantic import BaseModel
from typing import Optional, List, Dict


class Airport(BaseModel):
    """Airport data model."""

    iata_code: str
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    timezone: Optional[str] = None

    # Additional fields for direct connections
    direct_connections: List[str] = []

    def to_dict(self):
        return {
            "iata_code": self.iata_code,
            "name": self.name,
            "city": self.city,
            "country": self.country,
            "coordinates": [self.latitude, self.longitude],
            "elevation": self.elevation,
            "timezone": self.timezone,
            "direct_connections": self.direct_connections,
        }

    @classmethod
    def from_api(cls, api_data):
        """Convert API data format to Airport model."""
        return cls(
            iata_code=api_data.get("code", ""),
            name=api_data.get("name", ""),
            city=api_data.get("city_code", ""),  # Using city_code as city name
            country=api_data.get("country_code", ""),
            latitude=api_data.get("coordinates", {}).get("lat", 0),
            longitude=api_data.get("coordinates", {}).get("lon", 0),
            timezone=api_data.get("time_zone", ""),
            direct_connections=[],
        )
