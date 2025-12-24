/**
 * Date Utilities
 * Helper functions for date formatting and manipulation
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

/**
 * Format a date string to a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date, format = 'MMM D, YYYY'): string {
  return dayjs(date).format(format);
}

/**
 * Format a date and time
 */
export function formatDateTime(date: string | Date, format = 'MMM D, YYYY h:mm A'): string {
  return dayjs(date).format(format);
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  return dayjs(date).isBefore(dayjs());
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Get the difference between two dates in days
 */
export function getDaysDifference(date1: string | Date, date2: string | Date = new Date()): number {
  return dayjs(date1).diff(dayjs(date2), 'day');
}

