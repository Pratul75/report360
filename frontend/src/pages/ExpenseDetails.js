import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { expensesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { data: expense, isLoading, refetch } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesAPI.getOne(id).then(res => res.data),
  });

  const handleApprove = async () => {
    try {
      await expensesAPI.approve(id);
      refetch();
      alert('Expense approved');
    } catch (err) {
      alert('Failed to approve expense');
    }
  };

  const handleReject = async () => {
    try {
      await expensesAPI.reject(id);
      refetch();
      alert('Expense rejected');
    } catch (err) {
      alert('Failed to reject expense');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!expense) return <div>Expense not found</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Expense Details</h1>
          <p className="text-slate-600 mt-1">#{expense.id}</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('expense.approve') && expense.status === 'pending' && (
            <>
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">Approve</Button>
              <Button onClick={handleReject} variant="destructive">Reject</Button>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from);
              } else {
                navigate('/expenses');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Expense Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Expense Type</label>
                <p className="text-slate-900 font-medium">{expense.expense_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Amount</label>
                <p className="text-slate-900 font-medium text-xl">{formatCurrency(expense.amount)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Status</label>
                <div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[expense.status]}`}>
                    {expense.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Submitted Date</label>
                <p className="text-slate-900">{formatDate(expense.submitted_date)}</p>
              </div>
              {expense.approved_date && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Approved Date</label>
                  <p className="text-slate-900">{formatDate(expense.approved_date)}</p>
                </div>
              )}
            </div>
            {expense.description && (
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="text-slate-900 mt-1">{expense.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {expense.submitted_by_user && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Submitted By</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Name</label>
                  <p className="text-slate-900 font-medium">{expense.submitted_by_user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone Number</label>
                  <p className="text-slate-900 font-medium">{expense.submitted_by_user.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Role</label>
                  <p className="text-slate-900 font-medium capitalize">{expense.submitted_by_user.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {expense.bill_image && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Bill Image</h3>
            </CardHeader>
            <CardContent>
              <img 
                src={
                  expense.bill_image.startsWith('http') 
                    ? expense.bill_image 
                    : expense.bill_image.startsWith('/uploads/') 
                      ? `${process.env.REACT_APP_BACKEND_URL}${expense.bill_image}`
                      : `${process.env.REACT_APP_BACKEND_URL}/uploads/expenses/${expense.bill_image}`
                }
                alt="Bill" 
                className="max-w-full h-auto rounded-lg shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{display: 'none'}} className="text-sm text-slate-600 p-3 bg-slate-50 rounded">
                <p className="font-medium mb-1">Bill image not found</p>
                <p className="break-all text-xs">{expense.bill_image}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {expense.bill_url && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Bill URL</h3>
            </CardHeader>
            <CardContent>
              <a 
                href={expense.bill_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {expense.bill_url}
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExpenseDetails;
