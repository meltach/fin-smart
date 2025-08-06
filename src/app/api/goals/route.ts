import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, corsHeaders } from '@/lib/middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target: z.number().positive(),
  current: z.number().min(0).default(0),
  deadline: z.string().datetime().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
});

/**
 * GET /api/goals
 * Get user's goals with progress
 */
async function getGoals(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    // Direct Prisma call - much simpler!
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { targetDate: 'asc' }
      ]
    });

    // Simple transformation
    const transformedGoals = goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: goal.priority as 'high' | 'medium' | 'low',
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      isCompleted: goal.isCompleted || goal.currentAmount >= goal.targetAmount
    }));
    
    return NextResponse.json(transformedGoals, { status: 200 });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve goals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals
 * Create a new goal
 */
async function createGoal(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();

    // Simple validation
    const result = createGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { name, description, target, current, deadline, category, priority } = result.data;
    
    // Direct Prisma create - much simpler!
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        name,
        description,
        targetAmount: target,
        currentAmount: current || 0,
        targetDate: deadline ? new Date(deadline) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        priority: priority || 'medium',
        category: category || 'general',
        isCompleted: false
      }
    });

    // Return in expected format
    return NextResponse.json({
      id: goal.id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: goal.priority as 'high' | 'medium' | 'low'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getGoals);
export const POST = withAuth(createGoal);
export const OPTIONS = async () => NextResponse.json({}, { headers: corsHeaders() });
