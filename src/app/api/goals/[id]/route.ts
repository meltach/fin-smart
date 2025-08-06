import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, corsHeaders } from '@/lib/middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Simple validation schema for updates
const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().datetime().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

/**
 * GET /api/goals/[id]
 * Get specific goal details
 */
async function getGoal(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const goalId = params.id;
    
    // Direct Prisma call - much simpler!
    const goal = await prisma.goal.findFirst({
      where: { 
        id: goalId, 
        userId: user.id 
      }
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Add calculated fields
    const goalWithProgress = {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      target: goal.targetAmount,
      current: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: goal.priority as 'high' | 'medium' | 'low',
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      remainingAmount: goal.targetAmount - goal.currentAmount,
      daysRemaining: goal.targetDate ? Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      isCompleted: goal.isCompleted || goal.currentAmount >= goal.targetAmount
    };

    return NextResponse.json(goalWithProgress, { status: 200 });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve goal' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/goals/[id]
 * Update goal details
 */
async function updateGoal(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const goalId = params.id;
    const body = await request.json();

    // Simple validation
    const result = updateGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const updateData = result.data;

    // Transform field names to match database schema
    const prismaData: any = {};
    if (updateData.name) prismaData.name = updateData.name;
    if (updateData.description !== undefined) prismaData.description = updateData.description;
    if (updateData.targetAmount) prismaData.targetAmount = updateData.targetAmount;
    if (updateData.currentAmount !== undefined) prismaData.currentAmount = updateData.currentAmount;
    if (updateData.targetDate) prismaData.targetDate = new Date(updateData.targetDate);
    if (updateData.category) prismaData.category = updateData.category;
    if (updateData.priority) prismaData.priority = updateData.priority;

    // Direct Prisma update
    const goal = await prisma.goal.updateMany({
      where: { 
        id: goalId, 
        userId: user.id 
      },
      data: prismaData
    });

    if (goal.count === 0) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Fetch the updated goal to return it
    const updatedGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id }
    });

    return NextResponse.json({
      id: updatedGoal!.id,
      name: updatedGoal!.name,
      description: updatedGoal!.description,
      target: updatedGoal!.targetAmount,
      current: updatedGoal!.currentAmount,
      deadline: updatedGoal!.targetDate.toISOString(),
      category: updatedGoal!.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: updatedGoal!.priority as 'high' | 'medium' | 'low',
      progress: updatedGoal!.targetAmount > 0 ? (updatedGoal!.currentAmount / updatedGoal!.targetAmount) * 100 : 0,
      isCompleted: updatedGoal!.isCompleted || updatedGoal!.currentAmount >= updatedGoal!.targetAmount
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/goals/[id]
 * Delete goal
 */
async function deleteGoal(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const goalId = params.id;

    // Direct Prisma delete
    const result = await prisma.goal.deleteMany({
      where: { 
        id: goalId, 
        userId: user.id 
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Goal deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getGoal);
export const PUT = withAuth(updateGoal);
export const DELETE = withAuth(deleteGoal);
export const OPTIONS = async () => NextResponse.json({}, { headers: corsHeaders() });
