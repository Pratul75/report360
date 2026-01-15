import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { promotersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PromoterCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [language, setLanguage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, phone, email, specialty, language };
      if (id) {
        await promotersAPI.update(id, payload);
      } else {
        await promotersAPI.create(payload);
      }
      navigate('/promoters');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to add promoter');
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['promoter', id],
    queryFn: () => promotersAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setPhone(existing.phone || '');
      setEmail(existing.email || '');
      setSpecialty(existing.specialty || '');
      setLanguage(existing.language || '');
    }
  }, [existing]);

  return (
    <div data-testid="promoter-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add Promoter</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="mt-1 block w-full border rounded-md p-2" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Specialty" className="mt-1 block w-full border rounded-md p-2" />
              <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update' : 'Add')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/promoters')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoterCreate;
