import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, UserCheck, AlertCircle, ChevronDown, ChevronUp, Edit, Trash2, UserPlus, Save, X, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const RolesPermissions = () => {
  const navigate = useNavigate();
  const [expandedRole, setExpandedRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await usersAPI.getAll();
      return response.data;
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      return await usersAPI.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('User updated successfully!');
      setEditingUser(null);
      setEditForm({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      console.log('🗑️ Attempting to delete user ID:', userId);
      const response = await usersAPI.delete(userId);
      console.log('✅ Delete response:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('User deleted successfully!');
    },
    onError: (error) => {
      console.error('❌ Delete error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to delete user';
      toast.error(errorMsg);
    },
  });

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
    });
  };

  const handleSave = (userId) => {
    updateUserMutation.mutate({ userId, data: editForm });
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleToggleActive = (user) => {
    updateUserMutation.mutate({
      userId: user.id,
      data: { is_active: !user.is_active }
    });
  };

  // Define all available roles with their permissions
  const roleDefinitions = {
    admin: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      color: 'red',
      permissions: [
        'Full system configuration',
        'User management',
        'All CRUD operations',
        'Financial data access',
        'Reports and analytics',
        'System settings',
      ],
    },
    operations_manager: {
      name: 'Operations Manager',
      description: 'Manage daily operations and campaigns',
      color: 'blue',
      permissions: [
        'Campaign management',
        'Driver assignment',
        'Vehicle tracking',
        'Operations dashboard',
        'Daily reports',
      ],
    },
    accounts: {
      name: 'Accounts',
      description: 'Financial operations and payments',
      color: 'green',
      permissions: [
        'Invoice management',
        'Payment processing',
        'Expense approval',
        'Financial reports',
        'Vendor payments',
      ],
    },
    client_servicing: {
      name: 'Client Servicing',
      description: 'Client relationship management',
      color: 'purple',
      permissions: [
        'Client dashboard',
        'Campaign status',
        'Vehicle tracking',
        'Client reports',
      ],
    },
    vendor: {
      name: 'Vendor',
      description: 'Vendor operations and invoicing',
      color: 'orange',
      permissions: [
        'Vendor dashboard',
        'Invoice submission',
        'Driver management',
        'Vehicle management',
        'Payment tracking',
      ],
    },
    driver: {
      name: 'Driver',
      description: 'Driver daily operations',
      color: 'indigo',
      permissions: [
        'Driver dashboard',
        'Journey logging',
        'KM log submission',
        'Expense submission',
      ],
    },
    client: {
      name: 'Client',
      description: 'Client view only access',
      color: 'pink',
      permissions: [
        'View campaigns',
        'View reports',
        'Track progress',
      ],
    },
  };

  // Group users by role
  const usersByRole = users?.reduce((acc, user) => {
    const role = user.role || 'unassigned';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {}) || {};

  const toggleRole = (role) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      pink: 'bg-pink-100 text-pink-700 border-pink-300',
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading roles and permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="border-red-200 bg-red-50 max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error loading data</p>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="roles-permissions-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Roles & Permissions</h1>
          <p className="text-slate-600">Manage user roles and access control</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Active Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(usersByRole).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users?.filter(u => u.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {Object.entries(roleDefinitions).map(([roleKey, roleInfo]) => {
          const roleUsers = usersByRole[roleKey] || [];
          const isExpanded = expandedRole === roleKey;
          const colorClasses = getColorClasses(roleInfo.color);

          return (
            <Card key={roleKey} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleRole(roleKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{roleInfo.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{roleInfo.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-800">{roleUsers.length}</div>
                      <div className="text-xs text-slate-500">users</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Permissions */}
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permissions
                      </h4>
                      <ul className="space-y-2">
                        {roleInfo.permissions.map((permission, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Users with this role */}
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users ({roleUsers.length})
                      </h4>
                      {roleUsers.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {roleUsers.map((user) => (
                            <div
                              key={user.id}
                              className="p-3 bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              {editingUser === user.id ? (
                                // Edit Mode
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-slate-600">Name</label>
                                      <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600">Email</label>
                                      <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600">Phone</label>
                                      <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600">Role</label>
                                      <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      >
                                        {Object.keys(roleDefinitions).map(role => (
                                          <option key={role} value={role}>{roleDefinitions[role].name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="rounded border-slate-300"
                                      />
                                      Active
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleSave(user.id)}
                                      disabled={updateUserMutation.isLoading}
                                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                      <Save className="w-3 h-3" />
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancel}
                                      className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300 flex items-center gap-1"
                                    >
                                      <X className="w-3 h-3" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-800">{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                    {user.phone && <div className="text-xs text-slate-500">{user.phone}</div>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleToggleActive(user)}
                                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                        user.is_active 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                                      }`}
                                    >
                                      {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                    <button
                                      onClick={() => handleEdit(user)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit user"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(user)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete user"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No users assigned to this role</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RolesPermissions;
