import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driversAPI, vendorsAPI, vehiclesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DriverCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isVendor = user.role === 'vendor';
  
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsAPI.getAll().then(res => res.data),
    enabled: !isVendor, // Only load vendors if not a vendor user
  });
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesAPI.getAll().then(res => res.data),
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseValidity, setLicenseValidity] = useState('');
  const [vendorId, setVendorId] = useState(isVendor ? user.vendor_id : '');
  const [vehicleId, setVehicleId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [licenseImage, setLicenseImage] = useState(null);
  const [licenseImagePreview, setLicenseImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setLicenseImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLicenseImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setLicenseImagePreview('');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    // 1️⃣ Prepare driver payload (NO IMAGE HERE)
    const payload = { 
      name, 
      phone, 
      email, 
      license_number: licenseNumber, 
      license_validity: licenseValidity || null, 
      vendor_id: vendorId ? parseInt(vendorId, 10) : null,
      vehicle_id: vehicleId ? parseInt(vehicleId, 10) : null
    };

    let driverId = id;

    // 2️⃣ Create or update driver FIRST
    if (id) {
      await driversAPI.update(id, payload);
    } else {
      const res = await driversAPI.create(payload);
      driverId = res.data.id;   // 🔑 VERY IMPORTANT
    }

    // 3️⃣ Upload image AFTER driver exists
    if (licenseImage && driverId) {
      const formData = new FormData();
      formData.append("file", licenseImage);

      await driversAPI.uploadLicense(driverId, formData);
    }

    // 4️⃣ Done
    navigate('/drivers');

  } catch (err) {
    console.error(err);
    alert("Failed to add driver");
    setSubmitting(false);
  }
};

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driversAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setPhone(existing.phone || '');
      setEmail(existing.email || '');
      setLicenseNumber(existing.license_number || '');
      setLicenseValidity(existing.license_validity || '');
      setVendorId(existing.vendor_id ? String(existing.vendor_id) : '');
      setVehicleId(existing.vehicle_id ? String(existing.vehicle_id) : '');
    }
  }, [existing]);

  return (
    <div data-testid="driver-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add Driver</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="mt-1 block w-full border rounded-md p-2" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-1 block w-full border rounded-md p-2" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">License Number</label>
              <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">License Validity</label>
              <input value={licenseValidity} onChange={(e) => setLicenseValidity(e.target.value)} type="date" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            {!isVendor && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Vendor</label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                <option value="">{vendorsLoading ? 'Loading vendors...' : 'Select vendor (optional)'}</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Assigned Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                <option value="">{vehiclesLoading ? 'Loading vehicles...' : 'Select vehicle (optional)'}</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} - {v.vehicle_type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">License Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 block w-full" />
              {licenseImagePreview && (
                <img src={licenseImagePreview} alt="Preview" className="mt-2 rounded border max-w-xs max-h-40" style={{objectFit:'contain'}} />
              )}
              {!licenseImagePreview && existing?.license_image && (
                <img src={`${process.env.REACT_APP_BACKEND_URL}${existing.license_image}`} alt="Current License" className="mt-2 rounded border max-w-xs max-h-40" style={{objectFit:'contain'}} />
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update' : 'Add')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/drivers')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverCreate;
