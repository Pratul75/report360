import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';
import { CloudCog } from 'lucide-react';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesAPI.getOne(id).then(res => {
      console.log('Vehicle API Response:', res.data);
      console.log('Vehicle vendor:', res.data.vendor);
      console.log('Vehicle vendor_id:', res.data.vendor_id);
      return res.data;
    }),
  });
  console.log('Vehicle Details Component:', { vehicle, isLoading });

  if (isLoading) return <div>Loading...</div>;
  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{vehicle.vehicle_number}</h1>
        <div className="flex gap-2">
          {hasPermission('vehicle.update') && (
            <Button onClick={() => navigate(`/vehicles/${id}/edit`)}>Edit</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from.pathname);
              } else {
                navigate('/vehicles');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Vehicle Details</h3>
          <div><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            vehicle.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>{vehicle.is_active ? 'Active' : 'Inactive'}</span></div>
          {vehicle.inactive_reason && !vehicle.is_active && (
            <div className="mt-2"><strong>Reason for Inactivity:</strong> {vehicle.inactive_reason}</div>
          )}
          <div><strong>Number:</strong> {vehicle.vehicle_number}</div>
          <div><strong>Type:</strong> {vehicle.vehicle_type || '-'}</div>
          <div><strong>Capacity:</strong> {vehicle.capacity || '-'}</div>
          <div><strong>Vendor:</strong> {vehicle.vendor?.name || '-'}</div>
          <div><strong>RC Validity:</strong> {vehicle.rc_validity ? formatDate(vehicle.rc_validity) : '-'}</div>
          <div><strong>Insurance Validity:</strong> {vehicle.insurance_validity ? formatDate(vehicle.insurance_validity) : '-'}</div>
          <div><strong>Permit Validity:</strong> {vehicle.permit_validity ? formatDate(vehicle.permit_validity) : '-'}</div>
          <div className="text-sm text-slate-500 mt-3">Created: {formatDate(vehicle.created_at)}</div>
        </div>

        {/* Vehicle Documents Section */}
        {(vehicle.rc_image || vehicle.insurance_image) && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Vehicle Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* RC Document */}
              {vehicle.rc_image && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">RC Document</h4>
                  <img 
                    src={
                      vehicle.rc_image.startsWith('http') 
                        ? vehicle.rc_image 
                        : vehicle.rc_image.startsWith('/uploads/') 
                          ? `${process.env.REACT_APP_BACKEND_URL}${vehicle.rc_image}`
                          : `${process.env.REACT_APP_BACKEND_URL}/uploads/vehicles/${vehicle.rc_image}`
                    }
                    alt="RC Document"
                    className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}} className="text-sm text-slate-600 p-3 bg-slate-50 rounded">
                    <p className="font-medium mb-1">Image not found</p>
                    <p className="break-all">{vehicle.rc_image}</p>
                  </div>
                </div>
              )}

              {/* Insurance Document */}
              {vehicle.insurance_image && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Insurance Document</h4>
                  <img 
                    src={
                      vehicle.insurance_image.startsWith('http') 
                        ? vehicle.insurance_image 
                        : vehicle.insurance_image.startsWith('/uploads/') 
                          ? `${process.env.REACT_APP_BACKEND_URL}${vehicle.insurance_image}`
                          : `${process.env.REACT_APP_BACKEND_URL}/uploads/vehicles/${vehicle.insurance_image}`
                    }
                    alt="Insurance Document"
                    className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}} className="text-sm text-slate-600 p-3 bg-slate-50 rounded">
                    <p className="font-medium mb-1">Image not found</p>
                    <p className="break-all">{vehicle.insurance_image}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetails;
