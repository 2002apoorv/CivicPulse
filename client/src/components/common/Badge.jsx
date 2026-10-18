import React from 'react';
import { CATEGORY_COLORS, PRIORITY_STYLES, STATUS_STYLES } from '../../utils/constants';

export const CategoryBadge = ({ category, showDot = true, size = 'sm' }) => {
  const style = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
  const sizeClasses = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {category}
    </span>
  );
};

export const PriorityBadge = ({ priority, size = 'sm' }) => {
  const key = priority?.toLowerCase() || 'medium';
  const style = PRIORITY_STYLES[key] || PRIORITY_STYLES.medium;
  const sizeClasses = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center rounded-md border ${style.badge} ${sizeClasses}`}>
      {style.label}
    </span>
  );
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const key = status?.toLowerCase() || 'submitted';
  const style = STATUS_STYLES[key] || STATUS_STYLES.submitted;
  const sizeClasses = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center rounded-md border ${style.color} ${sizeClasses}`}>
      {style.label}
    </span>
  );
};
