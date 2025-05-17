from pydantic import BaseModel
from typing import Optional, Dict, Any


class Aircraft(BaseModel):
    """Aircraft specifications model."""

    model: str
    manufacturer: str
    mtow_kg: float  # Maximum Take-Off Weight in kg
    max_range_km: float
    cruise_speed_kmh: float
    fuel_capacity_liters: float
    fuel_consumption_lph: float  # Liters per hour at cruise
    ceiling_m: float  # Maximum operational altitude in meters
    additional_specs: Optional[Dict[str, Any]] = None

    def to_dict(self):
        return {
            "model": self.model,
            "manufacturer": self.manufacturer,
            "mtow_kg": self.mtow_kg,
            "max_range_km": self.max_range_km,
            "cruise_speed_kmh": self.cruise_speed_kmh,
            "fuel_capacity_liters": self.fuel_capacity_liters,
            "fuel_consumption_lph": self.fuel_consumption_lph,
            "ceiling_m": self.ceiling_m,
            "additional_specs": self.additional_specs,
        }

    def calculate_estimated_fuel(self, distance_km: float) -> float:
        """Calculate estimated fuel consumption for a given distance."""
        flight_hours = distance_km / self.cruise_speed_kmh
        return flight_hours * self.fuel_consumption_lph
