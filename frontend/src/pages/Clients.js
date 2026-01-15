import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => clientsAPI.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['campaigns']);
      
      const counts = response?.deleted_counts || {};
      const message = `Successfully deleted client and ${counts.projects || 0} projects, ${counts.campaigns || 0} campaigns, and all related data`;
      
      toast.success(message, { duration: 5000 });
      setDeleteConfirmation(null);
      setDeletionPreview(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete client');
      setDeleteConfirmation(null);
    },
  });

  const handleDeleteClick = async (id, name) => {
    // Fetch deletion preview
    try {
      toast.loading('Checking related data...', { id: 'preview' });
      
      const response = await clientsAPI.getDeletionPreview(id);
      toast.dismiss('preview');
      
      setDeletionPreview(response.data);
      setDeleteConfirmation({ id, name });
    } catch (error) {
      toast.dismiss('preview');
      toast.error('Failed to check related data');
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      deleteMutation.mutate(deleteConfirmation.id);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
    setDeletionPreview(null);
  };

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Clients</h1>
          <p className="text-slate-600">Manage your client relationships</p>
        </div>
        {hasPermission('client.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-client-btn" onClick={() => navigate('/clients/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        )}
      </div>

      {/* Deletion Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <CardTitle className="text-red-900">Confirm Deletion</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg font-semibold mb-4">
                Delete client "{deleteConfirmation.name}"?
              </p>
              
              {deletionPreview && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-yellow-900 mb-2">⚠️ This will also delete:</p>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• {deletionPreview.will_delete.projects} Projects</li>
                    <li>• {deletionPreview.will_delete.campaigns} Campaigns</li>
                    <li>• {deletionPreview.will_delete.expenses} Expenses</li>
                    <li>• {deletionPreview.will_delete.reports} Reports</li>
                    <li>• {deletionPreview.will_delete.invoices} Invoices</li>
                    <li>• {deletionPreview.will_delete.promoter_activities} Promoter Activities</li>
                    <li>• {deletionPreview.will_delete.driver_assignments} Driver Assignments</li>
                  </ul>
                  <p className="font-bold text-yellow-900 mt-3">
                    Total: {deletionPreview.total_affected} related records
                  </p>
                </div>
              )}
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. All related data will be permanently hidden from the system.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={cancelDelete}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Everything'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
                data-testid="search-clients-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No clients found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="clients-table">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid="client-row">
                      <td className="py-3 px-4">{client.name}</td>
                      <td className="py-3 px-4 text-slate-600">{client.company || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{client.email || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{client.phone || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(client.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${client.id}`)}>View</Button>
                        {hasPermission('client.delete') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDeleteClick(client.id, client.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
