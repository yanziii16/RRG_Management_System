const Select = ({
  label,
  error,
  options,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : void 0);
  return <div className="w-full">
      {label && <label
    htmlFor={selectId}
    className="block text-xs font-medium text-[#2A3B39] mb-1.5"
  >
          {label}
          {props.required && <span className="text-red-600 ml-0.5">*</span>}
        </label>}
      <select
    id={selectId}
    className={`w-full min-h-[40px] px-3 py-2 text-sm bg-white border rounded-lg text-[#152423] focus:outline-none focus:ring-2 focus:ring-[#143E3B]/20 focus:border-[#143E3B] transition-colors ${error ? "border-red-500" : "border-[#DCE5E3]"} ${className}`}
    {...props}
  >
        {options.map((opt) => <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>)}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>;
};
export {
  Select
};
