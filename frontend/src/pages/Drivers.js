import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserCircle, Trash2, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import ToggleStatusModal from '@/components/common/ToggleStatusModal';

const Drivers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [toggleModal, setToggleModal] = React.useState(null);
  
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversAPI.getAll().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => driversAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete driver');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data) => {
      const payload = { 
        is_active: data.is_active
      };
      if (data.inactive_reason) {
        payload.inactive_reason = data.inactive_reason;
      }
      return driversAPI.toggleStatus(data.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver status updated successfully!');
      setToggleModal(null);
    },
    onError: (error) => {
      const errorMessage = 
        typeof error.response?.data?.detail === 'string' 
          ? error.response.data.detail 
          : 'Failed to update driver status';
      toast.error(errorMessage);
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (driver) => {
    setToggleModal({ driver, isActive: driver.is_active });
  };

  const handleConfirmToggle = (statusData) => {
    toggleStatusMutation.mutate({
      id: toggleModal.driver.id,
      is_active: !toggleModal.isActive,
      inactive_reason: statusData.inactive_reason,
    });
  };

  return (
    <div data-testid="drivers-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Drivers</h1>
          <p className="text-slate-600">Manage driver information</p>
        </div>
        {hasPermission('driver.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-driver-btn" onClick={() => navigate('/drivers/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">Loading...</div>
        ) : drivers?.length === 0 ? (
          <div className="col-span-full text-center py-12">No drivers found</div>
        ) : (
          drivers?.map((driver) => (
            <Card key={driver.id} data-testid="driver-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{driver.name}</h3>
                      <p className="text-sm text-slate-600">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      driver.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {driver.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {driver.inactive_reason && !driver.is_active && (
                      <span className="text-xs text-slate-500 max-w-[120px] text-center">
                        {driver.inactive_reason}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-600">License:</span>
                  <span className="font-medium">{driver.license_number || 'N/A'}</span>
                  <span className="text-slate-600">Valid Until:</span>
                  <span className="font-medium">{formatDate(driver.license_validity)}</span>
                  <span className="text-slate-600">Vehicle:</span>
                  <span className="font-medium text-indigo-600">
                    {driver.vehicle?.vehicle_number || driver.vehicle_number || 'Not Assigned'}
                  </span>
                  {driver.license_image && (
                    <>
                      
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => navigate(`/drivers/${driver.id}`, { state: { from: { pathname: '/drivers' } } })}
                  >
                    View Details
                  </Button>
                  {hasPermission('driver.update') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(driver)}
                      disabled={toggleStatusMutation.isPending}
                      className={driver.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                  )}
                  {hasPermission('driver.delete') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(driver.id, driver.name)}
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

      {toggleModal && (
        <ToggleStatusModal
          isOpen={!!toggleModal}
          onClose={() => setToggleModal(null)}
          isActive={toggleModal.isActive}
          itemName={toggleModal.driver.name}
          itemType="Driver"
          onConfirm={handleConfirmToggle}
          isLoading={toggleStatusMutation.isPending}
        />
      )}
    </div>
  );
};

export default Drivers;
