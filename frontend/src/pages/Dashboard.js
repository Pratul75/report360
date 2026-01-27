import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Truck, DollarSign, AlertCircle, Clock, TrendingUp, Pause, CheckCircle, XCircle, Calendar, PlayCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, color, testId }) => (
  <Card data-testid={testId}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  
  // Redirect non-admin users to their respective dashboards
  React.useEffect(() => {
    if (userRole !== 'admin') {
      // Redirect based on role
      switch (userRole) {
        case 'vendor':
          navigate('/vendor-dashboard', { replace: true });
          break;
        case 'driver':
          navigate('/driver-dashboard', { replace: true });
          break;
        case 'client_servicing':
          navigate('/client-servicing-dashboard', { replace: true });
          break;
        case 'operations_manager':
          navigate('/driver-dashboard', { replace: true });
          break;
        default:
          // Unknown role or no dashboard - redirect to welcome page
          navigate('/welcome', { replace: true });
          break;
      }
    }
  }, [userRole, navigate]);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardAPI.getStats().then(res => res.data),
    refetchInterval: 30000, // Auto-refresh every 30 seconds for live status
    refetchOnWindowFocus: true, // Refresh when user switches back to tab
    enabled: userRole === 'admin', // Only fetch if admin
  });

  // Don't render anything if not admin
  if (userRole !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="border-red-200 bg-red-50 max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error loading dashboard</p>
                <p className="text-sm text-red-700">{error.message || 'Failed to fetch dashboard data'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Monitor your fleet operations in real-time</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Active Projects"
          value={stats?.active_projects || 0}
          icon={Activity}
          color="text-blue-600"
          testId="stat-active-projects"
        />
        <StatCard
          title="Running Campaigns"
          value={stats?.running_campaigns || 0}
          icon={Users}
          color="text-green-600"
          testId="stat-running-campaigns"
        />
        <StatCard
          title="Vehicles on Ground"
          value={stats?.vehicles_on_ground || 0}
          icon={Truck}
          color="text-purple-600"
          testId="stat-vehicles-on-ground"
        />
        <StatCard
          title="Total Expense"
          value={formatCurrency(stats?.todays_expense || 0)}
          icon={DollarSign}
          color="text-amber-600"
          testId="stat-todays-expense"
        />
        <StatCard
          title="Pending Expenses"
          value={stats?.pending_expenses || 0}
          icon={Clock}
          color="text-orange-600"
          testId="stat-pending-expenses"
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pending_payments || 0}
          icon={AlertCircle}
          color="text-red-600"
          testId="stat-pending-payments"
        />
      </div>

      {/* Admin-Only Campaign Status Stats */}
      {userRole === 'admin' && stats?.campaign_stats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Campaign Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Planning"
              value={stats.campaign_stats.planning || 0}
              icon={Calendar}
              color="text-slate-600"
              testId="campaign-stat-planning"
            />
            <StatCard
              title="Upcoming"
              value={stats.campaign_stats.upcoming || 0}
              icon={TrendingUp}
              color="text-blue-600"
              testId="campaign-stat-upcoming"
            />
            <StatCard
              title="Running"
              value={stats.campaign_stats.running || 0}
              icon={PlayCircle}
              color="text-green-600"
              testId="campaign-stat-running"
            />
            <StatCard
              title="On Hold"
              value={stats.campaign_stats.hold || 0}
              icon={Pause}
              color="text-yellow-600"
              testId="campaign-stat-hold"
            />
            <StatCard
              title="Completed"
              value={stats.campaign_stats.completed || 0}
              icon={CheckCircle}
              color="text-emerald-600"
              testId="campaign-stat-completed"
            />
            <StatCard
              title="Cancelled"
              value={stats.campaign_stats.cancelled || 0}
              icon={XCircle}
              color="text-red-600"
              testId="campaign-stat-cancelled"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              data-testid="quick-action-new-campaign"
              className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all group cursor-pointer"
              onClick={() => navigate('/campaigns/new')}
            >
              <Activity className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <h3 className="font-semibold">Create Campaign</h3>
              <p className="text-sm text-slate-500">Start a new campaign</p>
            </button>
            <button
              data-testid="quick-action-add-expense"
              className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group cursor-pointer"
              onClick={() => navigate('/expenses/new')}
            >
              <DollarSign className="h-8 w-8 text-slate-400 group-hover:text-purple-600 mb-2" />
              <h3 className="font-semibold">Submit Expense</h3>
              <p className="text-sm text-slate-500">Add new expense</p>
            </button>
            <button
              data-testid="quick-action-generate-report"
              className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group cursor-pointer"
              onClick={() => navigate('/reports/new')}
            >
              <AlertCircle className="h-8 w-8 text-slate-400 group-hover:text-green-600 mb-2" />
              <h3 className="font-semibold">Generate Report</h3>
              <p className="text-sm text-slate-500">Create execution report</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
