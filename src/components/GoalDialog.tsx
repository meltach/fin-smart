import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Goal } from '@/types/plaid';
import { useFinancialStore } from '@/stores/financialStore';

interface GoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null; // null for new goal, Goal for editing
}

export function GoalDialog({ isOpen, onClose, goal }: GoalDialogProps) {
  const { addGoal, updateGoal } = useFinancialStore();
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: undefined as Date | undefined,
    category: 'savings' as Goal['category'],
    priority: 'medium' as Goal['priority'],
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or goal changes
  useEffect(() => {
    if (isOpen) {
      if (goal) {
        // Editing existing goal
        setFormData({
          name: goal.name,
          targetAmount: goal.target.toString(),
          currentAmount: goal.current.toString(),
          targetDate: goal.deadline ? new Date(goal.deadline) : undefined,
          category: goal.category,
          priority: goal.priority,
        });
      } else {
        // Creating new goal
        setFormData({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          targetDate: undefined,
          category: 'savings',
          priority: 'medium',
        });
      }
      setErrors({});
    }
  }, [isOpen, goal]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be a positive number';
    }

    const currentAmount = parseFloat(formData.currentAmount);
    if (isNaN(currentAmount) || currentAmount < 0) {
      newErrors.currentAmount = 'Current amount must be a non-negative number';
    }

    if (targetAmount && currentAmount && currentAmount > targetAmount) {
      newErrors.currentAmount = 'Current amount cannot exceed target amount';
    }

    // Validate target date (required)
    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else if (formData.targetDate <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const goalData = {
      name: formData.name.trim(),
      target: parseFloat(formData.targetAmount),
      current: parseFloat(formData.currentAmount),
      deadline: formData.targetDate!.toISOString(),
      category: formData.category,
      priority: formData.priority,
    };

    try {
      if (goal) {
        // Update existing goal
        await updateGoal(goal.id, goalData);
      } else {
        // Create new goal
        await addGoal(goalData);
      }
      onClose();
    } catch (error) {
      // Error is already handled in the store, but you could show a toast here
      console.error('Failed to save goal:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Emergency Fund, Vacation"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                placeholder="10000"
                className={errors.targetAmount ? 'border-red-500' : ''}
              />
              {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount ($)</Label>
              <Input
                id="currentAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => handleInputChange('currentAmount', e.target.value)}
                placeholder="0"
                className={errors.currentAmount ? 'border-red-500' : ''}
              />
              {errors.currentAmount && <p className="text-sm text-red-500">{errors.currentAmount}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !formData.targetDate ? 'text-muted-foreground' : ''
                  } ${errors.targetDate ? 'border-red-500' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.targetDate ? format(formData.targetDate, 'PPP') : 'Pick a target date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={formData.targetDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setFormData(prev => ({ ...prev, targetDate: date }));
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.targetDate && <p className="text-sm text-red-500">{errors.targetDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: Goal['category']) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="debt">Debt Payoff</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: Goal['priority']) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
