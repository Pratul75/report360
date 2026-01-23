import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsAPI, expensesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsAPI.getOne(id).then(res => res.data),
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['client-expenses', id],
    queryFn: () => clientsAPI.getExpenses(id).then(res => res.data),
    enabled: !!id,
  });

  if (clientLoading) return <div>Loading client...</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <div className="flex gap-2">
          {hasPermission('client.update') && (
            <Button onClick={() => navigate(`/clients/${id}/edit`)}>Edit</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from);
              } else {
                navigate('/clients');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div><strong>Company:</strong> {client.company || '-'}</div>
            <div><strong>Email:</strong> {client.email || '-'}</div>
            <div><strong>Phone:</strong> {client.phone || '-'}</div>
            <div><strong>Address:</strong> {client.address || '-'}</div>
            <div><strong>Contact Person:</strong> {client.contact_person || '-'}</div>
            <div className="text-sm text-slate-500 mt-2">Created: {formatDate(client.created_at)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {client.projects && client.projects.length > 0 ? (
              <ul>
                {client.projects.map(p => (
                  <li key={p.id} className="py-1">
                    <Button variant="link" onClick={() => navigate(`/projects/${p.id}`)}>{p.name}</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No projects</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div>Loading expenses...</div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="text-sm text-slate-500">No expenses found for this client</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left">ID</th>
                    <th className="py-2 px-3 text-left">Type</th>
                    <th className="py-2 px-3 text-left">Amount</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Submitted</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-3">{e.id}</td>
                      <td className="py-2 px-3">{e.expense_type}</td>
                      <td className="py-2 px-3">{e.amount}</td>
                      <td className="py-2 px-3">{e.status}</td>
                      <td className="py-2 px-3">{e.submitted_date ? formatDate(e.submitted_date) : '-'}</td>
                      <td className="py-2 px-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/expenses/${e.id}`)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
};

export default ClientDetails;
