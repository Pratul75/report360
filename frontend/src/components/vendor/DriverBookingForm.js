import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorBookingAPI, driversAPI, vehiclesAPI, campaignsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2, X, CheckCircle, Power, Calendar } from 'lucide-react';
import ToggleStatusModal from '../common/ToggleStatusModal';

const DriverBookingForm = ({ campaignId, campaignName, vendorId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [toggleModal, setToggleModal] = useState(null);
  
  const [formData, setFormData] = useState({
    campaign_id: campaignId,
    driver_id: '',
    vehicle_id: '',
    assignment_date: new Date().toISOString().split('T')[0],
    assignment_start_date: '',
    assignment_end_date: '',
    work_title: '',
    work_description: '',
    village_name: '',
    location_address: '',
    
    remarks: ''
  });

  // Fetch campaign details to get start/end dates
  const { data: campaignDetails, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsAPI.getOne(campaignId).then(res => res.data),
    enabled: !!campaignId
  });

  // Auto-fill campaign dates when campaign data is loaded
  useEffect(() => {
    if (campaignDetails && campaignDetails.start_date && campaignDetails.end_date) {
      setFormData(prev => ({
        ...prev,
        assignment_start_date: campaignDetails.start_date,
        assignment_end_date: campaignDetails.end_date,
        project_id: campaignDetails.project_id || ''
      }));
    }
  }, [campaignDetails]);

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

  const toggleDriverStatusMutation = useMutation({
    mutationFn: (data) => driversAPI.toggleStatus(data.id, {
      is_active: data.is_active,
      inactive_reason: data.inactive_reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorDrivers']);
      toast.success('Driver status updated successfully!');
      setToggleModal(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update driver status');
    },
  });

  const toggleVehicleStatusMutation = useMutation({
    mutationFn: (data) => vehiclesAPI.toggleStatus(data.id, {
      is_active: data.is_active,
      inactive_reason: data.inactive_reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorVehicles']);
      toast.success('Vehicle status updated successfully!');
      setToggleModal(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update vehicle status');
    },
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

    // Validate assignment date is within campaign date range
    if (campaignDetails && campaignDetails.start_date && campaignDetails.end_date) {
      const assignmentDate = new Date(formData.assignment_date);
      const campaignStart = new Date(campaignDetails.start_date);
      const campaignEnd = new Date(campaignDetails.end_date);
      
      if (assignmentDate < campaignStart || assignmentDate > campaignEnd) {
        toast.error(`Assignment date must be between campaign dates (${campaignDetails.start_date} to ${campaignDetails.end_date})`);
        return;
      }
    }
    
    createMutation.mutate(formData);
  };

  const handleToggleDriver = (driver) => {
    setToggleModal({ type: 'driver', item: driver, isActive: driver.is_active });
  };

  const handleToggleVehicle = (vehicle) => {
    setToggleModal({ type: 'vehicle', item: vehicle, isActive: vehicle.is_active });
  };

  const handleConfirmToggle = (statusData) => {
    if (toggleModal.type === 'driver') {
      toggleDriverStatusMutation.mutate({
        id: toggleModal.item.id,
        is_active: !toggleModal.isActive,
        inactive_reason: statusData.inactive_reason,
      });
    } else {
      toggleVehicleStatusMutation.mutate({
        id: toggleModal.item.id,
        is_active: !toggleModal.isActive,
        inactive_reason: statusData.inactive_reason,
      });
    }
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
          {campaignDetails && (
            <span className="ml-2 text-xs text-blue-600">
              ({campaignDetails.start_date} to {campaignDetails.end_date})
            </span>
          )}
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
              <>
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
                {formData.driver_id && (
                  <div className="mt-2 flex gap-1">
                    {drivers.filter(d => d.id === parseInt(formData.driver_id)).map(driver => (
                      <Button
                        key={driver.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleDriver(driver)}
                        disabled={toggleDriverStatusMutation.isPending}
                        className={driver.is_active ? 'text-red-600 text-xs' : 'text-green-600 text-xs'}
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {driver.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    ))}
                  </div>
                )}
              </>
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
              <>
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
                {formData.vehicle_id && (
                  <div className="mt-2 flex gap-1">
                    {vehicles.filter(v => v.id === parseInt(formData.vehicle_id)).map(vehicle => (
                      <Button
                        key={vehicle.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleVehicle(vehicle)}
                        disabled={toggleVehicleStatusMutation.isPending}
                        className={vehicle.is_active ? 'text-red-600 text-xs' : 'text-green-600 text-xs'}
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {vehicle.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    ))}
                  </div>
                )}
              </>
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
              min={campaignDetails?.start_date || new Date().toISOString().split('T')[0]}
              max={campaignDetails?.end_date}
              required
            />
            {campaignDetails && (
              <p className="text-xs text-gray-500 mt-1">
                Must be within campaign period ({campaignDetails.start_date} to {campaignDetails.end_date})
              </p>
            )}
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

          {/* Assignment Date Range - Auto-filled from Campaign */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignment_start_date" className="flex items-center gap-2">
                Assignment Start Date
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">From Campaign</span>
              </Label>
              <Input
                type="date"
                id="assignment_start_date"
                value={formData.assignment_start_date}
                disabled
                className="mt-1 bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
              />
              {campaignLoading && (
                <p className="text-xs text-gray-500 mt-1">Loading campaign dates...</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="assignment_end_date" className="flex items-center gap-2">
                Assignment End Date
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">From Campaign</span>
              </Label>
              <Input
                type="date"
                id="assignment_end_date"
                value={formData.assignment_end_date}
                disabled
                className="mt-1 bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
              />
              {formData.assignment_start_date && formData.assignment_end_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {Math.ceil((new Date(formData.assignment_end_date) - new Date(formData.assignment_start_date)) / (1000 * 60 * 60 * 24))} days
                </p>
              )}
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

      {toggleModal && (
        <ToggleStatusModal
          isOpen={!!toggleModal}
          onClose={() => setToggleModal(null)}
          isActive={toggleModal.isActive}
          itemName={toggleModal.type === 'driver' ? toggleModal.item.name : toggleModal.item.vehicle_number}
          itemType={toggleModal.type === 'driver' ? 'Driver' : 'Vehicle'}
          onConfirm={handleConfirmToggle}
          isLoading={toggleModal.type === 'driver' ? toggleDriverStatusMutation.isPending : toggleVehicleStatusMutation.isPending}
        />
      )}
    </Card>
  );
};

export default DriverBookingForm;
