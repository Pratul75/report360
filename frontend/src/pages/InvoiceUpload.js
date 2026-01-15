import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { invoicesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft, Loader2 } from 'lucide-react';

const InvoiceUpload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    invoice_date: '',
    due_date: '',
    campaign_id: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create invoice
      const invoiceData = {
        ...formData,
        amount: parseFloat(formData.amount),
        campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : null,
      };

      const { data } = await invoicesAPI.create(invoiceData);
      setCreatedInvoiceId(data.id);
      toast.success('Invoice created successfully!');

      // Step 2: Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        await invoicesAPI.uploadFile(data.id, selectedFile);
        toast.success('Invoice file uploaded successfully!');
      }

      // Redirect to vendor dashboard
      setTimeout(() => navigate('/vendor-dashboard'), 1500);
    } catch (error) {
      console.error('Invoice creation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/vendor-dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  name="invoice_number"
                  placeholder="INV-001"
                  required
                  value={formData.invoice_number}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  name="invoice_date"
                  type="date"
                  required
                  value={formData.invoice_date}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_id">Campaign ID (Optional)</Label>
              <Input
                id="campaign_id"
                name="campaign_id"
                type="number"
                placeholder="Leave blank if not campaign-specific"
                value={formData.campaign_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className="w-full min-h-[100px] px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Invoice details..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Invoice File (PDF, JPG, PNG - Max 10MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-slate-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || uploadingFile}
                className="flex-1"
              >
                {loading || uploadingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingFile ? 'Uploading File...' : 'Creating Invoice...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create Invoice
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vendor-dashboard')}
                disabled={loading || uploadingFile}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceUpload;
