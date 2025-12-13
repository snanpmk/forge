import clsx from 'clsx';

export default function Button({ children, variant = 'primary', className, ...props }) {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 border border-black",
    secondary: "bg-white text-black border border-gray-300 hover:bg-gray-50",
    danger: "bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-500",
    ghost: "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100",
  };

  return (
    <button className={clsx(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
