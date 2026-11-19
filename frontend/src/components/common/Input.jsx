const Input = ({
  label,
  error,
  hint,
  rightElement,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : void 0);
  return <div className="w-full">
      {label && <label
    htmlFor={inputId}
    className="block text-xs font-medium text-[#2A3B39] mb-1.5"
  >
          {label}
          {props.required && <span className="text-red-600 ml-0.5">*</span>}
        </label>}
      <div className="relative">
        <input
    id={inputId}
    className={`w-full min-h-[40px] px-3 py-2 text-sm bg-white border rounded-lg text-[#152423] placeholder:text-[#8A9A98] focus:outline-none focus:ring-2 focus:ring-[#143E3B]/20 focus:border-[#143E3B] transition-colors ${error ? "border-red-500" : "border-[#DCE5E3]"} ${rightElement ? "pr-10" : ""} ${className}`}
    {...props}
  />
        {rightElement && <div className="absolute inset-y-0 right-2.5 flex items-center">
            {rightElement}
          </div>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-[#5A6D6B]">{hint}</p>}
    </div>;
};
export {
  Input
};
