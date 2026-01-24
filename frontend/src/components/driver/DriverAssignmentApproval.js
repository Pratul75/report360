import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorBookingAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, MapPin, Truck, Calendar, User, AlertCircle } from 'lucide-react';

const DriverAssignmentApproval = ({ assignment, onActionComplete }) => {
  const queryClient = useQueryClient();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Debug logging
  console.log('DriverAssignmentApproval - Assignment data:', {
    id: assignment.id,
    work_title: assignment.work_title,
    status: assignment.status,
    approval_status: assignment.approval_status,
    isPending: assignment.approval_status === 'PENDING_APPROVAL'
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => vendorBookingAPI.driverApproveAssignment(assignment.id),
    onSuccess: () => {
      toast.success('Assignment approved successfully!');
      queryClient.invalidateQueries(['vendorAssignments']);
      queryClient.invalidateQueries(['driverWork']);
      onActionComplete && onActionComplete();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to approve assignment');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (reason) => vendorBookingAPI.driverRejectAssignment(assignment.id, reason),
    onSuccess: () => {
      toast.success('Assignment rejected');
      queryClient.invalidateQueries(['vendorAssignments']);
      queryClient.invalidateQueries(['driverWork']);
      setShowRejectForm(false);
      setRejectionReason('');
      onActionComplete && onActionComplete();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to reject assignment');
    }
  });

  const handleApprove = () => {
    if (window.confirm('Are you sure you want to approve this assignment?')) {
      approveMutation.mutate();
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (window.confirm('Are you sure you want to reject this assignment?')) {
      rejectMutation.mutate(rejectionReason);
    }
  };

  const getApprovalStatusColor = (status) => {
    switch (status) {
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

  const isPending = assignment.approval_status === 'PENDING_APPROVAL';
  const isApproved = assignment.approval_status === 'APPROVED';
  const isRejected = assignment.approval_status === 'REJECTED';

  return (
    <Card className={`${isPending ? 'border-orange-300 border-2' : ''}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{assignment.work_title || 'Work Assignment'}</CardTitle>
            <Badge className={getApprovalStatusColor(assignment.approval_status)}>
              {isPending && <Clock className="w-3 h-3 mr-1" />}
              {isApproved && <CheckCircle className="w-3 h-3 mr-1" />}
              {isRejected && <XCircle className="w-3 h-3 mr-1" />}
              {isPending ? 'Pending Your Approval' : isApproved ? 'You Approved' : 'You Rejected'}
            </Badge>
          </div>
          {/* Show work status separately */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Work Status:</span>
            <Badge variant="outline" className="text-xs">
              {assignment.status === 'IN_PROGRESS' ? 'In Progress' : 
               assignment.status === 'PENDING' ? 'Pending' :
               assignment.status === 'COMPLETED' ? 'Completed' : assignment.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Assignment Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Date</p>
              <p className="text-sm font-medium">{new Date(assignment.assignment_date).toLocaleDateString()}</p>
            </div>
          </div>

          {assignment.vehicle_number && (
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">Vehicle</p>
                <p className="text-sm font-medium">{assignment.vehicle_number}</p>
              </div>
            </div>
          )}

          {assignment.village_name && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">Location</p>
                <p className="text-sm font-medium">{assignment.village_name}</p>
                {assignment.location_address && (
                  <p className="text-xs text-gray-500">{assignment.location_address}</p>
                )}
              </div>
            </div>
          )}

          {(assignment.expected_start_time || assignment.expected_end_time) && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">Time</p>
                <p className="text-sm font-medium">
                  {assignment.expected_start_time || '--:--'} to {assignment.expected_end_time || '--:--'}
                </p>
              </div>
            </div>
          )}

          {assignment.work_description && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 mb-1">Description</p>
              <p className="text-sm text-gray-800">{assignment.work_description}</p>
            </div>
          )}
        </div>

        {/* Rejection Reason Display */}
        {isRejected && assignment.rejection_reason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-900">Rejection Reason:</p>
                <p className="text-sm text-red-800">{assignment.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons (only for pending) */}
        {isPending && (
          <div className="space-y-3">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button 
                  onClick={handleApprove}
                  disabled={approveMutation.isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {approveMutation.isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setShowRejectForm(true)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Reason for Rejection *
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this assignment..."
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleReject}
                    disabled={rejectMutation.isLoading || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {rejectMutation.isLoading ? 'Submitting...' : 'Submit Rejection'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {isApproved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              You have Accepted this assignment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverAssignmentApproval;
