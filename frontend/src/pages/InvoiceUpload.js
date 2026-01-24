import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { invoicesAPI, vendorsAPI, campaignsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

const InvoiceUpload = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    invoice_date: '',
    due_date: '',
    campaign_id: '',
    description: '',
    vendor_id: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Load vendors and campaigns
  useEffect(() => {
    if (hasPermission('admin')) {
      loadVendors();
    }
    loadCampaigns();
  }, []);

  const loadVendors = async () => {
    setVendorsLoading(true);
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast.error('Failed to load vendors list');
    } finally {
      setVendorsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const response = await campaignsAPI.getAll();
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns list');
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    if (formData.invoice_date && formData.due_date && formData.invoice_date > formData.due_date) {
      newErrors.due_date = 'Due date must be after invoice date';
    }
    if (hasPermission('admin') && !formData.vendor_id) {
      newErrors.vendor_id = 'Please select a vendor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create invoice
      const invoiceData = {
        ...formData,
        amount: parseFloat(formData.amount),
        campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : null,
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
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
      
      // Extract error message safely
      let errorDetail = 'Failed to create invoice';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        errorDetail = typeof detail === 'string' ? detail : 
                     typeof detail === 'object' && detail.msg ? detail.msg :
                     'Failed to create invoice';
      }
      
      // Handle specific error messages
      const errorMsg = String(errorDetail).toLowerCase();
      
      if (errorMsg.includes('duplicate')) {
        setFieldErrors({ invoice_number: 'Invoice number already exists. Please use a different number.' });
        toast.error('Duplicate invoice number! Please use a different number.');
      } else if (errorMsg.includes('vendor')) {
        setFieldErrors({ vendor_id: errorDetail });
        toast.error(errorDetail);
      } else if (errorMsg.includes('campaign')) {
        setFieldErrors({ campaign_id: 'Invalid campaign ID. Please check and try again.' });
        toast.error('Invalid campaign ID! Please check the campaign exists.');
      } else if (errorMsg.includes('amount')) {
        setFieldErrors({ amount: 'Invalid amount. Please enter a valid number.' });
        toast.error('Invalid amount provided!');
      } else {
        toast.error(errorDetail);
      }
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
                  className={fieldErrors.invoice_number || errors.invoice_number ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {(fieldErrors.invoice_number || errors.invoice_number) && (
                  <p className="text-sm text-red-600 font-medium">{fieldErrors.invoice_number || errors.invoice_number}</p>
                )}
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
                  className={fieldErrors.amount || errors.amount ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {(fieldErrors.amount || errors.amount) && (
                  <p className="text-sm text-red-600 font-medium">{fieldErrors.amount || errors.amount}</p>
                )}
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
                  className={fieldErrors.invoice_date || errors.invoice_date ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {(fieldErrors.invoice_date || errors.invoice_date) && (
                  <p className="text-sm text-red-600 font-medium">{fieldErrors.invoice_date || errors.invoice_date}</p>
                )}
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
                  className={fieldErrors.due_date || errors.due_date ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {(fieldErrors.due_date || errors.due_date) && (
                  <p className="text-sm text-red-600 font-medium">{fieldErrors.due_date || errors.due_date}</p>
                )}
              </div>
            </div>

            {hasPermission('admin') && (
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Select Vendor *</Label>
                <select
                  id="vendor_id"
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleChange}
                  disabled={vendorsLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.vendor_id || errors.vendor_id 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">-- Select a Vendor --</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} (ID: {vendor.id})
                    </option>
                  ))}
                </select>
                {(fieldErrors.vendor_id || errors.vendor_id) && (
                  <p className="text-sm text-red-600 font-medium">{fieldErrors.vendor_id || errors.vendor_id}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="campaign_id">Campaign (Optional)</Label>
              <select
                id="campaign_id"
                name="campaign_id"
                value={formData.campaign_id}
                onChange={handleChange}
                disabled={campaignsLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  fieldErrors.campaign_id || errors.campaign_id 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              >
                <option value="">-- Select a Campaign (Optional) --</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {(fieldErrors.campaign_id || errors.campaign_id) && (
                <p className="text-sm text-red-600 font-medium">{fieldErrors.campaign_id || errors.campaign_id}</p>
              )}
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
