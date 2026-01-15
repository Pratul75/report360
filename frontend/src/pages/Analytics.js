import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Users, Loader2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const [expensePeriod, setExpensePeriod] = useState(30);

  // Fetch all analytics data
  const { data: campaignData, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['analytics-campaigns'],
    queryFn: async () => {
      const response = await analyticsAPI.getCampaignStatus();
      return response.data;
    },
  });

  const { data: expenseData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['analytics-expenses', expensePeriod],
    queryFn: async () => {
      const response = await analyticsAPI.getExpenseTrend(expensePeriod);
      return response.data;
    },
  });

  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ['analytics-payments'],
    queryFn: async () => {
      const response = await analyticsAPI.getPaymentsSummary();
      return response.data;
    },
  });

  const { data: vendorData, isLoading: loadingVendors } = useQuery({
    queryKey: ['analytics-vendors'],
    queryFn: async () => {
      const response = await analyticsAPI.getVendorPerformance(10);
      return response.data;
    },
  });

  const { data: utilizationData, isLoading: loadingUtilization } = useQuery({
    queryKey: ['analytics-utilization'],
    queryFn: async () => {
      const response = await analyticsAPI.getUtilizationSummary();
      return response.data;
    },
  });

  // Colors for charts
  const CAMPAIGN_COLORS = {
    'planning': '#3b82f6',
    'upcoming': '#8b5cf6',
    'running': '#10b981',
    'hold': '#f59e0b',
    'completed': '#6b7280',
    'cancelled': '#ef4444'
  };

  const PAYMENT_COLORS = {
    'pending': '#f59e0b',
    'submitted': '#3b82f6',
    'approved': '#10b981',
    'rejected': '#ef4444',
    'paid': '#059669'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const LoadingChart = () => (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  const EmptyChart = ({ message = "No data available" }) => (
    <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
      <p className="text-slate-500">{message}</p>
    </div>
  );

  return (
    <div data-testid="analytics-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics Dashboard</h1>
        <p className="text-slate-600">Real-time performance insights and trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-slate-800">
                  {campaignData?.data?.reduce((sum, item) => sum + item.count, 0) || 0}
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Drivers</p>
                <p className="text-2xl font-bold text-slate-800">
                  {utilizationData?.data?.drivers?.total || 0}
                </p>
              </div>
              <Users className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-slate-800">
                  {utilizationData?.data?.vehicles?.total || 0}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Running Campaigns</p>
                <p className="text-2xl font-bold text-slate-800">
                  {utilizationData?.data?.campaigns?.running || 0}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Status Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Campaign Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
              <LoadingChart />
            ) : campaignData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={campaignData.data}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {campaignData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CAMPAIGN_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No campaign data available" />
            )}
          </CardContent>
        </Card>

        {/* Expense Trend - Line Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Expense Trend
              </CardTitle>
              <select
                value={expensePeriod}
                onChange={(e) => setExpensePeriod(Number(e.target.value))}
                className="px-3 py-1 border border-slate-300 rounded text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingExpenses ? (
              <LoadingChart />
            ) : expenseData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={expenseData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Expense Amount"
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No expense data for this period" />
            )}
          </CardContent>
        </Card>

        {/* Payments Overview - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Payments Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <LoadingChart />
            ) : paymentsData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentsData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Amount">
                    {paymentsData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No payment data available" />
            )}
          </CardContent>
        </Card>

        {/* Vendor Performance - Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-3 w-5 text-blue-600" />
              Top Vendor Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVendors ? (
              <LoadingChart />
            ) : vendorData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={vendorData.data} 
                  layout="vertical"
                  margin={{ left: -10, right: 30}}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="vendor_name" 
                    width={170}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="paid_amount" stackId="a" fill="#10b981" name="Paid" />
                  <Bar dataKey="pending_amount" stackId="a" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No vendor data available" />
            )}
          </CardContent>
        </Card>

        {/* Vehicle Utilization - Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Vehicle Distribution by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUtilization ? (
              <LoadingChart />
            ) : utilizationData?.data?.vehicles?.by_type?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData.data.vehicles.by_type}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip labelStyle={{ color: '#000' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#5ca4f6" name="Vehicle Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No vehicle data available" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
