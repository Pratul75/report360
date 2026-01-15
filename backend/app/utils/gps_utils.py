"""GPS utility functions for distance calculation"""
import math
from typing import Tuple, Optional

def haversine_distance(
    lat1: float, 
    lon1: float, 
    lat2: float, 
    lon2: float
) -> float:
    """
    Calculate the great circle distance between two points on Earth
    using the Haversine formula.
    
    Args:
        lat1: Starting latitude in degrees
        lon1: Starting longitude in degrees
        lat2: Ending latitude in degrees
        lon2: Ending longitude in degrees
    
    Returns:
        Distance in kilometers (float)
    
    Formula:
        a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
        c = 2 ⋅ atan2( √a, √(1−a) )
        d = R ⋅ c
        
        where φ is latitude, λ is longitude, R is earth's radius (6371km)
    """
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Differences
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # Haversine formula
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    # Distance in kilometers
    distance = R * c
    
    return round(distance, 2)


def calculate_journey_distance(
    start_lat: Optional[float],
    start_lon: Optional[float],
    end_lat: Optional[float],
    end_lon: Optional[float]
) -> Optional[float]:
    """
    Calculate journey distance from start and end GPS coordinates.
    Returns None if any coordinate is missing.
    
    Args:
        start_lat: Starting latitude
        start_lon: Starting longitude
        end_lat: Ending latitude
        end_lon: Ending longitude
    
    Returns:
        Distance in kilometers or None if invalid coordinates
    """
    # Validate all coordinates are present
    if None in [start_lat, start_lon, end_lat, end_lon]:
        return None
    
    # Validate coordinate ranges
    if not (-90 <= start_lat <= 90) or not (-90 <= end_lat <= 90):
        raise ValueError("Latitude must be between -90 and 90 degrees")
    
    if not (-180 <= start_lon <= 180) or not (-180 <= end_lon <= 180):
        raise ValueError("Longitude must be between -180 and 180 degrees")
    
    # Calculate distance
    distance = haversine_distance(start_lat, start_lon, end_lat, end_lon)
    
    return distance


def validate_gps_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """
    Validate GPS coordinates.
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if lat is None or lon is None:
        return False, "GPS coordinates are required"
    
    if not (-90 <= lat <= 90):
        return False, f"Invalid latitude: {lat}. Must be between -90 and 90"
    
    if not (-180 <= lon <= 180):
        return False, f"Invalid longitude: {lon}. Must be between -180 and 180"
    
    return True, None
