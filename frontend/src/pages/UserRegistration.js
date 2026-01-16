import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8003/api') + '/v1';

const UserRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: '',
    vendor_id: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch vendors for dropdown (when role is vendor)
  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: formData.role === 'vendor'
  });

  // Register user mutation
  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/users/register`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`User "${data.name}" registered successfully!`);
      navigate('/settings'); // Navigate to settings or user list page
    },
    onError: (error) => {
      console.error('Registration error:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to register user';
      toast.error(errorMsg);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear vendor_id if role changes from vendor
      ...(name === 'role' && value !== 'vendor' ? { vendor_id: null } : {})
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirm_password || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.role === 'vendor' && !formData.vendor_id) {
      toast.error('Please select a vendor');
      return;
    }

    // Prepare data for submission
    const submitData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      password: formData.password,
      confirm_password: formData.confirm_password,
      role: formData.role,
      vendor_id: formData.role === 'vendor' ? parseInt(formData.vendor_id) : null
    };

    registerMutation.mutate(submitData);
  };

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'client_servicing', label: 'Client Servicing' },
    { value: 'operations_manager', label: 'Operations Manager' },
    { value: 'accounts', label: 'Accounts' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'client', label: 'Client' },
    { value: 'sales', label: 'Sales' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'operator', label: 'Operator' },
    { value: 'driver', label: 'Driver' },
    { value: 'promoter', label: 'Promoter' },
    { value: 'anchor', label: 'Anchor' },
    { value: 'vehicle_manager', label: 'Vehicle Manager' },
    { value: 'godown_manager', label: 'Godown Manager' }
  ];

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New User Registration</h1>
          <p className="text-gray-600 mt-2">Create a new user account with secure credentials</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            User Registration Form
          </CardTitle>
          <CardDescription>
            Admin-only feature. Password will be securely hashed and stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Notice */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                <strong>Security Notice:</strong> All passwords are encrypted using industry-standard bcrypt hashing. 
                The original password will be stored separately for admin reference only.
              </AlertDescription>
            </Alert>

            {/* User Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">User Details</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Secure Password</h3>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (min. 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Re-enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.password && formData.confirm_password && (
                  <p className={`text-sm mt-1 ${formData.password === formData.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.password === formData.confirm_password ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} /> Passwords match
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertCircle size={14} /> Passwords do not match
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Role Assignment Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Role Assignment</h3>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* Conditional: Vendor Selection */}
              {formData.role === 'vendor' && (
                <div>
                  <label htmlFor="vendor_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="vendor_id"
                    name="vendor_id"
                    value={formData.vendor_id || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a vendor</option>
                    {vendors?.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/settings')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRegistration;
