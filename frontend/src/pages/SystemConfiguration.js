import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Globe, Mail, Database, Clock, Shield, Zap, Server, ChevronLeft } from 'lucide-react';

const SystemConfiguration = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'Ops360 Fleet Management',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    
    // Email Settings
    emailEnabled: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    
    // Database Settings
    autoBackup: true,
    backupFrequency: 'daily',
    
    // Security Settings
    sessionTimeout: '60',
    passwordExpiry: '90',
    twoFactorAuth: false,
    
    // Performance Settings
    cacheEnabled: true,
    maxFileSize: '10',
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // TODO: API call to save settings
  };

  const ConfigSection = ({ icon: Icon, title, children }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  const FormField = ({ label, type = 'text', value, onChange, options, help }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'toggle' ? (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="ml-3 text-sm text-slate-700">{value ? 'Enabled' : 'Disabled'}</span>
        </label>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
      {help && <p className="text-xs text-slate-500 mt-1">{help}</p>}
    </div>
  );

  return (
    <div data-testid="system-configuration-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">System Configuration</h1>
          <p className="text-slate-600">General system settings and preferences</p>
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

      {/* Warning Banner */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-orange-600 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">Admin Access Only</h3>
              <p className="text-sm text-orange-800">
                These settings affect the entire system. Changes should be made carefully and tested
                before applying to production.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <ConfigSection icon={Globe} title="General Settings">
          <FormField
            label="System Name"
            value={settings.systemName}
            onChange={(val) => handleChange('systemName', val)}
          />
          <FormField
            label="Timezone"
            type="select"
            value={settings.timezone}
            onChange={(val) => handleChange('timezone', val)}
            options={[
              { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'America/New_York (EST)' },
            ]}
          />
          <FormField
            label="Date Format"
            type="select"
            value={settings.dateFormat}
            onChange={(val) => handleChange('dateFormat', val)}
            options={[
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            ]}
          />
          <FormField
            label="Currency"
            type="select"
            value={settings.currency}
            onChange={(val) => handleChange('currency', val)}
            options={[
              { value: 'INR', label: 'INR (₹)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
            ]}
          />
        </ConfigSection>

        {/* Email Settings */}
        <ConfigSection icon={Mail} title="Email Settings">
          <FormField
            label="Email Notifications"
            type="toggle"
            value={settings.emailEnabled}
            onChange={(val) => handleChange('emailEnabled', val)}
          />
          <FormField
            label="SMTP Server"
            value={settings.smtpServer}
            onChange={(val) => handleChange('smtpServer', val)}
            help="Mail server hostname"
          />
          <FormField
            label="SMTP Port"
            type="number"
            value={settings.smtpPort}
            onChange={(val) => handleChange('smtpPort', val)}
          />
        </ConfigSection>

        {/* Database Settings */}
        <ConfigSection icon={Database} title="Database Settings">
          <FormField
            label="Auto Backup"
            type="toggle"
            value={settings.autoBackup}
            onChange={(val) => handleChange('autoBackup', val)}
          />
          <FormField
            label="Backup Frequency"
            type="select"
            value={settings.backupFrequency}
            onChange={(val) => handleChange('backupFrequency', val)}
            options={[
              { value: 'hourly', label: 'Hourly' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
          />
        </ConfigSection>

        {/* Security Settings */}
        <ConfigSection icon={Shield} title="Security Settings">
          <FormField
            label="Session Timeout (minutes)"
            type="number"
            value={settings.sessionTimeout}
            onChange={(val) => handleChange('sessionTimeout', val)}
            help="User session expires after this duration of inactivity"
          />
          <FormField
            label="Password Expiry (days)"
            type="number"
            value={settings.passwordExpiry}
            onChange={(val) => handleChange('passwordExpiry', val)}
          />
          <FormField
            label="Two-Factor Authentication"
            type="toggle"
            value={settings.twoFactorAuth}
            onChange={(val) => handleChange('twoFactorAuth', val)}
          />
        </ConfigSection>

        {/* Performance Settings */}
        <ConfigSection icon={Zap} title="Performance Settings">
          <FormField
            label="Enable Cache"
            type="toggle"
            value={settings.cacheEnabled}
            onChange={(val) => handleChange('cacheEnabled', val)}
            help="Improves system performance by caching frequently accessed data"
          />
          <FormField
            label="Max File Upload Size (MB)"
            type="number"
            value={settings.maxFileSize}
            onChange={(val) => handleChange('maxFileSize', val)}
          />
        </ConfigSection>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
        >
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Save Configuration
        </button>
      </div>

      {/* System Info */}
      <Card className="mt-8 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-600" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600 mb-1">Version</div>
              <div className="font-semibold text-slate-800">1.0.0</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Environment</div>
              <div className="font-semibold text-slate-800">Production</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Last Updated</div>
              <div className="font-semibold text-slate-800">11 Jan 2026</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfiguration;
