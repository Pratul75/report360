import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendorsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsAPI.getOne(id).then(res => res.data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <div className="flex gap-2">
          {hasPermission('vendor.update') && (
            <Button onClick={() => navigate(`/vendors/${id}/edit`)}>Edit</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from);
              } else {
                navigate('/vendors');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Vendor Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Name:</strong> {vendor.name}</div>
            <div><strong>Email:</strong> {vendor.email || '-'}</div>
            <div><strong>Phone:</strong> {vendor.phone || '-'}</div>
            <div><strong>Contact Person:</strong> {vendor.contact_person || '-'}</div>
            <div><strong>Designation:</strong> {vendor.designation || '-'}</div>
            <div><strong>City:</strong> {vendor.city || '-'}</div>
            <div><strong>Category:</strong> {vendor.category || '-'}</div>
            <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{vendor.status || 'Active'}</span></div>
            <div><strong>Website:</strong> {vendor.company_website ? <a href={vendor.company_website.startsWith('http') ? vendor.company_website : `http://${vendor.company_website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{vendor.company_website}</a> : '-'}</div>
          </div>
          <div className="mt-4">
            <div><strong>Address:</strong> {vendor.address || '-'}</div>
          </div>
          {vendor.specifications && (
            <div className="mt-4">
              <strong>Specifications:</strong>
              <p className="text-slate-600 mt-1">{vendor.specifications}</p>
            </div>
          )}
          {vendor.remarks && (
            <div className="mt-4">
              <strong>Remarks:</strong>
              <p className="text-slate-600 mt-1">{vendor.remarks}</p>
            </div>
          )}
          <div className="text-sm text-slate-500 mt-3">Created: {formatDate(vendor.created_at)}</div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
