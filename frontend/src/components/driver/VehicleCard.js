import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Truck, Fuel, Calendar, FileText } from 'lucide-react';

const VehicleCard = ({ vehicle }) => {
  if (!vehicle) {
    return null;
  }

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: 'success',
      MAINTENANCE: 'warning',
      INACTIVE: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            Your Assigned Vehicle
          </CardTitle>
          {getStatusBadge(vehicle.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Vehicle Main Info */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-2xl font-bold text-purple-900 mb-1">
              {vehicle.vehicle_number || vehicle.registration_number || 'N/A'}
            </h3>
            <p className="text-purple-700">
              {vehicle.vehicle_type || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'}
              {vehicle.year && ` (${vehicle.year})`}
            </p>
          </div>

          {/* Vehicle Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Type</p>
              <p className="font-semibold capitalize">{vehicle.vehicle_type || vehicle.type || 'N/A'}</p>
            </div>

            {vehicle.capacity && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Capacity</p>
                <p className="font-semibold capitalize">{vehicle.capacity}</p>
              </div>
            )}

            {vehicle.fuel_type && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Fuel className="w-4 h-4" />
                  Fuel Type
                </p>
                <p className="font-semibold capitalize">{vehicle.fuel_type}</p>
              </div>
            )}

            {vehicle.seating_capacity && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Seating</p>
                <p className="font-semibold">{vehicle.seating_capacity} seats</p>
              </div>
            )}

            {(vehicle.insurance_validity || vehicle.insurance_expiry) && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Insurance Expiry
                </p>
                <p className="font-semibold">
                  {new Date(vehicle.insurance_validity || vehicle.insurance_expiry).toLocaleDateString()}
                </p>
              </div>
            )}

            {vehicle.rc_validity && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  RC Validity
                </p>
                <p className="font-semibold">
                  {new Date(vehicle.rc_validity).toLocaleDateString()}
                </p>
              </div>
            )}

            {vehicle.permit_validity && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Permit Validity
                </p>
                <p className="font-semibold">
                  {new Date(vehicle.permit_validity).toLocaleDateString()}
                </p>
              </div>
            )}

            {vehicle.last_service_date && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Last Service
                </p>
                <p className="font-semibold">
                  {new Date(vehicle.last_service_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {vehicle.current_mileage && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Mileage</p>
                <p className="font-semibold">{vehicle.current_mileage.toLocaleString()} KM</p>
              </div>
            )}
          </div>

          {/* Vendor Info */}
          {vehicle.vendor_name && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Vendor</p>
              <p className="text-sm font-medium text-gray-800">{vehicle.vendor_name}</p>
            </div>
          )}

          {/* Additional Notes */}
          {vehicle.notes && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              <p className="text-sm text-gray-800">{vehicle.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
