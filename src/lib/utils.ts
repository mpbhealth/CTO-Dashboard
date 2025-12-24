import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * @param inputs - CSS class values to merge
 * @returns Merged and optimized class string
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4'
 * cn('text-red-500', { 'text-blue-500': true }) // Returns 'text-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

