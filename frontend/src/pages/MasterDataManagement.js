import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MasterDataManagement = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [items, setItems] = useState([
    { id: 1, name: 'Product Launch', description: 'New product launches and introductions' },
    { id: 2, name: 'Brand Activation', description: 'Brand building and market activation' },
    { id: 3, name: 'Roadshow', description: 'On-ground roadshow and experiential marketing' },
    { id: 4, name: 'Trade Promotion', description: 'Trade and retailer promotions' },
    { id: 5, name: 'Sampling', description: 'Product sampling and distribution' },
    { id: 6, name: 'Demo', description: 'Product demonstration activities' },
    { id: 7, name: 'Retail Support', description: 'In-store retail support activities' },
    { id: 8, name: 'Event Management', description: 'Event sponsorship and management' },
  ]);

  const typeConfig = {
    'campaign-types': {
      title: 'Campaign Types',
      description: 'Product Launch, Brand Activation, Roadshow, etc.',
    },
    'expense-categories': {
      title: 'Expense Categories',
      description: 'Fuel, Toll, Parking, Food, etc.',
    },
    'vehicle-types': {
      title: 'Vehicle Types',
      description: 'Van, Truck, Car, Bike, etc.',
    },
    'locations': {
      title: 'Locations',
      description: 'Cities, regions, and operational areas',
    },
    'product-categories': {
      title: 'Product Categories',
      description: 'FMCG, Electronics, Apparel, etc.',
    },
    'document-types': {
      title: 'Document Types',
      description: 'Invoice, Receipt, Report, etc.',
    },
    'activity-tags': {
      title: 'Activity Tags',
      description: 'Custom tags for activities and campaigns',
    },
    'status-codes': {
      title: 'Status Codes',
      description: 'Campaign and operation status definitions',
    },
  };

  const config = typeConfig[type] || { title: 'Master Data', description: '' };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    const newItem = {
      id: Math.max(...items.map(i => i.id), 0) + 1,
      name: newItemName,
      description: '',
    };
    setItems([...items, newItem]);
    setNewItemName('');
    toast.success('Item added successfully');
  };

  const handleEdit = (id) => {
    const item = items.find(i => i.id === id);
    setEditingId(id);
    setEditValue(item.name);
  };

  const handleSaveEdit = (id) => {
    if (!editValue.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setItems(items.map(i => i.id === id ? { ...i, name: editValue } : i));
    setEditingId(null);
    toast.success('Item updated successfully');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(i => i.id !== id));
      toast.success('Item deleted successfully');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/settings/master-data')}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{config.title}</h1>
        <p className="text-slate-600">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Add New Item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New {config.title.slice(0, -1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Enter ${config.title.toLowerCase().slice(0, -1)} name...`}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Button 
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {config.title} List ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">No items yet. Add one to get started.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-slate-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-slate-600">{item.description}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {editingId === item.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterDataManagement;
