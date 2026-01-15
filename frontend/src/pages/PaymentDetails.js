import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, CreditCard, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentsAPI.getOne(id).then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading payment details...</div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Payment not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'text-blue-600';
      case 'upi':
        return 'text-purple-600';
      case 'cheque':
        return 'text-green-600';
      case 'cash':
        return 'text-orange-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800">Payment Details</h1>
          <p className="text-slate-600">View complete payment information</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Payment Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                  {payment.status?.toUpperCase()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Payment Amount</label>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Payment Date</label>
                  <p className="text-lg">
                    {payment.payment_date ? formatDate(payment.payment_date) : 'Not yet processed'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Payment Method</label>
                  <p className={`text-lg font-medium ${getMethodColor(payment.payment_method)}`}>
                    {payment.payment_method ? payment.payment_method.replace('_', ' ').toUpperCase() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Transaction Reference</label>
                  <p className="text-lg font-mono">{payment.transaction_reference || 'N/A'}</p>
                </div>
              </div>

              {payment.remarks && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Remarks</label>
                  <p className="text-slate-800 mt-1">{payment.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Link */}
          {payment.invoice_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Related Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Invoice ID</label>
                    <p className="text-lg">{payment.invoice_id}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/invoices/${payment.invoice_id}`)}
                    className="mt-2"
                  >
                    View Invoice Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline & Payment Method Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Created</label>
                <p className="text-sm">{formatDate(payment.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Updated</label>
                <p className="text-sm">{formatDate(payment.updated_at)}</p>
              </div>
              {payment.payment_date && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Processed On</label>
                  <p className="text-sm">{formatDate(payment.payment_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <CreditCard className="h-8 w-8 text-slate-600" />
                <div>
                  <p className="font-medium capitalize">
                    {payment.payment_method ? payment.payment_method.replace('_', ' ') : 'Not specified'}
                  </p>
                  {payment.transaction_reference && (
                    <p className="text-xs text-slate-600 font-mono">{payment.transaction_reference}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                  <div>
                    <p className="font-medium">Pending</p>
                    <p className="text-sm text-slate-600">{formatDate(payment.created_at)}</p>
                  </div>
                </div>
                {payment.status === 'processing' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Processing</p>
                      <p className="text-sm text-slate-600">{formatDate(payment.updated_at)}</p>
                    </div>
                  </div>
                )}
                {payment.status === 'completed' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-sm text-slate-600">
                        {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
                {payment.status === 'failed' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Failed</p>
                      <p className="text-sm text-slate-600">{formatDate(payment.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
