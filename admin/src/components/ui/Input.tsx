import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', type, ...rest }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`w-full rounded-md border border-border bg-surface2 px-3 py-2 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none ${
            isPassword ? 'pr-10' : ''
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text focus:outline-none"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-xs text-accent">{error}</span>}
    </label>
  );
});
Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, className = '', ...rest }, ref) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>}
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-border bg-surface2 px-3 py-2 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none ${className}`}
      {...rest}
    />
    {error && <span className="mt-1 block text-xs text-accent">{error}</span>}
  </label>
));
TextArea.displayName = 'TextArea';
