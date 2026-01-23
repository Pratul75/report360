import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverDashboardAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  Truck, 
  User, 
  Phone, 
  Camera, 
  Navigation,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';

const JourneyDetails = () => {
  const { driverId, date } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const canViewAllDrivers = ['admin', 'operations_manager'].includes(userRole);
  
  // If it's driver's own journey, use their own endpoint
  const isOwnJourney = userRole === 'driver' && (!driverId || driverId === 'me');

  // Fetch journey details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['journeyDetails', driverId || 'me', date],
    queryFn: () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log('🔍 Fetching Journey Details:', {
        driverId: driverId,
        targetDate: targetDate,
        userRole: userRole,
        isOwnJourney: isOwnJourney,
        queryEnabled: !!date || isOwnJourney
      });
      // Use the new unified API that handles both driver and admin access
      return driverDashboardAPI.getJourneyDetails(driverId, targetDate);
    },
    enabled: !!date || isOwnJourney,
  });

  if (isLoading) {
    console.log('⏳ Loading journey details...');
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    console.error('❌ Journey Details Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error loading journey details</p>
                <p className="text-sm text-red-700">{error.message}</p>
                {error.response?.data?.detail && (
                  <p className="text-xs text-red-600 mt-1">{JSON.stringify(error.response.data.detail)}</p>
                )}
              </div>
            </div>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('✅ Journey Data Received:', {
    hasData: !!data,
    hasKmLog: !!data?.km_log,
    hasDriver: !!data?.driver,
    hasVehicle: !!data?.vehicle,
    fullData: data
  });

  const journey = data?.km_log;
  const driver = data?.driver;
  const vehicle = data?.vehicle;

  // Debug logging for GPS coordinates
  if (journey) {
    console.log('🗺️ Journey GPS Data:', {
      start_lat: journey.start_latitude,
      start_lng: journey.start_longitude,
      end_lat: journey.end_latitude,
      end_lng: journey.end_longitude,
      status: journey.status
    });
  } else {
    console.warn('⚠️ No journey data found in response');
  }

  if (!journey) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Button
          onClick={() => {
            if (location.state && location.state.from) {
              navigate(location.state.from);
            } else {
              navigate(-1);
            }
          }}
          variant="outline"
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No journey data available for this date</p>
              <p className="text-sm text-gray-500 mt-2">{date || new Date().toISOString().split('T')[0]}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status badge component
  const StatusBadge = ({ status }) => {
    if (status === 'COMPLETED') {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    } else if (status === 'IN_PROGRESS') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Play className="w-3 h-3 mr-1" />In Progress</Badge>;
    } else {
      return <Badge variant="secondary"><Square className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  // Format coordinates for display
  const formatCoord = (lat, lng) => {
    if (!lat || !lng) return 'N/A';
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return 'Invalid coordinates';
    return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
  };

  // Validate and format coordinates for Google Maps URL
  const getGoogleMapsUrl = (lat, lng, type = 'point') => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Check if coordinates are valid
    if (isNaN(latNum) || isNaN(lngNum)) {
      console.error('Invalid coordinates:', { lat, lng });
      return null;
    }
    
    // Check if coordinates are within valid range
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      console.error('Coordinates out of range:', { lat: latNum, lng: lngNum });
      return null;
    }
    
    return `https://www.google.com/maps?q=${latNum},${lngNum}`;
  };

  // Get Google Maps directions URL
  const getGoogleMapsDirectionsUrl = (startLat, startLng, endLat, endLng) => {
    const startLatNum = parseFloat(startLat);
    const startLngNum = parseFloat(startLng);
    const endLatNum = parseFloat(endLat);
    const endLngNum = parseFloat(endLng);
    
    // Check if all coordinates are valid
    if (isNaN(startLatNum) || isNaN(startLngNum) || isNaN(endLatNum) || isNaN(endLngNum)) {
      console.error('Invalid coordinates for directions:', { startLat, startLng, endLat, endLng });
      return null;
    }
    
    // Check if coordinates are within valid range
    if (startLatNum < -90 || startLatNum > 90 || startLngNum < -180 || startLngNum > 180 ||
        endLatNum < -90 || endLatNum > 90 || endLngNum < -180 || endLngNum > 180) {
      console.error('Coordinates out of range for directions');
      return null;
    }
    
    return `https://www.google.com/maps/dir/${startLatNum},${startLngNum}/${endLatNum},${endLngNum}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => {
            if (location.state && location.state.from) {
              navigate(location.state.from);
            } else {
              navigate(-1);
            }
          }}
          variant="outline"
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journey Details</h1>
            <p className="text-gray-600 mt-1">
              {driver?.name || 'Driver'} - {new Date(journey.log_date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <StatusBadge status={journey.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Journey Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Journey Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900">{journey.total_km || 0} KM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={journey.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(journey.log_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {vehicle && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Vehicle Information</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.vehicle_number}</p>
                      <p className="text-sm text-gray-600">{vehicle.vehicle_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Start Journey Details */}
          {journey.start_latitude && journey.start_longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Play className="w-5 h-5" />
                  Journey Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Start Time</p>
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {formatTimestamp(journey.start_timestamp)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Start Location (GPS)</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {formatCoord(journey.start_latitude, journey.start_longitude)}
                  </p>
                  {getGoogleMapsUrl(journey.start_latitude, journey.start_longitude) ? (
                    <a 
                      href={getGoogleMapsUrl(journey.start_latitude, journey.start_longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Open in Google Maps →
                    </a>
                  ) : (
                    <p className="text-sm text-red-600 mt-2">Invalid GPS coordinates</p>
                  )}
                </div>

                {journey.start_km_photo && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600">Start Photo (Activity Proof)</p>
                    </div>
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <img 
                        src={journey.start_km_photo} 
                        alt="Start Journey Photo" 
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">Image not available</text></svg>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* End Journey Details */}
          {journey.end_latitude && journey.end_longitude && journey.status === 'COMPLETED' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Square className="w-5 h-5" />
                  Journey End
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-600">End Time</p>
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {formatTimestamp(journey.end_timestamp)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-600">End Location (GPS)</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {formatCoord(journey.end_latitude, journey.end_longitude)}
                  </p>
                  {getGoogleMapsUrl(journey.end_latitude, journey.end_longitude) ? (
                    <a 
                      href={getGoogleMapsUrl(journey.end_latitude, journey.end_longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Open in Google Maps →
                    </a>
                  ) : (
                    <p className="text-sm text-red-600 mt-2">Invalid GPS coordinates</p>
                  )}
                </div>

                {journey.end_km_photo && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600">End Photo (Activity Proof)</p>
                    </div>
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <img 
                        src={journey.end_km_photo} 
                        alt="End Journey Photo" 
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">Image not available</text></svg>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Status Message */}
          {journey.status === 'PENDING' && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">Journey Not Started</p>
                    <p className="text-sm text-yellow-700">Driver has not started the journey for this date yet.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* In Progress Status Message */}
          {journey.status === 'IN_PROGRESS' && (
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Journey In Progress</p>
                    <p className="text-sm text-blue-700">Driver is currently on the journey. End details will be available once the journey is completed.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Driver Info */}
        <div className="space-y-6">
          {/* Driver Card */}
          {driver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{driver.name}</p>
                </div>
                
                <Separator />
                
                {driver.phone && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600">Phone</p>
                    </div>
                    <a href={`tel:${driver.phone}`} className="font-medium text-blue-600 hover:underline">
                      {driver.phone}
                    </a>
                  </div>
                )}
                
                {driver.email && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900 text-sm break-all">{driver.email}</p>
                    </div>
                  </>
                )}
                
                {driver.license_number && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600">License Number</p>
                      <p className="font-medium text-gray-900">{driver.license_number}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Map Preview Card */}
          {journey.start_latitude && journey.start_longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Route Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {journey.status === 'COMPLETED' && journey.end_latitude && journey.end_longitude ? (
                    <>
                      <p className="text-sm text-gray-600">View complete route from start to end location</p>
                      {getGoogleMapsDirectionsUrl(journey.start_latitude, journey.start_longitude, journey.end_latitude, journey.end_longitude) ? (
                        <a
                          href={getGoogleMapsDirectionsUrl(journey.start_latitude, journey.start_longitude, journey.end_latitude, journey.end_longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full">
                            <MapPin className="w-4 h-4 mr-2" />
                            View Route in Google Maps
                          </Button>
                        </a>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-red-600">Invalid GPS coordinates - cannot show route</p>
                          <p className="text-xs text-gray-500 mt-1">Please check the journey data</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">View start location</p>
                      {getGoogleMapsUrl(journey.start_latitude, journey.start_longitude) ? (
                        <a
                          href={getGoogleMapsUrl(journey.start_latitude, journey.start_longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full" variant="outline">
                            <MapPin className="w-4 h-4 mr-2" />
                            View Start Location
                          </Button>
                        </a>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-red-600">Invalid GPS coordinates</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Log ID</p>
                <p className="font-mono text-gray-900">{journey.id}</p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Created At</p>
                <p className="text-gray-900">{formatTimestamp(journey.created_at)}</p>
              </div>
              {journey.updated_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-gray-600">Last Updated</p>
                    <p className="text-gray-900">{formatTimestamp(journey.updated_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetails;
