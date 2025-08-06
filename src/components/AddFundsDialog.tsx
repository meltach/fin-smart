import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Goal } from '@/types/plaid';
import { useFinancialStore } from '@/stores/financialStore';

interface AddFundsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
}

export function AddFundsDialog({ isOpen, onClose, goal }: AddFundsDialogProps) {
  const { updateGoal } = useFinancialStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fundAmount = parseFloat(amount);
    if (!amount || isNaN(fundAmount) || fundAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    const newCurrent = goal.current + fundAmount;
    if (newCurrent > goal.target) {
      setError(`Amount would exceed target by $${(newCurrent - goal.target).toFixed(2)}`);
      return;
    }

    try {
      await updateGoal(goal.id, { current: newCurrent });
      setAmount('');
      setError('');
      onClose();
    } catch (error) {
      setError('Failed to update goal. Please try again.');
      console.error('Failed to update goal:', error);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (error) setError('');
  };

  const remainingAmount = goal.target - goal.current;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Funds to {goal.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Progress</div>
            <div className="text-lg font-semibold">
              ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ${remainingAmount.toLocaleString()} remaining
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Add ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={remainingAmount}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className={error ? 'border-red-500' : ''}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <p className="text-xs text-gray-500">
                Maximum: ${remainingAmount.toLocaleString()}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Add Funds
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
