import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorBookingAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2, X, CheckCircle } from 'lucide-react';

const DriverBookingForm = ({ campaignId, campaignName, vendorId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    campaign_id: campaignId,
    driver_id: '',
    vehicle_id: '',
    assignment_date: new Date().toISOString().split('T')[0],
    work_title: '',
    work_description: '',
    village_name: '',
    location_address: '',
    expected_start_time: '09:00',
    expected_end_time: '17:00',
    remarks: ''
  });

  // Fetch drivers - backend automatically uses current user's vendor_id if not provided
  const { data: driversResponse, isLoading: driversLoading, error: driversError } = useQuery({
    queryKey: ['vendorDrivers', vendorId],
    queryFn: () => vendorBookingAPI.getDrivers(vendorId, true)
  });

  // Fetch vehicles - backend automatically uses current user's vendor_id if not provided
  const { data: vehiclesResponse, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['vendorVehicles', vendorId],
    queryFn: () => vendorBookingAPI.getVehicles(vendorId, true)
  });

  // Extract data from response
  const drivers = driversResponse?.data || driversResponse || [];
  const vehicles = vehiclesResponse?.data || vehiclesResponse || [];

  // Debug logging
  useEffect(() => {
    console.log('DriverBookingForm Debug:', {
      vendorId,
      driversResponse,
      vehiclesResponse,
      drivers,
      vehicles,
      driversLoading,
      vehiclesLoading,
      driversError: driversError?.message,
      vehiclesError: vehiclesError?.message,
      driversCount: drivers.length,
      vehiclesCount: vehicles.length
    });
  }, [vendorId, driversResponse, vehiclesResponse, drivers, vehicles, driversLoading, vehiclesLoading, driversError, vehiclesError]);

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data) => vendorBookingAPI.createAssignment(data, vendorId),
    onSuccess: (data) => {
      toast.success('Driver assigned successfully!');
      queryClient.invalidateQueries(['vendorAssignments']);
      onSuccess && onSuccess(data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to assign driver');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.driver_id) {
      toast.error('Please select a driver');
      return;
    }
    if (!formData.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!formData.work_title) {
      toast.error('Please enter work title');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Assign Driver & Book Work</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Campaign: <strong>{campaignName}</strong>
        </p>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Driver Selection */}
          <div>
            <Label htmlFor="driver_id">Select Driver <span className="text-red-500">*</span></Label>
            {driversLoading ? (
              <div className="flex items-center gap-2 text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading drivers...</span>
              </div>
            ) : driversError ? (
              <div className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded">
                Error loading drivers: {driversError.message}
              </div>
            ) : drivers && drivers.length > 0 ? (
              <select
                id="driver_id"
                value={formData.driver_id}
                onChange={(e) => handleChange('driver_id', parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose Driver ({drivers.length} available)</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.phone}) {driver.license_number && `- License: ${driver.license_number}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-amber-600 mt-1 p-2 bg-amber-50 rounded border border-amber-200">
                कोई active driver उपलब्ध नहीं है। कृपया पहले अपने vendor account में drivers जोड़ें।
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div>
            <Label htmlFor="vehicle_id">Select Vehicle <span className="text-red-500">*</span></Label>
            {vehiclesLoading ? (
              <div className="flex items-center gap-2 text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading vehicles...</span>
              </div>
            ) : vehiclesError ? (
              <div className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded">
                Error loading vehicles: {vehiclesError.message}
              </div>
            ) : vehicles && vehicles.length > 0 ? (
              <select
                id="vehicle_id"
                value={formData.vehicle_id}
                onChange={(e) => handleChange('vehicle_id', parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose Vehicle ({vehicles.length} available)</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} {vehicle.vehicle_type && `(${vehicle.vehicle_type})`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-amber-600 mt-1 p-2 bg-amber-50 rounded border border-amber-200">
                कोई active vehicle उपलब्ध नहीं है। कृपया पहले अपने vendor account में vehicles जोड़ें।
              </div>
            )}
          </div>

          {/* Assignment Date */}
          <div>
            <Label htmlFor="assignment_date">Assignment Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              id="assignment_date"
              value={formData.assignment_date}
              onChange={(e) => handleChange('assignment_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Work Title */}
          <div>
            <Label htmlFor="work_title">Work Type <span className="text-red-500">*</span></Label>
            <select
              id="work_title"
              value={formData.work_title}
              onChange={(e) => handleChange('work_title', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Work Type</option>
              <option value="Product Sampling">Product Sampling</option>
              <option value="Promotion Activity">Promotion Activity</option>
              <option value="Transport Service">Transport Service</option>
              <option value="Event Setup">Event Setup</option>
              <option value="Door-to-Door Campaign">Door-to-Door Campaign</option>
              <option value="Roadshow">Roadshow</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Work Description */}
          <div>
            <Label htmlFor="work_description">Work Description</Label>
            <Textarea
              id="work_description"
              value={formData.work_description}
              onChange={(e) => handleChange('work_description', e.target.value)}
              placeholder="Describe the work to be done..."
              rows={3}
            />
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="village_name">Village/Location Name</Label>
              <Input
                type="text"
                id="village_name"
                value={formData.village_name}
                onChange={(e) => handleChange('village_name', e.target.value)}
                placeholder="e.g. Rampur, Delhi Mall"
              />
            </div>
            
            <div>
              <Label htmlFor="location_address">Full Address</Label>
              <Input
                type="text"
                id="location_address"
                value={formData.location_address}
                onChange={(e) => handleChange('location_address', e.target.value)}
                placeholder="Complete address"
              />
            </div>
          </div>

          {/* Time Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected_start_time">Expected Start Time</Label>
              <Input
                type="time"
                id="expected_start_time"
                value={formData.expected_start_time}
                onChange={(e) => handleChange('expected_start_time', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="expected_end_time">Expected End Time</Label>
              <Input
                type="time"
                id="expected_end_time"
                value={formData.expected_end_time}
                onChange={(e) => handleChange('expected_end_time', e.target.value)}
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks / Special Instructions</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !drivers?.length || !vehicles?.length}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assign Driver
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DriverBookingForm;
