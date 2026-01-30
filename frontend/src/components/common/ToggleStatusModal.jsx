import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const ToggleStatusModal = ({
  isOpen,
  onClose,
  isActive,
  itemName,
  itemType,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm({
      is_active: isActive, // Toggle: if currently active, set to inactive
      inactive_reason: reason || undefined,
    });
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isActive ? 'Deactivate' : 'Reactivate'} {itemType}
          </DialogTitle>
          <DialogDescription>
            {itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isActive ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                This {itemType.toLowerCase()} will be reactivated and available for new assignments.
              </div>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  This {itemType.toLowerCase()} will be deactivated and won't appear in assignment dropdowns.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Deactivation (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., License expired, Vehicle maintenance, Driver transferred..."
                  className="w-full min-h-[100px] px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {isLoading ? 'Processing...' : (isActive ? 'Deactivate' : 'Reactivate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToggleStatusModal;
