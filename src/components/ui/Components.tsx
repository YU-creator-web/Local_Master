import React from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseStyles = "px-6 py-2 rounded-full font-medium transition-all duration-300 active:scale-95 disabled:opacity-50";
    const variants = {
      primary: "bg-[var(--color-shinise-brown)] text-[var(--color-shinise-paper)] hover:bg-opacity-90 shadow-md",
      secondary: "bg-[var(--color-shinise-orange)] text-white hover:bg-opacity-90 shadow-md",
      outline: "border-2 border-[var(--color-shinise-brown)] text-[var(--color-shinise-brown)] hover:bg-[var(--color-shinise-brown)] hover:text-[var(--color-shinise-paper)]"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";


// --- Input ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-[var(--color-shinise-brown)]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shinise-orange)]/50 transition-all placeholder:text-gray-400 text-[var(--color-shinise-brown)] ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";


// --- Card ---
export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => {
  return (
    <div className={`bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(62,39,35,0.1)] overflow-hidden border border-[var(--color-shinise-brown)]/10 hover:shadow-lg transition-shadow duration-300 ${className}`} {...props}>
      {children}
    </div>
  );
};
