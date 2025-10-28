interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'pink' | 'blue' | 'gray';
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'pink',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const colorClasses = {
    pink: 'border-pink-600',
    blue: 'border-blue-600',
    gray: 'border-gray-600',
  };

  const spinner = (
    <>
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {message && <p className="text-gray-600 mt-4">{message}</p>}
    </>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">{spinner}</div>
      </div>
    );
  }

  return <div className="flex items-center justify-center">{spinner}</div>;
}

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    </div>
  );
}
