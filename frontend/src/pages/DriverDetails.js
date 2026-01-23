import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driversAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const DriverDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driversAPI.getOne(id).then(res => res.data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!driver) return <div>Driver not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{driver.name}</h1>
        <div className="flex gap-2">
          {hasPermission('driver.update') && (
            <Button onClick={() => navigate(`/drivers/${id}/edit`)}>Edit</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from.pathname, { state: { activeTab: location.state.activeTab } });
              } else {
                navigate('/vendor-dashboard');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Driver Details</h3>
          <div><strong>Name:</strong> {driver.name}</div>
          <div><strong>Phone:</strong> {driver.phone || '-'}</div>
          <div><strong>Email:</strong> {driver.email || '-'}</div>
          <div><strong>License No:</strong> {driver.license_number || '-'}</div>
          <div><strong>License Validity:</strong> {driver.license_validity ? formatDate(driver.license_validity) : '-'}</div>
          {driver.license_image && (
            <div className="my-2">
              <strong>License Image:</strong><br />
              <img
                src={`${process.env.REACT_APP_BACKEND_URL}${driver.license_image}`}
                alt="License"
                className="mt-1 rounded border max-w-xs max-h-48 shadow"
                style={{objectFit: 'contain'}}
              />
            </div>
          )}
          <div><strong>Vendor:</strong> {driver.vendor?.name || driver.vendor_name || '-'}</div>
          <div><strong>Assigned Vehicle:</strong> <span className="text-indigo-600 font-medium">{driver.vehicle?.vehicle_number || driver.vehicle_number || 'Not Assigned'}</span></div>
          <div className="text-sm text-slate-500 mt-3">Created: {formatDate(driver.created_at)}</div>
        </div>
      </div>
    </div>
  );
};

export default DriverDetails;
