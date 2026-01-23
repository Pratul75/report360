import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';

const Vendors = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsAPI.getAll().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vendorsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      toast.success('Vendor deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete vendor');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div data-testid="vendors-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendors</h1>
          <p className="text-slate-600">Manage vendor partnerships</p>
        </div>
        {hasPermission('vendor.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-vendor-btn" onClick={() => navigate('/vendors/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">Loading...</div>
        ) : vendors?.length === 0 ? (
          <div className="col-span-full text-center py-12">No vendors found</div>
        ) : (
          vendors?.map((vendor) => (
            <Card key={vendor.id} data-testid="vendor-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{vendor.name}</h3>
                  </div>
                  {vendor.status && (
                    <span className={`px-2 py-1 rounded text-xs ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {vendor.status}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-600">{vendor.email}</p>
                <p className="text-sm text-slate-600">{vendor.phone}</p>
                {vendor.city && <p className="text-sm text-slate-600">📍 {vendor.city}</p>}
                {vendor.category && <p className="text-xs text-slate-500">Category: {vendor.category}</p>}
                <p className="text-xs text-slate-500">Added: {formatDate(vendor.created_at)}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/vendors/${vendor.id}`, { state: { from: location } })}
                  >
                    View Details
                  </Button>
                  {hasPermission('vendor.delete') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(vendor.id, vendor.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Vendors;
