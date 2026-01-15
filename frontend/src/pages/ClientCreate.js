import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ClientCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        company,
        email,
        phone,
        address,
        contact_person: contactPerson,
      };

      if (id) {
        await clientsAPI.update(id, payload);
        toast.success('Client updated');
      } else {
        await clientsAPI.create(payload);
        toast.success('Client created');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setCompany(existing.company || '');
      setEmail(existing.email || '');
      setPhone(existing.phone || '');
      setAddress(existing.address || '');
      setContactPerson(existing.contact_person || '');
    }
  }, [existing]);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Add Client</h1>
          <p className="text-slate-600">Create a new client record</p>
        </div>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input placeholder="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Client' : 'Create Client'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/clients')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientCreate;
