import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dailyActivityAPI } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Loader2, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import DailyActivityLogForm from './DailyActivityLogForm';
import CampaignActivityHistory from './CampaignActivityHistory';

const ActiveCampaignsPanel = ({ driverId }) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch active campaigns/assignments for driver
  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['activeCampaigns', driverId],
    queryFn: () => dailyActivityAPI.listAssignmentsForDriver(driverId),
    refetchInterval: 60000
  });

  // Get assignment for selected campaign
  const selectedAssignment = assignmentsData?.assignments?.find(
    a => a.campaign_id === selectedCampaignId
  );
  
  // Get active campaigns list
  const campaigns = assignmentsData?.assignments?.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600 text-sm">Failed to load campaigns</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedCampaignId || campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Your assigned work for ongoing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active campaigns assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                    <Badge className="h-fit">
                      {campaign.campaign_type}
                    </Badge>
                  </div>
                  
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {campaign.campaign_start_date && campaign.campaign_end_date ? 
                          `${format(new Date(campaign.campaign_start_date), 'MMM dd')} - ${format(new Date(campaign.campaign_end_date), 'MMM dd, yyyy')}`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    {campaign.campaign_locations && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{campaign.campaign_locations}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="space-y-4">
      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCampaignId(null);
                setShowLogForm(false);
                setShowHistory(false);
              }}
            >
              ← Back to Campaigns
            </Button>
            <Badge className="h-fit">{selectedCampaign?.campaign_type}</Badge>
          </div>
          <CardTitle>{selectedCampaign?.campaign_name}</CardTitle>
          <CardDescription>{selectedCampaign?.campaign_description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Start Date</p>
              <p className="text-lg font-medium text-gray-900">
                {selectedCampaign?.campaign_start_date ? format(new Date(selectedCampaign.campaign_start_date), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">End Date</p>
              <p className="text-lg font-medium text-gray-900">
                {selectedCampaign?.campaign_end_date ? format(new Date(selectedCampaign.campaign_end_date), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
            {selectedCampaign?.campaign_locations && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Locations</p>
                <p className="text-sm text-gray-900">{selectedCampaign?.campaign_locations}</p>
              </div>
            )}
            {selectedCampaign?.campaign_budget && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Budget</p>
                <p className="text-sm font-medium text-blue-600">₹{selectedCampaign?.campaign_budget}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant={showLogForm ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowLogForm(!showLogForm);
                setShowHistory(false);
              }}
            >
              {showLogForm ? 'Hide Form' : 'Add Daily Log'}
            </Button>
            <Button
              variant={showHistory ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowHistory(!showHistory);
                setShowLogForm(false);
              }}
            >
              {showHistory ? 'Hide History' : 'View History'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Activity Log Form */}
      {showLogForm && (
        <DailyActivityLogForm
          campaignId={selectedCampaignId}
          driverId={driverId}
          campaignAssignmentId={selectedAssignment?.id}
          onSuccess={() => {
            setShowLogForm(false);
            setShowHistory(true);
          }}
        />
      )}

      {/* Activity History */}
      {showHistory && (
        <CampaignActivityHistory
          campaignId={selectedCampaignId}
          driverId={driverId}
        />
      )}
    </div>
  );
};

export default ActiveCampaignsPanel;
