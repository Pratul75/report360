import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, clientsAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then(res => res.data),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert('Select client');
    setSubmitting(true);
    try {
      const payload = { name, description, client_id: parseInt(clientId, 10), budget: budget ? parseFloat(budget) : null, start_date: startDate || null, end_date: endDate || null };
      if (id) {
        await projectsAPI.update(id, payload);
      } else {
        await projectsAPI.create(payload);
      }
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to create project');
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setDescription(existing.description || '');
      setClientId(existing.client_id ? String(existing.client_id) : '');
      setBudget(existing.budget ? String(existing.budget) : '');
      setStartDate(existing.start_date || '');
      setEndDate(existing.end_date || '');
    }
  }, [existing]);

  return (
    <div data-testid="project-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create Project</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required>
                <option value="">{clientsLoading ? 'Loading clients...' : 'Select client'}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget" className="mt-1 block w-full border rounded-md p-2" type="number" />
              <input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="date" />
              <input value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="date" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update' : 'Create')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCreate;
