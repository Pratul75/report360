import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, AlertCircle, Eye, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { accountsAPI, invoicesAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Accounts = () => {
  const navigate = useNavigate();
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  // Fetch accounts summary from API
  const { data: accountsData, isLoading, error } = useQuery({
    queryKey: ['accounts-summary'],
    queryFn: async () => {
      const response = await accountsAPI.getSummary();
      return response.data;
    }
  });

  // Fetch all invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['all-invoices'],
    queryFn: async () => {
      const response = await invoicesAPI.getAll();
      return response.data;
    },
    enabled: showAllInvoices
  });

  // Show loading state
  if (isLoading) {
    return (
      <div data-testid="accounts-page">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Accounts & Payments</h1>
          <p className="text-slate-600">Manage vendor and driver payments</p>
        </div>
        <div className="text-center py-8 text-slate-500">
          Loading financial data...
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div data-testid="accounts-page">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Accounts & Payments</h1>
          <p className="text-slate-600">Manage vendor and driver payments</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load financial data. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="accounts-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Accounts & Payments</h1>
        <p className="text-slate-600">Manage vendor and driver payments</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">
                ₹{accountsData?.total_pending?.toLocaleString('en-IN') || '0'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {accountsData?.pending_count || 0} pending transaction(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                ₹{accountsData?.paid_this_month?.toLocaleString('en-IN') || '0'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Completed payments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              <span className="text-2xl font-bold">
                ₹{accountsData?.total_payable?.toLocaleString('en-IN') || '0'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Unpaid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor-wise Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendor-wise Payment Summary</CardTitle>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowAllInvoices(!showAllInvoices)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {showAllInvoices ? 'Hide' : 'View All'} Invoices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accountsData?.vendor_summary?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-slate-700">Vendor</th>
                    <th className="text-right p-2 font-medium text-slate-700">Invoices</th>
                    <th className="text-right p-2 font-medium text-slate-700">Total Invoiced</th>
                    <th className="text-right p-2 font-medium text-slate-700">Paid</th>
                    <th className="text-right p-2 font-medium text-slate-700">Pending</th>
                    <th className="text-center p-2 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsData.vendor_summary.map((vendor, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium">{vendor.vendor_name}</td>
                      <td className="p-2 text-right">{vendor.invoice_count}</td>
                      <td className="p-2 text-right">₹{vendor.total_invoiced?.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right text-green-600">₹{vendor.invoice_paid?.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right text-orange-600">₹{vendor.invoice_pending?.toLocaleString('en-IN')}</td>
                      <td className="p-2 flex items-center justify-center"> 
                        <Button 
                        
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/vendors/${vendor.vendor_id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No vendor payment data available</p>
          )}
        </CardContent>
      </Card>

      {/* Campaign-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign-wise Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {accountsData?.campaign_summary?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-slate-700">Campaign</th>
                    <th className="text-right p-2 font-medium text-slate-700">Invoices</th>
                    <th className="text-right p-2 font-medium text-slate-700">Total Amount</th>
                    <th className="text-right p-2 font-medium text-slate-700">Paid</th>
                    <th className="text-center p-2 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsData.campaign_summary.map((campaign, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium">{campaign.campaign_name}</td>
                      <td className="p-2 text-right">{campaign.invoice_count}</td>
                      <td className="p-2 text-right">₹{campaign.total_amount?.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right text-green-600">₹{campaign.paid_amount?.toLocaleString('en-IN')}</td>
                      <td className="p-2 flex items-center justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/campaigns/${campaign.campaign_id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No campaign invoice data available</p>
          )}
        </CardContent>
      </Card>

      {/* All Invoices Section */}
      {showAllInvoices && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Invoices / Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesData?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-slate-700">Invoice No.</th>
                      <th className="text-left p-2 font-medium text-slate-700">Vendor</th>
                      <th className="text-left p-2 font-medium text-slate-700">Date</th>
                      <th className="text-right p-2 font-medium text-slate-700">Amount</th>
                      <th className="text-center p-2 font-medium text-slate-700">Status</th>
                      <th className="text-center p-2 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesData.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-medium">{invoice.invoice_number}</td>
                        <td className="p-2">{invoice.vendor?.name || invoice.vendor?.id || 'N/A'}</td>
                        <td className="p-2">{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</td>
                        <td className="p-2 text-right font-semibold">₹{invoice.amount?.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {invoice.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                            className="flex items-center gap-1 mx-auto"
                          >
                            <FileText className="h-3 w-3" />
                            View Bill
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No invoices found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Accounts;
