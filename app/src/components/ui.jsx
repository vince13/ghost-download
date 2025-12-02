import clsx from 'clsx';

export const Card = ({ children, className }) => (
  <div
    className={clsx(
      'bg-gray-900/90 border border-gray-800 rounded-xl p-4 shadow-lg backdrop-blur-md',
      className
    )}
  >
    {children}
  </div>
);

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled = false,
  type = 'button'
}) => {
  const base =
    'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-400'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        base,
        variants[variant],
        className,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
    red: 'bg-red-900/30 text-red-400 border-red-800',
    green: 'bg-green-900/30 text-green-400 border-green-800',
    yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-mono border uppercase tracking-wide', colors[color])}>
      {children}
    </span>
  );
};

