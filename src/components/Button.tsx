import React from "react";
import { Loader } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "elegant" | "minimal" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// Simple utility to concatenate class names
const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variants = {
      primary: cn(
        "bg-white border border-slate-200 text-slate-700 shadow-sm",
        "hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
        "focus:ring-blue-400 focus:border-blue-300",
        "active:translate-y-0 active:shadow-sm",
      ),
      secondary: cn(
        "bg-slate-50 border border-slate-200 text-slate-600",
        "hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700",
        "focus:ring-slate-400",
      ),
      elegant: cn(
        "bg-gradient-to-r from-white to-slate-50 border border-slate-200 text-slate-700 shadow-sm",
        "hover:from-slate-50 hover:to-slate-100 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
        "focus:ring-blue-400 focus:border-blue-300",
        "active:translate-y-0 active:shadow-sm",
      ),
      minimal: cn(
        "bg-transparent border border-transparent text-slate-600",
        "hover:bg-slate-50 hover:text-slate-700",
        "focus:ring-slate-400 focus:bg-slate-50",
      ),
      ghost: cn(
        "bg-transparent border border-transparent text-slate-500",
        "hover:bg-slate-50 hover:text-slate-600",
        "focus:ring-slate-400",
      ),
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-4 py-2.5 text-sm rounded-xl",
      lg: "px-6 py-3 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && (
          <span className="mr-2 transition-transform duration-200 group-hover:scale-110">
            {leftIcon}
          </span>
        )}
        <span className="relative">{children}</span>
        {!loading && rightIcon && (
          <span className="ml-2 transition-transform duration-200 group-hover:scale-110">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
