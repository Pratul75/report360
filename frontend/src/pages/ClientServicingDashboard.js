import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientServicingDashboardAPI } from '../lib/api';

const ClientServicingDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Project Progress Query
  const { data: projectProgress, isLoading: loadingProjects, error: projectError, refetch: refetchProjects } = useQuery({
    queryKey: ['client-servicing-project-progress', dateRange],
    queryFn: () => clientServicingDashboardAPI.getProjectProgress({
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    }),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Vehicle Movement Query
  const { data: vehicleMovement, isLoading: loadingVehicles, error: vehicleError, refetch: refetchVehicles } = useQuery({
    queryKey: ['client-servicing-vehicle-movement', dateRange],
    queryFn: () => clientServicingDashboardAPI.getVehicleMovement({
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    }),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Expense Snapshot Query
  const { data: expenseSnapshot, isLoading: loadingExpenses, error: expenseError, refetch: refetchExpenses } = useQuery({
    queryKey: ['client-servicing-expense-snapshot', dateRange],
    queryFn: () => clientServicingDashboardAPI.getExpenseSnapshot({
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    }),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Live Updates Query
  const { data: liveUpdates, isLoading: loadingUpdates, error: updatesError, refetch: refetchUpdates } = useQuery({
    queryKey: ['client-servicing-live-updates'],
    queryFn: () => clientServicingDashboardAPI.getLiveUpdates({ limit: 20 }),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const handleRefreshAll = () => {
    console.log('Refreshing all dashboard data...');
    refetchProjects();
    refetchVehicles();
    refetchExpenses();
    refetchUpdates();
  };

  const handleExport = async (format) => {
    try {
      const blob = await clientServicingDashboardAPI.exportDashboard(format, {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'csv' : 'pdf';
      link.download = `client_servicing_dashboard_${timestamp}.${extension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      const successMsg = format === 'excel' ? 
        '✅ Dashboard exported successfully as CSV (Excel-compatible)!' :
        '✅ Dashboard exported successfully as PDF!';
      alert(successMsg);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export dashboard: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Debug: Log data when it changes
  React.useEffect(() => {
    if (projectProgress) {
      console.log('Project Progress Data:', projectProgress);
    }
  }, [projectProgress]);

  React.useEffect(() => {
    if (projectError) {
      console.error('Project Error:', projectError);
    }
  }, [projectError]);

  // Show error if any critical data fails
  if (projectError || vehicleError || expenseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-red-900">Error Loading Dashboard</p>
              <p className="text-sm text-red-700">
                {projectError?.message || vehicleError?.message || expenseError?.message || 'Failed to fetch data'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshAll}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Client Servicing Dashboard</h1>
          <p className="text-gray-600">Real-time overview of operations, vehicles, and expenses</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Start Date:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">End Date:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Auto Refresh:</label>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>

            <button
              onClick={handleRefreshAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600"
            >
              🔄 Refresh All
            </button>

            <div className="ml-auto flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
              >
                📄 Export PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600"
              >
                📊 Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Live Photo & GPS Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📸 Live Photo & GPS Verification</h2>
          {loadingUpdates ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading live updates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveUpdates?.activities?.slice(0, 8).map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                  {activity.photo_url && (
                    <img 
                      src={activity.photo_url} 
                      alt="Activity" 
                      className="w-full h-40 object-cover rounded-md mb-2"
                    />
                  )}
                  <p className="text-sm font-semibold text-gray-800">{activity.activity_type}</p>
                  <p className="text-xs text-gray-600">{activity.location}</p>
                  {activity.latitude && activity.longitude && (
                    <p className="text-xs text-blue-600">
                      📍 {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Progress Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Project Progress Overview</h2>
          {loadingProjects ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : projectError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading projects: {projectError.message}</p>
              <button 
                onClick={refetchProjects}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Today's Projects</h3>
                  <p className="text-4xl font-bold">{projectProgress?.today || 0}</p>
                  <p className="text-sm mt-2 opacity-90">Starting today</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Completed</h3>
                  <p className="text-4xl font-bold">{projectProgress?.completed || 0}</p>
                  <p className="text-sm mt-2 opacity-90">In selected range</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Pending</h3>
                  <p className="text-4xl font-bold">{projectProgress?.pending || 0}</p>
                  <p className="text-sm mt-2 opacity-90">In progress</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Upcoming</h3>
                  <p className="text-4xl font-bold">{projectProgress?.upcoming || 0}</p>
                  <p className="text-sm mt-2 opacity-90">Scheduled</p>
                </div>
              </div>

              {projectProgress?.recent_projects?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Projects</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projectProgress.recent_projects.map((project) => (
                          <tr key={project.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{project.start_date}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{project.end_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Vehicle Movement Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🚗 Vehicle Movement Summary</h2>
          {loadingVehicles ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Active Vehicles</h3>
                <p className="text-4xl font-bold">{vehicleMovement?.active_vehicles || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Assigned</h3>
                <p className="text-4xl font-bold">{vehicleMovement?.assigned_vehicles || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Unassigned</h3>
                <p className="text-4xl font-bold">{vehicleMovement?.unassigned_vehicles || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Total Distance</h3>
                <p className="text-4xl font-bold">{vehicleMovement?.total_distance_km || 0}</p>
                <p className="text-sm mt-2 opacity-90">km</p>
              </div>
            </div>
          )}
        </div>

        {/* Daily Expense Snapshot */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Daily Expense Snapshot</h2>
          {loadingExpenses ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
                  <p className="text-3xl font-bold">₹{expenseSnapshot?.total_expenses?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Approved</h3>
                  <p className="text-3xl font-bold">₹{expenseSnapshot?.approved?.amount?.toLocaleString() || 0}</p>
                  <p className="text-sm mt-1 opacity-90">({expenseSnapshot?.approved?.count || 0} items)</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Pending</h3>
                  <p className="text-3xl font-bold">₹{expenseSnapshot?.pending?.amount?.toLocaleString() || 0}</p>
                  <p className="text-sm mt-1 opacity-90">({expenseSnapshot?.pending?.count || 0} items)</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Rejected</h3>
                  <p className="text-3xl font-bold">₹{expenseSnapshot?.rejected?.amount?.toLocaleString() || 0}</p>
                  <p className="text-sm mt-1 opacity-90">({expenseSnapshot?.rejected?.count || 0} items)</p>
                </div>
              </div>

              {expenseSnapshot?.campaign_breakdown?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Top Campaigns by Expense</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Expense</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expenseSnapshot.campaign_breakdown.map((campaign) => (
                          <tr key={campaign.campaign_id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{campaign.campaign_name}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              ₹{campaign.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientServicingDashboard;
