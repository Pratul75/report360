import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendorsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VendorCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  // New fields
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [specifications, setSpecifications] = useState('');
  const [designation, setDesignation] = useState('');
  const [status, setStatus] = useState('Active');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !customCategories.includes(customCategory.trim())) {
      setCustomCategories([...customCategories, customCategory.trim()]);
      setCategory(customCategory.trim());
      setCustomCategory('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { 
        name, 
        email, 
        phone, 
        address, 
        contact_person: contactPerson,
        company_website: companyWebsite,
        city,
        category,
        specifications,
        designation,
        status,
        remarks
      };
      if (id) {
        await vendorsAPI.update(id, payload);
      } else {
        await vendorsAPI.create(payload);
      }
      navigate('/vendors');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to create vendor');
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setEmail(existing.email || '');
      setPhone(existing.phone || '');
      setAddress(existing.address || '');
      setContactPerson(existing.contact_person || '');
      setCompanyWebsite(existing.company_website || '');
      setCity(existing.city || '');
      const existingCategory = existing.category || '';
      const predefinedCategories = ['Transport', 'Logistics', 'Rental', 'Warehouse', 'Courier'];
      if (existingCategory && !predefinedCategories.includes(existingCategory)) {
        setCustomCategories([existingCategory]);
        setCategory(existingCategory);
      } else {
        setCategory(existingCategory);
      }
      setSpecifications(existing.specifications || '');
      setDesignation(existing.designation || '');
      setStatus(existing.status || 'Active');
      setRemarks(existing.remarks || '');
    }
  }, [existing]);

  return (
    <div data-testid="vendor-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add Vendor</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Organization Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Contact Person</label>
                <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Designation</label>
                <input value={designation} onChange={(e) => setDesignation(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Company Website</label>
                <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="url" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="mt-1 block w-full border rounded-md p-2"
                >
                  <option value="">Select Category</option>
                  <option value="Transport">Transport</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Rental">Rental</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Courier">Courier</option>
                  {customCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input 
                    value={customCategory} 
                    onChange={(e) => setCustomCategory(e.target.value)} 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    className="flex-1 block w-full border rounded-md p-2" 
                    placeholder="Add custom category"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddCustomCategory}
                    disabled={!customCategory.trim()}
                    className="bg-green-600 hover:bg-green-700 px-4"
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Specifications</label>
              <textarea value={specifications} onChange={(e) => setSpecifications(e.target.value)} className="mt-1 block w-full border rounded-md p-2" rows="3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Remarks</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 block w-full border rounded-md p-2" rows="2" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update' : 'Add')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/vendors')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorCreate;
