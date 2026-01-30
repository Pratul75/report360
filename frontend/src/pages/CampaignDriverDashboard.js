import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dailyActivityAPI, campaignsAPI } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, BarChart3, Calendar, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';

const CampaignDashboardAdmin = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // Fetch all campaigns
  const { data: campaignsList, isLoading: campaignsLoading } = useQuery({
    queryKey: ['allCampaigns'],
    queryFn: campaignsAPI.getAll,
    refetchInterval: 60000
  });

  // Fetch assignments for selected campaign
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['campaignAssignments', selectedCampaignId],
    queryFn: () => dailyActivityAPI.listAssignmentsForCampaign(selectedCampaignId),
    enabled: !!selectedCampaignId,
    refetchInterval: 60000
  });

  // Fetch daily logs for selected campaign/driver
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['campaignLogs', selectedCampaignId, selectedDriverId],
    queryFn: () => {
      if (selectedDriverId) {
        return dailyActivityAPI.listLogsForDriverCampaign(selectedCampaignId, selectedDriverId);
      }
      return Promise.resolve({ logs: [] });
    },
    enabled: !!selectedCampaignId && !!selectedDriverId
  });

  const campaigns = campaignsList?.campaigns || [];
  const assignments = assignmentsData?.assignments || [];
  const logs = logsData?.logs || [];
  const totalActivities = activityCountData?.total_activities || 0;

  if (campaignsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campaign Driver Dashboard</h1>
        <p className="text-gray-600">Monitor all campaigns, assignments, and daily activity logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaigns List */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Campaigns
              </CardTitle>
              <CardDescription>Select a campaign to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No campaigns available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => {
                        setSelectedCampaignId(campaign.id);
                        setSelectedDriverId(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedCampaignId === campaign.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{campaign.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(campaign.start_date), 'MMM dd')} - {format(new Date(campaign.end_date), 'MMM dd')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Drivers & Activity Summary */}
        {selectedCampaignId && (
          <div className="space-y-4">
            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {totalActivities}
                </div>
                <p className="text-sm text-gray-600">Total activity logs submitted</p>
              </CardContent>
            </Card>

            {/* Drivers List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Assigned Drivers
                </CardTitle>
                <CardDescription>
                  {assignments.length} driver(s) assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-sm text-gray-500">No drivers assigned</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {assignments.map((assignment) => (
                      <button
                        key={assignment.id}
                        onClick={() => setSelectedDriverId(assignment.driver_id)}
                        className={`w-full text-left p-3 rounded-lg border transition text-sm ${
                          selectedDriverId === assignment.driver_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{assignment.driver_name || assignment.driver_phone}</span>
                          <Badge variant="outline" className="text-xs">
                            {assignment.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          🚗 {assignment.vehicle_number} ({assignment.vehicle_type})
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignment.village_name && `📍 ${assignment.village_name} • `}
                          Assigned: {format(new Date(assignment.assigned_at), 'MMM dd, HH:mm')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Details */}
            {selectedDriverId && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments
                    .filter(a => a.driver_id === selectedDriverId)
                    .map((assignment) => (
                      <div key={assignment.id} className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Driver Name</p>
                            <p className="font-semibold">{assignment.driver_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Phone</p>
                            <p className="font-semibold">{assignment.driver_phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Vehicle Number</p>
                            <p className="font-semibold">{assignment.vehicle_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Vehicle Type</p>
                            <p className="font-semibold">{assignment.vehicle_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Village/Location</p>
                            <p className="font-semibold">{assignment.village_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Work Title</p>
                            <p className="font-semibold">{assignment.work_title}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-600">Full Address</p>
                            <p className="font-semibold text-sm">{assignment.location_address || 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-600">Work Description</p>
                            <p className="text-sm">{assignment.work_description || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Activity Logs */}
      {selectedCampaignId && selectedDriverId && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Logs</CardTitle>
            <CardDescription>All logs for selected driver and campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activity logs for this driver in this campaign</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">
                        {format(new Date(log.log_date), 'EEEE, MMM dd, yyyy')}
                      </h4>
                      <Badge variant="secondary">{log.log_date}</Badge>
                    </div>

                    {log.activity_details && (
                      <p className="text-sm text-gray-700 mb-2">{log.activity_details}</p>
                    )}

                    {log.villages && log.villages.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Villages:</p>
                        <div className="flex flex-wrap gap-1">
                          {log.villages.map((village, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {village}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.images && log.images.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Images: {log.images.length}
                        </p>
                        <div className="grid grid-cols-6 gap-2">
                          {log.images.slice(0, 6).map((img, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={img}
                                alt={`Log ${idx}`}
                                className="w-full h-12 object-cover rounded text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(log.latitude || log.location_address) && (
                      <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                        📍 {log.location_address || `GPS: ${log.latitude}, ${log.longitude}`}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {format(new Date(log.created_at), 'MMM dd HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignDashboardAdmin;
