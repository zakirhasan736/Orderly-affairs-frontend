import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { FormField } from './FormField';
import { Plus, Minus } from 'lucide-react';

interface VehiclesSectionProps {
  data: any;
  onChange: (data: any) => void;
}

export function VehiclesSection({ data, onChange }: VehiclesSectionProps) {
  const updateVehicle = (index: number, field: string, value: any) => {
    const vehicles = [...(data.vehicles || [])];
    if (!vehicles[index]) {
      vehicles[index] = {};
    }
    vehicles[index][field] = value;
    onChange({ ...data, vehicles });
  };

  const addVehicle = () => {
    const vehicles = [...(data.vehicles || []), {}];
    onChange({ ...data, vehicles });
  };

  const removeVehicle = (index: number) => {
    const vehicles = (data.vehicles || []).filter((_: any, i: number) => i !== index);
    onChange({ ...data, vehicles });
  };

  const vehicleTypes = [
    { value: 'car', label: 'Car' },
    { value: 'truck', label: 'Truck' },
    { value: 'suv', label: 'SUV' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'boat', label: 'Boat' },
    { value: 'rv', label: 'RV/Motorhome' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'other', label: 'Other' }
  ];

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'not-running', label: 'Not Running' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>2A – Vehicles</CardTitle>
            <Button type="button" onClick={addVehicle}>
              <Plus className="h-4 w-4 mr-1" />
              Add Vehicle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(data.vehicles || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No vehicles added yet. Click &quot;Add Vehicle&quot; to get started.</p>
            </div>
          )}

          {(data.vehicles || []).map((vehicle: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4>Vehicle {index + 1}</h4>
                {(data.vehicles || []).length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVehicle(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  label="Vehicle Type"
                  type="select"
                  value={vehicle.type}
                  onChange={(value) => updateVehicle(index, 'type', value)}
                  options={vehicleTypes}
                  required
                />

                <FormField
                  label="Year"
                  type="text"
                  value={vehicle.year}
                  onChange={(value) => updateVehicle(index, 'year', value)}
                  placeholder="e.g., 2020"
                  required
                />

                <FormField
                  label="Make"
                  type="text"
                  value={vehicle.make}
                  onChange={(value) => updateVehicle(index, 'make', value)}
                  placeholder="e.g., Toyota"
                  required
                />

                <FormField
                  label="Model"
                  type="text"
                  value={vehicle.model}
                  onChange={(value) => updateVehicle(index, 'model', value)}
                  placeholder="e.g., Camry"
                  required
                />

                <FormField
                  label="Color"
                  type="text"
                  value={vehicle.color}
                  onChange={(value) => updateVehicle(index, 'color', value)}
                  placeholder="e.g., Silver"
                />

                <FormField
                  label="License Plate"
                  type="text"
                  value={vehicle.licensePlate}
                  onChange={(value) => updateVehicle(index, 'licensePlate', value)}
                  placeholder="License plate number"
                />

                <FormField
                  label="VIN"
                  type="text"
                  value={vehicle.vin}
                  onChange={(value) => updateVehicle(index, 'vin', value)}
                  placeholder="Vehicle Identification Number"
                />

                <FormField
                  label="Mileage"
                  type="text"
                  value={vehicle.mileage}
                  onChange={(value) => updateVehicle(index, 'mileage', value)}
                  placeholder="Current mileage"
                />

                <FormField
                  label="Condition"
                  type="select"
                  value={vehicle.condition}
                  onChange={(value) => updateVehicle(index, 'condition', value)}
                  options={conditionOptions}
                />

                <div className="md:col-span-2 lg:col-span-3">
                  <FormField
                    label="Location/Storage"
                    type="textarea"
                    value={vehicle.location}
                    onChange={(value) => updateVehicle(index, 'location', value)}
                    placeholder="Where is this vehicle currently located?"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <FormField
                    label="Title/Registration Documents"
                    type="upload"
                    value={vehicle.titleUpload}
                    onChange={(value) => updateVehicle(index, 'titleUpload', value)}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <FormField
                    label="Insurance Information"
                    type="upload"
                    value={vehicle.insuranceUpload}
                    onChange={(value) => updateVehicle(index, 'insuranceUpload', value)}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <FormField
                    label="Vehicle Photos"
                    type="upload"
                    value={vehicle.photosUpload}
                    onChange={(value) => updateVehicle(index, 'photosUpload', value)}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <FormField
                    label="Additional Notes"
                    type="textarea"
                    value={vehicle.notes}
                    onChange={(value) => updateVehicle(index, 'notes', value)}
                    placeholder="Any additional information about this vehicle..."
                  />
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}