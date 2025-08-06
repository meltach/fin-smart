'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Calendar, DollarSign, Edit, Trash2, RefreshCw } from 'lucide-react';
import { GoalDialog } from '@/components/GoalDialog';
import { AddFundsDialog } from '@/components/AddFundsDialog';
import { useGoals, useDeleteGoal, useRefreshAllData } from '@/hooks/useFinancialData';
import { Goal } from '@/types/plaid';

export default function GoalsPage() {
  // Use React Query hooks
  const { data: goals = [], isLoading, error } = useGoals();
  const deleteGoalMutation = useDeleteGoal();
  const refreshAllData = useRefreshAllData();
  
  // Local state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addFundsGoal, setAddFundsGoal] = useState<Goal | null>(null);

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoalMutation.mutateAsync(goalId);
      } catch (error) {
        console.error('Failed to delete goal:', error);
        // Could show a toast notification here
      }
    }
  };

  const getCategoryColor = (category: Goal['category']) => {
    const colors = {
      emergency: 'text-red-600',
      savings: 'text-green-600',
      debt: 'text-orange-600',
      investment: 'text-purple-600',
      other: 'text-blue-600',
    };
    return colors[category] || colors.other;
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    };
    return colors[priority];
  };

  // Calculate summary statistics
  const totalSaved = goals.reduce((sum: number, goal: Goal) => sum + goal.current, 0);
  const totalTarget = goals.reduce((sum: number, goal: Goal) => sum + goal.target, 0);
  const remaining = totalTarget - totalSaved;
  const averageProgress = goals.length > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Goals</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your financial objectives</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Goals</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your financial objectives</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <Target className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Goals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Failed to load your financial goals. Please try refreshing the page.
            </p>
          </div>
          <Button onClick={() => refreshAllData.mutate()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Goals</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your financial objectives</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshAllData.mutate()}
              disabled={refreshAllData.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshAllData.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New Goal</span>
            </Button>
          </div>
        </div>

        {goals.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Goals Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by creating your first financial goal to track your progress.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Goal
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal: Goal) => {
                const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                const remaining = goal.target - goal.current;
                
                return (
                  <Card key={goal.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg`}>
                          <Target className={`h-6 w-6 ${getCategoryColor(goal.category)}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800`}>
                              {goal.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}>
                              {goal.priority} priority
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingGoal(goal)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="mb-2" />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-green-600">
                          {/* <DollarSign className="h-4 w-4 mr-1" /> */}
                          <span>${goal.current.toLocaleString()}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          of ${goal.target.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      {goal.deadline && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            Target: {new Date(goal.deadline).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-red-600">
                        ${remaining.toLocaleString()} remaining
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setEditingGoal(goal)}
                      >
                        Edit Goal
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setAddFundsGoal(goal)}
                        disabled={goal.current >= goal.target}
                      >
                        Add Funds
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-8 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goal Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{goals.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Goals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${totalSaved.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">${remaining.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{averageProgress.toFixed(0)}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Progress</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Dialogs */}
        <GoalDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          goal={null}
        />

        <GoalDialog
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          goal={editingGoal}
        />

        {addFundsGoal && (
          <AddFundsDialog
            isOpen={!!addFundsGoal}
            onClose={() => setAddFundsGoal(null)}
            goal={addFundsGoal}
          />
        )}
      </div>
  );
}
