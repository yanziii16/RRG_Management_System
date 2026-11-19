import { Search, X } from "lucide-react";
const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  return <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-[#5A6D6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full min-h-[40px] pl-9 pr-8 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg text-[#152423] placeholder:text-[#8A9A98] focus:outline-none focus:ring-2 focus:ring-[#143E3B]/20 focus:border-[#143E3B]"
  />
      {value && <button
    type="button"
    onClick={() => onChange("")}
    aria-label="Clear search"
    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6D6B] hover:text-[#152423]"
  >
          <X className="w-4 h-4" />
        </button>}
    </div>;
};
export {
  SearchBar
};
