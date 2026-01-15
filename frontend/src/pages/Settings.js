import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Users, Database, Key, UserPlus, Shield } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate('/403', { replace: true });
    }
  }, [isAdmin, navigate]);

  const go = (path) => () => navigate(path);

  // Don't render anything if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div data-testid="settings-page">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        </div>
        <p className="text-slate-600">System configuration and preferences (Admin Only)</p>
      </div>

      {/* Admin Warning Banner */}
      <Card className="mb-8 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Administrator Access Required</h3>
              <p className="text-sm text-red-800">
                This section contains critical system settings. Only administrators can access and modify these configurations.
                Changes made here affect the entire system and all users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New User Registration */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200" onClick={go('/settings/user-registration')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              New User Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Register new users with secure password handling</p>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={go('/settings/user-management')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Manage user passwords and credentials</p>
          </CardContent>
        </Card>

        {/* Roles & Permissions */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-200" onClick={go('/settings/roles')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">View user roles and access control from database</p>
          </CardContent>
        </Card>

        {/* Master Data */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200" onClick={go('/settings/master-data')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              Master Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Configure categories, types, and master lists</p>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-200" onClick={go('/settings/system')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <SettingsIcon className="h-5 w-5 text-orange-600" />
              </div>
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">General system settings and preferences</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
