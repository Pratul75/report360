import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesAPI, vendorsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const VehicleCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isVendor = user.role === 'vendor';
  
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsAPI.getAll().then(res => res.data),
    enabled: !isVendor, // Only load vendors if not a vendor user
  });

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [vendorId, setVendorId] = useState(isVendor ? user.vendor_id : '');
  const [rcValidity, setRcValidity] = useState('');
  const [insuranceValidity, setInsuranceValidity] = useState('');
  const [permitValidity, setPermitValidity] = useState('');
  const [rcImageFile, setRcImageFile] = useState(null);
  const [insuranceImageFile, setInsuranceImageFile] = useState(null);
  const [rcImageUrl, setRcImageUrl] = useState('');
  const [insuranceImageUrl, setInsuranceImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let uploadedRcUrl = rcImageUrl;
      let uploadedInsuranceUrl = insuranceImageUrl;

      // Upload RC image if selected
      if (rcImageFile) {
        const formData = new FormData();
        formData.append('file', rcImageFile);
        formData.append('document_type', 'rc');
        const token = localStorage.getItem('token');
        
        try {
          const uploadResponse = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/v1/upload/vehicle-document`,
            formData,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          uploadedRcUrl = uploadResponse.data.url;
        } catch (uploadErr) {
          console.error('RC image upload failed:', uploadErr);
          alert('Failed to upload RC image: ' + (uploadErr.response?.data?.detail || uploadErr.message));
          setSubmitting(false);
          return;
        }
      }

      // Upload Insurance image if selected
      if (insuranceImageFile) {
        const formData = new FormData();
        formData.append('file', insuranceImageFile);
        formData.append('document_type', 'insurance');
        const token = localStorage.getItem('token');
        
        try {
          const uploadResponse = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/v1/upload/vehicle-document`,
            formData,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          uploadedInsuranceUrl = uploadResponse.data.url;
        } catch (uploadErr) {
          console.error('Insurance image upload failed:', uploadErr);
          alert('Failed to upload insurance image: ' + (uploadErr.response?.data?.detail || uploadErr.message));
          setSubmitting(false);
          return;
        }
      }

      const payload = { 
        vehicle_number: vehicleNumber, 
        vehicle_type: vehicleType, 
        capacity, 
        vendor_id: vendorId ? parseInt(vendorId,10) : null, 
        rc_validity: rcValidity || null, 
        insurance_validity: insuranceValidity || null, 
        permit_validity: permitValidity || null,
        rc_image: uploadedRcUrl || null,
        insurance_image: uploadedInsuranceUrl || null
      };
      
      if (id) {
        await vehiclesAPI.update(id, payload);
      } else {
        await vehiclesAPI.create(payload);
      }
      navigate('/vehicles');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to add vehicle');
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setVehicleNumber(existing.vehicle_number || '');
      setVehicleType(existing.vehicle_type || '');
      setCapacity(existing.capacity || '');
      setVendorId(existing.vendor_id ? String(existing.vendor_id) : '');
      setRcValidity(existing.rc_validity || '');
      setInsuranceValidity(existing.insurance_validity || '');
      setPermitValidity(existing.permit_validity || '');
      setRcImageUrl(existing.rc_image || '');
      setInsuranceImageUrl(existing.insurance_image || '');
    }
  }, [existing]);

  return (
    <div data-testid="vehicle-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add Vehicle</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
  {/* Vehicle Number */}
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Vehicle Number
    </label>
    <input
      type="text"
      value={vehicleNumber}
      onChange={(e) => setVehicleNumber(e.target.value)}
      className="mt-1 block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      required
    />
  </div>

  {/* Vehicle Type */}
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Vehicle Type
    </label>
    <input
      type="text"
      value={vehicleType}
      onChange={(e) => setVehicleType(e.target.value)}
      className="mt-1 block w-full border border-slate-300 rounded-md p-2"
      placeholder="Truck / Van / Tempo"
    />
  </div>

  {/* Capacity */}
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Capacity
    </label>
    <input
      type="number"
      value={capacity}
      onChange={(e) => setCapacity(e.target.value)}
      className="mt-1 block w-full border border-slate-300 rounded-md p-2"
      placeholder="In tons"
    />
  </div>

  {/* Vendor - Hide for vendor users */}
  {!isVendor && (
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Vendor
    </label>
    <select
      value={vendorId}
      onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : '')}
      className="mt-1 block w-full border border-slate-300 rounded-md p-2"
    >
      <option value="">
        {vendorsLoading ? 'Loading vendors...' : 'Select vendor (optional)'}
      </option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  </div>
  )}

  {/* Validity Dates */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium text-slate-700">
        RC Validity
      </label>
      <input
        type="date"
        value={rcValidity}
        onChange={(e) => setRcValidity(e.target.value)}
        className="mt-1 block w-full border border-slate-300 rounded-md p-2"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700">
        Insurance Validity
      </label>
      <input
        type="date"
        value={insuranceValidity}
        onChange={(e) => setInsuranceValidity(e.target.value)}
        className="mt-1 block w-full border border-slate-300 rounded-md p-2"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700">
        Permit Validity
      </label>
      <input
        type="date"
        value={permitValidity}
        onChange={(e) => setPermitValidity(e.target.value)}
        className="mt-1 block w-full border border-slate-300 rounded-md p-2"
      />
    </div>
  </div>

  {/* Document Images */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        RC Document Image <span className="text-red-500">*</span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setRcImageFile(e.target.files[0])}
        className="mt-1 block w-full border border-slate-300 rounded-md p-2 text-sm"
      />
      {rcImageUrl && !rcImageFile && (
        <div className="mt-2 text-sm text-slate-600">
          Current: {rcImageUrl.split('/').pop()}
        </div>
      )}
      {rcImageFile && (
        <div className="mt-2 text-sm text-green-600">
          Selected: {rcImageFile.name}
        </div>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Insurance Document Image <span className="text-red-500">*</span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setInsuranceImageFile(e.target.files[0])}
        className="mt-1 block w-full border border-slate-300 rounded-md p-2 text-sm"
      />
      {insuranceImageUrl && !insuranceImageFile && (
        <div className="mt-2 text-sm text-slate-600">
          Current: {insuranceImageUrl.split('/').pop()}
        </div>
      )}
      {insuranceImageFile && (
        <div className="mt-2 text-sm text-green-600">
          Selected: {insuranceImageFile.name}
        </div>
      )}
    </div>
  </div>

  {/* Actions */}
  <div className="flex gap-3 pt-2">
    <Button
      type="submit"
      className="bg-indigo-600 hover:bg-indigo-700"
      disabled={submitting}
    >
      {submitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update Vehicle' : 'Add Vehicle')}
    </Button>

    <Button
      type="button"
      variant="ghost"
      onClick={() => navigate('/vehicles')}
    >
      Cancel
    </Button>
  </div>
</form>

        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleCreate;
