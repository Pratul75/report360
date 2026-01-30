import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dailyActivityAPI } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Calendar, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';

const CampaignActivityHistory = ({ campaignId, driverId }) => {
  // Fetch all daily logs for this campaign
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['campaignActivityHistory', campaignId, driverId],
    queryFn: () => dailyActivityAPI.listLogsForDriverCampaign(campaignId, driverId),
    refetchInterval: 30000
  });

  // Fetch activity count
  const { data: countData } = useQuery({
    queryKey: ['activityCount', campaignId, driverId],
    queryFn: () => dailyActivityAPI.getActivityCountForDriverInCampaign(campaignId, driverId)
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600 text-sm">Failed to load activity history</p>
        </CardContent>
      </Card>
    );
  }

  const logs = historyData?.logs || [];
  const activityCount = countData?.driver_activities || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>All daily logs submitted for this campaign</CardDescription>
          </div>
          <Badge variant="secondary" className="h-fit">
            {activityCount} Activities
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                {/* Date and count badge */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">
                      {format(new Date(log.log_date), 'EEEE, MMM dd, yyyy')}
                    </span>
                  </div>
                  <Badge variant="outline">{log.log_date}</Badge>
                </div>

                {/* Activity Details */}
                {log.activity_details && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{log.activity_details}</p>
                  </div>
                )}

                {/* Villages */}
                {log.villages && log.villages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Villages Visited:</p>
                    <div className="flex flex-wrap gap-2">
                      {log.villages.map((village, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {village}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {log.images && log.images.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Images ({log.images.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {log.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Activity ${idx}`}
                            className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                {(log.latitude || log.longitude || log.location_address) && (
                  <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        {log.location_address && (
                          <p className="text-gray-700">{log.location_address}</p>
                        )}
                        {log.latitude && log.longitude && (
                          <p className="text-xs text-gray-600 mt-1">
                            GPS: {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Extra Data */}
                {log.extra_data && Object.keys(log.extra_data).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-semibold text-gray-600 mb-1">Additional Info:</p>
                    {Object.entries(log.extra_data).map(([key, value]) => (
                      <p key={key} className="text-gray-700">
                        <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                      </p>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignActivityHistory;
