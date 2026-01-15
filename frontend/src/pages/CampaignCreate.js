import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { campaignsAPI, projectsAPI, clientsAPI, vendorsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const CAMPAIGN_TYPES = [
  { value: 'l_shape', label: 'L Shape' },
  { value: 'btl', label: 'BTL' },
  { value: 'roadshow', label: 'Roadshow' },
  { value: 'sampling', label: 'Sampling' },
  { value: 'other', label: 'Other' },
];

const CAMPAIGN_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'running', label: 'Running' },
  { value: 'hold', label: 'Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CampaignCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(res => res.data),
  });
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then(res => res.data),
  });
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsAPI.getAll().then(res => res.data),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [campaignType, setCampaignType] = useState('l_shape');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locations, setLocations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) return alert('Please select a project');
    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        project_id: parseInt(projectId, 10),
        campaign_type: campaignType,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        budget: budget ? parseFloat(budget) : null,
        locations,
        vendor_ids: selectedVendors,
      };
      if (id) {
        await campaignsAPI.update(id, payload);
      } else {
        await campaignsAPI.create(payload);
      }
      navigate('/campaigns');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to create campaign');
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setDescription(existing.description || '');
      setBudget(existing.budget ? String(existing.budget) : '');
      setProjectId(existing.project_id ? String(existing.project_id) : '');
      setCampaignType(existing.campaign_type || 'l_shape');
      setStatus(existing.status || 'planning');
      setStartDate(existing.start_date || '');
      setEndDate(existing.end_date || '');
      setLocations(existing.locations || '');
    }
  }, [existing]);

  useEffect(() => {
    if (existing && projects.length) {
      const proj = projects.find(p => p.id === existing.project_id);
      if (proj) setClientId(proj.client_id ? String(proj.client_id) : '');
    }
  }, [existing, projects]);

  useEffect(() => {
    if (existing && existing.vendor_names && vendors.length) {
      const vendorIds = vendors
        .filter(v => existing.vendor_names.includes(v.name))
        .map(v => v.id);
      setSelectedVendors(vendorIds);
    }
  }, [existing, vendors]);

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor => 
    vendor.name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    vendor.id?.toString().includes(vendorSearch)
  );

  return (
    <div data-testid="campaign-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create Campaign</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                <option value="">{clientsLoading ? 'Loading clients...' : 'Select client'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label className="block text-sm font-medium text-slate-700 mt-3">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required>
                <option value="">{projectsLoading ? 'Loading projects...' : 'Select project'}</option>
                {projects
                  .filter(p => !clientId || p.client_id === parseInt(clientId, 10))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Assign Vendors <span className="text-slate-500">(Select one or more vendors for this campaign)</span>
              </label>
              
              {/* Vendor Search Input */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-2 border rounded-md p-3 bg-slate-50 max-h-48 overflow-y-auto">
                {vendorsLoading ? (
                  <p className="text-slate-500">Loading vendors...</p>
                ) : filteredVendors.length === 0 ? (
                  <p className="text-slate-500">
                    {vendorSearch ? `No vendors found matching "${vendorSearch}"` : 'No vendors available'}
                  </p>
                ) : (
                  filteredVendors.map(vendor => (
                    <label key={vendor.id} className="flex items-center gap-2 py-2 hover:bg-slate-100 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendors([...selectedVendors, vendor.id]);
                          } else {
                            setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm">
                        {vendor.name || `Vendor #${vendor.id}`}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedVendors.length > 0 && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {selectedVendors.length} vendor{selectedVendors.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Campaign Type</label>
                <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                  {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                  {CAMPAIGN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Budget</label>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="number" step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                <input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">End Date</label>
                <input value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="date" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Locations</label>
              <input value={locations} onChange={(e) => setLocations(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update' : 'Create')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/campaigns')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignCreate;