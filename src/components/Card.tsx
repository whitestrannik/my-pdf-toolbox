import type { ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  variant?: "default" | "elevated" | "glass" | "gradient";
  hoverable?: boolean;
  style?: CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  variant = "default",
  hoverable = false,
  style,
}) => {
  const paddingStyles = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const baseStyles = "rounded-2xl border transition-all duration-300 ease-out";

  const variantStyles = {
    default: "bg-slate-800/70 border-slate-700 shadow-sm",
    elevated: "bg-slate-800/80 border-slate-600/80 shadow-lg shadow-slate-900/60",
    glass: "bg-slate-800/90 backdrop-blur-sm border-slate-600/20 shadow-lg",
    gradient: "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-md",
  };

  const hoverStyles = hoverable
    ? "hover:shadow-xl hover:shadow-slate-900/70 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer hover:border-slate-500/60"
    : "";

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
