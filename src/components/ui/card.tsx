import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * Standardized Card Components for Dashboard UI
 * 
 * Usage:
 * - Card: Base card with white background, rounded-xl, subtle shadow and border
 * - CardHeader: Header section with flex layout for title + actions
 * - CardTitle: Styled title text
 * - CardDescription: Muted description text
 * - CardContent: Main content area with padding
 * - CardFooter: Footer section for actions
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4 md:p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-slate-900',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 md:p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 md:p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

/**
 * StatCard - Gradient stat card for KPIs and metrics
 */
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'sky' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'teal' | 'cyan';
}

const statCardVariants: Record<string, string> = {
  sky: 'from-sky-500 to-sky-600',
  indigo: 'from-indigo-500 to-indigo-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  purple: 'from-purple-500 to-purple-600',
  rose: 'from-rose-500 to-rose-600',
  teal: 'from-teal-500 to-teal-600',
  cyan: 'from-cyan-500 to-cyan-600',
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, variant = 'sky', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-gradient-to-br rounded-xl shadow-lg p-4 md:p-6 text-white transition-all duration-200 hover:shadow-xl',
        statCardVariants[variant],
        className
      )}
      {...props}
    />
  )
);
StatCard.displayName = 'StatCard';

/**
 * PanelCard - Card with header/body separation for grouped content
 */
const PanelCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden',
      className
    )}
    {...props}
  />
));
PanelCard.displayName = 'PanelCard';

const PanelCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 flex items-center justify-between',
      className
    )}
    {...props}
  />
));
PanelCardHeader.displayName = 'PanelCardHeader';

const PanelCardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 md:p-6', className)} {...props} />
));
PanelCardBody.displayName = 'PanelCardBody';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  PanelCard,
  PanelCardHeader,
  PanelCardBody,
};
