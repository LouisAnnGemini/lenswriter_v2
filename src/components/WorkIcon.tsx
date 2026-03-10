import React from 'react';
import { Book } from 'lucide-react';

interface WorkIconProps {
  icon?: string;
  className?: string;
  size?: number;
}

export function WorkIcon({ icon, className = "", size = 16 }: WorkIconProps) {
  if (!icon) {
    return <Book size={size} className={className} />;
  }

  if (icon.startsWith('book-')) {
    const color = icon.split('-')[1];
    let colorClass = 'text-stone-500';
    switch (color) {
      case 'red': colorClass = 'text-red-500'; break;
      case 'blue': colorClass = 'text-blue-500'; break;
      case 'green': colorClass = 'text-emerald-500'; break;
      case 'yellow': colorClass = 'text-amber-500'; break;
      case 'purple': colorClass = 'text-purple-500'; break;
      case 'pink': colorClass = 'text-pink-500'; break;
      case 'orange': colorClass = 'text-orange-500'; break;
    }
    return <Book size={size} className={`${colorClass} ${className}`} />;
  }

  // Assume it's an emoji
  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`} 
      style={{ fontSize: `${size}px`, lineHeight: 1, width: size, height: size }}
    >
      {icon}
    </span>
  );
}
