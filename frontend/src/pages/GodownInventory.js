import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ChevronLeft, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api/v1';

const GodownInventory = () => {
  const { godownId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    item_code: '',
    category: '',
    quantity: '',
    unit: '',
    min_stock_level: '',
    remarks: '',
  });

  // Fetch godown details
  const { data: godown, isLoading: godownLoading, error: godownError, isError: godownIsError } = useQuery({
    queryKey: ['godown', godownId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/godowns/${godownId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch inventory items
  const { data: items = [], isLoading: itemsLoading, error: itemsError, isError: itemsIsError } = useQuery({
    queryKey: ['inventory', godownId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/inventory/godown/${godownId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      return await axios.post(`${API_BASE_URL}/inventory`, {
        ...data,
        godown_id: parseInt(godownId),
        quantity: parseFloat(data.quantity),
        min_stock_level: parseFloat(data.min_stock_level),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', godownId]);
      resetForm();
      toast.success('Item added successfully');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Failed to create item'),
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      return await axios.patch(`${API_BASE_URL}/inventory/${editingId}`, {
        ...data,
        quantity: data.quantity ? parseFloat(data.quantity) : undefined,
        min_stock_level: data.min_stock_level ? parseFloat(data.min_stock_level) : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', godownId]);
      resetForm();
      toast.success('Item updated successfully');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Failed to update item'),
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      return await axios.delete(`${API_BASE_URL}/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', godownId]);
      toast.success('Item deleted successfully');
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const resetForm = () => {
    setFormData({
      item_name: '',
      item_code: '',
      category: '',
      quantity: '',
      unit: '',
      min_stock_level: '',
      remarks: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      item_name: item?.item_name || '',
      item_code: item?.item_code || '',
      category: item?.category || '',
      quantity: (item?.quantity ?? '').toString(),
      unit: item?.unit || '',
      min_stock_level: (item?.min_stock_level ?? '').toString(),
      remarks: item?.remarks || '',
    });
    setEditingId(item?.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete item "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const lowStockItems = items.filter(item => item.quantity < item.min_stock_level);

  if (godownLoading) return <div className="text-center py-12">Loading...</div>;
  if (godownIsError) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="border-red-200 bg-red-50 max-w-lg w-full">
          <CardHeader>
            <CardTitle>Error loading godown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700 mb-2">{godownError?.response?.data?.detail || godownError?.message || 'Unknown error'}</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!godown) return <div className="text-center py-12">Godown not found</div>;

  if (itemsIsError) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="border-red-200 bg-red-50 max-w-lg w-full">
          <CardHeader>
            <CardTitle>Error loading inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700 mb-2">{itemsError?.response?.data?.detail || itemsError?.message || 'Unknown error'}</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/godown-inventory')}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{godown.name}</h1>
          <p className="text-slate-600">{godown.location || 'Location not specified'}</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Low Stock Alert</h3>
                <p className="text-sm text-orange-800">
                  {lowStockItems.length} item(s) are below minimum stock level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Button */}
      <div className="mb-6">
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Inventory Item
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Item' : 'Add New Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Item Code *</label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ITEM-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Building Materials"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., kg, pcs, box"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Stock Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update' : 'Add'} Item
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {itemsLoading ? (
        <div className="text-center py-12">Loading inventory...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No items in this godown yet</p>
            <Button onClick={() => setShowForm(true)}>Add First Item</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Item Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Quantity</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Min Level</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLowStock = (item.quantity ?? 0) < (item.min_stock_level ?? 0);
                return (
                  <tr key={item.id} className={`border-b hover:bg-slate-50 ${isLowStock ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600">{item.item_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.item_name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {(item.quantity ?? 0).toFixed(2)} {item.unit || 'units'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{(item.min_stock_level ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertTriangle className="w-3 h-3" />
                          Low
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id, item.item_name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GodownInventory;
