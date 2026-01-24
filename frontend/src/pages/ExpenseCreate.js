import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { expensesAPI, campaignsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const ExpenseCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getAll().then(res => res.data),
    retry: 1,
  });

  const [campaignId, setCampaignId] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billUrl, setBillUrl] = useState('');
  const [billImage, setBillImage] = useState(null);
  const [submittedDate, setSubmittedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('expense_type', expenseType);
      formData.append('amount', amount);
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
            <div>
              <label className="block text-sm font-medium text-slate-700">Campaign (optional)</label>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                <option value="">{campaignsLoading ? 'Loading campaigns...' : 'Select campaign'}</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
