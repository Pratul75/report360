import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MapPin, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';

const statusColors = {
  planning: 'bg-blue-100 text-blue-700',
  upcoming: 'bg-yellow-100 text-yellow-700',
  running: 'bg-green-100 text-green-700',
  hold: 'bg-orange-100 text-orange-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

const Campaigns = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  const { data: allCampaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getAll().then(res => res.data),
  });

  // Filter campaigns based on user role
  const campaigns = React.useMemo(() => {
    if (!allCampaigns) return [];
    
    // If vendor, show only campaigns assigned to this vendor
    if (user.role === 'vendor') {
      return allCampaigns.filter(campaign => {
        if (!campaign.vendor_ids || campaign.vendor_ids.length === 0) {
          return false;
        }
        // Convert all values to numbers for comparison to handle type mismatches
        const vendorIdsAsNumbers = campaign.vendor_ids.map(v => Number(v));
        const userIdAsNumber = Number(user.id);
        return vendorIdsAsNumbers.includes(userIdAsNumber);
      });
    }
    
    // Otherwise show all campaigns
    return allCampaigns;
  }, [allCampaigns, user.id, user.role]);

  const deleteMutation = useMutation({
    mutationFn: (id) => campaignsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']); // Refresh campaigns list
      queryClient.invalidateQueries(['dashboardStats']); // Refresh admin dashboard
      queryClient.invalidateQueries(['vendor-dashboard']); // Refresh vendor dashboard
      toast.success('Campaign deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete campaign');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div data-testid="campaigns-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Campaigns</h1>
          <p className="text-slate-600">Manage and monitor campaign execution</p>
        </div>
        {hasPermission('campaign.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-campaign-btn" onClick={() => navigate('/campaigns/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading campaigns...</div>
        ) : campaigns?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">No campaigns found</div>
        ) : (
          campaigns?.map((campaign) => (
            <Card key={campaign.id} data-testid="campaign-card" className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{campaign.name}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[campaign.status] || 'bg-slate-100 text-slate-700'}`}>
                        {campaign.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {campaign.campaign_type}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 line-clamp-2">{campaign.description || 'No description'}</p>
                {isAdmin && campaign.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Budget: {formatCurrency(campaign.budget)}</span>
                  </div>
                )}
                {campaign.start_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                  </div>
                )}
                {campaign.locations && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="line-clamp-1">{campaign.locations}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/campaigns/${campaign.id}`, { state: { from: location } })}
                  >
                    Manage Campaign
                  </Button>
                  {hasPermission('campaign.delete') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(campaign.id, campaign.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Campaigns;
