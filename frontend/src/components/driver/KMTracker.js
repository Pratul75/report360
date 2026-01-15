import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { driverDashboardAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Camera, MapPin, CheckCircle, PlayCircle, StopCircle, AlertCircle, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

const KMTracker = ({ kmLog, onUpdate }) => {
  // REMOVED: Manual KM entry state (as per requirements)
  const [startPhoto, setStartPhoto] = useState(null);
  const [endPhoto, setEndPhoto] = useState(null);
  const [startGPS, setStartGPS] = useState(null);
  const [endGPS, setEndGPS] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  
  const startPhotoInputRef = useRef(null);
  const endPhotoInputRef = useRef(null);

  // GPS Location Capture (PRIMARY data source for KM tracking)
  const getGPSLocation = (setGPS, journeyType = 'start') => {
    setGpsLoading(true);
    setGpsError('');

    if (!navigator.geolocation) {
      const errorMsg = 'GPS not supported by your device. GPS is required for KM tracking.';
      setGpsError(errorMsg);
      setGpsLoading(false);
      toast.error(errorMsg);
      return;
    }

    toast.loading(`Capturing ${journeyType} location... (Force fresh GPS)`, { id: 'gps-capture' });

    // CRITICAL: Clear browser cache and force fresh GPS
    console.log('🎯 Starting GPS capture - forcing fresh location...');
    
    // Alert user to check their device
    console.log('📍 Device Check:', {
      hasGeolocation: !!navigator.geolocation,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Try with high accuracy first - ULTRA STRICT NO CACHE POLICY
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        const gpsData = { latitude, longitude, accuracy };
        
        // Debug logging for GPS capture - EXTENSIVE
        console.log(`✅ GPS Captured (${journeyType}):`, {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: `±${Math.round(accuracy)}m`,
          timestamp: new Date(position.timestamp).toISOString(),
          captureTime: new Date().toISOString(),
          timeDiff: `${Date.now() - position.timestamp}ms`,
          altitude: altitude,
          altitudeAccuracy: altitudeAccuracy,
          heading: heading,
          speed: speed,
          raw: position.coords,
          positionAge: position.timestamp ? `${Date.now() - position.timestamp}ms old` : 'unknown',
          googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
        });
        
        // ULTRA STRICT: Reject anything older than 1 second
        const positionAge = Date.now() - position.timestamp;
        console.log(`⏱️ Position Age: ${positionAge}ms`);
        
        if (positionAge > 1000) {
          console.warn(`⚠️ GPS position is ${Math.round(positionAge/1000)}s old - REJECTED!`);
          console.warn(`🔍 This is cached location. Need fresh GPS.`);
          console.warn(`📱 Device Info:`, {
            position: { lat: latitude, lng: longitude },
            age: `${positionAge}ms`,
            timestamp: new Date(position.timestamp).toISOString(),
            now: new Date().toISOString()
          });
          toast.error(`❌ Location is cached (${Math.round(positionAge/1000)}s old)\n\n✓ Enable device GPS\n✓ Turn on High Accuracy\n✓ Refresh page\n✓ Try again`, { duration: 10000 });
          setGpsLoading(false);
          toast.dismiss('gps-capture');
          return;
        }
        
        console.log('✅ Fresh GPS position accepted (age: ' + positionAge + 'ms)');
        
        // Verify coordinates are valid
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          console.error('❌ Invalid GPS coordinates:', gpsData);
          toast.error('Invalid GPS coordinates received. Please try again.');
          setGpsLoading(false);
          return;
        }
        
        setGPS(gpsData);
        setGpsLoading(false);
        toast.dismiss('gps-capture');
        toast.success(
          `${journeyType === 'start' ? 'Start' : 'End'} location captured!\nLat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}\nAccuracy: ±${Math.round(accuracy)}m`,
          { duration: 4000 }
        );
      },
      (error) => {
        console.error('GPS error (high accuracy):', error);
        
        // If high accuracy fails, try with lower accuracy
        if (error.code === 3) { // Timeout
          toast.loading('Retrying with lower accuracy...', { id: 'gps-capture' });
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              const gpsData = { latitude, longitude, accuracy };
              
              // Debug logging for fallback GPS capture
              console.log(`✅ GPS Captured (${journeyType} - Fallback):`, {
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6),
                accuracy: accuracy ? `±${Math.round(accuracy)}m` : 'unknown',
                timestamp: new Date(position.timestamp).toISOString(),
                captureTime: new Date().toISOString(),
                timeDiff: `${Date.now() - position.timestamp}ms`,
                method: 'low-accuracy',
                raw: position.coords,
                positionAge: position.timestamp ? `${Date.now() - position.timestamp}ms old` : 'unknown',
                googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
              });
              
              // STRICT: Warning if fallback position is old (more than 5 seconds)
              const positionAge = Date.now() - position.timestamp;
              if (positionAge > 5000) {
                console.warn(`⚠️ Fallback GPS position is ${Math.round(positionAge/1000)}s old - might be cached!`);
                console.warn(`🔍 Device may be using cached location. Check location settings.`);
                toast.error(`⚠️ GPS using cached location (${Math.round(positionAge/1000)}s old).\n\nDevice location issue detected.\nMove to open area and enable high accuracy mode.`, { duration: 8000 });
                setGpsLoading(false);
                toast.dismiss('gps-capture');
                return;
              }
              
              setGPS(gpsData);
              setGpsLoading(false);
              toast.dismiss('gps-capture');
              toast.success(
                `${journeyType === 'start' ? 'Start' : 'End'} location captured!\nLat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
                { duration: 4000 }
              );
            },
            (fallbackError) => {
              console.error('GPS error (fallback):', fallbackError);
              let errorMsg = 'Failed to get GPS location';
              if (fallbackError.code === 1) {
                errorMsg = 'GPS permission denied. Please enable location access in your browser settings.';
              } else if (fallbackError.code === 2) {
                errorMsg = 'GPS position unavailable. Ensure location services are enabled.';
              } else if (fallbackError.code === 3) {
                errorMsg = 'GPS timeout. Move to an open area with clear sky view and try again.';
              }
              setGpsError(errorMsg);
              setGpsLoading(false);
              toast.dismiss('gps-capture');
              toast.error(errorMsg, { duration: 6000 });
            },
            { 
              enableHighAccuracy: false, 
              timeout: 30000, // 30 seconds for fallback
              maximumAge: 0 // NO CACHE - Force fresh GPS
            }
          );
        } else {
          let errorMsg = 'Failed to get GPS location';
          if (error.code === 1) {
            errorMsg = 'GPS permission denied. Please enable location access in your browser settings.';
          } else if (error.code === 2) {
            errorMsg = 'GPS position unavailable. Ensure location services are enabled.';
          }
          setGpsError(errorMsg);
          setGpsLoading(false);
          toast.dismiss('gps-capture');
          toast.error(errorMsg, { duration: 6000 });
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, // 15 seconds for high accuracy
        maximumAge: 0 
      }
    );
  };

  // Record Start Journey Mutation (GPS-based)
  const startKMMutation = useMutation({
    mutationFn: (data) => driverDashboardAPI.recordStartKM(data),
    onSuccess: (response) => {
      toast.success('Journey started successfully!');
      setStartPhoto(null);
      setStartGPS(null);
      onUpdate();
    },
    onError: (error) => {
      console.error('Start journey error:', error);
      let errorMsg = 'Failed to start journey';
      
      // Handle different error response structures
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
        } 
        // Handle string error messages
        else if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        }
        // Handle object with error/message property
        else if (data.error) {
          errorMsg = data.error;
        } else if (data.message) {
          errorMsg = data.message;
        }
      }
      
      toast.error(errorMsg, { duration: 5000 });
    },
  });

  // Record End Journey Mutation (GPS-based, auto-calculates distance)
  const endKMMutation = useMutation({
    mutationFn: (data) => driverDashboardAPI.recordEndKM(data),
    onSuccess: (response) => {
      const totalKM = response?.data?.total_km || response?.total_km || 0;
      toast.success(`Journey completed! Total distance: ${totalKM.toFixed(2)} KM`, { duration: 5000 });
      setEndPhoto(null);
      setEndGPS(null);
      onUpdate();
    },
    onError: (error) => {
      console.error('End journey error:', error);
      let errorMsg = 'Failed to end journey';
      
      // Handle different error response structures
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
        } 
        // Handle string error messages
        else if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        }
        // Handle object with error/message property
        else if (data.error) {
          errorMsg = data.error;
        } else if (data.message) {
          errorMsg = data.message;
        }
      }
      
      toast.error(errorMsg, { duration: 5000 });
    },
  });

  // Handle Start Journey Submit (GPS + Photo only, NO manual KM)
  const handleStartKMSubmit = (e) => {
    e.preventDefault();

    // VALIDATION: Photo is mandatory
    if (!startPhoto) {
      toast.error('Please upload an activity photo to start journey');
      return;
    }

    // VALIDATION: GPS is mandatory (single source of truth)
    if (!startGPS) {
      toast.error('Please capture GPS location to start journey');
      return;
    }

    // CRITICAL FIX: Send only base64 string, not the whole object
    const submitData = {
      latitude: startGPS.latitude,
      longitude: startGPS.longitude,
      start_km_photo: startPhoto.base64 || startPhoto // Extract base64 string from object
    };

    console.log('📤 Submitting Start Journey:', {
      latitude: submitData.latitude,
      longitude: submitData.longitude,
      photoSize: startPhoto.base64 ? `${(startPhoto.base64.length / 1024).toFixed(2)} KB` : 'N/A',
      photoFormat: typeof submitData.start_km_photo,
      timestamp: new Date().toISOString()
    });

    startKMMutation.mutate(submitData);
  };

  // Handle End Journey Submit (GPS-based, NO manual KM entry)
  const handleEndKMSubmit = (e) => {
    e.preventDefault();

    // REMOVED: Manual end KM validation (not needed with GPS-based tracking)

    // VALIDATION: Photo is mandatory
    if (!endPhoto) {
      toast.error('Please upload an activity photo to end journey');
      return;
    }

    // VALIDATION: GPS is mandatory (single source of truth)
    if (!endGPS) {
      toast.error('Please capture GPS location to end journey');
      return;
    }

    // CRITICAL FIX: Send only base64 string, not the whole object
    const submitData = {
      latitude: endGPS.latitude,
      longitude: endGPS.longitude,
      end_km_photo: endPhoto.base64 || endPhoto // Extract base64 string from object
    };

    console.log('📤 Submitting End Journey:', {
      latitude: submitData.latitude,
      longitude: submitData.longitude,
      photoSize: endPhoto.base64 ? `${(endPhoto.base64.length / 1024).toFixed(2)} KB` : 'N/A',
      photoFormat: typeof submitData.end_km_photo,
      timestamp: new Date().toISOString()
    });

    endKMMutation.mutate(submitData);
  };

  // Handle Photo Capture/Upload
  const handlePhotoCapture = (e, setPhoto) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Convert to base64 for sending to backend
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        console.log('📸 Photo captured:', {
          filename: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          base64Length: base64String.length,
          type: file.type
        });
        setPhoto({
          file: file,
          base64: base64String,
          name: file.name
        });
        toast.success('Photo captured successfully');
      };
      reader.onerror = () => {
        console.error('❌ Failed to read photo file');
        toast.error('Failed to read photo');
      };
      reader.readAsDataURL(file);
    }
  };

  const status = kmLog?.status || 'PENDING';
  const hasStarted = status === 'IN_PROGRESS' || status === 'COMPLETED';
  const isCompleted = status === 'COMPLETED';

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">KM Tracker</CardTitle>
            <CardDescription>Record your daily kilometers with GPS and photo proof</CardDescription>
          </div>
          <Badge 
            variant={isCompleted ? 'success' : hasStarted ? 'warning' : 'secondary'}
            className="text-sm"
          >
            {isCompleted ? 'Completed' : hasStarted ? 'In Progress' : 'Not Started'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* GPS Error Alert */}
        {gpsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{gpsError}</AlertDescription>
          </Alert>
        )}

        {/* Current KM Log Info */}
        {kmLog && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Start KM</p>
                <p className="font-bold text-lg">{kmLog.start_km || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">End KM</p>
                <p className="font-bold text-lg">{kmLog.end_km || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Total KM</p>
                <p className="font-bold text-lg text-green-600">{kmLog.total_km || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-bold text-lg capitalize">{status.toLowerCase()}</p>
              </div>
            </div>
          </div>
        )}

        {/* START JOURNEY SECTION - GPS Based (NO Manual KM Entry) */}
        {!hasStarted && (
          <form onSubmit={handleStartKMSubmit} className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Start Journey (GPS-Based Tracking)</h3>
            </div>

            {/* REMOVED: Manual KM Input - GPS is the single source of truth */}
            
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Navigation className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">GPS-Based Distance Tracking</p>
                  <p className="text-xs text-blue-800">
                    No manual KM entry required. System automatically calculates distance travelled using GPS coordinates from start to end locations.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Photo * (Proof of journey start)
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-800">
                  📸 Upload any photo as proof of activity. Photo is NOT for odometer verification.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={startPhotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, setStartPhoto)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startPhotoInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {startPhoto ? 'Change Photo' : 'Upload Activity Photo'}
                </Button>
                {startPhoto && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {startPhoto.name || (startPhoto.file && startPhoto.file.name) || 'Photo captured'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPS Start Location * (Required for distance calculation)
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-800">
                  📍 For best GPS accuracy: Move to open area, ensure location is enabled in settings.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => getGPSLocation(setStartGPS, 'start')}
                  disabled={gpsLoading}
                  className="flex items-center justify-center gap-2 w-full"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Capturing start location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Capture Start Location
                    </>
                  )}
                </Button>
                {startGPS && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <div className="text-sm flex-1">
                        <p className="font-medium">GPS Captured Successfully ✅</p>
                        <p className="text-xs mt-1 font-mono">
                          Lat: {startGPS.latitude.toFixed(6)}, Long: {startGPS.longitude.toFixed(6)}
                          {startGPS.accuracy && <> (±{Math.round(startGPS.accuracy)}m)</>}
                        </p>
                        <a 
                          href={`https://www.google.com/maps?q=${startGPS.latitude},${startGPS.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                        >
                          📍 View on Google Maps →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={startKMMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {startKMMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Journey
                </>
              )}
            </Button>
          </form>
        )}

        {/* END JOURNEY SECTION - GPS Based (NO Manual KM Entry) */}
        {hasStarted && !isCompleted && (
          <form onSubmit={handleEndKMSubmit} className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <StopCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold">End Journey (GPS Auto-Calculate Distance)</h3>
            </div>

            {/* REMOVED: Manual End KM Input - GPS auto-calculates distance */}
            
            {kmLog?.start_latitude && kmLog?.start_longitude && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Journey Started From:</p>
                <p className="text-xs text-blue-800">
                  📍 Lat: {kmLog.start_latitude.toFixed(6)}, Lng: {kmLog.start_longitude.toFixed(6)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Distance will be automatically calculated from GPS coordinates when you end journey.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Photo * (Proof of journey completion)
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-800">
                  📸 Upload any photo as proof of activity completion. Photo is NOT for odometer verification.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={endPhotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, setEndPhoto)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => endPhotoInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {endPhoto ? 'Change Photo' : 'Upload Activity Photo'}
                </Button>
                {endPhoto && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {endPhoto.name || (endPhoto.file && endPhoto.file.name) || 'Photo captured'}
                  </span>
                )}
              </div>
            </div>

           
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPS End Location * (Required for distance calculation)
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-800">
                  📍 For accurate distance: Ensure location is enabled. Distance will be auto-calculated from start to end GPS coordinates.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => getGPSLocation(setEndGPS, 'end')}
                  disabled={gpsLoading}
                  className="flex items-center justify-center gap-2 w-full"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Capturing end location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Capture End Location
                    </>
                  )}
                </Button>
                {endGPS && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <div className="text-sm flex-1">
                        <p className="font-medium">End Location Captured ✅</p>
                        <p className="text-xs mt-1 font-mono">
                          Lat: {endGPS.latitude.toFixed(6)}, Lng: {endGPS.longitude.toFixed(6)}
                          {endGPS.accuracy && <> (±{Math.round(endGPS.accuracy)}m)</>}
                        </p>
                        <a 
                          href={`https://www.google.com/maps?q=${endGPS.latitude},${endGPS.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                        >
                          📍 View on Google Maps →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={endKMMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {endKMMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating distance & completing journey...
                </>
              ) : (
                <>
                  <StopCircle className="w-4 h-4 mr-2" />
                  End Journey & Calculate Distance
                </>
              )}
            </Button>
          </form>
        )}

        {/* COMPLETED STATE - Show GPS-based distance */}
        {isCompleted && (
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Journey Completed!
            </h3>
            {kmLog?.total_km && (
              <div className="bg-white border-2 border-green-300 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-600 mb-1">GPS-Calculated Distance</p>
                <p className="text-3xl font-bold text-green-700">{kmLog.total_km.toFixed(2)} KM</p>
                <p className="text-xs text-gray-500 mt-2">Auto-calculated from GPS coordinates</p>
              </div>
            )}
            <p className="text-green-700">
              You traveled {kmLog.total_km} KM today
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KMTracker;
