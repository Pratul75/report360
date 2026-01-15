import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api/v1';

const Godowns = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manager_name: '',
    contact_number: '',
    remarks: '',
  });

  // Fetch godowns
  const { data: godowns = [], isLoading, error, isError } = useQuery({
    queryKey: ['godowns'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/godowns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Create godown mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      return await axios.post(`${API_BASE_URL}/godowns`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['godowns']);
      setFormData({ name: '', location: '', manager_name: '', contact_number: '', remarks: '' });
      setShowForm(false);
      toast.success('Godown created successfully');
    },
    onError: () => toast.error('Failed to create godown'),
  });

  // Update godown mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      return await axios.patch(`${API_BASE_URL}/godowns/${editingId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['godowns']);
      setFormData({ name: '', location: '', manager_name: '', contact_number: '', remarks: '' });
      setEditingId(null);
      setShowForm(false);
      toast.success('Godown updated successfully');
    },
    onError: () => toast.error('Failed to update godown'),
  });

  // Delete godown mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      return await axios.delete(`${API_BASE_URL}/godowns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['godowns']);
      toast.success('Godown deleted successfully');
    },
    onError: () => toast.error('Failed to delete godown'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Godown name is required');
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (godown) => {
    setFormData({
      name: godown?.name || '',
      location: godown?.location || '',
      manager_name: godown?.manager_name || '',
      contact_number: godown?.contact_number || '',
      remarks: godown?.remarks || '',
    });
    setEditingId(godown?.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete godown "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', location: '', manager_name: '', contact_number: '', remarks: '' });
    setEditingId(null);
    setShowForm(false);
  };

  // Error UI
  if (isError) {

    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="border-red-200 bg-red-50 max-w-lg w-full">
          <CardHeader>
            <CardTitle>Error loading godowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700 mb-2">{error?.response?.data?.detail || error?.message || 'Unknown error'}</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Godown Inventory</h1>
          <p className="text-slate-600">Manage warehouses and storage locations</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Godown
        </Button>
      </div>

      {/* Form: Only show at top, not below godown cards */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Godown' : 'Add New Godown'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Godown Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Delhi Warehouse"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Industrial Area, Delhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Manager Name</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., +91-9999999999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update' : 'Create'} Godown
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Godowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">Loading godowns...</div>
        ) : godowns.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500 mb-4">No godowns yet. Create one to get started.</p>
            <Button onClick={() => setShowForm(true)}>Create First Godown</Button>
          </div>
        ) : (
          godowns.map((godown) => (
            <Card key={godown.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{godown.name}</CardTitle>
                    <div className="text-sm text-slate-500 mt-1">ID: {godown.id}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    godown.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {godown.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {godown.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {godown.location}
                  </div>
                )}
                {godown.manager_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-green-500" />
                    {godown.manager_name}
                  </div>
                )}
                {godown.contact_number && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-purple-500" />
                    {godown.contact_number}
                  </div>
                )}
                {godown.remarks && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                    {godown.remarks}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/godown-inventory/${godown.id}`)}
                    className="flex-1"
                  >
                    View Items
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEdit(godown)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(godown.id, godown.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default Godowns;
