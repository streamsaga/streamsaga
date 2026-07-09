import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-surface2 text-text hover:bg-surface3 border border-border',
  ghost: 'bg-transparent text-muted hover:text-text hover:bg-surface2',
  danger: 'bg-transparent text-accent border border-accent/40 hover:bg-accent/10',
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', isLoading, className = '', children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
        {...rest}
      >
        {isLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
