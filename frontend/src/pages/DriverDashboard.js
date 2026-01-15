import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { driverDashboardAPI, vendorBookingAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Loader2, Truck, MapPin, Calendar, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import KMTracker from '../components/driver/KMTracker';
import ProfileForm from '../components/driver/ProfileForm';
import WorkList from '../components/driver/WorkList';
import VehicleCard from '../components/driver/VehicleCard';
import AssignmentsList from '../components/vendor/AssignmentsList';
import DriverAssignmentApproval from '../components/driver/DriverAssignmentApproval';

const DriverDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  
  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const isDriver = userRole === 'driver';
  const isAdminOrOps = ['admin', 'operations_manager'].includes(userRole);

  // For drivers - fetch their own dashboard
  const { data: dashboardData, isLoading: driverLoading, error: driverError, refetch } = useQuery({
    queryKey: ['driverDashboard', selectedDate],
    queryFn: () => driverDashboardAPI.getMyDashboard(selectedDate),
    refetchInterval: 30000,
    enabled: isDriver, // Only fetch for driver role
  });

  // For admin/ops - fetch all drivers summary
  const { data: allSummaryData, isLoading: adminLoading, error: adminError, refetch: refetchSummary } = useQuery({
    queryKey: ['allDriversSummary', selectedDate],
    queryFn: () => driverDashboardAPI.getAllDriversSummary(selectedDate),
    refetchInterval: 30000,
    enabled: isAdminOrOps, // Only fetch for admin/ops roles
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Force refetch when selectedDate changes
  useEffect(() => {
    if (isAdminOrOps && selectedDate) {
      console.log('🔄 Date changed to:', selectedDate, '- Refetching data...');
      refetchSummary();
    }
  }, [selectedDate, isAdminOrOps, refetchSummary]);

  // Fetch profile (only for drivers)
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: () => driverDashboardAPI.getProfile(),
    enabled: isDriver,
  });

  // Fetch assigned work (only for drivers)
  const { data: workData } = useQuery({
    queryKey: ['driverWork', selectedDate],
    queryFn: () => driverDashboardAPI.getAssignedWork(selectedDate),
    refetchInterval: 30000,
    enabled: isDriver,
  });

  // Fetch vehicle info (only for drivers)
  const { data: vehicleData } = useQuery({
    queryKey: ['driverVehicle'],
    queryFn: () => driverDashboardAPI.getVehicle(),
    enabled: isDriver,
  });
  // Driver work assignments from vendor booking
  const { data: driverWorkAssignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['driverWorkAssignments', selectedDate],
    queryFn: () => vendorBookingAPI.getAssignments(null, null, selectedDate),
    refetchInterval: 30000,
    enabled: isDriver,
  });
  const isLoading = isDriver ? driverLoading : adminLoading;
  const error = isDriver ? driverError : adminError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    // Check if it's a 404 driver not found error
    const is404 = error.response?.status === 404 || error.message?.includes('Driver record not found');
    
    if (is404 && isDriver) {
      return (
        <div className="container mx-auto p-4 max-w-2xl">
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">Driver Record Not Found</h3>
                <p className="text-gray-700 mb-4">
                  Your driver profile is not set up yet. Please contact your administrator to complete your registration.
                </p>
                <div className="bg-white rounded-lg p-4 mt-6">
                  <p className="text-sm text-gray-600 mb-2">What to do:</p>
                  <ul className="text-sm text-gray-700 space-y-1 text-left">
                    <li>✓ Contact your operations manager</li>
                    <li>✓ Verify your account details</li>
                    <li>✓ Wait for profile activation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error loading dashboard</p>
                <p className="text-sm text-red-700">{error.message}</p>
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

  // Render admin/ops view
  if (isAdminOrOps) {
    const summaries = allSummaryData?.data || []; // Fixed: backend returns {data: [...]} not {summaries: [...]}
    
    // Debug logging
    console.log('📊 Admin View - Driver Dashboard Data:', {
      selectedDate: selectedDate,
      apiResponseDate: allSummaryData?.date,
      totalSummaries: summaries.length,
      activeDrivers: summaries.filter(s => s.is_active).length,
      totalAssignments: summaries.reduce((sum, s) => sum + (s.assignments_count || 0), 0),
      driversWithVehicles: summaries.filter(s => s.vehicle_number).length,
      firstDriverDate: summaries[0]?.date,
      sampleData: summaries.slice(0, 2)
    });
    
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor all drivers - {userRole === 'admin' ? 'Admin' : 'Operations Manager'} View</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summaries.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">
                    {summaries.filter(s => s.km_status === 'IN_PROGRESS' || (s.km_status === 'NOT_STARTED' && s.assignments_count > 0)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {summaries.filter(s => s.km_status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total KM</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    {summaries.reduce((sum, s) => sum + (s.total_km || 0), 0).toFixed(0)}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drivers List */}
        <Card>
          <CardHeader>
            <CardTitle>All Drivers - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            <CardDescription>Real-time tracking of all driver activities</CardDescription>
          </CardHeader>
          <CardContent>
            {summaries.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No driver data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KM Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total KM</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {summaries.map((summary, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50 ${!summary.is_active ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{summary.driver_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{summary.driver_email || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{summary.driver_phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{summary.vehicle_number || 'Not Assigned'}</td>
                        <td className="px-4 py-3">
                          {summary.is_active ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {summary.km_status === 'COMPLETED' ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                          ) : summary.km_status === 'IN_PROGRESS' ? (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>
                          ) : (
                            <Badge variant="secondary">Not Started</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{summary.total_km || 0} KM</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{summary.assignments_count || 0}</td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/journey/${summary.driver_id}/${selectedDate}`)}
                            disabled={!summary.driver_id}
                          >
                            View Journey Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Driver view (existing code)
  const profile = dashboardData?.profile || profileData;
  const assignments = workData?.assignments || dashboardData?.assignments || [];
  const vehicle = vehicleData?.vehicle || dashboardData?.vehicle;
  const kmLog = dashboardData?.km_log;

  // Check if driver data exists
  if (!dashboardData && isDriver) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">No Dashboard Data Available</h3>
              <p className="text-gray-700">
                Your dashboard is being set up. Please contact your administrator if this persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if profile is complete
  const isProfileComplete = profile?.is_profile_complete || false;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome, {profile?.driver?.name || 'Driver'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button onClick={() => setShowProfile(!showProfile)} variant="outline">
              {showProfile ? 'Dashboard' : 'Profile'}
            </Button>
          </div>
        </div>

        {/* Profile completion alert */}
        {!isProfileComplete && (
          <Card className="mt-4 border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900">Complete Your Profile</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please complete your profile information to access all features.
                  </p>
                  <Button 
                    onClick={() => setShowProfile(true)} 
                    size="sm" 
                    className="mt-3"
                    variant="secondary"
                  >
                    Complete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Show Profile Form or Dashboard */}
      {showProfile ? (
        <ProfileForm 
          profile={profile} 
          onSuccess={() => {
            refetchProfile();
            setShowProfile(false);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assignments Today</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {assignments.length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">KM Status</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {kmLog?.status === 'COMPLETED' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Done</Badge>
                      ) : kmLog?.status === 'IN_PROGRESS' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total KM Today</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {kmLog?.total_km || 0}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KM Tracker - Main Feature */}
          <KMTracker kmLog={kmLog} onUpdate={refetch} />

          {/* View Journey Details Button */}
          {kmLog && (kmLog.status === 'IN_PROGRESS' || kmLog.status === 'COMPLETED') && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">View Complete Journey Details</p>
                    <p className="text-sm text-gray-600 mt-1">
                      See full journey information with GPS coordinates, photos, and timestamps
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate(`/journey/me/${selectedDate}`)}
                    className="ml-4"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Info */}
          {vehicle && <VehicleCard vehicle={vehicle} />}

          {/* Assigned Work */}
          {assignments.length > 0 && (
            <WorkList assignments={assignments} />
          )}

          {/* Vendor Booking Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>My Work Assignments - Approval Required</CardTitle>
              <CardDescription>Review and approve or reject work assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading assignments...</span>
                </div>
              ) : !driverWorkAssignmentsData || driverWorkAssignmentsData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No assignments for {selectedDate}</p>
                  <p className="text-sm mt-2">Check back later or contact your manager</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {driverWorkAssignmentsData.map((assignment) => (
                    <DriverAssignmentApproval 
                      key={assignment.id} 
                      assignment={assignment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* No assignments message */}
          {assignments.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No assignments for {selectedDate}</p>
                  <p className="text-sm text-gray-500 mt-2">Check back later or contact your manager</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
