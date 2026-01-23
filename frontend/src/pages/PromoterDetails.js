import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { promotersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const PromoterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: promoter, isLoading } = useQuery({
    queryKey: ['promoter', id],
    queryFn: () => promotersAPI.getOne(id).then(res => res.data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!promoter) return <div>Promoter not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{promoter.name}</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/promoters/${id}/edit`)}>Edit</Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from);
              } else {
                navigate('/promoters');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Promoter Details</h3>
          <div><strong>Name:</strong> {promoter.name}</div>
          <div><strong>Specialty:</strong> {promoter.specialty || '-'}</div>
          <div><strong>Phone:</strong> {promoter.phone || '-'}</div>
          <div><strong>Email:</strong> {promoter.email || '-'}</div>
          <div><strong>Language:</strong> {promoter.language || '-'}</div>
          <div className="text-sm text-slate-500 mt-3">Created: {formatDate(promoter.created_at)}</div>
        </div>
      </div>
    </div>
  );
};

export default PromoterDetails;
