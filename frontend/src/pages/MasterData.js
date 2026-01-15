import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Package, Truck, MapPin, DollarSign, FileText, Tag, Briefcase } from 'lucide-react';

const MasterData = () => {
  const navigate = useNavigate();

  const masterDataCategories = [
    {
      title: 'Campaign Types',
      icon: Briefcase,
      color: 'blue',
      description: 'Product Launch, Brand Activation, Roadshow, etc.',
      count: 8,
      route: 'campaign-types',
    },
    {
      title: 'Expense Categories',
      icon: DollarSign,
      color: 'green',
      description: 'Fuel, Toll, Parking, Food, etc.',
      count: 12,
      route: 'expense-categories',
    },
    {
      title: 'Vehicle Types',
      icon: Truck,
      color: 'purple',
      description: 'Van, Truck, Car, Bike, etc.',
      count: 6,
      route: 'vehicle-types',
    },
    {
      title: 'Locations',
      icon: MapPin,
      color: 'red',
      description: 'Cities, regions, and operational areas',
      count: 24,
      route: 'locations',
    },
    {
      title: 'Product Categories',
      icon: Package,
      color: 'orange',
      description: 'FMCG, Electronics, Apparel, etc.',
      count: 15,
      route: 'product-categories',
    },
    {
      title: 'Document Types',
      icon: FileText,
      color: 'indigo',
      description: 'Invoice, Receipt, Report, etc.',
      count: 10,
      route: 'document-types',
    },
    {
      title: 'Activity Tags',
      icon: Tag,
      color: 'pink',
      description: 'Custom tags for activities and campaigns',
      count: 18,
      route: 'activity-tags',
    },
    {
      title: 'Status Codes',
      icon: Database,
      color: 'teal',
      description: 'Campaign and operation status definitions',
      count: 6,
      route: 'status-codes',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      teal: 'bg-teal-100 text-teal-600',
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div data-testid="master-data-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Master Data Management</h1>
        <p className="text-slate-600">Configure categories, types, and master lists</p>
      </div>

      {/* Info Banner */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Master Data</h3>
              <p className="text-sm text-blue-800 mb-2">
                Master data defines the core reference data used across the system. Changes to master data
                affect all related operations and reports.
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Admin Access Only:</span> Only administrators can modify
                master data to ensure system consistency and data integrity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Data Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterDataCategories.map((category, index) => {
          const Icon = category.icon;
          const colorClasses = getColorClasses(category.color);

          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-all cursor-pointer group hover:border-slate-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-3 rounded-lg ${colorClasses} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">{category.count}</div>
                    <div className="text-xs text-slate-500">entries</div>
                  </div>
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{category.description}</p>
                <button 
                  onClick={() => navigate(`/settings/master-data/${category.route}`)}
                  className="mt-4 w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
                >
                  Manage {category.title}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon Features */}
      <Card className="mt-8 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-600" />
            Features Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-semibold text-slate-700">Bulk Import/Export</h4>
                <p className="text-sm text-slate-600">
                  Import and export master data via CSV/Excel
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-semibold text-slate-700">Version History</h4>
                <p className="text-sm text-slate-600">
                  Track changes and rollback to previous versions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-semibold text-slate-700">Data Validation Rules</h4>
                <p className="text-sm text-slate-600">
                  Define custom validation for master data entries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-semibold text-slate-700">Custom Fields</h4>
                <p className="text-sm text-slate-600">
                  Add custom attributes to master data types
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterData;
