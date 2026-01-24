import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { driverDashboardAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProfileForm = ({ profile, driver, onSuccess }) => {
  // Debug: log the profile and driver object to inspect their structure
  console.log('Driver Profile object:', profile);
  console.log('Driver object:', driver);
  // Prefer new backend fields if present, then profile, then driver prop
  const driverName = profile?.driver_name || profile?.name || driver?.name || 'N/A';
  const driverPhone = profile?.driver_phone || profile?.phone || driver?.phone || 'N/A';
  const [formData, setFormData] = useState({
    address: profile?.address || '',
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
    blood_group: profile?.blood_group || '',
    aadhar_number: profile?.aadhar_number || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => driverDashboardAPI.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Driver Info Summary */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex flex-col md:flex-row md:items-center md:gap-8">
          <div className="mb-2 md:mb-0">
            <span className="text-sm text-gray-600 font-medium">Name: </span>
            <span className="text-lg text-blue-900 font-bold">{driverName}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600 font-medium">Phone: </span>
            <span className="text-lg text-blue-900 font-bold">{driverPhone}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your complete address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name *
              </label>
              <Input
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="Contact person name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone *
              </label>
              <Input
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="Contact phone number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group *
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number *
              </label>
              <Input
                name="aadhar_number"
                value={formData.aadhar_number}
                onChange={handleChange}
                placeholder="12-digit Aadhar number"
                maxLength="12"
                pattern="[0-9]{12}"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;