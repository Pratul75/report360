import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorDashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Truck, FileText, DollarSign, Activity, Upload, UserPlus } from 'lucide-react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import BackButton from '@/components/ui/BackButton';
import { formatCurrency, formatDate } from '@/lib/utils';
import DriverBookingForm from '@/components/vendor/DriverBookingForm';
import AssignmentsList from '@/components/vendor/AssignmentsList';

import { useLocation } from 'react-router-dom';

const VendorDashboard = () => {
  const { navigateTo } = useSmartNavigation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
    // Restore tab from navigation state if present
    useEffect(() => {
      if (location.state && location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
    }, [location.state]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () => vendorDashboardAPI.getDashboard().then(res => res.data),
  });

  const { data: menuCounts } = useQuery({
    queryKey: ['vendor-menu-counts'],
    queryFn: () => vendorDashboardAPI.getMenuCounts(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const { summary, assigned_campaigns, vehicles, drivers, invoices, payments } = dashboardData || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vendor Dashboard</h1>
          <p className="text-slate-600">Manage your operations and track performance</p>
        </div>
        {/* Optional: Show BackButton if you want a global back button at the top */}
        {/* <BackButton fallbackPath="/" /> */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Campaigns</p>
                <p className="text-2xl font-bold">{summary?.total_campaigns || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Vehicles</p>
                <p className="text-2xl font-bold">{summary?.total_vehicles || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Drivers</p>
                <p className="text-2xl font-bold">{summary?.total_drivers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Invoices</p>
                <p className="text-2xl font-bold">{summary?.total_invoices || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Payments</p>
                <p className="text-2xl font-bold">{summary?.pending_payments || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.total_revenue || 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({assigned_campaigns?.length || 0})</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles?.length || 0})</TabsTrigger>
          <TabsTrigger value="drivers">Drivers ({drivers?.length || 0})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-xl font-semibold">Business Overview</h2>
          
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices?.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-600">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      invoice.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
              {invoices?.length === 0 && (
                <p className="text-center text-slate-500 py-8">No invoices yet</p>
              )}
              {invoices?.length > 0 && (
                <Button variant="link" className="w-full mt-4" onClick={() => setActiveTab('invoices')}>
                  View All Invoices →
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments?.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-slate-600">
                      {payment.payment_date ? formatDate(payment.payment_date) : 'Pending'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    payment.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
              {payments?.length === 0 && (
                <p className="text-center text-slate-500 py-8">No payments yet</p>
              )}
              {payments?.length > 0 && (
                <Button variant="link" className="w-full mt-4" onClick={() => setActiveTab('payments')}>
                  View All Payments →
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Vehicles</span>
                  <span className="font-semibold">{summary?.total_vehicles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Drivers</span>
                  <span className="font-semibold">{summary?.total_drivers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Campaigns</span>
                  <span className="font-semibold">{summary?.total_campaigns || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Revenue</span>
                  <span className="font-semibold text-green-600">{formatCurrency(summary?.total_revenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Invoices</span>
                  <span className="font-semibold">{summary?.total_invoices || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending Payments</span>
                  <span className="font-semibold text-orange-600">{summary?.pending_payments || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assigned Campaigns</h2>
          </div>
          
          <div className="grid gap-4">
            {assigned_campaigns?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  No campaigns assigned yet
                </CardContent>
              </Card>
            ) : (
              assigned_campaigns?.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardContent className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        {campaign.project_name && (
                          <p className="text-sm text-blue-600 font-medium">Project: {campaign.project_name}</p>
                        )}
                        {campaign.client_name && (
                          <p className="text-sm text-purple-600">Client: {campaign.client_name}</p>
                        )}
                        {campaign.vendor_names && campaign.vendor_names.length > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            Vendor: {campaign.vendor_names.join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 mt-1">{campaign.description}</p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-sm text-slate-600">
                            {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            campaign.status === 'running' ? 'bg-green-100 text-green-700' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowBookingForm(showBookingForm && selectedCampaign?.id === campaign.id ? false : true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign Driver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateTo(`/campaigns/${campaign.id}`, { state: { from: { pathname: window.location.pathname }, activeTab } })}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                    
                    {/* Booking Form - shown inline when button is clicked */}
                    {showBookingForm && selectedCampaign?.id === campaign.id && (
                      <div className="mb-4">
                        <DriverBookingForm
                          campaignId={campaign.id}
                          campaignName={campaign.name}
                          vendorId={null}
                          onSuccess={() => {
                            setShowBookingForm(false);
                            setSelectedCampaign(null);
                          }}
                          onCancel={() => {
                            setShowBookingForm(false);
                            setSelectedCampaign(null);
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Display assignments for this campaign */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3 text-slate-700">Work Assignments</h4>
                      <AssignmentsList 
                        campaignId={campaign.id}
                        selectedDate={selectedDate}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Vehicles</h2>
            <Button onClick={() => navigateTo('/vehicles/new', { activeTab })}>
              <Upload className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          </div>
          <div className="grid gap-4">
            {vehicles?.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardContent className="px-6 pt-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{vehicle.vehicle_number}</h3>
                      <p className="text-sm text-slate-600">{vehicle.vehicle_type}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(`/vehicles/${vehicle.id}`, { state: { from: { pathname: window.location.pathname }, activeTab } })}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!vehicles || vehicles.length === 0) && (
              <p className="text-center text-slate-500 py-8">No vehicles yet. Add your first vehicle!</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Drivers</h2>
            <Button onClick={() => navigateTo('/drivers/new', { activeTab })}>
              <Upload className="mr-2 h-4 w-4" /> Add Driver
            </Button>
          </div>
          <div className="grid gap-4">
            {drivers?.map((driver) => (
              <Card key={driver.id}>
                <CardContent className="px-6 pt-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{driver.name}</h3>
                      <p className="text-sm text-slate-600">{driver.phone}</p>
                      <p className="text-sm text-slate-600">License: {driver.license_number}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(`/drivers/${driver.id}`, { state: { from: { pathname: window.location.pathname }, activeTab } })}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!drivers || drivers.length === 0) && (
              <p className="text-center text-slate-500 py-8">No drivers yet. Add your first driver!</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Invoices</h2>
            <Button onClick={() => navigateTo('/invoices/new', { activeTab })}>
              <Upload className="mr-2 h-4 w-4" /> Upload Invoice
            </Button>
          </div>
          <div className="grid gap-4">
            {invoices?.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="px-6 pt-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{invoice.invoice_number}</h3>
                      <p className="text-sm text-slate-600">Amount: {formatCurrency(invoice.amount)}</p>
                      <p className="text-sm text-slate-600">Date: {formatDate(invoice.invoice_date)}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        invoice.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(`/invoices/${invoice.id}`, { state: { from: { pathname: window.location.pathname }, activeTab } })}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <h2 className="text-xl font-semibold">Payment Status</h2>
          <div className="grid gap-4">
            {payments?.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="px-6 pt-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{formatCurrency(payment.amount)}</h3>
                      <p className="text-sm text-slate-600">
                        {payment.payment_date ? formatDate(payment.payment_date) : 'Pending'}
                      </p>
                      <p className="text-sm text-slate-600">Method: {payment.payment_method || 'N/A'}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        payment.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(`/payments/${payment.id}`, { state: { from: { pathname: window.location.pathname }, activeTab } })}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;
