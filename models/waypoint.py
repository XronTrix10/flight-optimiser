from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import uuid4, UUID
from datetime import datetime
from enum import Enum


class WaypointStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PASSED = "passed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"


class Waypoint(BaseModel):
    """Waypoint data model."""

    id: UUID = Field(default_factory=uuid4)
    sequence: int
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    weather_data: Optional[Dict[str, Any]] = None
    status: WaypointStatus = WaypointStatus.PENDING
    estimated_arrival: Optional[datetime] = None

    def to_dict(self):
        return {
            "id": str(self.id),
            "sequence": self.sequence,
            "coordinates": [self.latitude, self.longitude],
            "altitude": self.altitude,
            "weather_data": self.weather_data,
            "status": self.status,
            "estimated_arrival": (
                self.estimated_arrival.isoformat() if self.estimated_arrival else None
            ),
        }

    def mark_as_blocked(self):
        """Mark this waypoint as blocked."""
        self.status = WaypointStatus.BLOCKED
        return self

    def mark_as_active(self):
        """Mark this waypoint as active (current position)."""
        self.status = WaypointStatus.ACTIVE
        return self

    def mark_as_passed(self):
        """Mark this waypoint as passed."""
        self.status = WaypointStatus.PASSED
        return self
