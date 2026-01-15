import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promoterActivitiesAPI, campaignsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar, MapPin, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';

const PromoterActivities = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  const [filters, setFilters] = useState({
    village_name: '',
    campaign_id: '',
    date_from: '',
    date_to: '',
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['promoter-activities', filters],
    queryFn: () => {
      // Filter out empty strings to avoid type issues
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      return promoterActivitiesAPI.getAll(cleanFilters).then(res => res.data);
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getAll().then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['promoter-activities-stats', filters.campaign_id],
    queryFn: () => promoterActivitiesAPI.getStats(filters.campaign_id).then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => promoterActivitiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['promoter-activities']);
      queryClient.invalidateQueries(['promoter-activities-stats']);
      toast.success('Activity deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete activity');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete activity for "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div data-testid="promoter-activities-page" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Promoter Activities</h1>
          <p className="text-slate-600">Track and manage field promotion activities</p>
        </div>
        {hasPermission('promoter_activity.create') && (
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700" 
            onClick={() => navigate('/promoter-activities/new')}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Activity
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-indigo-600">{stats.total_activities}</div>
              <div className="text-sm text-slate-600">Total Activities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.total_people_reached}</div>
              <div className="text-sm text-slate-600">People Reached</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{stats.total_villages}</div>
              <div className="text-sm text-slate-600">Villages Covered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.avg_attendance_per_activity}</div>
              <div className="text-sm text-slate-600">Avg Attendance</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search by village..."
                  className="pl-10"
                  value={filters.village_name}
                  onChange={(e) => handleFilterChange('village_name', e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-4 py-2 border rounded-md"
              value={filters.campaign_id}
              onChange={(e) => handleFilterChange('campaign_id', e.target.value)}
            >
              <option value="">All Campaigns</option>
              {campaigns?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <Input
              type="date"
              placeholder="From Date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-[180px]"
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-[180px]"
            />

            <Button variant="outline" onClick={() => setFilters({ village_name: '', campaign_id: '', date_from: '', date_to: '' })}>
              Clear Filters
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading activities...</div>
        ) : activities?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">No activities found</div>
        ) : (
          activities?.map((activity) => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{activity.promoter_name}</h3>
                    <p className="text-sm text-slate-600">{activity.specialty || 'General Promoter'}</p>
                  </div>
                  <div className="flex gap-1">
                    {activity.before_image && <ImageIcon className="h-4 w-4 text-blue-500" />}
                    {activity.during_image && <ImageIcon className="h-4 w-4 text-green-500" />}
                    {activity.after_image && <ImageIcon className="h-4 w-4 text-purple-500" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{activity.village_name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(activity.activity_date)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>{activity.people_attended} people attended • {activity.activity_count} activities</span>
                </div>

                {activity.language && (
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
                    {activity.language}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => navigate(`/promoter-activities/${activity.id}`)}
                  >
                    View Details
                  </Button>
                  {hasPermission('promoter_activity.delete') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(activity.id, activity.promoter_name)}
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

export default PromoterActivities;
