import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Calendar, DollarSign, Building2, Briefcase } from 'lucide-react';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await invoicesAPI.getOne(id);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load invoice</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    const colors = {
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'approved': 'bg-blue-100 text-blue-800 border-blue-200',
      'submitted': 'bg-purple-100 text-purple-800 border-purple-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between no-print">
        <Button
          variant="outline"
          onClick={() => {
            // Always go back to dashboard invoices tab if not coming from dashboard
            if (location.state && location.state.from && location.state.from.pathname.startsWith('/vendor-dashboard')) {
              navigate(
                location.state.from.pathname + (location.state.from.search || ''),
                { replace: true, state: { activeTab: location.state.activeTab || 'invoices' } }
              );
            } else {
              navigate('/vendor-dashboard', { state: { activeTab: 'invoices' } });
            }
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice PDF View */}
      <Card className="print:shadow-none">
        <CardHeader className="border-b bg-slate-50 print:bg-white">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">TAX INVOICE</CardTitle>
              <p className="text-sm text-slate-600">Fleet Operations Platform</p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(invoice.status)}`}>
                {invoice.status?.toUpperCase()}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Invoice Header Info */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b">
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Bill From:</h3>
              <div className="space-y-1">
                <p className="font-medium text-lg">{invoice.vendor?.name || invoice.vendor?.id || 'N/A'}</p>
                {invoice.vendor?.email && (
                  <p className="text-sm text-slate-600">{invoice.vendor.email}</p>
                )}
                {invoice.vendor?.phone && (
                  <p className="text-sm text-slate-600">{invoice.vendor.phone}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-slate-700 mb-3">Invoice Details:</h3>
              <div className="space-y-2">
                <div className="flex justify-end items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Invoice No:</span>
                  <span className="font-semibold">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-end items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Date:</span>
                  <span className="font-semibold">
                    {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {invoice.campaign && (
                  <div className="flex justify-end items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Campaign:</span>
                    <span className="font-semibold">{invoice.campaign.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-slate-700 mb-4">Invoice Items:</h3>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700">Description</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 text-slate-700">
                    {invoice.campaign?.name || 'Services Rendered'}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    ₹{invoice.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-2 border-t">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">
                  ₹{invoice.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-300">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-lg font-bold text-indigo-600">
                  ₹{invoice.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {invoice.payment && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Payment Date:</span>
                  <span className="ml-2 font-semibold">
                    {invoice.payment.payment_date 
                      ? new Date(invoice.payment.payment_date).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-green-700">Payment Method:</span>
                  <span className="ml-2 font-semibold capitalize">
                    {invoice.payment.payment_method?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
                {invoice.payment.transaction_reference && (
                  <div className="col-span-2">
                    <span className="text-green-700">Reference:</span>
                    <span className="ml-2 font-semibold">
                      {invoice.payment.transaction_reference}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice PDF/Bill File View */}
          {invoice.invoice_file && (
            <div className="mb-8">
              <h3 className="font-semibold text-slate-700 mb-2">Bill Image / Invoice File:</h3>
              <div className="border rounded p-3 bg-slate-50">
                {invoice.invoice_file.match(/\.(pdf)$/i) ? (
                  <a href={invoice.invoice_file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">View PDF</a>
                ) : (
                  <img src={invoice.invoice_file} alt="Invoice Bill" className="max-h-96 object-contain border" />
                )}
              </div>
            </div>
          )}

          {/* Footer Notes */}
          <div className="text-center text-sm text-slate-500 pt-6 border-t">
            <p>Thank you for your business!</p>
            <p className="mt-1">For any queries, please contact our accounts department.</p>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except invoice */
          body * {
            visibility: hidden;
          }
          
          /* Hide navigation, sidebar, headers */
          .no-print,
          header,
          nav,
          aside,
          .sidebar,
          button,
          .breadcrumb {
            display: none !important;
          }
          
          /* Show only invoice content */
          .max-w-4xl,
          .max-w-4xl * {
            visibility: visible;
          }
          
          /* Position invoice at top of page */
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 20px;
          }
          
          /* Ensure colors print correctly */
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Remove shadows and borders for cleaner print */
          .shadow-sm,
          .shadow,
          .shadow-lg {
            box-shadow: none !important;
          }
          
          /* Page breaks */
          .card {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetails;
