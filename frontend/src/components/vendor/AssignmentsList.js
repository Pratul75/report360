import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorBookingAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, MapPin, Clock, User, Truck, Calendar } from 'lucide-react';

const AssignmentsList = ({ campaignId, selectedDate }) => {
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['vendorAssignments', campaignId, selectedDate],
    queryFn: () => vendorBookingAPI.getAssignments(null, campaignId, selectedDate),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading assignments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading assignments: {error.message}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No assignments found</p>
        <p className="text-sm mt-1">Click "Assign Driver" to create new assignment</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApprovalStatusColor = (approvalStatus) => {
    switch (approvalStatus) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PENDING_APPROVAL':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApprovalStatusLabel = (approvalStatus) => {
    switch (approvalStatus) {
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING_APPROVAL':
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Work Assignments ({assignments.length})
      </h3>
      
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {assignment.work_title || 'Work Assignment'}
                </h4>
                <p className="text-sm text-gray-600">
                  {assignment.work_description || 'No description'}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(assignment.status)}>
                  {assignment.status}
                </Badge>
                <Badge className={getApprovalStatusColor(assignment.approval_status)}>
                  {getApprovalStatusLabel(assignment.approval_status)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Driver Info */}
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">Driver</p>
                  <p className="text-gray-900">{assignment.driver_name}</p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">Vehicle</p>
                  <p className="text-gray-900">{assignment.vehicle_number || 'Not assigned'}</p>
                </div>
              </div>

              {/* Location */}
              {assignment.village_name && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-900">{assignment.village_name}</p>
                    {assignment.location_address && (
                      <p className="text-xs text-gray-600">{assignment.location_address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Time */}
              {(assignment.expected_start_time || assignment.expected_end_time) && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Time</p>
                    <p className="text-gray-900">
                      {assignment.expected_start_time || '--:--'} to {assignment.expected_end_time || '--:--'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {assignment.approval_status === 'REJECTED' && assignment.rejection_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                <p className="text-sm text-red-800">{assignment.rejection_reason}</p>
              </div>
            )}

            {/* Date */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(assignment.assignment_date).toLocaleDateString()}
                </span>
                {assignment.remarks && (
                  <span className="italic">Note: {assignment.remarks}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssignmentsList;
