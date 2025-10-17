import React from 'react';

interface TrustScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({
  score,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  // Determine styling based on score
  let bgColor = 'bg-green-100 text-green-800';
  let ringColor = 'ring-green-500';
  let sizeClasses = 'w-16 h-16 text-xl';
  
  if (score < 70) {
    bgColor = 'bg-red-100 text-red-800';
    ringColor = 'ring-red-500';
  } else if (score < 90) {
    bgColor = 'bg-yellow-100 text-yellow-800';
    ringColor = 'ring-yellow-500';
  }
  
  // Adjust size classes
  switch (size) {
    case 'sm':
      sizeClasses = 'w-10 h-10 text-sm';
      break;
    case 'md':
      sizeClasses = 'w-16 h-16 text-xl';
      break;
    case 'lg':
      sizeClasses = 'w-24 h-24 text-2xl';
      break;
  }
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`${sizeClasses} rounded-full ${bgColor} ${ringColor} ring-4 flex items-center justify-center font-bold`}>
        {score}
      </div>
      {showLabel && (
        <p className="mt-2 text-xs font-medium text-gray-900">
          {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Attention'}
        </p>
      )}
    </div>
  );
};

export default TrustScoreDisplay;