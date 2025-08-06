import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wrapper around fetch that automatically includes credentials for authenticated API calls
 * Use this for all internal API calls to ensure authentication cookies are sent
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    credentials: "include", // Always include cookies for authentication
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Format currency values with proper locale formatting
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

/**
 * Format percentage values with consistent formatting
 */
export function formatPercentage(value: number, showSign: boolean = true): string {
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Calculate savings rate as a percentage
 */
export function calculateSavingsRate(monthlyIncome: number, monthlyExpenses: number): number {
  if (monthlyIncome <= 0) return 0;
  return ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
}

/**
 * Get financial health color class based on a metric value and thresholds
 */
export function getHealthColor(
  value: number,
  thresholds: { good: number; fair: number },
  higherIsBetter: boolean = true
): string {
  if (higherIsBetter) {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  } else {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  }
}

/**
 * Get progress bar color class based on financial health
 */
export function getProgressColor(
  value: number,
  thresholds: { good: number; fair: number },
  higherIsBetter: boolean = true
): string {
  if (higherIsBetter) {
    if (value >= thresholds.good) return 'bg-green-500';
    if (value >= thresholds.fair) return 'bg-yellow-500';
    return 'bg-red-500';
  } else {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.fair) return 'bg-yellow-500';
    return 'bg-red-500';
  }
}
