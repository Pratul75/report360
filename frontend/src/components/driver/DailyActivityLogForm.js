import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dailyActivityAPI } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Upload, MapPin, Calendar, X, Plus, Save, Camera, Navigation } from 'lucide-react';
import { format } from 'date-fns';

const DailyActivityLogForm = ({ campaignId, driverId, campaignAssignmentId, onSuccess }) => {
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activityDetails, setActivityDetails] = useState('');
  const [villages, setVillages] = useState([]);
  const [newVillage, setNewVillage] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [extraData, setExtraData] = useState('{}');
  const [errors, setErrors] = useState({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef(null);

  // Camera capture function
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleImageCapture = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImages(prev => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          
          // Get address from coordinates (optional)
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data.display_name) {
              setLocationAddress(data.display_name);
            }
          } catch (error) {
            console.error('Error getting address:', error);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors({ location: 'Unable to get your location. Please enable GPS.' });
          setIsGettingLocation(false);
        }
      );
    } else {
      setErrors({ location: 'Geolocation is not supported by your browser.' });
      setIsGettingLocation(false);
    }
  }, []);

  // Create daily log mutation
  const createLogMutation = useMutation({
    mutationFn: (logData) => dailyActivityAPI.createDailyLog(logData),
    onSuccess: (data) => {
      console.log('Daily log created successfully:', data);
      // Reset form
      setActivityDetails('');
      setVillages([]);
      setImages([]);
      setLatitude('');
      setLongitude('');
      setLocationAddress('');
      setExtraData('{}');
      setErrors({});
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      console.error('Error creating daily log:', error);
      setErrors({ submit: error.response?.data?.detail || 'Failed to create log' });
    }
  });

  const handleAddVillage = () => {
    if (newVillage.trim()) {
      setVillages([...villages, newVillage.trim()]);
      setNewVillage('');
    }
  };

  const handleRemoveVillage = (index) => {
    setVillages(villages.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          setErrors({ ...errors, location: 'Failed to get location: ' + error.message });
        }
      );
    } else {
      setErrors({ ...errors, location: 'Geolocation is not supported by this browser' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!activityDetails.trim()) {
      newErrors.activityDetails = 'Activity details are required';
    }
    if (villages.length === 0) {
      newErrors.villages = 'At least one village must be added';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Parse extra data
    let parsedExtraData = null;
    try {
      parsedExtraData = JSON.parse(extraData || '{}');
    } catch (e) {
      setErrors({ ...errors, extraData: 'Invalid JSON format for extra data' });
      return;
    }

    const logData = {
      campaign_id: campaignId,
      driver_id: driverId,
      log_date: logDate,
      campaign_assignment_id: campaignAssignmentId,
      activity_details: activityDetails.trim(),
      villages: villages.length > 0 ? villages : null,
      images: images.length > 0 ? images : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      location_address: locationAddress.trim() || null,
      extra_data: Object.keys(parsedExtraData).length > 0 ? parsedExtraData : null
    };

    createLogMutation.mutate(logData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Activity Log</CardTitle>
        <CardDescription>Record your daily activities and observations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Log Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Log Date *
            </label>
            <Input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Activity Details */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Details *</label>
            <textarea
              value={activityDetails}
              onChange={(e) => setActivityDetails(e.target.value)}
              placeholder="Describe the activities performed today..."
              className="w-full h-24 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.activityDetails && (
              <p className="text-red-600 text-sm">{errors.activityDetails}</p>
            )}
          </div>

          {/* Villages */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Villages Visited *</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newVillage}
                onChange={(e) => setNewVillage(e.target.value)}
                placeholder="Enter village name..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVillage();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddVillage}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Villages List */}
            {villages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {villages.map((village, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {village}
                    <button
                      type="button"
                      onClick={() => handleRemoveVillage(index)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.villages && (
              <p className="text-red-600 text-sm">{errors.villages}</p>
            )}
          </div>

          {/* Images - Camera Capture */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photos
            </label>
            
            {/* Hidden file input for camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCameraCapture}
                variant="outline"
                className="flex-1"
                disabled={isCapturing}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isCapturing ? 'Opening Camera...' : '📷 Take Photo'}
              </Button>
            </div>
            
            {/* Images Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Activity ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.images && (
              <p className="text-red-600 text-sm">{errors.images}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={getCurrentLocation}
                variant="outline"
                disabled={isGettingLocation}
                className="flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                {isGettingLocation ? 'Getting Location...' : '📍 Get Current Location'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Latitude</label>
                <Input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Auto-filled"
                  className="mt-1"
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Longitude</label>
                <Input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Auto-filled"
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Location Address</label>
              <Input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Location description..."
                className="mt-1"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-sm">{errors.location}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createLogMutation.isPending}
            className="w-full"
          >
            {createLogMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Daily Log
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DailyActivityLogForm;
