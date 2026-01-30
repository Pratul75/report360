import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { expensesAPI, campaignsAPI, driversAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const ExpenseCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const isDriver = userRole === 'driver';
  
  // For drivers: get their assigned campaigns only
  // For others: get all campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: isDriver ? ['driverCampaigns', user.id] : ['campaigns'],
    queryFn: () => {
      if (isDriver) {
        // For drivers, we need to get their driver ID first, then fetch their assigned campaigns
        return driversAPI.getAll().then(res => {
          const driverRecord = res.data?.find(d => d.email === user.email);
          if (driverRecord) {
            return campaignsAPI.getForDriver(driverRecord.id);
          }
          return [];
        });
      } else {
        return campaignsAPI.getAll().then(res => res.data);
      }
    },
    retry: 1,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversAPI.getAll().then(res => res.data),
    retry: 1,
    enabled: !isDriver, // Don't show driver dropdown for drivers
  });

  const [driverId, setDriverId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billUrl, setBillUrl] = useState('');
  const [billImage, setBillImage] = useState(null);
  const [submittedDate, setSubmittedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-set driver ID for drivers
  useEffect(() => {
    if (isDriver && drivers.length > 0) {
      const driverRecord = drivers.find(d => d.email === user.email);
      if (driverRecord) {
        setDriverId(driverRecord.id.toString());
      }
    }
  }, [isDriver, drivers, user.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('expense_type', expenseType);
      formData.append('amount', amount);
      if (driverId) formData.append('driver_id', driverId);
      if (campaignId) formData.append('campaign_id', campaignId);
      if (description) formData.append('description', description);
      if (billUrl) formData.append('bill_url', billUrl);
      if (submittedDate) formData.append('submitted_date', submittedDate);
      if (billImage) formData.append('bill_image', billImage);

      if (id) {
        await expensesAPI.update(id, formData);
        toast.success('Expense updated successfully!');
      } else {
        await expensesAPI.create(formData);
        toast.success('Expense submitted successfully!');
      }
      navigate('/expenses');
    } catch (err) {
      console.error('Expense submission error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit expense';
      toast.error(errorMsg);
      setSubmitting(false);
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setDriverId(existing.driver_id ? String(existing.driver_id) : '');
      setCampaignId(existing.campaign_id ? String(existing.campaign_id) : '');
      setExpenseType(existing.expense_type || '');
      setAmount(existing.amount ? String(existing.amount) : '');
      setDescription(existing.description || '');
      setBillUrl(existing.bill_url || '');
      setSubmittedDate(existing.submitted_date || '');
    }
  }, [existing]);

  return (
    <div data-testid="expense-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Submit Expense</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Driver dropdown - only show for non-drivers */}
            {!isDriver && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Driver (optional)</label>
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                  <option value="">{driversLoading ? 'Loading drivers...' : 'Select driver'}</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name || d.phone}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Campaign (optional)</label>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                <option value="">{campaignsLoading ? 'Loading campaigns...' : (isDriver ? 'Select your assigned campaign' : 'Select campaign')}</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {isDriver && campaigns.length === 0 && !campaignsLoading && (
                <p className="text-sm text-gray-500 mt-1">No campaigns assigned to you</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Expense Type</label>
              <input value={expenseType} onChange={(e) => setExpenseType(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="number" step="0.01" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Bill Image</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setBillImage(e.target.files[0])} 
                className="mt-1 block w-full border rounded-md p-2" 
              />
              {billImage && (
                <p className="text-sm text-slate-600 mt-1">Selected: {billImage.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Bill URL (optional)</label>
              <input value={billUrl} onChange={(e) => setBillUrl(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Submitted Date</label>
              <input value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="date" />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Submitting...') : (id ? 'Update' : 'Submit')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/expenses')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseCreate;
