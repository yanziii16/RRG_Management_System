const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143E3B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const variants = {
    primary: "bg-[#143E3B] text-white hover:bg-[#0E2E2B]",
    secondary: "bg-[#E9F0EE] text-[#143E3B] hover:bg-[#DCE6E3]",
    outline: "bg-white border border-[#DCE5E3] text-[#152423] hover:bg-[#F5F8F7]",
    danger: "bg-[#B91C1C] text-white hover:bg-[#991B1B]",
    ghost: "bg-transparent text-[#5A6D6B] hover:text-[#152423] hover:bg-[#EDF3F1]"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs min-h-[34px]",
    md: "px-4 py-2 text-sm min-h-[40px]",
    lg: "px-6 py-2.5 text-sm min-h-[44px]"
  };
  return <button
    disabled={disabled || loading}
    className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>;
};
export {
  Button
};
