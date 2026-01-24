import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { expensesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const Expenses = () => {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesAPI.getAll().then(res => res.data),
  });
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Check if user has admin/accountant permissions to see submitter info
  const canSeeSubmitterInfo = hasPermission('admin') || hasPermission('accountant') || hasPermission('expense.approve');

  return (
    <div data-testid="expenses-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Expenses</h1>
          <p className="text-slate-600">Track and approve expenses</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-expense-btn" onClick={() => navigate('/expenses/new')}>
          <Plus className="mr-2 h-4 w-4" /> Submit Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Expenses</h3>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expenses?.length === 0 ? (
            <div className="text-center py-8">No expenses found</div>
          ) : (
            <table className="w-full" data-testid="expenses-table">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  {canSeeSubmitterInfo && <th className="text-left py-3 px-4">Submitted By</th>}
                  {canSeeSubmitterInfo && <th className="text-left py-3 px-4">Role</th>}
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses?.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-slate-50" data-testid="expense-row">
                    <td className="py-3 px-4">{expense.expense_type}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(expense.amount)}</td>
                    {canSeeSubmitterInfo && (
                      <td className="py-3 px-4 text-slate-600">
                        {expense.submitted_by_user?.name || 'Unknown'}
                      </td>
                    )}
                    {canSeeSubmitterInfo && (
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {expense.submitted_by_user?.role.replace(/_/g, ' ') || 'N/A'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-slate-600">{formatDate(expense.submitted_date)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[expense.status]}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/expenses/${expense.id}`)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
