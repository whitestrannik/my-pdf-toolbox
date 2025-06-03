import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'glass' | 'gradient';
  hoverable?: boolean;
  style?: CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hoverable = false,
  style
}) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseStyles = 'rounded-2xl border transition-all duration-300 ease-out';
  
  const variantStyles = {
    default: 'bg-white border-slate-200 shadow-sm',
    elevated: 'bg-white border-slate-200/80 shadow-lg shadow-slate-200/60',
    glass: 'glass-effect border-white/20',
    gradient: 'bg-gradient-soft border-slate-200 shadow-md'
  };

  const hoverStyles = hoverable 
    ? 'hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer hover:border-slate-300/60' 
    : '';

  return (
    <div 
      className={`
        ${baseStyles} 
        ${variantStyles[variant]} 
        ${paddingStyles[padding]} 
        ${hoverStyles} 
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}; 