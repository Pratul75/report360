import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle, Clock, Users, FileText, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { operationsAPI } from '@/lib/api';

const Operations = () => {
  // Date filter state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]); // Today
  
  // Fetch operations summary from API
  const { data: operationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['operations-summary', fromDate, toDate],
    queryFn: async () => {
      const response = await operationsAPI.getSummary(fromDate || undefined, toDate);
      return response.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds for live updates
  });

  // Handle filter reset
  const handleReset = () => {
    setFromDate('');
    setToDate(new Date().toISOString().split('T')[0]);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div data-testid="operations-page">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Operations</h1>
          <p className="text-slate-600">Monitor live campaign execution and operations</p>
        </div>
        <div className="text-center py-8 text-slate-500">
          Loading operations data...
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div data-testid="operations-page">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Operations</h1>
          <p className="text-slate-600">Monitor live campaign execution and operations</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error loading operations data</p>
                <p className="text-sm text-red-700">{error.message || 'Failed to fetch data'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="operations-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Operations Dashboard</h1>
        <p className="text-slate-600">Monitor live campaign execution and operations</p>
      </div>

      {/* Date Filter Section */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <Calendar className="w-5 h-5" />
              <span>Date Filter:</span>
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Today
            </button>
            
            {operationsData && (
              <div className="text-sm text-slate-600">
                Showing: <span className="font-semibold text-slate-800">
                  {operationsData.from_date} to {operationsData.to_date}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Running Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{operationsData?.running_campaigns || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Active right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{operationsData?.on_hold_campaigns || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Temporarily paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed in Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{operationsData?.completed_in_range || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Finished campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{operationsData?.issues_count || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Drivers in Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-3xl font-bold">{operationsData?.active_drivers || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Working in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Reports Submitted in Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              <span className="text-3xl font-bold">{operationsData?.reports_in_range || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Filed in selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Status Breakdown */}
      {operationsData?.campaign_status_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Campaign Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(operationsData.campaign_status_breakdown).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-600 capitalize mt-1">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Operations;

