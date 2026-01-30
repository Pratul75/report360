import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Truck, Trash2, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import ToggleStatusModal from '@/components/common/ToggleStatusModal';

const Vehicles = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [toggleModal, setToggleModal] = React.useState(null);
  
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesAPI.getAll().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vehiclesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      toast.success('Vehicle deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete vehicle');
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
      return vehiclesAPI.toggleStatus(data.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      toast.success('Vehicle status updated successfully!');
      setToggleModal(null);
    },
    onError: (error) => {
      const errorMessage = 
        typeof error.response?.data?.detail === 'string' 
          ? error.response.data.detail 
          : 'Failed to update vehicle status';
      toast.error(errorMessage);
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (vehicle) => {
    setToggleModal({ vehicle, isActive: vehicle.is_active });
  };

  const handleConfirmToggle = (statusData) => {
    toggleStatusMutation.mutate({
      id: toggleModal.vehicle.id,
      is_active: !toggleModal.isActive,
      inactive_reason: statusData.inactive_reason,
    });
  };

  return (
    <div data-testid="vehicles-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Vehicles</h1>
          <p className="text-slate-600">Manage your fleet vehicles</p>
        </div>
        {hasPermission('vehicle.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-vehicle-btn" onClick={() => navigate('/vehicles/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">Loading...</div>
        ) : vehicles?.length === 0 ? (
          <div className="col-span-full text-center py-12">No vehicles found</div>
        ) : (
          vehicles?.map((vehicle) => (
            <Card key={vehicle.id} data-testid="vehicle-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Truck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{vehicle.vehicle_number}</h3>
                      <p className="text-sm text-slate-600">{vehicle.vehicle_type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      vehicle.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {vehicle.inactive_reason && !vehicle.is_active && (
                      <span className="text-xs text-slate-500 max-w-[120px] text-center">
                        {vehicle.inactive_reason}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-600">Capacity:</span>
                  <span className="font-medium">{vehicle.capacity || 'N/A'}</span>
                  <span className="text-slate-600">RC Valid:</span>
                  <span className="font-medium">{formatDate(vehicle.rc_validity)}</span>
                  <span className="text-slate-600">Insurance:</span>
                  <span className="font-medium">{formatDate(vehicle.insurance_validity)}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => navigate(`/vehicles/${vehicle.id}`, { state: { from: { pathname: '/vehicles' } } })}
                  >
                    View Details
                  </Button>
                  {hasPermission('vehicle.update') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(vehicle)}
                      disabled={toggleStatusMutation.isPending}
                      className={vehicle.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                  )}
                  {hasPermission('vehicle.delete') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id, vehicle.vehicle_number)}
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
          itemName={toggleModal.vehicle.vehicle_number}
          itemType="Vehicle"
          onConfirm={handleConfirmToggle}
          isLoading={toggleStatusMutation.isPending}
        />
      )}
    </div>
  );
};

export default Vehicles;
