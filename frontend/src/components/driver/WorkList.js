import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, MapPin, Briefcase, Truck } from 'lucide-react';

const WorkList = ({ assignments }) => {
  const getStatusBadge = (status) => {
    const variants = {
      ASSIGNED: 'secondary',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id || index}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {assignment.campaign_name || assignment.project_name || 'Assignment'}
                  </h3>
                </div>
                {getStatusBadge(assignment.status)}
              </div>

              {assignment.task_description && (
                <p className="text-sm text-gray-700 mb-3">
                  {assignment.task_description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {assignment.vehicle_number && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="w-4 h-4" />
                    <span>Vehicle: {assignment.vehicle_number}</span>
                  </div>
                )}

                {assignment.campaign_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Campaign: {assignment.campaign_name}</span>
                  </div>
                )}

                {assignment.project_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>Project: {assignment.project_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {assignment.assignment_date 
                      ? new Date(assignment.assignment_date).toLocaleDateString()
                      : 'Today'
                    }
                  </span>
                </div>

                {assignment.assigned_by_name && (
                  <div className="text-gray-600">
                    <span className="font-medium">Assigned by:</span> {assignment.assigned_by_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkList;
