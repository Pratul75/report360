import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { promoterActivitiesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Calendar, MapPin, Users, Award, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const PromoterActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  
  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const { data: activity, isLoading } = useQuery({
    queryKey: ['promoter-activity', id],
    queryFn: () => promoterActivitiesAPI.getOne(id).then(res => res.data),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading activity details...</div>;
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-700">Activity not found</h2>
        <Button className="mt-4" onClick={() => navigate('/promoter-activities')}>
          Back to Activities
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/promoter-activities')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{activity.promoter_name}</h1>
            <p className="text-slate-600">{activity.specialty || 'Promoter Activity'}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate(`/promoter-activities/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit Activity
          </Button>
        )}
      </div>

      {/* Activity Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-slate-600">Village</div>
                <div className="text-lg font-semibold">{activity.village_name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-slate-600">Activity Date</div>
                <div className="text-lg font-semibold">{formatDate(activity.activity_date)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-slate-600">People Attended</div>
                <div className="text-lg font-semibold">{activity.people_attended}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-slate-600">Activity Count</div>
                <div className="text-lg font-semibold">{activity.activity_count}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Images */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Activity Images</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['before', 'during', 'after'].map((type) => (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700 capitalize">{type} Activity</h3>
                {activity[`${type}_image`] ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-slate-200">
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${activity[`${type}_image`]}`}
                      alt={`${type} activity`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                    <span className="text-slate-400">No image uploaded</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Video */}
      {activity.activity_video && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Activity Video</h2>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden border-2 border-slate-200 flex items-center justify-center">
              <video controls className="w-full h-full">
                <source src={`${process.env.REACT_APP_BACKEND_URL}${activity.activity_video}`} />
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Promoter Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-slate-600">Name</div>
              <div className="font-medium">{activity.promoter_name}</div>
            </div>
            {activity.specialty && (
              <div>
                <div className="text-sm text-slate-600">Specialty</div>
                <div className="font-medium">{activity.specialty}</div>
              </div>
            )}
            {activity.language && (
              <div>
                <div className="text-sm text-slate-600">Language</div>
                <div className="font-medium">{activity.language}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Campaign Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-slate-600">Campaign</div>
              <div className="font-medium">{activity.campaign_name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Location</div>
              <div className="font-medium">{activity.village_name}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Date</div>
              <div className="font-medium">{formatDate(activity.activity_date)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remarks */}
      {activity.remarks && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-600" />
              <h2 className="text-xl font-semibold">Remarks</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{activity.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-slate-600">
            <div>Created: {formatDate(activity.created_at)}</div>
            <div>Updated: {formatDate(activity.updated_at)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoterActivityDetails;
