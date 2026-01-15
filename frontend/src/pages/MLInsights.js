import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, TrendingUp, AlertTriangle, Activity, Truck, Users, 
  Building2, DollarSign, BarChart3, Lightbulb, RefreshCw, ShieldOff 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mlInsightsAPI } from '../lib/api';
import toast from 'react-hot-toast';

const MLInsights = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if ML service is enabled
  const { data: statusData } = useQuery({
    queryKey: ['ml-insights-status'],
    queryFn: mlInsightsAPI.getStatus,
    retry: 1,
  });

  // Fetch dashboard insights
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['ml-insights-dashboard'],
    queryFn: mlInsightsAPI.getDashboard,
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: statusData?.enabled !== false, // Only fetch if enabled
  });

  useEffect(() => {
    if (error) {
      console.error('ML Insights error:', error);
      toast.error('Failed to load ML insights');
    }
  }, [error]);

  useEffect(() => {
    if (dashboardData) {
      console.log('Dashboard data loaded:', dashboardData);
    }
  }, [dashboardData]);

  const handleRefresh = () => {
    toast.loading('Refreshing insights...', { id: 'refresh' });
    refetch().then(() => {
      toast.success('Insights updated!', { id: 'refresh' });
    });
  };

  // Check if ML service is disabled
  if (statusData?.enabled === false) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">ML Service Disabled</h3>
          <p className="text-gray-600">
            The ML Insights service is currently disabled by system administrator.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Contact admin to enable via ENABLE_ML_SERVICE environment variable.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Brain className="w-12 h-12 text-purple-600 animate-pulse" />
          <p className="text-gray-600">Analyzing data with ML...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">ML service temporarily unavailable</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const dashboard = dashboardData || {};
  const summary = dashboard.summary || {};
  const campaignInsights = dashboard.campaign_insights || [];
  const expenseAnomalies = dashboard.expense_anomalies || [];
  const vehicleUtilization = dashboard.vehicle_utilization || [];
  const driverUtilization = dashboard.driver_utilization || [];
  const vendorPerformance = dashboard.vendor_performance || [];
  const topRecommendations = dashboard.top_recommendations || [];
  const criticalAlerts = dashboard.critical_alerts || [];

  // Debug logging
  console.log('ML Dashboard Data:', { 
    campaignCount: campaignInsights.length,
    firstCampaign: campaignInsights[0],
    topRecommendations 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ML Insights Dashboard</h1>
            <p className="text-sm text-gray-500">AI-powered analytics & recommendations</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {criticalAlerts.map((alert, index) => (
                <li key={index} className="flex items-start gap-2 text-red-800">
                  <span className="text-lg">{alert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summary.total_campaigns || 0}</p>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.active_campaigns || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summary.avg_performance_score || 0}%</p>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Campaign score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summary.high_priority_alerts || 0}</p>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expense Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summary.anomalous_expenses || 0}</p>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Recommendations */}
      {topRecommendations.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Lightbulb className="w-5 h-5" />
              Top Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topRecommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-purple-800">
                  <span className="text-lg">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Campaign Insights */}
      {campaignInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Campaign Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Campaign</th>
                    <th className="text-left py-2 px-3">Performance</th>
                    <th className="text-left py-2 px-3">Budget Use</th>
                    <th className="text-left py-2 px-3">ROI</th>
                    <th className="text-left py-2 px-3">Trend</th>
                    <th className="text-left py-2 px-3">Recommendations</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignInsights.map((insight, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{insight.campaign_name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          insight.performance_score >= 80 ? 'bg-green-100 text-green-800' :
                          insight.performance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {insight.performance_score}%
                        </span>
                      </td>
                      <td className="py-3 px-3">{insight.budget_utilization}%</td>
                      <td className="py-3 px-3">{insight.roi_estimate}%</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          insight.trend === 'improving' ? 'bg-green-100 text-green-800' :
                          insight.trend === 'declining' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {insight.trend}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <ul className="text-sm space-y-1">
                          {insight.recommendations && insight.recommendations.length > 0 ? (
                            insight.recommendations.map((rec, i) => (
                              <li key={i} className="text-gray-800 font-medium flex items-start gap-1">
                                <span className="text-base">{rec}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-400 italic">No recommendations</li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Anomalies */}
      {expenseAnomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Expense Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Expense ID</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Amount</th>
                    <th className="text-left py-2 px-3">Expected Range</th>
                    <th className="text-left py-2 px-3">Anomaly Score</th>
                    <th className="text-left py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseAnomalies.map((anomaly, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-mono text-sm">{anomaly.expense_id}</td>
                      <td className="py-3 px-3">{anomaly.expense_type}</td>
                      <td className="py-3 px-3 font-semibold">₹{anomaly.amount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        ₹{anomaly.expected_range.min} - ₹{anomaly.expected_range.max}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          anomaly.anomaly_score > 3 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {anomaly.anomaly_score}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">{anomaly.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Utilization & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Utilization */}
        {vehicleUtilization.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vehicle Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicleUtilization.slice(0, 5).map((vehicle, index) => (
                  <div key={index} className="border-b pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{vehicle.entity_name}</span>
                      <span className={`text-sm font-semibold ${
                        vehicle.utilization_rate >= 70 ? 'text-green-600' :
                        vehicle.utilization_rate >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {vehicle.utilization_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          vehicle.utilization_rate >= 70 ? 'bg-green-500' :
                          vehicle.utilization_rate >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${vehicle.utilization_rate}%` }}
                      />
                    </div>
                    {vehicle.recommendations && vehicle.recommendations.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-800 font-medium space-y-1">
                        {vehicle.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Driver Utilization */}
        {driverUtilization.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Driver Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {driverUtilization.slice(0, 5).map((driver, index) => (
                  <div key={index} className="border-b pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{driver.entity_name}</span>
                      <span className={`text-sm font-semibold ${
                        driver.utilization_rate >= 70 ? 'text-green-600' :
                        driver.utilization_rate >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {driver.utilization_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          driver.utilization_rate >= 70 ? 'bg-green-500' :
                          driver.utilization_rate >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${driver.utilization_rate}%` }}
                      />
                    </div>
                    {driver.recommendations && driver.recommendations.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-800 font-medium space-y-1">
                        {driver.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vendor Performance */}
      {vendorPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Vendor Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Vendor</th>
                    <th className="text-left py-2 px-3">Reliability</th>
                    <th className="text-left py-2 px-3">Avg Delivery (days)</th>
                    <th className="text-left py-2 px-3">Cost Efficiency</th>
                    <th className="text-left py-2 px-3">Recommendations</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPerformance.slice(0, 5).map((vendor, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{vendor.vendor_name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          vendor.reliability_score >= 90 ? 'bg-green-100 text-green-800' :
                          vendor.reliability_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {vendor.reliability_score}%
                        </span>
                      </td>
                      <td className="py-3 px-3">{vendor.avg_delivery_time}</td>
                      <td className="py-3 px-3">{vendor.cost_efficiency}%</td>
                      <td className="py-3 px-3">
                        <ul className="text-sm space-y-1">
                          {vendor.recommendations && vendor.recommendations.length > 0 ? (
                            vendor.recommendations.map((rec, i) => (
                              <li key={i} className="text-gray-800 font-medium flex items-start gap-1">
                                <span className="text-base">{rec}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-400 italic">No recommendations</li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MLInsights;
