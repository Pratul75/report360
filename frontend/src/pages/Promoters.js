import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Promoters = () => {
  const { data: promoters, isLoading } = useQuery({
    queryKey: ['promoters'],
    queryFn: () => promotersAPI.getAll().then(res => res.data),
  });
  const navigate = useNavigate();

  return (
    <div data-testid="promoters-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Promoters & Anchors</h1>
          <p className="text-slate-600">Manage promoter and anchor database</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-promoter-btn" onClick={() => navigate('/promoters/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add Promoter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">Loading...</div>
        ) : promoters?.length === 0 ? (
          <div className="col-span-full text-center py-12">No promoters found</div>
        ) : (
          promoters?.map((promoter) => (
            <Card key={promoter.id} data-testid="promoter-card">
              <CardHeader>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-full mb-3">
                    <UserPlus className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-bold">{promoter.name}</h3>
                  <p className="text-sm text-slate-600">{promoter.specialty || 'General'}</p>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <p className="text-sm text-slate-600">{promoter.phone}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/promoters/${promoter.id}`)}>View Profile</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Promoters;
